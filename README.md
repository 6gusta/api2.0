WhatsApp Multi-Instance API

API completa para criar, gerenciar e operar instâncias independentes de WhatsApp usando a biblioteca whatsapp-web.js, permitindo envio e recebimento de mensagens, leitura de QR Codes em tempo real e integração com qualquer sistema externo.

Ideal para automações, chatbots, SAC, n8n, Typebot, etc.

Funcionalidades

✔ Criar instâncias ilimitadas
✔ Obter QR Code em tempo real
✔ Enviar mensagens para qualquer número
✔ Receber mensagens via Webhook
✔ Verificar status da sessão
✔ Encerrar/deslogar instâncias
✔ API REST documentada
✔ Integração com chatbots e serviços externos

Tecnologias

Node.js

Express

whatsapp-web.js

QRCode

Nodemon

Axios

Instalação
git clone https://github.com/6gusta/Api-whatsapp
cd Api-whatsapp
npm install

Iniciar Servidor
npm start


Servidor disponível em:

http://localhost:3000

Criar uma instância
POST /instance/create
Content-Type: application/json


Body:

{
  "instanceName": "minhaLoja01"
}

Obter QR Code da instância
GET /instance/qr/:instanceName

Ver status da instância
GET /instance/status/:instanceName


Retorno:

{
  "instance": "minhaLoja01",
  "status": "CONNECTED"
}

Enviar Mensagem
POST /message/send
Content-Type: application/json


Body:

{
  "instanceName": "minhaLoja01",
  "to": "5561999999999",
  "message": "Olá!"
}

Webhook (Receber Mensagens)

Exemplo de payload enviado pela API:

{
  "from": "556191234567",
  "to": "556198765432",
  "message": "Olá, tudo bem?",
  "timestamp": "2024-11-20T14:21:33Z"
}

Encerrar Sessão
DELETE /instance/logout/:instanceName

Deletar Instância
DELETE /instance/delete/:instanceName

Estrutura do Projeto
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

Integrações
Typebot

Envie a mensagem com:

POST /message/send


Body:

{
  "instanceName": "minhaLoja01",
  "to": "{{numero}}",
  "message": "Sua resposta aqui"
}

n8n

Configurar um node HTTP Request com:

POST /message/send

Autor

Desenvolvido por Luiz Gustavo Pereira de Carvalho (6gusta)
GitHub: https://github.com/6gusta
