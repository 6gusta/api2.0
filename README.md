📱 WhatsApp Multi-Instance API

API completa para criar, gerenciar e operar instâncias independentes de WhatsApp usando a biblioteca whatsapp-web.js, permitindo envio e recebimento de mensagens, leitura de QR Codes em tempo real e integração com qualquer sistema externo.

Ideal para automações, chatbots, SAC, n8n, Typebot, etc.

🚀 Funcionalidades

✔️ Criar instâncias ilimitadas
✔️ Obter QR Code em tempo real
✔️ Enviar mensagens para qualquer número
✔️ Receber mensagens via Webhook
✔️ Verificar status da sessão
✔️ Encerrar/deslogar instâncias
✔️ API REST documentada
✔️ Ideal para integrações com chatbots e serviços externos

🏗️ Tecnologias

Node.js

Express

whatsapp-web.js

QRCode

Nodemon

Axios

📦 Instalação
git clone https://github.com/6gusta/Api-whatsapp
cd Api-whatsapp
npm install

▶️ Iniciar Servidor
npm start


O servidor sobe em:

http://localhost:3000

🔐 Criar uma nova instância
POST /instance/create
Content-Type: application/json


Body:

{
  "instanceName": "minhaLoja01"
}


Retorno:

{
  "message": "Instância criada. Aguarde o QR Code.",
  "instance": "minhaLoja01"
}

📲 Obter QR Code da Instância
GET /instance/qr/:instanceName


Exemplo:

GET /instance/qr/minhaLoja01


Retorno: Base64 do QR Code.

📊 Status da Instância
GET /instance/status/:instanceName


Retorno:

{
  "instance": "minhaLoja01",
  "status": "CONNECTED"
}

✉️ Enviar Mensagem
POST /message/send
Content-Type: application/json


Body:

{
  "instanceName": "minhaLoja01",
  "to": "5561999999999",
  "message": "Olá! Tudo certo?"
}


Retorno:

{
  "success": true,
  "info": "Mensagem enviada com sucesso"
}

🎧 Recebendo Mensagens (Webhook)

A API envia automaticamente qualquer mensagem recebida para o Webhook configurado.

Exemplo de payload recebido:

{
  "from": "556191234567",
  "to": "556198765432",
  "message": "Oi, tudo bem?",
  "timestamp": "2024-11-20T14:21:33Z"
}

🗑️ Encerrar Sessão
DELETE /instance/logout/:instanceName

❌ Deletar Instância
DELETE /instance/delete/:instanceName

📁 Estrutura do Projeto
Api-whatsapp/
│── src/
│   ├── server.js
│   ├── routes.js
│   ├── controllers/
│   ├── instances/
│   └── utils/
│
│── package.json
│── README.md

🔗 Integrações Comuns
🔹 Typebot

Use a URL:

POST https://seu_servidor.com/message/send


Body:

{
  "instanceName": "minhaLoja01",
  "to": "{{resposta_do_usuario}}",
  "message": "Sua mensagem aqui"
}

🔹 n8n

Node HTTP Request:

POST /message/send


Body:

{
  "instanceName": "myInstance",
  "to": "55{{numero}}",
  "message": "Texto automático"
}

🛑 Observações Importantes

⚠ QR Codes expiram em ~30 segundos
⚠ Instâncias desconectam se ficarem muito tempo sem uso
⚠ Sempre armazene a sessão se quiser evitar ler QR Code novamente

💬 Autor

Feito por Luiz Gustavo Pereira de Carvalho (6gusta) 🧑‍💻
Github: https://github.com/6gusta
