const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// Endpoint directo JSON para Make.com con manejo de sesión
app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;

  try {
    // 1. Crear una instancia de Axios que mantenga las cookies entre peticiones
    const client = axios.create({
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    // 2. Visitar primero la portada de la FMP para inicializar la sesión/cookies
    const homeRes = await client.get('https://www.hockeypatines.fmp.es/');
    const cookieHeader = homeRes.headers['set-cookie'];

    // 3. Consultar la liga usando las cookies generadas
    const targetUrl = `https://www.hockeypatines.fmp.es/?id_liga=${leagueId}`;
    const response = await client.get(targetUrl, {
      headers: {
        'Cookie': cookieHeader ? cookieHeader.join('; ') : '',
        'Referer': 'https://www.hockeypatines.fmp.es/'
      }
    });

    // 4. Procesar el HTML
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

// Proxy espejo visual
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
