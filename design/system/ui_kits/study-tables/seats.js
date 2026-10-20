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

// Hall: a gathering's seat picture. setup: tables | circle | stage | rows.
// replies: number going, number maybe; seats fill from the front / table by table.
function hall(setup, capacity, going, maybe, { width = 520, mine = -1, cancelled = false } = {}) {
  const per = capacity > 80 ? 2 : 1;            // one dot per seat, or per two
  const n = Math.ceil(capacity / per), g = Math.ceil(going / per), m = Math.ceil(maybe / per);
  const pts = [];
  let height;
  if (setup === 'circle') {
    height = width * 0.7; const cx = width / 2, cy = height / 2, R = height * 0.42;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  } else if (setup === 'stage') {
    height = width * 0.56; const cx = width / 2, cy = height * 0.86;
    const rowsN = Math.max(3, Math.round(Math.sqrt(n / 4)));
    const radii = Array.from({ length: rowsN }, (_, r) => width * (0.17 + 0.29 * r / (rowsN - 1)));
    const sum = radii.reduce((a, b) => a + b, 0); let left = n;
    radii.forEach((R, r) => {
      const cnt = r === rowsN - 1 ? left : Math.round(n * R / sum); left -= cnt;
      for (let i = 0; i < cnt; i++) { const a = Math.PI + (i + 0.5) * Math.PI / cnt; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    });
  } else if (setup === 'rows') {
    const cols = Math.min(16, Math.ceil(Math.sqrt(n * 2.2))), rowsN = Math.ceil(n / cols);
    const gap = width / (cols + 1); height = gap * (rowsN + 2.2);
    for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c = i % cols; pts.push([gap * (c + 1) + (c >= cols / 2 ? gap * 0.35 : -gap * 0.35) * 0.6, gap * (r + 2)]); }
  } else { // tables of 6
    const per6 = 6, tables = Math.ceil(n / per6), cols = Math.min(5, Math.ceil(Math.sqrt(tables * 1.6)));
    const cell = width / cols, rowsN = Math.ceil(tables / cols); height = cell * rowsN;
    for (let t = 0; t < tables; t++) {
      const cx = cell * (t % cols + 0.5), cy = cell * (Math.floor(t / cols) + 0.5);
      const k = Math.min(per6, n - t * per6);
      for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / per6; pts.push([cx + cell * 0.3 * Math.cos(a), cy + cell * 0.3 * Math.sin(a), cx, cy]); }
    }
  }
  const dot = Math.max(3, Math.min(9, width / (Math.sqrt(n) * 5.2)));
  const out = [`<svg width="${width}" height="${Math.round(height)}" viewBox="0 0 ${width} ${Math.round(height)}" role="img" aria-label="${going} going, ${maybe} maybe, ${capacity} seats" style="opacity:${cancelled ? .38 : 1};max-width:100%;height:auto">`];
  if (setup === 'stage') out.push(`<rect x="${width / 2 - width * 0.12}" y="${height * 0.86}" width="${width * 0.24}" height="${height * 0.11}" rx="8" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/><text x="${width / 2}" y="${height * 0.93}" text-anchor="middle" font-size="12" fill="var(--md-on-surface-variant)">Stage</text>`);
  if (setup === 'rows') out.push(`<rect x="${width * 0.2}" y="6" width="${width * 0.6}" height="10" rx="5" fill="var(--md-surface-variant)"/><text x="${width / 2}" y="32" text-anchor="middle" font-size="11" fill="var(--md-on-surface-variant)">Front</text>`);
  if (setup === 'circle') out.push(`<circle cx="${width / 2}" cy="${height / 2}" r="${height * 0.3}" fill="var(--md-surface-variant)" opacity=".6"/>`);
  if (setup === 'tables') { const seen = new Set(); pts.forEach(p => { const k = p[2] + ',' + p[3]; if (!seen.has(k)) { seen.add(k); out.push(`<circle cx="${p[2]}" cy="${p[3]}" r="${(width / Math.min(5, Math.ceil(Math.sqrt(Math.ceil(n / 6) * 1.6)))) * 0.17}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)"/>`); } }); }
  pts.forEach(([x, y], i) => {
    if (i < g) out.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="var(--md-focus)"/>`);
    else if (i < g + m) out.push(`<circle cx="${x}" cy="${y}" r="${dot - 1}" fill="var(--md-focus-container)" stroke="var(--md-focus)" stroke-width="1.5"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="${dot - 1}" fill="none" stroke="var(--md-outline)" stroke-width="1.2"/>`);
    if (i === mine) out.push(`<circle cx="${x}" cy="${y}" r="${dot + 3}" fill="none" stroke="var(--md-focus)" stroke-width="2"/>`);
  });
  out.push('</svg>');
  return out.join('');
}
