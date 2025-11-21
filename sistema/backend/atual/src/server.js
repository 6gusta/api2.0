const app = require('./app');
const { restaurarInstancias } = require('./services/whatsappService');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  await restaurarInstancias();
});
