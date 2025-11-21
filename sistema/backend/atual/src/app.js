const path = require('path');
const express = require('express');
const corsConfig = require('./config/cors');
const whatsappRoutes = require('./routes/whatsappRoutes');

const app = express();

app.use(corsConfig);
app.use(express.json());

// Caminho certo do frontend/html
const frontendPath = path.join(__dirname, '..', '..', '..', 'frontend', 'html');
console.log('🧭 Servindo frontend de:', frontendPath);

// Servir arquivos estáticos
app.use(express.static(frontendPath));

// Rotas da API
app.use('/', whatsappRoutes);

// Evita aviso do Chrome DevTools
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_, res) => res.status(204).send());

// ✅ Rota fallback sem erro (Express 5)
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;
