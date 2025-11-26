# WhatsApp Multi-Instance API

API para criar e gerenciar múltiplas instâncias independentes do WhatsApp utilizando a biblioteca whatsapp-web.js. Permite enviar mensagens, receber mensagens via webhook, gerar QR Codes em tempo real e integrar com sistemas externos como n8n, Typebot, chatbot próprio, etc.

Ideal para automações, SAC, suporte, bots e integrações profissionais.

---

## Funcionalidades

- Criar instâncias ilimitadas
- Obter QR Code em tempo real
- Enviar mensagens de texto
- Receber mensagens via Webhook
- Consultar status da sessão
- Encerrar/deslogar instâncias
- Integração com API REST
- Compatível com n8n, Typebot e qualquer sistema externo

---

## Tecnologias Utilizadas

- Node.js
- Express
- whatsapp-web.js
- Axios
- QRCode
- Nodemon

---

## Instalação

```bash
git clone https://github.com/6gusta/Api-whatsapp
cd Api-whatsapp
npm install
```

---

## Iniciar Servidor

```bash
npm start
```

Servidor padrão:  
http://localhost:3000

---

# Endpoints da API

## 1. Criar instância

**POST /instance/create**

```json
{
  "instanceName": "minhaInstancia"
}
```

---

## 2. Obter QR Code

**GET /instance/qr/:instanceName**

Retorna a imagem do QR Code em base64 para escanear no celular.

---

## 3. Ver status da instância

**GET /instance/status/:instanceName**

Retorno esperado:

```json
{
  "instance": "minhaInstancia",
  "status": "CONNECTED"
}
```

---

## 4. Enviar mensagem

**POST /message/send**

```json
{
  "instanceName": "minhaInstancia",
  "to": "5561999999999",
  "message": "Olá! Seu pedido foi recebido."
}
```

---

## 5. Receber mensagens (Webhook)

A API envia automaticamente POSTs para o seu webhook configurado.

Exemplo de payload:

```json
{
  "from": "556191234567",
  "to": "minhaInstancia",
  "message": "Olá, tudo bem?",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 6. Encerrar sessão

**DELETE /instance/logout/:instanceName**

---

## 7. Excluir instância

**DELETE /instance/delete/:instanceName**

---

# Estrutura do Projeto

```
Api-whatsapp/
│── src/
│   ├── server.js
│   ├── routes.js
│   ├── controllers/
│   ├── sessions/
│   └── utils/
│
├── package.json
└── README.md
```

---

# Integrações

## Typebot

Use um bloco HTTP com:

```
POST /message/send
Content-Type: application/json
```

Body:

```json
{
  "instanceName": "loja01",
  "to": "{{phone}}",
  "message": "{{resposta_do_typebot}}"
}
```

---

## n8n

Node → HTTP Request  
Método: POST  
URL: `/message/send`

---

# Autor

Desenvolvido por Luiz Gustavo Pereira de Carvalho  
GitHub: https://github.com/6gusta
