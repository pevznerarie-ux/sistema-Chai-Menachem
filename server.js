// Servidor da prévia: entrega a página única do sistema.
const http = require('http');
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'public', 'index.html');
http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  fs.readFile(file, (err, html) => {
    if (err) { res.writeHead(500); return res.end('Erro ao abrir a página.'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-cache' });
    res.end(html);
  });
}).listen(process.env.PORT || 3000, () => console.log('Sistema Chai Menachem no ar'));
