const WebSocket = require('ws');

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log('Servidor WebSocket rodando na porta 8080');

// Armazena os clientes conectados
const clientes = new Map(); // Mapear o socket para o login

// Quando um cliente se conecta
wss.on('connection', (socket) => {
    console.log('Cliente conectado.');

    // Quando o servidor recebe uma mensagem
    socket.on('message', (mensagem) => {
        console.log('Mensagem recebida:', mensagem);

        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login') {
                if (dados.login && dados.senha) {
                    console.log(`Login recebido: ${dados.login}`);

                    // Simulação de validação de login
                    if (dados.login === 'usuario' && dados.senha === 'senha') {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));

                        // Armazena o socket e o login
                        clientes.set(socket, dados.login);

                        console.log(`Usuário autenticado: ${dados.login}`);
                        console.log('Usuários conectados atualmente:');
                        for (const [sock, login] of clientes.entries()) {
                            console.log(`- ${login}`);
                        }
                    } else {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: false }));
                    }
                }
            }
        } catch (erro) {
            console.error('Erro ao processar mensagem:', erro);
        }
    });

    // Quando a conexão é encerrada
    socket.on('close', () => {
        const login = clientes.get(socket);
        clientes.delete(socket);

        console.log(`Cliente desconectado: ${login || 'desconhecido'}`);
        console.log('Usuários conectados atualmente:');
        for (const [sock, login] of clientes.entries()) {
            console.log(`- ${login}`);
        }
    });

    // Quando ocorre algum erro
    socket.on('error', (erro) => {
        console.error('Erro na conexão:', erro);
    });
});

// Mantém o servidor ativo
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.ping();
        }
    });
}, 30000);
