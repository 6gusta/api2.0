// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const puppeteer = require('puppeteer');
const db = require('./db');

const app = express();

// ---------------- MIDDLEWARES ----------------
app.use(cors({
    origin: "http://localhost:4200" // libera pro Angular
}));
app.use(express.json());
app.use(express.static('frontend'));

// ---------------- VARIÁVEIS ----------------
let instancias = {};
const MAX_INSTANCIAS_GRATIS = 2;

// ---------------- FUNÇÕES AUXILIARES ----------------
function formatNumber(num) {
    let n = num.replace(/\D/g, '');
    if (n.length === 10 || n.length === 11) n = '55' + n;
    if (!n.startsWith('55')) n = '55' + n;
    return n + '@c.us';
}

async function criarInstancia(nome) {
    if (instancias[nome]) return;

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: nome }),
        puppeteer: {
            headless: true,
            executablePath: puppeteer.executablePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    instancias[nome] = { client, ready: false, qr: null };

    client.on('qr', qr => {
        instancias[nome].qr = qr;
        instancias[nome].ready = false;
        console.log(`QR Code da instância "${nome}" gerado.`);
    });

    client.on('ready', () => {
        instancias[nome].ready = true;
        instancias[nome].qr = null;
        console.log(`✅ Instância "${nome}" conectada!`);
        db.get('instancias').find({ name: nome }).assign({ ready: true }).write();
    });

    client.on('message', async msg => {
        let texto = msg.body || (msg.hasMedia ? '[Mensagem com mídia]' : '[Mensagem vazia]');
        const payload = {
            fromNumber: msg.from.replace('@c.us', ''),
            body: texto,
            timestamp: msg.timestamp
        };

        try {
            const url = 'http://localhost:8080/whatsapp/webhook';
            console.log('Enviando para backend Java:', payload);
            await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error('Erro ao enviar mensagem para o Java:', err.response?.data || err.message);
        }
    });

    client.on('disconnected', () => {
        instancias[nome].ready = false;
        instancias[nome].qr = null;
        console.log(`⚠️ Instância "${nome}" desconectada, reiniciando em 5s...`);
        db.get('instancias').find({ name: nome }).assign({ ready: false }).write();
        setTimeout(() => client.initialize(), 5000);
    });

    client.initialize();

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
restaurarInstancias();

// ---------------- ENDPOINTS ----------------

// Criar instância
app.post('/initialize', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    if (instancias[name]) return res.json({ status: `Instância "${name}" já existe` });
    if (Object.keys(instancias).length >= MAX_INSTANCIAS_GRATIS)
        return res.status(403).json({ error: `Limite de ${MAX_INSTANCIAS_GRATIS} instâncias grátis atingido.` });

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
        db.get('instancias').remove({ name: req.params.name }).write();
        delete instancias[req.params.name];
        res.json({ status: `Instância "${req.params.name}" desconectada com sucesso!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enviar mensagem (com verificação real do número)
app.post('/send/:name', async (req, res) => {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });

    const number = req.body.number || req.query.to;
    const message = req.body.message || req.query.message;

    console.log("[NODE] Recebido do Angular:", { rawNumber: number, rawMessage: message });

    if (!number || !message) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    }

    if (!inst.ready) {
        return res.status(400).json({ error: 'Instância ainda não conectada' });
    }

    try {
        let finalNumber = formatNumber(number);

        // Verifica se o número existe no WhatsApp
        const numberId = await inst.client.getNumberId(finalNumber);
        if (!numberId) {
            console.log('[NODE] [WARN] Número não registrado no WhatsApp');
            return res.status(400).json({ error: 'Número não registrado no WhatsApp' });
        }

        await inst.client.sendMessage(numberId._serialized, message);
        console.log(`[NODE] Mensagem enviada para ${numberId._serialized}`);
        res.json({ status: `Mensagem enviada para ${numberId._serialized}` });

    } catch (err) {
        console.error('[NODE ERROR] Falha geral ao enviar mensagem:', err);
        res.status(500).json({ error: err.message });
    }
});

// Lista instâncias
app.get('/instancias', (req, res) => {
    const lista = Object.keys(instancias).map(name => ({ name }));
    res.json(lista);
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
