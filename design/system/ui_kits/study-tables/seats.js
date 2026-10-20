// SeatRing: N seats around a round table; states: mine, taken, empty.
function seatRing(seats, { size = 168, code = 'C001', cancelled = false } = {}) {
  const n = seats.length, r = size / 2, table = size * (n > 8 ? 0.32 : 0.30), orbit = size * 0.40, seat = size * (n > 8 ? 0.062 : 0.085);
  const parts = [`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${seats.filter(s => s !== 'empty').length} of ${seats.length} seats taken" style="opacity:${cancelled ? .38 : 1}">`];
  parts.push(`<circle cx="${r}" cy="${r}" r="${table}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" stroke-width="1.5" ${cancelled ? 'stroke-dasharray="6 5"' : ''}/>`);
  if (code) parts.push(`<text x="${r}" y="${r + size * 0.035}" text-anchor="middle" font-family="var(--font-mono)" font-size="${size * 0.1}" fill="var(--md-on-surface)">${code}</text>`);
  seats.forEach((s, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats.length;
    const x = r + orbit * Math.cos(a), y = r + orbit * Math.sin(a);
    if (s === 'empty') parts.push(`<circle cx="${x}" cy="${y}" r="${seat}" fill="none" stroke="var(--md-outline)" stroke-width="2"/>`);
    else parts.push(`<circle cx="${x}" cy="${y}" r="${seat}" fill="var(--md-focus)"/>`);
    if (s === 'mine') parts.push(`<circle cx="${x}" cy="${y}" r="${seat + 4}" fill="none" stroke="var(--md-focus)" stroke-width="2"/>`);
  });
  parts.push('</svg>');
  return parts.join('');
}

