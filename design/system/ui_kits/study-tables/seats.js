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
// type: 'focus' (round tables of 6), 'games' (long tables of 8),
//       'talk' (half circle facing a block), 'meeting' (rows behind a line).
// replies: a string in reply order, 'g' = going, 'm' = maybe. Dots are people,
// not seats: they fill in that order; the outlines are the rest of the room.
function hallPlaces(type, n, width, colsMax) {
  const pts = [], shapes = [];
  let height, dot;
  if (type === 'talk') {
    const rowsN = Math.max(3, Math.round(Math.sqrt(n / 4)));
    height = width * 0.56; const cx = width / 2, cy = height * 0.9;
    const radii = Array.from({ length: rowsN }, (_, r) => width * (0.17 + 0.29 * r / (rowsN - 1)));
    const sum = radii.reduce((a, b) => a + b, 0); let left = n;
    radii.forEach((R, r) => {
      const cnt = r === rowsN - 1 ? left : Math.round(n * R / sum); left -= cnt;
      for (let i = 0; i < cnt; i++) { const a = Math.PI + (i + 0.5) * Math.PI / cnt; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    });
    dot = Math.min(11, (Math.PI * radii[0] / (Math.round(n * radii[0] / sum) || 1)) * 0.36);
    shapes.push(`<rect x="${cx - width * 0.1}" y="${cy - height * 0.04}" width="${width * 0.2}" height="${height * 0.1}" rx="6" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/>`);
  } else if (type === 'meeting') {
    let cols = Math.max(6, Math.min(16, Math.round(Math.sqrt(n * 1.6))));
    if (cols >= 8 && cols % 2) cols += 1;
    const rowsN = Math.ceil(n / cols), aisle = cols >= 8;
    const gap = width / (cols + (aisle ? 1.6 : 1));
    dot = Math.min(11, gap * 0.32);
    const top = gap * 0.9;
    shapes.push(`<line x1="${gap * 0.5}" y1="${top - gap * 0.45}" x2="${width - gap * 0.5}" y2="${top - gap * 0.45}" stroke="var(--md-outline)" stroke-width="3" stroke-linecap="round"/>`);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      pts.push([gap * (c + 1) + (aisle && c >= cols / 2 ? gap * 0.6 : 0) - gap * 0.2, top + r * gap + gap * 0.3]);
    }
    height = top + rowsN * gap + gap * 0.1;
  } else if (type === 'focus') {
    const per = 6, tables = Math.ceil(n / per), cols = Math.min(colsMax || (width < 400 ? 3 : 5), tables), rowsN = Math.ceil(tables / cols);
    const cell = width / cols; height = cell * rowsN * 0.92;
    dot = Math.min(11, cell * 0.075);
    for (let t = 0; t < tables; t++) {
      const cx = cell * (t % cols + 0.5), cy = cell * 0.92 * (Math.floor(t / cols) + 0.5);
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${cell * 0.2}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/>`);
      const k = Math.min(per, n - t * per);
      for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / per; pts.push([cx + cell * 0.32 * Math.cos(a), cy + cell * 0.32 * Math.sin(a)]); }
    }
  } else { // games: long tables of 8
    const per = 8, side = 4, tables = Math.ceil(n / per);
    const cols = Math.min(colsMax || (width < 400 ? 3 : 4), tables), rowsN = Math.ceil(tables / cols);
    const cellW = width / cols, seatGap = (cellW * 0.82) / side, cellH = seatGap * 3.2;
    dot = Math.min(11, seatGap * 0.3);
    for (let t = 0; t < tables; t++) {
      const x0 = cellW * (t % cols) + cellW * 0.09, y0 = cellH * Math.floor(t / cols) + seatGap * 0.5;
      shapes.push(`<rect x="${x0}" y="${y0 + seatGap * 0.55}" width="${side * seatGap}" height="${seatGap * 0.9}" rx="${seatGap * 0.2}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/>`);
      const k = Math.min(per, n - t * per);
      for (let i = 0; i < k; i++) pts.push([x0 + seatGap * (i % side + 0.5), i < side ? y0 + seatGap * 0.2 : y0 + seatGap * 1.8]);
    }
    height = cellH * rowsN;
  }
  return { pts, shapes, height, dot: Math.max(3, dot) };
}

function hall(type, capacity, replies, { width = 520, maxDots = 120, cols, cancelled = false } = {}) {
  const per = Math.max(1, Math.ceil(capacity / maxDots));   // people per dot
  const n = Math.ceil(capacity / per);
  const marks = [];                                          // 'g' | 'm' per dot, in reply order
  for (let i = 0; i < replies.length && marks.length < n; i += per) {
    const pair = replies.slice(i, i + per);
    marks.push(pair.includes('m') ? 'm' : 'g');
  }
  const { pts, shapes, height, dot } = hallPlaces(type, n, width, cols);
  const H = Math.round(height);
  const out = [`<svg width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${replies.split('g').length - 1} going, ${replies.split('m').length - 1} maybe, ${capacity} seats" style="opacity:${cancelled ? .38 : 1};max-width:100%;height:auto">`, ...shapes];
  pts.forEach(([x, y], i) => {
    const r = dot;
    if (marks[i] === 'g') out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="var(--md-focus)"/>`);
    else if (marks[i] === 'm') out.push(`<circle cx="${x}" cy="${y}" r="${r - 0.75}" fill="var(--md-surface)" stroke="var(--md-focus)" stroke-width="1.5"/><path d="M ${x} ${y - r + 0.75} A ${r - 0.75} ${r - 0.75} 0 0 0 ${x} ${y + r - 0.75} Z" fill="var(--md-focus)"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="${r - 0.75}" fill="none" stroke="var(--md-outline)" stroke-width="1.5"/>`);
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
