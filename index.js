const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Ruta específica para leer ligas directamente (para ti y para Make.com)
app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  // Usamos la ruta real que acepta la federación cuando navegas
  const targetUrl = `https://www.hockeypatines.fmp.es/competicion.asp?id_competicion=${leagueId}`;

  try {
    // Hacemos la petición imitando a un navegador real
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.hockeypatines.fmp.es/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const matches = [];

    // Buscamos la tabla de partidos en la página de la federación
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

    // Devolvemos los partidos en formato JSON limpio
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

// 2. Proxy espejo general para navegar por toda la web visualmente
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor proxy ejecutándose en puerto ${PORT}`);
});
