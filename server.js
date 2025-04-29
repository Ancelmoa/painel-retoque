const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

console.log('Servidor WebSocket rodando.');

// Armazena os clientes conectados
const clientes = new Map();

// Rota para status
app.get('/status', (req, res) => {
    const logins = Array.from(clientes.values());
    res.json({
        totalConectados: logins.length,
        usuarios: logins
    });
});

// WebSocket
wss.on('connection', (socket) => {
    console.log('Cliente conectado.');

    socket.on('message', (mensagem) => {
        console.log('Mensagem recebida:', mensagem);

        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login') {
                if (dados.login && dados.senha) {
                    console.log(`Tentativa de login: ${dados.login}`);

                    if (dados.login === 'usuario' && dados.senha === 'senha') {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));

                        clientes.set(socket, dados.login);

                        console.log(`Usuário autenticado: ${dados.login}`);
                    } else {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: false }));
                    }
                }
            }
        } catch (erro) {
            console.error('Erro ao processar mensagem:', erro);
        }
    });

    socket.on('close', () => {
        const login = clientes.get(socket);
        clientes.delete(socket);
        console.log(`Cliente desconectado: ${login || 'desconhecido'}`);
    });

    socket.on('error', (erro) => {
        console.error('Erro na conexão:', erro);
    });
});

// Mantém o servidor ativo
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.ping();
        }
    });
}, 30000);

// Inicia o servidor HTTP
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
