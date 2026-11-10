const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 10000;

// Ruta JSON para Make.com
app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://www.hockeypatines.fmp.es/competicion/${leagueId}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Cargar sesión original e ir a la competición
    await page.goto('https://www.hockeypatines.fmp.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 40000 });

    const matches = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      const parsed = [];
      
      rows.forEach((row) => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 4) {
          const rawTexts = Array.from(cols).map(c => c.innerText.trim());
          parsed.push({
            fecha: rawTexts[0] || '',
            hora: rawTexts[1] || '',
            local: rawTexts[2] || '',
            visitante: rawTexts[3] || '',
            pista: rawTexts[4] || ''
          });
        }
      });
      return parsed;
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy para la web visual completa
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
