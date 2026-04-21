/**
 * /.netlify/functions/data
 * GET  → devuelve el blob cacheado
 * POST → fetcha seatemperature.info server-side, guarda en blob, retorna datos
 */
const https             = require('https');
const { getStore }      = require('@netlify/blobs');

const ALLOWED_ORIGIN    = 'https://seatemperature.info';
const BLOB_STORE        = 'sea-temp-mdq';
const BLOB_KEY          = 'cache-2026';
const LAST_EMBEDDED_IDX = 71;
const MONTH_NAMES_URL   = ['january','february','march','april','may','june','july',
                            'august','september','october','november','december'];
const MONTH_DAYS        = [31,28,31,30,31,30,31,31,30,31,30,31];

const CORS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
};

// ── helpers ────────────────────────────────────────────────────────────────

function monthDayToIdx(m, d) {
  let idx = d - 1;
  for (let i = 0; i < m; i++) idx += MONTH_DAYS[i];
  return Math.min(364, idx);
}

function todayStr() {
  const t = new Date();
  return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
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
    hcells.forEach(function(c, i) { if (c.replace(/<[^>]+>/g,'').trim() === String(year)) col = i; });
    if (col < 0) continue;
    for (let ri = 1; ri < rows.length; ri++) {
      const cells = rows[ri].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length < 2) continue;
      const dm = cells[0].replace(/<[^>]+>/g,'').trim().match(/^(\d+)/);
      if (!dm) continue;
      const day = parseInt(dm[1]);
      if (isNaN(day) || day < 1 || day > 31 || col >= cells.length) continue;
      const tm2 = cells[col].replace(/<[^>]+>/g,'').trim().match(/([\d.]+)/);
      if (tm2) result[day] = parseFloat(tm2[1]);
    }
  }
  return result;
}

function prepareText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&deg;/gi,  '\u00b0')
    .replace(/&#176;/g,  '\u00b0')
    .replace(/&amp;/gi,  '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');
}

function parseHomepage(html) {
  const result  = {};
  const MONTHS  = ['january','february','march','april','may','june','july',
                   'august','september','october','november','december'];
  const text    = prepareText(html);

  // Pattern 1: date THEN temperature within ~120 chars
  // e.g. "19 April 2026 ... 21.4°C" (handles &deg;, different spaces, HTML tags)
  const rx1 = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+2026/gi;
  let m;
  while ((m = rx1.exec(text)) !== null) {
    const day = parseInt(m[1]), mon = MONTHS.indexOf(m[2].toLowerCase());
    if (mon < 0 || day < 1 || day > 31) continue;
    const snippet = text.slice(m.index, m.index + m[0].length + 120);
    const t = snippet.match(/([\d]+\.[\d]+|[\d]+)\s*°\s*C/i);
    if (t) { const v = parseFloat(t[1]); if (v > 3 && v < 40) result[mon+'_'+day] = v; }
  }

  // Pattern 2: temperature THEN date within ~100 chars
  // e.g. "21.4°C ... 19 April 2026"
  const rx2 = /([\d]+\.[\d]+|[\d]+)\s*°\s*C.{0,100}?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+2026/gi;
  while ((m = rx2.exec(text)) !== null) {
    const v = parseFloat(m[1]), day = parseInt(m[2]), mon = MONTHS.indexOf(m[3].toLowerCase());
    if (mon < 0 || day < 1 || day > 31 || v <= 3 || v >= 40) continue;
    if (!(mon+'_'+day in result)) result[mon+'_'+day] = v;
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

// ── handler ────────────────────────────────────────────────────────────────

exports.handler = async function(event) {

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  // Usar getStore con string simple — compatible con deploy manual ZIP
  const store = getStore(BLOB_STORE);

  // ── GET: devolver blob ────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const cached = await store.get(BLOB_KEY, { type: 'json' });
      return { statusCode: 200, headers: CORS, body: JSON.stringify(cached || { lastFetch: null, data: {} }) };
    } catch (e) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ lastFetch: null, data: {} }) };
    }
  }

  // ── POST: fetch + guardar en blob ─────────────────────────────────────────
  if (event.httpMethod === 'POST') {

    // Leer blob existente como punto de partida
    let cache = { lastFetch: null, data: {} };
    try {
      cache = (await store.get(BLOB_KEY, { type: 'json' })) || cache;
    } catch (_) {}

    const today = new Date();
    const ts    = todayStr();

    // Índice del último día conocido en el blob
    let lastIdx = LAST_EMBEDDED_IDX;
    for (const key of Object.keys(cache.data || {})) {
      const idx = parseInt(key);
      if (!isNaN(idx) && idx > lastIdx && cache.data[key] != null) lastIdx = idx;
    }

    const months = monthsToFetch(lastIdx, today);

    // Fetch de cada mes en paralelo (sin restricciones CORS, es server-side)
    await Promise.all(months.map(async function(m) {
      try {
        const url   = ALLOWED_ORIGIN+'/'+MONTH_NAMES_URL[m]+'/mar-del-plata-water-temperature.html';
        const html  = await httpGet(url);
        const temps = parseMonthlyPage(html, 2026);
        for (const [dayStr, temp] of Object.entries(temps)) {
          const day     = parseInt(dayStr);
          const idx     = monthDayToIdx(m, day);
          const dayDate = new Date(2026, m, day);
          if (idx > LAST_EMBEDDED_IDX && dayDate <= today) cache.data[String(idx)] = temp;
        }
      } catch (e) { console.warn('month '+m+' failed: '+e.message); }
    }));

    // Homepage para capturar el dato de hoy (puede ir un día adelante de la página mensual)
    try {
      const html   = await httpGet(ALLOWED_ORIGIN+'/mar-del-plata-water-temperature.html');
      const parsed = parseHomepage(html);
      for (const [key, temp] of Object.entries(parsed)) {
        const parts   = key.split('_');
        const mon = parseInt(parts[0]), day = parseInt(parts[1]);
        const idx     = monthDayToIdx(mon, day);
        const dayDate = new Date(2026, mon, day);
        if (idx > LAST_EMBEDDED_IDX && dayDate <= today) cache.data[String(idx)] = temp;
      }
    } catch (e) { console.warn('homepage failed: '+e.message); }

    cache.lastFetch = ts;

    // Guardar en blob
    try {
      await store.setJSON(BLOB_KEY, cache);
    } catch (e) { console.error('blob write failed: '+e.message); }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(cache) };
  }

  return { statusCode: 405, headers: CORS, body: '"Method not allowed"' };
};
