const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

// Redirige todo el tráfico visual como un espejo transparente de la FMP
app.use('/', createProxyMiddleware({
  target: 'https://www.hockeypatines.fmp.es',
  changeOrigin: true,
  secure: false
}));

app.listen(PORT, () => {
  console.log(`Servidor proxy ejecutándose en puerto ${PORT}`);
});
