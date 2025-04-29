const WebSocket = require('ws');

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log('Servidor WebSocket rodando na porta 8080');

// Lista de usuários válidos
const usuariosValidos = {
    'admin': '12345',
    'usuario': 'senha',
    'Ancelmo': 'Genezis'
};

// Armazena os clientes conectados
const clientes = new Map(); // socket -> { login, ip }

wss.on('connection', (socket, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 Nova conexão de IP: ${ip}`);

    socket.on('message', (mensagem) => {
        console.log('📨 Mensagem recebida:', mensagem);

        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login') {
                if (dados.login && dados.senha) {
                    const senhaCorreta = usuariosValidos[dados.login];

                    if (senhaCorreta && dados.senha === senhaCorreta) {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));

                        // Armazena o cliente conectado
                        clientes.set(socket, { login: dados.login, ip });

                        console.log(`✅ Login bem-sucedido: ${dados.login} (${ip})`);
                        mostrarConectados();
                    } else {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: false }));
                        console.log(`❌ Falha de login para ${dados.login} (${ip})`);
                    }
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

// Função para mostrar conectados
function mostrarConectados() {
    console.log('🧑‍💻 Usuários conectados atualmente:');
    for (const [_, info] of clientes.entries()) {
        console.log(`- ${info.login} (${info.ip})`);
    }
}
