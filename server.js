const WebSocket = require('ws');

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log('🚀 Servidor WebSocket rodando na porta 8080');

// Lista de usuários válidos
const usuariosValidos = {
    'admin': '12345',
    'usuario': 'senha',
    'Ancelmo': 'Genezis'
};

// Armazena os clientes conectados: socket -> { login, ip }
const clientes = new Map();

wss.on('connection', (socket, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 Nova conexão de IP: ${ip}`);

    socket.on('message', (mensagem) => {
        console.log('📨 Mensagem recebida:', mensagem);

        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login') {
                const { login, senha } = dados;
                const senhaCorreta = usuariosValidos[login];

                if (senhaCorreta && senha === senhaCorreta) {
                    socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));
                    clientes.set(socket, { login, ip });

                    console.log(`✅ Login bem-sucedido: ${login} (${ip})`);
                    mostrarConectados();
                } else {
                    socket.send(JSON.stringify({ tipo: 'login', sucesso: false }));
                    console.log(`❌ Falha de login para ${login} (${ip})`);
                }
            }
        } catch (erro) {
            console.error('❗ Erro ao processar mensagem:', erro);
        }
    });

    socket.on('close', () => {
        const info = clientes.get(socket);
        clientes.delete(socket);

        console.log(`🔌 Cliente desconectado: ${info?.login || 'desconhecido'} (${info?.ip || 'IP desconhecido'})`);
        mostrarConectados();
    });

    socket.on('error', (erro) => {
        console.error('❗ Erro na conexão:', erro);
    });
});

// Ping para manter conexões vivas
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.ping();
        }
    });
}, 30000);

// Exibe usuários conectados no terminal
function mostrarConectados() {
    console.log('🧑‍💻 Usuários conectados atualmente:');
    for (const [_, info] of clientes.entries()) {
        console.log(`- ${info.login} (${info.ip})`);
    }
}
