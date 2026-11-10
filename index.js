const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta de prueba para la página principal (para que no dé "Not Found")
app.get('/', (req, res) => {
  res.send('FMP Proxy is running! Usa /league/:id para ver los partidos.');
});

app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://hockeypatines.fmp.es/competicion/${leagueId}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const matches = await page.evaluate(() => {
      const matchRows = document.querySelectorAll('table tr');
      const parsedMatches = [];

      matchRows.forEach((tr, index) => {
        if (index === 0) return;
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
          parsedMatches.push({
            fecha: tds[0] ? tds[0].innerText.trim() : '',
            hora: tds[1] ? tds[1].innerText.trim() : '',
            equipo_local: tds[2] ? tds[2].innerText.trim() : '',
            equipo_visitante: tds[3] ? tds[3].innerText.trim() : '',
            pista: tds[4] ? tds[4].innerText.trim() : 'Por determinar'
          });
        }
      });

      return parsedMatches;
    });

    await browser.close();

    res.json({
      success: true,
      league_id: leagueId,
      total_matches: matches.length,
      matches: matches
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
