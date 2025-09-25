const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('./db'); // LowDB com FileSync

let instancias = {}; // instâncias ativas em memória

// Função para criar instância
async function criarInstancia(nome) {
    if (instancias[nome]) return;

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: nome }),
        puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
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

        // Atualiza o banco
        db.get("instancias")
          .find({ name: nome })
          .assign({ ready: true })
          .write();
    });

    client.on('disconnected', () => {
        instancias[nome].ready = false;
        instancias[nome].qr = null;
        console.log(`⚠️ Instância "${nome}" desconectada, reiniciando...`);

        db.get("instancias")
          .find({ name: nome })
          .assign({ ready: false })
          .write();

        client.initialize();
    });

    client.initialize();

    // Salva a instância no banco logo ao criar (se ainda não existir)
    const exists = db.get("instancias").find({ name: nome }).value();
    if (!exists) {
        db.get("instancias")
          .push({ name: nome, ready: false })
          .write();
    }
}

module.exports = { criarInstancia, instancias };
