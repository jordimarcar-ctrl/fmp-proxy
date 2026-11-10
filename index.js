const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Ruta para que Make.com obtenga los datos limpios en JSON
app.get('/league/:id', async (req, res) => {
  const leagueId = req.params.id;
  const targetUrl = `https://www.hockeypatines.fmp.es/competicion/${leagueId}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const matches = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      const parsed = [];
      rows.forEach((row, i) => {
        if (i === 0) return;
        const cols = row.querySelectorAll('td');
        if (cols.length >= 3) {
          parsed.push({
            fecha: cols[0] ? cols[0].innerText.trim() : '',
            hora: cols[1] ? cols[1].innerText.trim() : '',
            local: cols[2] ? cols[2].innerText.trim() : '',
            visitante: cols[3] ? cols[3].innerText.trim() : '',
            pista: cols[4] ? cols[4].innerText.trim() : ''
          });
        }
      });
      return parsed;
    });

    await browser.close();
    res.json({ success: true, league_id: leagueId, matches });
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Proxy inverso para clonar y navegar la web original de la Federación
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
