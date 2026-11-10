const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir peticiones desde cualquier origen
app.use(cors());
app.use(express.json());

// Ruta de prueba para comprobar que el proxy está vivo
app.get('/', (req, res) => {
  res.send('Servidor Proxy FMP activo y listo.');
});

// Endpoint principal para Make.com: extrae los datos de cualquier liga de Sidgad
app.get('/api/liga/:id', async (req, res) => {
  try {
    const leagueId = req.params.id;
    const targetUrl = `https://www.server2.sidgad.es/rfep/rfep_mc_1.php?idm=1&idc=${leagueId}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Error de Sidgad: Status ${response.status}`);
    }

    const html = await response.text();
    
    // Devolver el HTML limpio directamente a Make
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error procesando la liga:', error);
    res.status(500).send(`Error interno del proxy: ${error.message}`);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
