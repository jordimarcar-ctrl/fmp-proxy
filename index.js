const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// Endpoint directo JSON para Make.com
app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://www.hockeypatines.fmp.es/competicion/${leagueId}`;

  try {
    // 1. Obtener el HTML directamente simulando navegador
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.hockeypatines.fmp.es/'
      }
    });

    // 2. Analizar el HTML recibido
    const $ = cheerio.load(response.data);
    const matches = [];

    $('table tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const rawTexts = cols.map((_, col) => $(col).text().trim()).get();
        matches.push({
          fecha: rawTexts[0] || '',
          hora: rawTexts[1] || '',
          local: rawTexts[2] || '',
          visitante: rawTexts[3] || '',
          pista: rawTexts[4] || ''
        });
      }
    });

    res.json({
      success: true,
      league_id: leagueId,
      total_matches: matches.length,
      matches: matches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Espejo visual para el navegador
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
