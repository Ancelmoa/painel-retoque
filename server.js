const WebSocket = require('ws');

// Pega a porta que o Railway vai fornecer automaticamente
const port = process.env.PORT || 5050;

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port });

const usuarios = [
    { login: 'admin', senha: '12345' },
    { login: 'user', senha: 'senha123' }
];

wss.on('connection', (ws) => {
    console.log('Novo cliente conectado!');

    ws.on('message', (message) => {
        console.log('Mensagem recebida do cliente: ', message);
        let dados;

        try {
            dados = JSON.parse(message);
        } catch (error) {
            console.log('Erro ao fazer parse da mensagem:', error);
            ws.close();
            return;
        }

        if (dados.tipo === 'login') {
            const usuario = usuarios.find(u => u.login === dados.login && u.senha === dados.senha);

            if (usuario) {
                ws.send(JSON.stringify({ tipo: 'login', sucesso: true }));
            } else {
                ws.send(JSON.stringify({ tipo: 'login', sucesso: false }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });

    ws.on('error', (error) => {
        console.log('Erro na conexão do WebSocket:', error);
    });
});

wss.on('listening', () => {
    console.log(`Servidor WebSocket rodando na porta ${port}`);
});

wss.on('error', (error) => {
    console.log('Erro no servidor WebSocket: ', error);
});
