// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
// Variables used by Scriptable.
// icon-color: teal; icon-glyph: water;
//
// MAREAS · PUERTO MAR DEL PLATA — widget de iOS (Scriptable)
// Datos: predicción astronómica 2026 del Servicio de Hidrografía Naval (hidro.gov.ar)
// La curva se interpola (coseno) entre las pleamares/bajamares oficiales.
//
// Cobertura actual de datos: 01/09/2026 – 31/12/2026.
// Para extender el rango, reemplazá el objeto TIDE_DATA de abajo agregando
// los nuevos meses en el mismo formato: "YYYY-MM-DD": [["HH:MM", altura], ...]

const TIDE_DATA = {"2026-09-01":[["05:08",0.33],["09:34",1.13],["15:43",0.42],["21:48",1.4]],"2026-09-02":[["05:41",0.38],["10:13",1.21],["16:30",0.4],["22:38",1.31]],"2026-09-03":[["06:09",0.44],["10:55",1.29],["17:38",0.39],["23:37",1.19]],"2026-09-04":[["06:31",0.5],["11:43",1.35],["19:27",0.38]],"2026-09-05":[["00:47",1.08],["06:51",0.54],["12:39",1.4],["20:53",0.35]],"2026-09-06":[["02:04",0.99],["07:22",0.58],["13:46",1.44],["22:11",0.32]],"2026-09-07":[["03:15",0.92],["08:07",0.61],["15:01",1.49],["23:29",0.27]],"2026-09-08":[["04:19",0.89],["09:11",0.63],["16:11",1.55]],"2026-09-09":[["00:40",0.23],["05:20",0.89],["10:32",0.62],["17:14",1.6]],"2026-09-10":[["01:42",0.19],["06:19",0.93],["12:05",0.58],["18:10",1.62]],"2026-09-11":[["02:35",0.19],["07:14",0.98],["13:30",0.51],["19:02",1.6]],"2026-09-12":[["03:23",0.2],["08:03",1.06],["14:30",0.45],["19:52",1.54]],"2026-09-13":[["04:07",0.24],["08:47",1.13],["15:19",0.4],["20:40",1.45]],"2026-09-14":[["04:46",0.29],["09:28",1.2],["16:04",0.39],["21:28",1.34]],"2026-09-15":[["05:21",0.36],["10:08",1.25],["16:49",0.39],["22:19",1.22]],"2026-09-16":[["05:50",0.42],["10:49",1.28],["17:37",0.41],["23:17",1.11]],"2026-09-17":[["06:14",0.48],["11:30",1.29],["18:29",0.42]],"2026-09-18":[["00:22",1.01],["06:34",0.52],["12:16",1.29],["19:25",0.44]],"2026-09-19":[["01:25",0.93],["06:57",0.56],["13:08",1.28],["20:22",0.44]],"2026-09-20":[["02:22",0.88],["07:27",0.6],["14:07",1.28],["21:18",0.43]],"2026-09-21":[["03:16",0.84],["08:06",0.63],["15:06",1.29],["22:14",0.42]],"2026-09-22":[["04:07",0.83],["08:57",0.65],["16:00",1.32],["23:09",0.4]],"2026-09-23":[["04:56",0.83],["10:01",0.67],["16:48",1.36]],"2026-09-24":[["00:03",0.38],["05:41",0.86],["11:07",0.65],["17:30",1.39]],"2026-09-25":[["00:55",0.37],["06:18",0.91],["12:08",0.61],["18:08",1.43]],"2026-09-26":[["01:44",0.36],["06:49",0.97],["13:00",0.56],["18:44",1.45]],"2026-09-27":[["02:30",0.36],["07:19",1.04],["13:44",0.5],["19:22",1.46]],"2026-09-28":[["03:13",0.38],["07:51",1.14],["14:25",0.44],["20:03",1.44]],"2026-09-29":[["03:53",0.41],["08:26",1.24],["15:06",0.39],["20:47",1.39]],"2026-09-30":[["04:29",0.46],["09:04",1.34],["15:57",0.35],["21:36",1.31]],"2026-10-01":[["05:00",0.51],["09:45",1.42],["17:11",0.33],["22:31",1.2]],"2026-10-02":[["05:23",0.56],["10:30",1.49],["18:34",0.31],["23:36",1.09]],"2026-10-03":[["05:42",0.6],["11:20",1.52],["19:48",0.29]],"2026-10-04":[["00:55",0.99],["06:12",0.63],["12:19",1.51],["20:58",0.27]],"2026-10-05":[["02:12",0.93],["06:56",0.65],["13:32",1.5],["22:08",0.26]],"2026-10-06":[["03:18",0.91],["08:01",0.66],["14:52",1.49],["23:17",0.25]],"2026-10-07":[["04:18",0.91],["09:30",0.66],["16:05",1.51]],"2026-10-08":[["00:22",0.25],["05:15",0.96],["11:11",0.62],["17:08",1.52]],"2026-10-09":[["01:20",0.26],["06:07",1.03],["12:39",0.54],["18:03",1.5]],"2026-10-10":[["02:11",0.29],["06:54",1.12],["13:42",0.47],["18:53",1.46]],"2026-10-11":[["02:56",0.34],["07:36",1.21],["14:32",0.41],["19:39",1.39]],"2026-10-12":[["03:36",0.4],["08:16",1.29],["15:16",0.39],["20:24",1.3]],"2026-10-13":[["04:10",0.46],["08:53",1.36],["15:57",0.38],["21:10",1.21]],"2026-10-14":[["04:38",0.52],["09:29",1.4],["16:38",0.39],["21:58",1.12]],"2026-10-15":[["04:58",0.57],["10:05",1.42],["17:22",0.41],["22:52",1.03]],"2026-10-16":[["05:12",0.6],["10:41",1.42],["18:10",0.42],["23:54",0.96]],"2026-10-17":[["05:28",0.62],["11:19",1.4],["19:00",0.42]],"2026-10-18":[["00:55",0.9],["05:52",0.63],["12:02",1.37],["19:50",0.42]],"2026-10-19":[["01:49",0.87],["06:22",0.65],["12:57",1.34],["20:40",0.42]],"2026-10-20":[["02:39",0.86],["07:05",0.67],["14:06",1.31],["21:29",0.41]],"2026-10-21":[["03:26",0.87],["08:08",0.69],["15:10",1.32],["22:17",0.41]],"2026-10-22":[["04:09",0.9],["09:24",0.69],["16:03",1.34],["23:05",0.41]],"2026-10-23":[["04:48",0.95],["10:35",0.66],["16:49",1.37],["23:55",0.42]],"2026-10-24":[["05:25",1.03],["11:38",0.61],["17:32",1.4]],"2026-10-25":[["00:45",0.45],["06:01",1.12],["12:34",0.54],["18:15",1.42]],"2026-10-26":[["01:34",0.48],["06:38",1.23],["13:26",0.47],["18:58",1.41]],"2026-10-27":[["02:21",0.52],["07:16",1.36],["14:18",0.4],["19:44",1.38]],"2026-10-28":[["03:03",0.56],["07:56",1.48],["15:18",0.34],["20:33",1.31]],"2026-10-29":[["03:38",0.61],["08:38",1.58],["16:28",0.3],["21:27",1.22]],"2026-10-30":[["04:06",0.64],["09:23",1.65],["17:38",0.27],["22:29",1.12]],"2026-10-31":[["04:32",0.66],["10:11",1.68],["18:44",0.25],["23:45",1.04]],"2026-11-01":[["05:07",0.68],["11:04",1.66],["19:48",0.24]],"2026-11-02":[["01:07",0.99],["05:54",0.68],["12:07",1.6],["20:50",0.24]],"2026-11-03":[["02:13",0.97],["06:59",0.69],["13:25",1.53],["21:52",0.26]],"2026-11-04":[["03:11",0.98],["08:27",0.69],["14:50",1.49],["22:54",0.29]],"2026-11-05":[["04:06",1.02],["10:00",0.66],["16:01",1.46],["23:54",0.33]],"2026-11-06":[["04:58",1.1],["11:30",0.6],["17:01",1.43]],"2026-11-07":[["00:50",0.38],["05:46",1.19],["12:42",0.52],["17:53",1.38]],"2026-11-08":[["01:40",0.44],["06:29",1.28],["13:39",0.46],["18:41",1.32]],"2026-11-09":[["02:23",0.5],["07:09",1.37],["14:28",0.43],["19:25",1.25]],"2026-11-10":[["03:00",0.57],["07:46",1.45],["15:11",0.42],["20:09",1.18]],"2026-11-11":[["03:29",0.63],["08:21",1.5],["15:51",0.42],["20:54",1.11]],"2026-11-12":[["03:48",0.67],["08:55",1.54],["16:31",0.42],["21:42",1.04]],"2026-11-13":[["03:55",0.7],["09:28",1.55],["17:11",0.43],["22:33",0.99]],"2026-11-14":[["04:07",0.7],["10:00",1.54],["17:54",0.43],["23:28",0.95]],"2026-11-15":[["04:28",0.69],["10:33",1.52],["18:38",0.42]],"2026-11-16":[["00:19",0.92],["04:55",0.69],["11:10",1.47],["19:22",0.42]],"2026-11-17":[["01:04",0.91],["05:29",0.69],["11:53",1.42],["20:05",0.42]],"2026-11-18":[["01:45",0.92],["06:12",0.7],["12:52",1.38],["20:49",0.42]],"2026-11-19":[["02:26",0.94],["07:15",0.71],["14:07",1.35],["21:31",0.43]],"2026-11-20":[["03:08",1.0],["08:43",0.71],["15:13",1.35],["22:14",0.46]],"2026-11-21":[["03:50",1.07],["10:00",0.67],["16:08",1.36],["22:57",0.5]],"2026-11-22":[["04:34",1.18],["11:08",0.61],["16:58",1.37],["23:40",0.55]],"2026-11-23":[["05:18",1.3],["12:10",0.53],["17:46",1.37]],"2026-11-24":[["00:25",0.61],["06:02",1.44],["13:13",0.45],["18:36",1.35]],"2026-11-25":[["01:09",0.65],["06:46",1.58],["14:21",0.38],["19:27",1.3]],"2026-11-26":[["01:52",0.69],["07:31",1.7],["15:31",0.32],["20:21",1.23]],"2026-11-27":[["02:33",0.71],["08:17",1.79],["16:37",0.27],["21:21",1.16]],"2026-11-28":[["03:16",0.71],["09:05",1.83],["17:40",0.23],["22:31",1.09]],"2026-11-29":[["04:02",0.71],["09:56",1.82],["18:39",0.22],["23:50",1.05]],"2026-11-30":[["04:54",0.7],["10:53",1.74],["19:36",0.22]],"2026-12-01":[["00:57",1.04],["05:59",0.69],["12:00",1.64],["20:31",0.26]],"2026-12-02":[["01:54",1.06],["07:17",0.69],["13:23",1.53],["21:25",0.31]],"2026-12-03":[["02:47",1.1],["08:38",0.67],["14:44",1.46],["22:20",0.38]],"2026-12-04":[["03:39",1.16],["10:02",0.64],["15:51",1.4],["23:15",0.45]],"2026-12-05":[["04:29",1.24],["11:24",0.58],["16:48",1.34]],"2026-12-06":[["00:09",0.52],["05:17",1.33],["12:33",0.53],["17:38",1.27]],"2026-12-07":[["01:00",0.59],["06:01",1.41],["13:30",0.48],["18:26",1.21]],"2026-12-08":[["01:43",0.66],["06:41",1.49],["14:19",0.46],["19:12",1.15]],"2026-12-09":[["02:17",0.71],["07:18",1.56],["15:02",0.45],["19:59",1.09]],"2026-12-10":[["02:39",0.75],["07:52",1.61],["15:42",0.45],["20:47",1.05]],"2026-12-11":[["02:48",0.77],["08:25",1.63],["16:21",0.45],["21:36",1.01]],"2026-12-12":[["03:01",0.77],["08:56",1.64],["16:58",0.44],["22:20",0.98]],"2026-12-13":[["03:23",0.75],["09:27",1.62],["17:36",0.44],["22:55",0.97]],"2026-12-14":[["03:50",0.73],["09:59",1.59],["18:15",0.43],["23:22",0.96]],"2026-12-15":[["04:21",0.71],["10:34",1.54],["18:53",0.43],["23:50",0.98]],"2026-12-16":[["04:56",0.7],["11:16",1.49],["19:32",0.43]],"2026-12-17":[["00:25",1.01],["05:39",0.7],["12:07",1.43],["20:10",0.45]],"2026-12-18":[["01:09",1.06],["06:36",0.7],["13:14",1.38],["20:47",0.48]],"2026-12-19":[["01:59",1.13],["08:01",0.69],["14:27",1.35],["21:23",0.53]],"2026-12-20":[["02:52",1.21],["09:29",0.65],["15:31",1.34],["22:00",0.59]],"2026-12-21":[["03:47",1.33],["10:44",0.59],["16:28",1.32],["22:38",0.65]],"2026-12-22":[["04:39",1.46],["11:57",0.51],["17:22",1.3],["23:19",0.7]],"2026-12-23":[["05:31",1.61],["13:12",0.44],["18:16",1.26]],"2026-12-24":[["00:06",0.74],["06:21",1.75],["14:27",0.36],["19:12",1.21]],"2026-12-25":[["00:59",0.75],["07:11",1.86],["15:33",0.29],["20:11",1.16]],"2026-12-26":[["01:55",0.74],["08:01",1.91],["16:34",0.25],["21:15",1.13]],"2026-12-27":[["02:53",0.71],["08:52",1.91],["17:30",0.22],["22:24",1.11]],"2026-12-28":[["03:53",0.68],["09:45",1.85],["18:23",0.23],["23:28",1.12]],"2026-12-29":[["04:56",0.65],["10:44",1.74],["19:14",0.26]],"2026-12-30":[["00:25",1.14],["06:04",0.64],["11:54",1.61],["20:03",0.32]],"2026-12-31":[["01:18",1.18],["07:16",0.63],["13:16",1.49],["20:50",0.4]]}
;

