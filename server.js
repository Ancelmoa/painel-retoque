const http = require('http');
const WebSocket = require('ws');

// Cria o servidor HTTP e WebSocket juntos na mesma porta
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Servidor WebSocket ativo\n');
});

const wss = new WebSocket.Server({ server });

const PORTA = process.env.PORT || 8080;

server.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});

console.log('Servidor WebSocket rodando na porta 8080');

const usuariosValidos = {
    'admin': '12345',
    'usuario': 'senha',
    'Ancelmo': 'Genezis'
};

const clientes = new Map(); // socket -> { login, ip }
const conexoesPorUsuario = new Map(); // login -> Set de IPs

const LIMITE_DISPOSITIVOS = 1; // ✅ Altere aqui para permitir mais IPs por usuário

wss.on('connection', (socket, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 Nova conexão de IP: ${ip}`);

    socket.on('message', (mensagem) => {
        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login' && dados.login && dados.senha) {
                const senhaCorreta = usuariosValidos[dados.login];

                if (senhaCorreta && dados.senha === senhaCorreta) {
                    const ipsDoUsuario = conexoesPorUsuario.get(dados.login) || new Set();

                    if (!ipsDoUsuario.has(ip) && ipsDoUsuario.size >= LIMITE_DISPOSITIVOS) {
                        console.log(`⚠️  Usuário ${dados.login} tentou conectar de mais de ${LIMITE_DISPOSITIVOS} dispositivos. IP atual: ${ip}`);
                        socket.send(JSON.stringify({
                            tipo: 'erro',
                            mensagem: `Limite de ${LIMITE_DISPOSITIVOS} dispositivos atingido para ${dados.login}`
                        }));
                        // ⚠️ Mantém o socket aberto — o cliente decide o que fazer
                        
                        return;
                    }

                    // Autenticado
                    socket.send(JSON.stringify({ tipo: 'login', sucesso: true }));
                    clientes.set(socket, { login: dados.login, ip });
                    ipsDoUsuario.add(ip);
                    conexoesPorUsuario.set(dados.login, ipsDoUsuario);

                    console.log(`✅ Login bem-sucedido: ${dados.login} (${ip})`);
                    mostrarConectados();
                } else {
                    socket.send(JSON.stringify({ tipo: 'login', sucesso: false }));
                }
            }
        } catch (erro) {
            console.error('❗ Erro ao processar mensagem:', erro);
        }
    });

    socket.on('close', () => {
        const info = clientes.get(socket);
        clientes.delete(socket);

        if (info) {
            const { login, ip } = info;
            const ipsDoUsuario = conexoesPorUsuario.get(login);
            if (ipsDoUsuario) {
                ipsDoUsuario.delete(ip);
                if (ipsDoUsuario.size === 0) {
                    conexoesPorUsuario.delete(login);
                }
            }
            console.log(`🔌 Cliente desconectado: ${login} (${ip})`);
            mostrarConectados();
        }
    });

    socket.on('error', (erro) => {
        console.error('❗ Erro na conexão:', erro);
    });
});

// Ping para manter conexões WebSocket vivas
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.ping();
        }
    });
}, 30000);

function mostrarConectados() {
    console.log('🧑‍💻 Usuários conectados atualmente:');
    for (const [_, info] of clientes.entries()) {
        console.log(`- ${info.login} (${info.ip})`);
    }
}
