const WebSocket = require('ws');
const http = require('http');

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
    if (req.url === '/status') {
        // Responde com a lista de clientes conectados
        const logins = Array.from(clientes.values());
        const resposta = {
            totalConectados: logins.length,
            usuarios: logins
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resposta));
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Cria o servidor WebSocket usando o mesmo servidor HTTP
const wss = new WebSocket.Server({ server });

console.log('Servidor WebSocket rodando na porta 8080');

// Armazena os clientes conectados
const clientes = new Map(); // Mapear o socket para o login

// Quando um cliente se conecta
wss.on('connection', (socket) => {
    console.log('Cliente conectado.');
    console.log(`Total de clientes conectados: ${wss.clients.size}`);

    socket.on('message', (mensagem) => {
        console.log('Mensagem recebida:', mensagem);

        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login') {
                if (dados.login && dados.senha) {
                    console.log(`Tentativa de login: ${dados.login}`);

                    // Simulação de validação de login
                    if (dados.login === 'usuario' && dados.senha === 'senha') {
                        socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));

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

    socket.on('close', () => {
        const login = clientes.get(socket);
        clientes.delete(socket);

        console.log(`Cliente desconectado: ${login || 'desconhecido'}`);
        console.log(`Total de clientes conectados: ${wss.clients.size}`);
        console.log('Usuários conectados atualmente:');
        for (const [sock, login] of clientes.entries()) {
            console.log(`- ${login}`);
        }
    });

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

// Inicia o servidor HTTP na porta 8080 ou porta do Railway
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