// hora fija que siempre se marca con una línea vertical en el gráfico
const REFERENCE_HOUR = 14, REFERENCE_MIN = 30;

// ---------- ancho de contenido real del widget ----------
function contentWidth() {
  try {
    const screenW = Device.screenSize().width;
    return Math.round(screenW - 64);
  } catch (e) {
    return 300;
  }
}

// ---------- helpers (misma lógica que el visualizador web) ----------
function pad(n) { return String(n).padStart(2, "0"); }
function toKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function fromKey(k) {
  const parts = k.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function parseHM(hm, baseDate) {
  const parts = hm.split(":").map(Number);
  const dt = new Date(baseDate);
  dt.setHours(parts[0], parts[1], 0, 0);
  return dt;
}

const ALL_KEYS = Object.keys(TIDE_DATA).sort();
const MIN_KEY = ALL_KEYS[0];
const MAX_KEY = ALL_KEYS[ALL_KEYS.length - 1];

const FLAT = [];
ALL_KEYS.forEach(function(k) {
  const base = fromKey(k);
  TIDE_DATA[k].forEach(function(entry) {
    FLAT.push({ t: parseHM(entry[0], base), h: entry[1] });
  });
});
FLAT.sort(function(a, b) { return a.t - b.t; });

function cosineInterp(t, p0, p1) {
  const frac = (t - p0.t) / (p1.t - p0.t);
  return p0.h + (p1.h - p0.h) / 2 * (1 - Math.cos(Math.PI * frac));
}

function heightAt(t) {
  if (t <= FLAT[0].t) return FLAT[0].h;
  if (t >= FLAT[FLAT.length - 1].t) return FLAT[FLAT.length - 1].h;
  let lo = 0, hi = FLAT.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (FLAT[mid].t <= t) lo = mid; else hi = mid;
  }
  return cosineInterp(t, FLAT[lo], FLAT[hi]);
}

