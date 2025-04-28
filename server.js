const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 8080;

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor WebSocket ativo!');
});

// Cria o WebSocket Server em cima do servidor HTTP
const wss = new WebSocket.Server({ server });

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

server.listen(port, () => {
  console.log(`Servidor HTTP e WebSocket rodando na porta ${port}`);
});
