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

// Hall: a gathering's seat picture (docs/product/organizations.md → Hall rules).
// setup: 'tables' (long tables of perTable, 8/10/12) or 'rows'.
// Seats fill one table at a time, or front row first, centre outwards.
function hall(setup, capacity, going, maybe, { width = 520, perTable = 8, maxCols = 4, mine = -1, cancelled = false } = {}) {
  const per = capacity > 120 ? 2 : 1;                  // one dot per seat, or per two
  const n = Math.ceil(capacity / per), g = Math.ceil(going / per), m = Math.ceil(maybe / per);
  const pts = [], shapes = [];
  let height, dot;
  if (setup === 'rows') {
    let cols = Math.max(6, Math.min(16, Math.round(Math.sqrt(n * 1.6))));
    if (cols >= 8 && cols % 2) cols += 1;              // even, so the aisle is centred
    const rowsN = Math.ceil(n / cols), aisle = cols >= 8;
    const gap = width / (cols + (aisle ? 1.6 : 1));
    dot = Math.min(10, gap * 0.32);
    const top = gap * 0.9;                               // the front line sits just above the first row
    shapes.push(`<line x1="${gap * 0.5}" y1="${top - gap * 0.45}" x2="${width - gap * 0.5}" y2="${top - gap * 0.45}" stroke="var(--md-outline)" stroke-width="3" stroke-linecap="round"/>`);
    // Centre-out order within each row.
    const order = [...Array(cols).keys()].sort((a, b) => Math.abs(a - (cols - 1) / 2) - Math.abs(b - (cols - 1) / 2) || a - b);
    for (let r = 0; r < rowsN; r++) {
      const inRow = Math.min(cols, n - r * cols);
      order.filter((c, k) => k < inRow).forEach((c) => {
        const x = gap * (c + 1) + (aisle && c >= cols / 2 ? gap * 0.6 : 0) - gap * 0.2;
        pts.push([x, top + r * gap + gap * 0.3]);
      });
    }
    height = top + rowsN * gap + gap * 0.1;
  } else {
    const side = perTable / 2, tables = Math.ceil(n / perTable);
    const cols = Math.min(maxCols, tables), rowsN = Math.ceil(tables / cols);
    const cellW = width / cols, seatGap = (cellW * 0.82) / side, cellH = seatGap * 3.4;
    dot = Math.min(10, seatGap * 0.3);
    for (let t = 0; t < tables; t++) {
      const x0 = cellW * (t % cols) + cellW * 0.09, y0 = cellH * Math.floor(t / cols) + seatGap * 0.7;
      const k = Math.min(perTable, n - t * perTable), w = side * seatGap;
      shapes.push(`<rect x="${x0}" y="${y0 + seatGap * 0.55}" width="${w}" height="${seatGap * 0.9}" rx="${seatGap * 0.2}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/>`);
      for (let i = 0; i < k; i++) {
        const col = i % side, top = i < side;
        pts.push([x0 + seatGap * (col + 0.5), top ? y0 + seatGap * 0.2 : y0 + seatGap * 1.8]);
      }
    }
    height = cellH * rowsN;
  }
  const out = [`<svg width="${width}" height="${Math.round(height)}" viewBox="0 0 ${width} ${Math.round(height)}" role="img" aria-label="${going} going, ${maybe} maybe, ${capacity} seats" style="opacity:${cancelled ? .38 : 1};max-width:100%;height:auto">`, ...shapes];
  pts.forEach(([x, y], i) => {
    if (i < g) out.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="var(--md-focus)"/>`);
    else if (i < g + m) out.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="var(--md-focus-container)" stroke="var(--md-focus)" stroke-width="1.5"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="none" stroke="var(--md-outline)" stroke-width="1.5"/>`);
    if (i === mine) out.push(`<circle cx="${x}" cy="${y}" r="${dot + 3.5}" fill="none" stroke="var(--md-focus)" stroke-width="2"/>`);
  });
  out.push('</svg>');
  return out.join('');
}