function buildDayCurve(dateKey) {
  const base = fromKey(dateKey);
  const points = [];
  const STEP_MIN = 10;
  for (let mins = 0; mins <= 24 * 60; mins += STEP_MIN) {
    const t = new Date(base);
    t.setHours(0, mins, 0, 0);
    points.push({ x: t, y: heightAt(t) });
  }
  return points;
}

function classifyPoint(t, h) {
  const idx = FLAT.findIndex(function(p) { return p.t.getTime() === t.getTime(); });
  const prev = FLAT[idx - 1], next = FLAT[idx + 1];
  if (prev && next) return h > prev.h && h > next.h;
  if (prev) return h > prev.h;
  if (next) return h > next.h;
  return h > 0.9;
}

function eventsForDay(dateKey) {
  const base = fromKey(dateKey);
  const raw = TIDE_DATA[dateKey] || [];
  return raw.map(function(entry) {
    const t = parseHM(entry[0], base);
    return { t: t, hm: entry[0], h: entry[1], isHigh: classifyPoint(t, entry[1]) };
  });
}

function clampKey(key) {
  if (key < MIN_KEY) return MIN_KEY;
  if (key > MAX_KEY) return MAX_KEY;
  return key;
}

function addDaysKey(dateKey, n) {
  const d = fromKey(dateKey);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// ---------- mini gráfico dibujado con DrawContext ----------
// las etiquetas de hora/altura van POR DEBAJO del punto en pleamar y POR
// ENCIMA en bajamar: así caen sobre el espacio que la propia curva deja
// libre hacia su interior, sin necesitar margen extra arriba/abajo.
async function createChartImage(dateKey, now, dispWidth, dispHeight, labelFontSize) {
  const curve = buildDayCurve(dateKey);
  const events = eventsForDay(dateKey);

  const ctx = new DrawContext();
  ctx.size = new Size(dispWidth, dispHeight);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const dataMin = Math.min.apply(null, curve.map(function(p) { return p.y; }));
  const dataMax = Math.max.apply(null, curve.map(function(p) { return p.y; }));
  const span = Math.max(0.4, dataMax - dataMin);

  const padL = 4, padR = 4, padT = 10, padB = 16;
  const plotW = dispWidth - padL - padR;
  const plotH = dispHeight - padT - padB;
  const yMin = dataMin - span * 0.15;
  const yMax = dataMax + span * 0.15;
  const dayStart = curve[0].x;

  function xToPx(t) { return padL + ((t - dayStart) / 60000 / (24 * 60)) * plotW; }
  function yToPx(h) {
    const c = Math.min(yMax, Math.max(yMin, h));
    return padT + (1 - (c - yMin) / (yMax - yMin)) * plotH;
  }

  // línea vertical de referencia fija
  const refT = new Date(dayStart);
  refT.setHours(REFERENCE_HOUR, REFERENCE_MIN, 0, 0);
  const refX = xToPx(refT);
  ctx.setStrokeColor(new Color("#6d7c8c", 0.55));
  ctx.setLineWidth(1);
  let dashY = padT;
  while (dashY < dispHeight - padB) {
    const seg = new Path();
    seg.move(new Point(refX, dashY));
    seg.addLine(new Point(refX, Math.min(dashY + 4, dispHeight - padB)));
    ctx.addPath(seg);
    ctx.strokePath();
    dashY += 7;
  }
  ctx.setFont(Font.mediumSystemFont(8));
  ctx.setTextColor(new Color("#6d7c8c"));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(pad(REFERENCE_HOUR) + ":" + pad(REFERENCE_MIN),
    new Rect(refX - 20, dispHeight - 11, 40, 10));

  // curva
  const path = new Path();
  curve.forEach(function(p, i) {
    const x = xToPx(p.x), y = yToPx(p.y);
    if (i === 0) path.move(new Point(x, y)); else path.addLine(new Point(x, y));
  });
  ctx.addPath(path);
  ctx.setStrokeColor(new Color("#4fd1c5"));
  ctx.setLineWidth(2);
  ctx.strokePath();

  events.forEach(function(e) {
    const x = xToPx(e.t), y = yToPx(e.h);
    ctx.setFillColor(new Color(e.isHigh ? "#4fd1c5" : "#f2a65a"));
    ctx.fillEllipse(new Rect(x - 2.5, y - 2.5, 5, 5));

    if (labelFontSize) {
      const label = e.hm + "  " + e.h.toFixed(2) + "m";
      ctx.setFont(Font.mediumSystemFont(labelFontSize));
      ctx.setTextColor(new Color(e.isHigh ? "#8fe6dd" : "#f6c188"));
      ctx.setTextAlignedCenter();
      const labelW = labelFontSize >= 9 ? 62 : 54;
      const labelH = labelFontSize + 3;
      const gap = 5;
      // pleamar -> etiqueta debajo del punto; bajamar -> etiqueta encima
      let labelY = e.isHigh ? (y + gap) : (y - gap - labelH);
      labelY = Math.min(Math.max(labelY, 0), dispHeight - labelH);
      const labelX = Math.min(Math.max(x - labelW / 2, 0), dispWidth - labelW);
      ctx.drawTextInRect(label, new Rect(labelX, labelY, labelW, labelH));
    }
  });

  if (now && now >= dayStart && now <= curve[curve.length - 1].x) {
    const x = xToPx(now), y = yToPx(heightAt(now));
    ctx.setFillColor(new Color("#ef6f6c"));
    ctx.fillEllipse(new Rect(x - 3.5, y - 3.5, 7, 7));
  }

  return ctx.getImage();
}

// ---------- widget de pantalla bloqueada (accessoryRectangular) ----------
// Los widgets de pantalla bloqueada de iOS NO admiten imágenes propias
// (ni de fondo ni superpuestas) — solo texto y símbolos SF. Por eso acá es
// una tabla de hora/altura/flecha por cada marea de hoy, sin gráfico.
function buildLockScreenWidget(w, dateKey, now) {
  w.setPadding(6, 6, 6, 6);
  const events = eventsForDay(dateKey).slice(0, 4);

  const row = w.addStack();
  row.layoutHorizontally();
  events.forEach(function(e, i) {
    const col = row.addStack();
    col.layoutVertically();

    const t = col.addText(e.hm);
    t.font = Font.boldSystemFont(8);
    t.textColor = new Color("#ffffff", 0.75);

    const v = col.addText(e.h.toFixed(2));
    v.font = Font.systemFont(12);
    v.textColor = new Color("#ffffff", e.isHigh ? 1 : 0.8);

    const arrowRow = col.addStack();
    arrowRow.layoutHorizontally();
    arrowRow.size = new Size(0, 16);
    arrowRow.centerAlignContent();
    arrowRow.addSpacer();
    const arrow = arrowRow.addText(e.isHigh ? "\u25B2" : "\u25BC");
    arrow.font = Font.boldSystemFont(13);
    arrow.textColor = new Color("#ffffff", e.isHigh ? 0.9 : 0.65);
    arrowRow.addSpacer();

    if (i < events.length - 1) row.addSpacer(10);
  });
}

function addEventRow(container, e, fontSize, rowGap) {
  fontSize = fontSize || 11;
  rowGap = rowGap === undefined ? 3 : rowGap;
  const row = container.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const tag = row.addText(e.isHigh ? "\u25B2" : "\u25BC");
  tag.font = Font.mediumSystemFont(Math.max(7, fontSize - 2));
  tag.textColor = new Color(e.isHigh ? "#4fd1c5" : "#f2a65a");
  row.addSpacer(4);
  const txt = row.addText(e.hm + "  " + e.h.toFixed(2) + "m");
  txt.font = Font.mediumSystemFont(fontSize);
  txt.textColor = new Color("#a8b2bd");
  if (rowGap > 0) container.addSpacer(rowGap);
}

function addDayColumn(parent, label, events, fontSize, rowGap) {
  const col = parent.addStack();
  col.layoutVertically();
  const lbl = col.addText(label);
  lbl.font = Font.mediumSystemFont(Math.max(7, fontSize - 2));
  lbl.textColor = new Color("#46545f");
  col.addSpacer(2);
  events.forEach(function(e) { addEventRow(col, e, fontSize, rowGap); });
  return col;
}

function addCenteredHeader(w, fontSize) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.addSpacer();
  const header = row.addText("MAREAS · MAR DEL PLATA");
  header.font = Font.mediumSystemFont(fontSize);
  header.textColor = new Color("#6d7c8c");
  row.addSpacer();
}

