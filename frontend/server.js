// server.js
const axios = require('axios'); // Para enviar mensagens para o backend Java
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js'); // WhatsApp Web API não oficial
const qrcode = require('qrcode'); // Para gerar QR Code
const db = require('./db'); // LowDB, nosso "banco de dados" local
const puppeteer = require('puppeteer'); // Para o modo headless do WhatsApp Web

// Inicializa o servidor Express
const app = express();
app.use(cors()); // Permite requisições externas
app.use(express.json()); // Permite receber JSON no corpo das requisições
app.use(express.static('frontend')); // Servir arquivos estáticos da pasta frontend

// Estrutura para guardar instâncias ativas em memória
let instancias = {}; // Exemplo: { "usuario1": { client, ready, qr } }
const MAX_INSTANCIAS_GRATIS = 2; // Limite de instâncias gratuitas

// Função para criar uma instância do WhatsApp
async function criarInstancia(nome) {
    if (instancias[nome]) return; // Evita duplicadas

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: nome }),
        puppeteer: { 
            headless: true,
            executablePath: puppeteer.executablePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    instancias[nome] = { client, ready: false, qr: null };

    // QR Code gerado
    client.on('qr', qr => {
        instancias[nome].qr = qr;
        instancias[nome].ready = false;
        console.log(`QR Code da instância "${nome}" gerado.`);
    });

    // WhatsApp pronto
    client.on('ready', () => {
        instancias[nome].ready = true;
        instancias[nome].qr = null;
        console.log(`✅ Instância "${nome}" conectada!`);

        db.get('instancias')
          .find({ name: nome })
          .assign({ ready: true })
          .write();
    });

    // Recebendo mensagens
   // Recebendo mensagens
client.on('message', async (msg) => {
    let texto = msg.body;

    // Se msg.body estiver vazio, pode ser mídia
    if (!texto) {
        if (msg.hasMedia) {
            texto = '[Mensagem com mídia]';
        } else {
            texto = '[Mensagem vazia]';
        }
    }

    const payload = {
        fromNumber: msg.from.replace('@c.us', ''), // só o número
        body: texto,
        timestamp: msg.timestamp
    };

    try {
        const url = 'http://localhost:8080/whatsapp/webhook';
        console.log('Enviando para:', url, payload);

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Mensagem enviada para o backend Java com sucesso!', response.data);
    } catch (err) {
        if (err.response) {
            console.error('Erro ao enviar mensagem para o Java:', err.response.status, err.response.data);
        } else {
            console.error('Erro ao enviar mensagem para o Java:', err.message);
        }
    }
});


    // Desconexão
    client.on('disconnected', () => {
        instancias[nome].ready = false;
        instancias[nome].qr = null;
        console.log(`⚠️ Instância "${nome}" desconectada, reiniciando em 5s...`);

        db.get('instancias')
          .find({ name: nome })
          .assign({ ready: false })
          .write();

        setTimeout(() => client.initialize(), 5000);
    });

    client.initialize();

    // Salva no banco
    if (!db.get('instancias').find({ name: nome }).value()) {
        db.get('instancias')
          .push({ name: nome, ready: false })
          .write();
    }
}

// Restaurar instâncias salvas
async function restaurarInstancias() {
    const instanciasSalvas = db.get('instancias').value();
    for (const inst of instanciasSalvas) {
        console.log(`🔄 Restaurando instância "${inst.name}"...`);
        await criarInstancia(inst.name);
    }
}
restaurarInstancias();

// ------------------- ENDPOINTS -------------------

// Criar nova instância
app.post('/initialize', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    if (instancias[name]) return res.json({ status: `Instância "${name}" já existe` });

    if (Object.keys(instancias).length >= MAX_INSTANCIAS_GRATIS) {
        return res.status(403).json({ error: `Limite de ${MAX_INSTANCIAS_GRATIS} instâncias grátis atingido.` });
    }

    await criarInstancia(name);
    res.json({ status: `Instância "${name}" criada com sucesso!` });
});

// Status da instância
app.get('/status/:name', (req, res) => {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });
    res.json({ whatsappReady: inst.ready });
});

// QR Code
app.get('/qrcode/:name', async (req, res) => {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });
    if (inst.ready) return res.json({ qr: null });
    if (!inst.qr) return res.status(404).json({ error: 'QR Code ainda não gerado' });

    try {
        const qrImage = await qrcode.toDataURL(inst.qr);
        res.json({ qr: qrImage });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

// Desconectar instância
app.post('/disconnect/:name', async (req, res) => {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });

    try {
        await inst.client.destroy();
        inst.ready = false;
        inst.qr = null;

        db.get('instancias')
          .remove({ name: req.params.name })
          .write();

        delete instancias[req.params.name];

        res.json({ status: `Instância "${req.params.name}" desconectada com sucesso!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enviar mensagem
app.post('/send/:name', async (req, res) => {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });

    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    if (!inst.ready) return res.status(400).json({ error: 'Instância ainda não conectada' });

    try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        await inst.client.sendMessage(formattedNumber, message);
        res.json({ status: `Mensagem enviada para ${number}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Retornar todas instâncias
app.get('/instancias', (req, res) => {
    const insts = db.get('instancias').value();
    res.json(insts);
});

// Inicializa servidor
app.listen(3000, () => console.log('🚀 API rodando em http://localhost:3000'));