// Hall: a gathering's picture (docs/product/organizations.md → The hall).
// type: 'focus' round tables of 6 · 'games' long tables of 8 ·
//       'talk' a half circle facing the stage · 'meeting' rows facing the front.
// replies: reply order, 'g' going, 'm' maybe. Dots fill from the front (or
// table by table) in that order; free places are faint. The room code sits
// on the stage, the front, or a plate above the tables.
function hall(type, capacity, replies, { width = 320, code = 'I112', maxDots = 120, cancelled = false } = {}) {
  const per = Math.max(1, Math.ceil(capacity / maxDots));
  const n = Math.ceil(capacity / per);
  const marks = [];
  for (let i = 0; i < replies.length && marks.length < n; i += per) marks.push(replies.slice(i, i + per).includes('m') ? 'm' : 'g');
  const pts = [], shapes = [];
  let height, dot;
  const plateH = Math.max(26, width * 0.085);
  const plate = (cx, cy, w, h) => shapes.push(
    `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h * 0.3}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" stroke-width="1.5"/>` +
    `<text x="${cx}" y="${cy + h * 0.2}" text-anchor="middle" font-family="var(--font-mono)" font-size="${h * 0.55}" fill="var(--md-on-surface)">${code}</text>`);
  if (type === 'talk') {
    const rowsN = Math.max(3, Math.round(Math.sqrt(n / 4)));
    const R0 = width * 0.2, R1 = width * 0.47;
    height = R1 + plateH * 1.4;
    const cx = width / 2, cy = height - plateH * 0.8;
    const radii = Array.from({ length: rowsN }, (_, r) => R0 + (R1 - R0) * r / (rowsN - 1));
    const sum = radii.reduce((a, b) => a + b, 0); let left = n;
    radii.forEach((R, r) => {
      const cnt = r === rowsN - 1 ? left : Math.round(n * R / sum); left -= cnt;
      // Centre first, then outwards, so early replies sit in front of the stage.
      const order = [...Array(cnt).keys()].sort((p, q) => Math.abs(p - (cnt - 1) / 2) - Math.abs(q - (cnt - 1) / 2) || p - q);
      for (const i of order) { const a = Math.PI + (i + 0.5) * Math.PI / cnt; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    });
    dot = Math.min(width * 0.026, (Math.PI * R0 / Math.max(1, Math.round(n * R0 / sum))) * 0.34);
    plate(cx, cy, width * 0.28, plateH);
  } else if (type === 'meeting') {
    let cols = Math.max(6, Math.min(14, Math.round(Math.sqrt(n * 1.6))));
    if (cols >= 8 && cols % 2) cols += 1;
    const rowsN = Math.ceil(n / cols), aisle = cols >= 8;
    const gap = width / (cols + (aisle ? 1.6 : 1));
    dot = Math.min(width * 0.026, gap * 0.3);
    const top = plateH * 1.6;
    plate(width / 2, plateH * 0.6, width * 0.34, plateH);
    const centre = [...Array(cols).keys()].sort((p, q) => Math.abs(p - (cols - 1) / 2) - Math.abs(q - (cols - 1) / 2) || p - q);
    for (let r = 0; r < rowsN; r++) {
      centre.slice(0, Math.min(cols, n - r * cols)).forEach((c) =>
        pts.push([gap * (c + 1) + (aisle && c >= cols / 2 ? gap * 0.6 : 0) - gap * 0.2, top + r * gap + gap * 0.3]));
    }
    height = top + rowsN * gap;
  } else {
    const round = type === 'focus', per = round ? 6 : 8, tables = Math.ceil(n / per);
    const cols = Math.min(width < 400 ? (round ? 3 : 2) : (round ? 4 : 3), tables), rowsN = Math.ceil(tables / cols);
    const cellW = width / cols, cellH = round ? cellW * 0.95 : cellW * 0.62, top = plateH * 1.5;
    plate(width / 2, plateH * 0.6, width * 0.3, plateH);
    dot = Math.min(width * 0.026, round ? cellW * 0.075 : cellW * 0.06);
    for (let t = 0; t < tables; t++) {
      const cx = cellW * (t % cols + 0.5), cy = top + cellH * (Math.floor(t / cols) + 0.5);
      const k = Math.min(per, n - t * per);
      if (round) {
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${cellW * 0.2}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" stroke-width="1.5"/>`);
        for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / per; pts.push([cx + cellW * 0.32 * Math.cos(a), cy + cellW * 0.32 * Math.sin(a)]); }
      } else {
        const w = cellW * 0.74, h = cellH * 0.26, step = w / 4;
        shapes.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h * 0.25}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" stroke-width="1.5"/>`);
        for (let i = 0; i < k; i++) pts.push([cx - w / 2 + step * (i % 4 + 0.5), i < 4 ? cy - h / 2 - dot * 1.9 : cy + h / 2 + dot * 1.9]);
      }
    }
    height = top + cellH * rowsN;
  }
  dot = Math.max(3, dot);
  const H = Math.round(height);
  const going = replies.split('g').length - 1, maybe = replies.split('m').length - 1;
  const out = [`<svg width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${code}: ${going} going, ${maybe} maybe" style="display:block;max-width:100%;height:auto;opacity:${cancelled ? .38 : 1}">`, ...shapes];
  pts.forEach(([x, y], i) => {
    if (marks[i] === 'g') out.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="var(--md-focus)"/>`);
    else if (marks[i] === 'm') out.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="var(--md-focus-container)" stroke="var(--md-focus)" stroke-width="1.25"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="none" stroke="var(--md-outline-variant)" stroke-width="1.25"/>`);
  });
  out.push('</svg>');
  return out.join('');
}

// A reply sequence for specimens: `going` g and `maybe` m, mixed in a fixed order.
function replySeq(going, maybe, seed = 3) {
  const out = []; let g = going, m = maybe, s = seed;
  while (g || m) { s = (s * 9301 + 49297) % 233280; if (m && (!g || s / 233280 < maybe / (going + maybe))) { out.push('m'); m--; } else { out.push('g'); g--; } }
  return out.join('');
}