// ---------- temperatura del mar (seatemperature.info), con caché diaria ----------
const SEA_TEMP_URL = "https://seatemperature.info/mar-del-plata-water-temperature.html";
const SEA_TEMP_CACHE_FILE = "mareas-sea-temp-cache.json";

async function fetchSeaTemperature() {
  try {
    const req = new Request(SEA_TEMP_URL);
    req.timeoutInterval = 8;
    const html = await req.loadString();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&deg;/gi, "°")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ");

    let today = null, yesterday = null;
    let m = text.match(/today temp[^\d]{0,40}([\d.,]+)\s*°?\s*C/i);
    if (m) today = parseFloat(m[1].replace(",", "."));
    if (today === null) {
      m = text.match(/today is[^\d]{0,20}([\d.,]+)\s*°?\s*C/i);
      if (m) today = parseFloat(m[1].replace(",", "."));
    }
    m = text.match(/yesterday temp[^\d]{0,40}([\d.,]+)\s*°?\s*C/i);
    if (m) yesterday = parseFloat(m[1].replace(",", "."));

    if (today === null || isNaN(today)) return null;
    return { today: today, yesterday: (yesterday !== null && !isNaN(yesterday)) ? yesterday : null };
  } catch (e) {
    return null;
  }
}

// devuelve { dateKey, today, yesterday } — solo pega a la red si todavía no
// se actualizó hoy; si el pedido falla, devuelve la última caché disponible
// (aunque sea de un día anterior) en vez de dejar el widget sin dato.
async function getSeaTemperature() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), SEA_TEMP_CACHE_FILE);

  let cache = null;
  if (fm.fileExists(path)) {
    try { cache = JSON.parse(fm.readString(path)); } catch (e) { cache = null; }
  }

  const todayKey = toKey(new Date());
  if (cache && cache.dateKey === todayKey) return cache;

  const fresh = await fetchSeaTemperature();
  if (fresh) {
    const toSave = { dateKey: todayKey, today: fresh.today, yesterday: fresh.yesterday };
    try { fm.writeString(path, JSON.stringify(toSave)); } catch (e) {}
    return toSave;
  }
  return cache; // sin conexión / sitio caído: usamos lo último guardado
}

