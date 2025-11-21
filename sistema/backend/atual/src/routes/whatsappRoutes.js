const express = require('express');
const multer = require('multer');
const upload = multer();
const qrcode = require('qrcode');
const {
  criarInstancia,
  restaurarInstancias,
  getInstancias,
  MAX_INSTANCIAS_GRATIS,
  formatNumber,
  MessageMedia
} = require('../services/whatsappService');

const router = express.Router();
let instancias = getInstancias();

// Criar instância
router.post('/initialize', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

  if (instancias[name]) return res.json({ status: `Instância "${name}" já existe` });
  if (Object.keys(instancias).length >= MAX_INSTANCIAS_GRATIS)
    return res.status(403).json({ error: `Limite de ${MAX_INSTANCIAS_GRATIS} instâncias atingido.` });

  await criarInstancia(name);
  res.json({ status: `Instância "${name}" criada com sucesso!` });
});

// Status
router.get('/status/:name', (req, res) => {
  const inst = instancias[req.params.name];
  if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });
  res.json({ whatsappReady: inst.ready });
});

// QR Code
router.get('/qrcode/:name', async (req, res) => {
  const inst = instancias[req.params.name];
  if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });
  if (inst.ready) return res.json({ qr: null });
  if (!inst.qr) return res.status(404).json({ error: 'QR Code ainda não gerado' });

  const qrImage = await qrcode.toDataURL(inst.qr);
  res.json({ qr: qrImage });
});

// Enviar mensagem
router.post('/send/:name', upload.single('image'), async (req, res) => {
  try {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });

    if (!inst.ready) {
      inst.client.initialize();
      return res.status(503).json({ error: 'Instância não conectada. Tente novamente.' });
    }

    const number = req.body.toNumber;
    const message = req.body.message;
    const imageFile = req.file;

    if (!number) return res.status(400).json({ error: 'Número obrigatório' });

    const finalNumber = formatNumber(number);
    const numberId = await inst.client.getNumberId(finalNumber);
    if (!numberId) return res.status(404).json({ error: 'Número inválido' });

    if (message) await inst.client.sendMessage(numberId._serialized, message);
    if (imageFile) {
      const media = new MessageMedia(
        imageFile.mimetype,
        imageFile.buffer.toString('base64'),
        imageFile.originalname
      );
      await inst.client.sendMessage(numberId._serialized, media);
    }

    res.json({ status: 'Mensagem enviada!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar instâncias
router.get('/instancias', (req, res) => {
  res.json(Object.keys(instancias).map(name => ({ name })));
});

// Desconectar instância
router.post('/disconnect/:name', async (req, res) => {
  try {
    const inst = instancias[req.params.name];
    if (!inst) return res.status(404).json({ error: 'Instância não encontrada' });

    if (inst.client) {
      await inst.client.destroy();
      delete instancias[req.params.name];
      console.log(`💤 Instância "${req.params.name}" desconectada e removida.`);
      return res.json({ status: `Instância "${req.params.name}" desconectada com sucesso.` });
    } else {
      return res.status(400).json({ error: 'Cliente não inicializado.' });
    }
  } catch (err) {
    console.error('Erro ao desconectar:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
