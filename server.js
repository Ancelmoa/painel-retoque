const http = require('http');
const WebSocket = require('ws');

// Cria um servidor HTTP básico só para manter o processo Railway ativo
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Servidor WebSocket ativo\n');
}).listen(process.env.HTTP_PORT || 3000);

// Servidor WebSocket
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
console.log('Servidor WebSocket rodando na porta 8080');

const fs = require('fs');
let usuariosValidos = {};

try {
    usuariosValidos = JSON.parse(fs.readFileSync('./usuarios.json', 'utf-8'));
} catch (err) {
    console.error('❗ Erro ao carregar usuarios.json:', err);
}

const clientes = new Map(); // socket -> { login, ip }
const conexoesPorUsuario = new Map(); // login -> Set de IPs
const LIMITE_DISPOSITIVOS = 2;

wss.on('connection', (socket, req) => {
    const ip = req.socket.remoteAddress;
    const origin = req.headers.origin || '';

    console.log(`🔌 Nova conexão de IP: ${ip} | Origem: ${origin}`);

    // Bloqueia origens suspeitas
    if (!origin.includes('file://') && !origin.includes('localhost')) {
        console.log(`🚫 Conexão recusada de origem: ${origin}`);
        socket.terminate();
        return;
    }

    // ⏱️ Timeout para login
    const tempoLimiteLogin = setTimeout(() => {
        if (!clientes.has(socket)) {
            socket.terminate();
            console.log(`⏱️ Desconectado por inatividade (sem login): ${ip}`);
        }
    }, 30000); // 10 segundos

    socket.on('message', (mensagem) => {
        try {
            const dados = JSON.parse(mensagem);

            if (dados.tipo === 'login' && dados.login && dados.senha) {
                const senhaCorreta = usuariosValidos[dados.login];

                if (senhaCorreta && dados.senha === senhaCorreta) {
                    const ipsDoUsuario = conexoesPorUsuario.get(dados.login) || new Set();

                    if (!ipsDoUsuario.has(ip) && ipsDoUsuario.size >= LIMITE_DISPOSITIVOS) {
                        console.log(`⚠️  ${dados.login} excedeu o limite de dispositivos (${LIMITE_DISPOSITIVOS})`);
                        socket.send(JSON.stringify({
                            tipo: 'erro',
                            mensagem: `Limite de ${LIMITE_DISPOSITIVOS} dispositivos atingido para ${dados.login}`
                        }));
                        return;
                    }

                    clearTimeout(tempoLimiteLogin); // ✅ Login feito, remove timeout

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

// Ping para manter conexões ativas
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.ping();
        }
    });
}, 30000);

// Exibe usuários conectados
function mostrarConectados() {
    console.log('🧑‍💻 Usuários conectados atualmente:');
    for (const [_, info] of clientes.entries()) {
        console.log(`- ${info.login} (${info.ip})`);
    }
}
