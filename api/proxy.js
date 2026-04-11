/**
 * /api/proxy
 * Proxy server-side para evitar CORS al acceder a seatemperature.info
 * Parámetro: ?url=https://seatemperature.info/...
 */
const https = require('https');

const ALLOWED_ORIGIN = 'https://seatemperature.info';

function httpGet(url, hops) {
  hops = hops === undefined ? 3 : hops;
  return new Promise(function(resolve, reject) {
    const req = https.get(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      }
    }, function(res) {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        if (hops <= 0) return reject(new Error('Too many redirects'));
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = ALLOWED_ORIGIN + loc;
        res.resume();
        return resolve(httpGet(loc, hops - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', function(c) { buf += c; });
      res.on('end',  function()  { resolve(buf); });
    });
    req.on('error', reject);
    req.setTimeout(12000, function() { req.destroy(); reject(new Error('Timeout')); });
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = req.query && req.query.url;

  if (!url || !url.startsWith(ALLOWED_ORIGIN + '/')) {
    return res.status(400).send('URL no permitida. Solo se acepta seatemperature.info');
  }

  try {
    const html = await httpGet(url);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
};
