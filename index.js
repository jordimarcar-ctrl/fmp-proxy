const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 10000;

// Ruta API para Make.com
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Paso previo: Entrar a la portada para cargar sesión/cookies
    await page.goto('https://www.hockeypatines.fmp.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 2. Ir directamente a la competición deseada
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 40000 });

    // 3. Extraer los datos de la tabla de partidos
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

// Proxy para navegación visual clonada
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
