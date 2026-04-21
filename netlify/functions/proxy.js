const https = require('https');

const ALLOWED_ORIGIN = 'https://seatemperature.info';

exports.handler = async function(event) {
  const url = event.queryStringParameters && event.queryStringParameters.url;

  // Validación: solo se permite fetching de seatemperature.info
  if (!url || !url.startsWith(ALLOWED_ORIGIN + '/')) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'URL no permitida. Solo se acepta seatemperature.info'
    };
  }

  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'identity'
        }
      },
      (res) => {
        // Seguir redirecciones manualmente (301/302)
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          var loc = res.headers.location;
          if (!loc.startsWith('http')) loc = ALLOWED_ORIGIN + loc;
          if (!loc.startsWith(ALLOWED_ORIGIN + '/')) {
            return resolve({ statusCode: 403, body: 'Redirección fuera del dominio permitido' });
          }
          // Reintentar con la URL redirigida
          return resolve(fetchUrl(loc));
        }

        if (res.statusCode !== 200) {
          return resolve({
            statusCode: res.statusCode,
            body: 'Error HTTP ' + res.statusCode + ' al obtener: ' + url
          });
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache'
            },
            body: data
          });
        });
      }
    );

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Error de red: ' + e.message
      });
    });

    // Timeout de 12 segundos
    req.setTimeout(12000, () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Timeout al obtener: ' + url
      });
    });
  });
};

// Función auxiliar para reintentar en redirecciones
function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
            body: data
          });
        });
      }
    );
    req.on('error', (e) => resolve({ statusCode: 500, body: 'Error: ' + e.message }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ statusCode: 504, body: 'Timeout' }); });
  });
}
