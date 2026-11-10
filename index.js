const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('FMP Proxy is running! Usa /league/:id para ver los partidos.');
});

app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://www.hockeypatines.fmp.es/competicion/${leagueId}`;

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
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Esperar a que cargue cualquier tabla o contenedor de partidos
    await page.waitForTimeout(3000);

    const matches = await page.evaluate(() => {
      const parsedMatches = [];
      // Buscar cualquier tabla o filas con datos de partidos
      const rows = document.querySelectorAll('table tr, .match-row, .partido-item');

      rows.forEach((row) => {
        const cols = row.querySelectorAll('td, div');
        if (cols.length >= 3) {
          const textValues = Array.from(cols).map(c => c.innerText.trim()).filter(t => t.length > 0);
          if (textValues.length >= 3) {
            parsedMatches.push({
              raw_data: textValues
            });
          }
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
