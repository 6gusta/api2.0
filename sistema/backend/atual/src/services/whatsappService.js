const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode');
const db = require('../services/db');
const puppeteerConfig = require('../config/puppeteer');
const formatNumber = require('../utils/formatNumber');

let instancias = {};
const MAX_INSTANCIAS_GRATIS = 2;

async function criarInstancia(nome) {
  if (instancias[nome]) return;

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: nome }),
    puppeteer: puppeteerConfig
  });

  instancias[nome] = { client, ready: false, qr: null };

  client.on('qr', qr => {
    instancias[nome].qr = qr;
    instancias[nome].ready = false;
    console.log(`📱 QR Code da instância "${nome}" gerado.`);
  });

  client.on('ready', () => {
    instancias[nome].ready = true;
    instancias[nome].qr = null;
    console.log(`✅ Instância "${nome}" conectada!`);
    db.get('instancias').find({ name: nome }).assign({ ready: true }).write();
  });

  client.on('message', async msg => {
    const texto = msg.body || (msg.hasMedia ? '[Mensagem com mídia]' : '[Mensagem vazia]');
    const payload = {
       instancia: nome, 
      fromNumber: msg.from.replace('@c.us', ''),
      body: texto,
      timestamp: msg.timestamp
    };

    try {
      const url = 'http://localhost:8080/whatsapp/webhook';
        console.log(`📤 Enviando para backend Java (${nome}):`, payload);
      await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error(`❌ Erro ao enviar mensagem da instância ${nome}:`, err.message);
    }
  });

  client.on('disconnected', reason => {
    console.log(`⚠️ Instância "${nome}" desconectada (${reason})`);
    instancias[nome].ready = false;
    instancias[nome].qr = null;
    db.get('instancias').find({ name: nome }).assign({ ready: false }).write();
    setTimeout(() => client.initialize(), 5000);
  });

  await client.initialize();

  if (!db.get('instancias').find({ name: nome }).value()) {
    db.get('instancias').push({ name: nome, ready: false }).write();
  }
}

async function restaurarInstancias() {
  const instanciasSalvas = db.get('instancias').value();
  for (const inst of instanciasSalvas) {
    console.log(`🔄 Restaurando instância "${inst.name}"...`);
    await criarInstancia(inst.name);
  }
}

function getInstancias() {
  return instancias;
}

module.exports = {
  criarInstancia,
  restaurarInstancias,
  getInstancias,
  MAX_INSTANCIAS_GRATIS,
  formatNumber,
  MessageMedia
};
