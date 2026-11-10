const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Servidor Proxy FMP activo y listo.');
    return;
  }

  if (parsedUrl.pathname === '/api/proxy') {
    const idm = parsedUrl.query.idm || '1';
    const idc = parsedUrl.query.idc || '4870';
    
    // Probamos la ruta estándar de la federación para competiciones
    const targetUrl = `https://www.server2.sidgad.es/rfep/portales/fmp/fmp_mc_1.php?idm=${idm}&idc=${idc}`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.server2.sidgad.es/'
      }
    };

    https.get(targetUrl, options, (proxyRes) => {
      // Si hay una redirección (302/301), la seguimos automáticamente
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        https.get(proxyRes.headers.location, options, (redirectRes) => {
          let redirectData = '';
          redirectRes.on('data', chunk => redirectData += chunk);
          redirectRes.on('end', () => {
            res.writeHead(redirectRes.statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(redirectData);
          });
        }).on('error', err => {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Error en redirección: ${err.message}`);
        });
        return;
      }

      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
    }).on('error', err => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Error en el proxy: ${err.message}`);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
