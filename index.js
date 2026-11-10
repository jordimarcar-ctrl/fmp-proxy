const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Proxy FMP activo y listo.');
});

// Endpoint para Make.com
app.get('/api/liga/:id', (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://www.server2.sidgad.es/rfep/rfep_mc_1.php?idm=1&idc=${leagueId}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  };

  https.get(targetUrl, options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(data);
    });

  }).on('error', (err) => {
    console.error('Error al consultar Sidgad:', err);
    res.status(500).send(`Error interno del proxy: ${err.message}`);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
