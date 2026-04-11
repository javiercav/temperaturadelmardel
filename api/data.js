/**
 * /api/data
 *
 * GET  → devuelve el cache almacenado en Vercel Blob
 * POST → fetchea seatemperature.info server-side, guarda en Blob, retorna datos frescos
 *
 * Requiere la variable de entorno BLOB_READ_WRITE_TOKEN (Vercel la inyecta
 * automáticamente al vincular un Blob Store desde el dashboard).
 */
const https          = require('https');
const { put, list }  = require('@vercel/blob');

const BLOB_NAME         = 'sea-temp-mdq-2026.json';
const ALLOWED_ORIGIN    = 'https://seatemperature.info';
const LAST_EMBEDDED_IDX = 71; // 13-Mar-2026
const MONTH_NAMES_URL   = ['january','february','march','april','may','june','july',
                            'august','september','october','november','december'];
const MONTH_DAYS        = [31,28,31,30,31,30,31,31,30,31,30,31];

// ── helpers ────────────────────────────────────────────────────────────────

function monthDayToIdx(m, d) {
  let idx = d - 1;
  for (let i = 0; i < m; i++) idx += MONTH_DAYS[i];
  return Math.min(364, idx);
}

function todayStr() {
  const t = new Date();
  return t.getFullYear() + '-'
    + String(t.getMonth() + 1).padStart(2, '0') + '-'
    + String(t.getDate()).padStart(2, '0');
}

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
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', function(c) { buf += c; });
      res.on('end',  function()  { resolve(buf); });
    });
    req.on('error', reject);
    req.setTimeout(12000, function() { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseMonthlyPage(html, year) {
  const result  = {};
  const tableRx = /<table[\s\S]*?<\/table>/gi;
  let tm;
  while ((tm = tableRx.exec(html)) !== null) {
    const rows = tm[0].match(/<tr[\s\S]*?<\/tr>/gi);
    if (!rows || rows.length < 2) continue;
    const hcells = rows[0].match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
    let col = -1;
    hcells.forEach(function(c, i) {
      if (c.replace(/<[^>]+>/g, '').trim() === String(year)) col = i;
    });
    if (col < 0) continue;
    for (let ri = 1; ri < rows.length; ri++) {
      const cells = rows[ri].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length < 2) continue;
      const dm = cells[0].replace(/<[^>]+>/g, '').trim().match(/^(\d+)/);
      if (!dm) continue;
      const day = parseInt(dm[1]);
      if (isNaN(day) || day < 1 || day > 31 || col >= cells.length) continue;
      const tm2 = cells[col].replace(/<[^>]+>/g, '').trim().match(/([\d.]+)/);
      if (tm2) result[day] = parseFloat(tm2[1]);
    }
  }
  return result;
}

function parseHomepage(html) {
  const result = {};
  const MONTHS = ['january','february','march','april','may','june','july',
                  'august','september','october','november','december'];
  const rx = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})[^\d]+([\d.]+).C/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const day = parseInt(m[1]), mon = MONTHS.indexOf(m[2].toLowerCase());
    const yr  = parseInt(m[3]),  tmp = parseFloat(m[4]);
    if (yr === 2026 && mon >= 0 && day >= 1 && day <= 31 && tmp > 0 && tmp < 40)
      result[mon + '_' + day] = tmp;
  }
  return result;
}

function monthsToFetch(lastIdx, today) {
  let dayCount = 0, startM = 0;
  for (let m = 0; m < 12; m++) {
    dayCount += MONTH_DAYS[m];
    if (dayCount - 1 >= lastIdx) { startM = m; break; }
  }
  const months = [];
  for (let m = startM; m <= today.getMonth(); m++) months.push(m);
  return months;
}

// ── blob helpers ───────────────────────────────────────────────────────────

async function loadFromBlob() {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    if (!blobs || blobs.length === 0) return { lastFetch: null, data: {} };
    // Fetch the public URL of the blob
    const response = await fetch(blobs[0].url);
    if (!response.ok) return { lastFetch: null, data: {} };
    return await response.json();
  } catch (e) {
    console.warn('loadFromBlob failed:', e.message);
    return { lastFetch: null, data: {} };
  }
}

async function saveToBlob(cache) {
  await put(BLOB_NAME, JSON.stringify(cache), {
    access:            'public',
    addRandomSuffix:   false,
    contentType:       'application/json',
  });
}

// ── handler ────────────────────────────────────────────────────────────────

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── GET: devolver blob ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    const cache = await loadFromBlob();
    return res.status(200).json(cache);
  }

  // ── POST: fetch seatemperature.info + guardar en Blob ──────────────────
  if (req.method === 'POST') {
    const cache = await loadFromBlob();
    const today = new Date();
    const ts    = todayStr();

    // Índice del último día conocido en el blob
    let lastIdx = LAST_EMBEDDED_IDX;
    for (const key of Object.keys(cache.data || {})) {
      const idx = parseInt(key);
      if (!isNaN(idx) && idx > lastIdx && cache.data[key] != null) lastIdx = idx;
    }

    const months = monthsToFetch(lastIdx, today);

    // Fetch de cada mes en paralelo (server-side — sin restricciones CORS)
    await Promise.all(months.map(async function(m) {
      try {
        const url   = ALLOWED_ORIGIN + '/' + MONTH_NAMES_URL[m] + '/mar-del-plata-water-temperature.html';
        const html  = await httpGet(url);
        const temps = parseMonthlyPage(html, 2026);
        for (const [dayStr, temp] of Object.entries(temps)) {
          const day     = parseInt(dayStr);
          const idx     = monthDayToIdx(m, day);
          const dayDate = new Date(2026, m, day);
          if (idx > LAST_EMBEDDED_IDX && dayDate <= today) cache.data[String(idx)] = temp;
        }
      } catch (e) { console.warn('month ' + m + ' failed: ' + e.message); }
    }));

    // Homepage: captura el dato de hoy (puede adelantarse a la página mensual)
    try {
      const html   = await httpGet(ALLOWED_ORIGIN + '/mar-del-plata-water-temperature.html');
      const parsed = parseHomepage(html);
      for (const [key, temp] of Object.entries(parsed)) {
        const parts   = key.split('_');
        const mon     = parseInt(parts[0]), day = parseInt(parts[1]);
        const idx     = monthDayToIdx(mon, day);
        const dayDate = new Date(2026, mon, day);
        if (idx > LAST_EMBEDDED_IDX && dayDate <= today) cache.data[String(idx)] = temp;
      }
    } catch (e) { console.warn('homepage failed: ' + e.message); }

    cache.lastFetch = ts;

    // Guardar en Vercel Blob
    try {
      await saveToBlob(cache);
    } catch (e) { console.error('blob write failed: ' + e.message); }

    return res.status(200).json(cache);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