function addSeaTempColumn(parent, seaTemp, fontSize) {
  const col = parent.addStack();
  col.layoutVertically();
  const lbl = col.addText("MAR");
  lbl.font = Font.mediumSystemFont(Math.max(7, fontSize - 2));
  lbl.textColor = new Color("#46545f");
  col.addSpacer(2);
  if (seaTemp && seaTemp.today != null) {
    const t = col.addText(seaTemp.today.toFixed(1) + "°");
    t.font = Font.boldSystemFont(fontSize + 3);
    t.textColor = new Color("#dfe6ec");
    if (seaTemp.yesterday != null) {
      col.addSpacer(2);
      const y = col.addText("ayer " + seaTemp.yesterday.toFixed(1) + "°");
      y.font = Font.mediumSystemFont(Math.max(7, fontSize - 2));
      y.textColor = new Color("#6d7c8c");
    }
  } else {
    const t = col.addText("—");
    t.font = Font.mediumSystemFont(fontSize);
    t.textColor = new Color("#6d7c8c");
  }
  return col;
}

// fila hoy/mañana, con la temperatura del mar al medio si está disponible
function addDayRow(w, dateKey, tomorrowKey, fontSize, rowGap, seaTemp) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.topAlignContent();
  row.addSpacer();
  addDayColumn(row, "HOY", eventsForDay(dateKey), fontSize, rowGap);
  row.addSpacer();
  if (seaTemp !== undefined) {
    addSeaTempColumn(row, seaTemp, fontSize);
    row.addSpacer();
  }
  addDayColumn(row, "MAÑANA", eventsForDay(tomorrowKey), fontSize, rowGap);
  row.addSpacer();
}

