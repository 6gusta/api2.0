const LOCAL = window.location.hostname.includes("localhost");

const API_URL = LOCAL 
    ? "http://localhost:3000" // desenvolvimento local
    : "https://api2-0-agp8.onrender.com"; // sem barra final

const createBtn = document.getElementById('createBtn');
const cardsContainer = document.getElementById('cards-container');
const integrationModal = document.getElementById('integrationModal');

const modalInstanceName = document.getElementById('modalInstanceName');
const sendEndpoint = document.getElementById('sendEndpoint');
const statusEndpoint = document.getElementById('statusEndpoint');
const qrEndpoint = document.getElementById('qrEndpoint');
const disconnectEndpoint = document.getElementById('disconnectEndpoint');

const numberInput = document.getElementById('numberInput');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput'); // input para imagem
const sendTestBtn = document.getElementById('sendTestBtn');
const closeModal = integrationModal.querySelector('.close');

let instancias = {}; // armazenando instâncias no frontend

// ----------------- FUNÇÕES PRINCIPAIS -----------------

// Criar instância via API
createBtn.addEventListener('click', async () => {
    const nome = prompt("Digite o nome da instância:");
    if (!nome) return;

    try {
        const res = await fetch(`${API_URL}/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nome })
        });
        const data = await res.json();
        alert(data.status || data.error);

        if (!data.error) createCard(nome);
    } catch (err) {
        console.error(err);
        alert("Erro ao criar instância: " + err.message);
    }
});

// Criar card de instância
function createCard(nome) {
    if (instancias[nome]) return;
    instancias[nome] = true;

    const card = document.createElement('div');
    card.className = 'instance-card';
    card.id = `card-${nome}`;
    card.innerHTML = `
        <h2>${nome}</h2>
        <p class="status">Aguardando QR...</p>
        <div class="qr-container">
            <img class="qr" />
            <p class="qr-text">Escaneie o QR para conectar</p>
        </div>
        <button class="integration-btn">Integração</button>
        <button class="disconnect-btn">Desconectar</button>
    `;
    cardsContainer.appendChild(card);

    // Botão desconectar
    card.querySelector('.disconnect-btn').addEventListener('click', async () => {
        if (!confirm(`Desconectar a instância "${nome}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/disconnect/${nome}`, { method: 'POST' });
            const data = await res.json();
            alert(data.status || data.error);
        } catch (err) {
            console.error(err);
            alert('Erro ao desconectar: ' + err.message);
        }
    });

    // Botão integração
    card.querySelector('.integration-btn').addEventListener('click', () => openIntegrationModal(nome));

    // Atualiza status e QR
    updateStatus(nome);
}

// Abrir modal de integração
function openIntegrationModal(nome) {
    modalInstanceName.textContent = nome;
    sendEndpoint.textContent = `${API_URL}/send/${nome}`;
    statusEndpoint.textContent = `${API_URL}/status/${nome}`;
    qrEndpoint.textContent = `${API_URL}/qrcode/${nome}`;
    disconnectEndpoint.textContent = `${API_URL}/disconnect/${nome}`;

    numberInput.value = '';
    messageInput.value = '';
    fileInput.value = '';

    integrationModal.style.display = 'flex';
}

// Enviar mensagem de teste (texto + imagem)
sendTestBtn.addEventListener('click', async () => {
    const number = numberInput.value.trim();
    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (!number && !message && !file) return alert("Preencha número, mensagem ou selecione uma imagem");

    const formData = new FormData();
    if (number) formData.append('toNumber', number);
    if (message) formData.append('message', message);
    formData.append('fromNumber', '5561991763642'); // seu número
    if (file) formData.append('image', file);

    try {
        const res = await fetch(`${API_URL}/send/${modalInstanceName.textContent}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        alert(data.status || data.error);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        alert('Erro ao enviar mensagem. Veja console.');
    }
});

// Fechar modal
closeModal.addEventListener('click', () => integrationModal.style.display = 'none');
window.addEventListener('click', e => {
    if (e.target === integrationModal) integrationModal.style.display = 'none';
});

// Atualiza status e QR
async function updateStatus(nome) {
    const card = document.getElementById(`card-${nome}`);
    if (!card) return;

    const statusEl = card.querySelector('.status');
    const qrEl = card.querySelector('.qr');
    const qrContainer = card.querySelector('.qr-container');

    try {
        const res = await fetch(`${API_URL}/status/${nome}`);
        const data = await res.json();

        if (data.whatsappReady) {
            statusEl.textContent = '✅ Conectado';
            statusEl.style.color = '#2ecc71';
            qrContainer.style.display = 'none';
        } else {
            statusEl.textContent = '📲 Aguardando QR';
            statusEl.style.color = '#f1c40f';
            await fetchQRCode(nome, qrEl, qrContainer);
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = '❌ Erro ao verificar status';
        statusEl.style.color = '#e74c3c';
    }

    setTimeout(() => updateStatus(nome), 3000); // atualiza a cada 3s
}

// Buscar QR
async function fetchQRCode(nome, qrEl, qrContainer) {
    try {
        const res = await fetch(`${API_URL}/qrcode/${nome}`);
        const data = await res.json();

        if (data.qr) {
            qrEl.src = data.qr;
            qrContainer.style.display = 'flex';
        } else {
            qrContainer.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        qrContainer.style.display = 'none';
    }
}

// ----------------- CARREGAR INSTÂNCIAS EXISTENTES -----------------
async function carregarInstancias() {
    try {
        const res = await fetch(`${API_URL}/instancias`);
        const lista = await res.json();
        lista.forEach(inst => createCard(inst.name));
    } catch (err) {
        console.error('Erro ao carregar instâncias:', err);
    }
}

// Executa ao carregar a página
window.addEventListener('DOMContentLoaded', carregarInstancias);
