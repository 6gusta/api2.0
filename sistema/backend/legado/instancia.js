client.on('disconnected', async () => {
    instancias[nome].ready = false;
    instancias[nome].qr = null;
    console.log(`⚠️ Instância "${nome}" desconectada. Tentando reconectar em 5s...`);

    db.get("instancias")
      .find({ name: nome })
      .assign({ ready: false })
      .write();

    try {
        // Aguarda o fechamento completo antes de tentar reiniciar
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Cria uma nova instância do zero, evitando reuso do cliente antigo
        delete instancias[nome];
        await criarInstancia(nome);
    } catch (err) {
        console.error(`Erro ao reiniciar a instância "${nome}":`, err.message);
    }
});