// ---------- widget ----------
async function createWidget() {
  const now = new Date();
  const realTodayKey = toKey(now);
  const outOfRange = realTodayKey < MIN_KEY || realTodayKey > MAX_KEY;
  const dateKey = clampKey(realTodayKey);
  const tomorrowKey = addDaysKey(dateKey, 1);

  const w = new ListWidget();
  w.backgroundColor = new Color("#0a0f14");

  const family = config.widgetFamily || "medium";

  if (outOfRange) {
    w.setPadding(14, 16, 14, 16);
    addCenteredHeader(w, 10);
    w.addSpacer(8);
    const warn = w.addText("Sin datos para hoy");
    warn.font = Font.boldSystemFont(16);
    warn.textColor = new Color("#dfe6ec");
    w.addSpacer(4);
    const sub = w.addText("Actualizá TIDE_DATA con la tabla vigente");
    sub.font = Font.mediumSystemFont(11);
    sub.textColor = new Color("#6d7c8c");
    w.refreshAfterDate = new Date(now.getTime() + 60 * 60000);
    return w;
  }

  if (family === "small") {
    w.setPadding(14, 14, 14, 14);
    const h = heightAt(now);
    const big = w.addText(h.toFixed(2) + " m");
    big.font = Font.boldSystemFont(30);
    big.textColor = new Color("#dfe6ec");
    const nEv = FLAT.find(function(p) { return p.t > now; });
    if (nEv) {
      const label = classifyPoint(nEv.t, nEv.h) ? "pleamar" : "bajamar";
      const timeStr = pad(nEv.t.getHours()) + ":" + pad(nEv.t.getMinutes());
      const sub = w.addText("Próxima " + label + " · " + timeStr);
      sub.font = Font.mediumSystemFont(12);
      sub.textColor = new Color(label === "pleamar" ? "#4fd1c5" : "#f2a65a");
    }
  } else if (family === "large") {
    w.setPadding(12, 16, 14, 16);
    addCenteredHeader(w, 10);
    w.addSpacer(6);
    const seaTempLarge = await getSeaTemperature();
    addDayRow(w, dateKey, tomorrowKey, 12, 3, seaTempLarge);

    w.addSpacer(10);
    const imgWidth = contentWidth();
    const img = await createChartImage(dateKey, now, imgWidth, 160, 9);
    const imgWidget = w.addImage(img);
    imgWidget.imageSize = new Size(imgWidth, 160);
  } else if (family === "accessoryRectangular") {
    // widget de pantalla bloqueada (tamaño ~2x1 iconos) — solo texto, sin imágenes
    buildLockScreenWidget(w, dateKey, now);
  } else {
    // medium: diseñado para caber en el widget mediano más chico (~148pt de alto)
    w.setPadding(10, 14, 6, 14);
    addCenteredHeader(w, 9);
    w.addSpacer(3);
    const seaTempMedium = await getSeaTemperature();
    addDayRow(w, dateKey, tomorrowKey, 10, 0, seaTempMedium);

    w.addSpacer(4);
    const imgWidth = contentWidth();
    const imgHeight = 52;
    const img = await createChartImage(dateKey, now, imgWidth, imgHeight, 7);
    const imgWidget = w.addImage(img);
    imgWidget.imageSize = new Size(imgWidth, imgHeight);
  }

  // pedirle a iOS que refresque en ~20 minutos (el sistema decide el momento real)
  w.refreshAfterDate = new Date(now.getTime() + 20 * 60000);

  return w;
}

let widget = await createWidget();
if (!config.runsInWidget) {
  const family = config.widgetFamily;
  if (family === "small") await widget.presentSmall();
  else if (family === "large") await widget.presentLarge();
  else if (family === "accessoryRectangular") await widget.presentAccessoryRectangular();
  else await widget.presentMedium();
}
Script.setWidget(widget);
Script.complete();
