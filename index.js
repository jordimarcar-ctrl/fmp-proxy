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
    
    // PASO 1: Visitar la página previa (portales.php) para inicializar la sesión y capturar cookies
    const handshakeUrl = `https://www.server2.sidgad.es/rfep/portales.php?idm=${idm}&idc=${idc}`;
    
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9'
    };

    https.get(handshakeUrl, { headers: commonHeaders }, (handshakeRes) => {
      // Extraer las cookies de sesión que devuelve el servidor
      const setCookie = handshakeRes.headers['set-cookie'] || [];
      const cookieHeader = Array.isArray(setCookie) 
        ? setCookie.map(c => c.split(';')[0]).join('; ') 
        : '';

      // Consumir el stream de la primera respuesta
      let handshakeData = '';
      handshakeRes.on('data', chunk => handshakeData += chunk);
      handshakeRes.on('end', () => {
        
        // PASO 2: Llamar al script de partidos real (fmp_mc_1.php) usando la cookie obtenida
        const targetUrl = `https://www.server2.sidgad.es/rfep/fmp_mc_1.php?idm=${idm}&idc=${idc}`;
        
        const targetOptions = {
          headers: {
            ...commonHeaders,
            'Referer': handshakeUrl,
            'Cookie': cookieHeader,
            'Host': 'www.server2.sidgad.es'
          }
        };

        https.get(targetUrl, targetOptions, (targetRes) => {
          let data = '';
          targetRes.on('data', chunk => data += chunk);
          targetRes.on('end', () => {
            res.writeHead(targetRes.statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
          });
        }).on('error', err => {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Error en la petición de partidos: ${err.message}`);
        });

      });
    }).on('error', err => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Error en la sesión inicial: ${err.message}`);
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
