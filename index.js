const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor Proxy FMP activo y listo.');
});

// Proxy hacia fmp_mc_1.php usando parámetros directos
app.get('/api/proxy', (req, res) => {
  const idm = req.query.idm || '1';
  const idc = req.query.idc || '4870';
  
  const targetUrl = `https://www.server2.sidgad.es/rfep/fmp_mc_1.php?idm=${idm}&idc=${idc}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://www.server2.sidgad.es/'
    }
  };

  https.get(targetUrl, options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(response.statusCode).send(data);
    });
  }).on('error', err => {
    res.status(500).send(`Error en el proxy: ${err.message}`);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
