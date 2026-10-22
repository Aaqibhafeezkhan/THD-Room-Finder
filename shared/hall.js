// The picture of a gathering (docs/product/organizations.md → Types, The
// picture): the room set up for its kind, the room code where the front is,
// and one dot per person in reply order. Shared by the app's Hall component
// and the link-preview card, so both draw the same thing.
//
//   focus    round tables of 6, like study tables, a plate above
//   games    long tables of 8, four a side, a plate above
//   talk     an auditorium: a half circle of rows facing the stage
//   meeting  a classroom: rows facing the front plate
//
// replies: one letter per person in reply order, 'g' going, 'm' maybe.
// People fill table by table (focus, games) or row by row from the front,
// centre first (talk, meeting). Free places are outlines.

export const HALL_KINDS = ['focus', 'games', 'talk', 'meeting'];

const centreOut = (n) => [...Array(n).keys()].sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);

/** Geometry only: dots, shapes and the plate for the room code. */
export function hallLayout(kind, capacity, replies, { width = 320, maxDots = 120, cols: colsMax } = {}) {
  const cap = Math.max(1, Math.round(capacity));
  const per = Math.max(1, Math.ceil(cap / maxDots));
  const n = Math.ceil(cap / per);
  const seq = String(replies ?? '');
  const marks = [];
  for (let i = 0; i < seq.length && marks.length < n; i += per) marks.push(seq.slice(i, i + per).includes('m') ? 'm' : 'g');

  const points = [];
  const tables = [];
  const plateH = Math.max(26, width * 0.085);
  let plate;
  let height;
  let dot;

  if (kind === 'talk') {
    const rows = Math.max(3, Math.round(Math.sqrt(n / 4)));
    const r0 = width * 0.2;
    const r1 = width * 0.47;
    height = r1 + plateH * 1.4;
    const cx = width / 2;
    const cy = height - plateH * 0.8;
    const radii = Array.from({ length: rows }, (_, r) => r0 + ((r1 - r0) * r) / (rows - 1));
    const sum = radii.reduce((a, b) => a + b, 0);
    let left = n;
    radii.forEach((R, r) => {
      const count = r === rows - 1 ? left : Math.round((n * R) / sum);
      left -= count;
      for (const i of centreOut(count)) {
        const a = Math.PI + ((i + 0.5) * Math.PI) / count;
        points.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
      }
    });
    dot = Math.min(width * 0.026, ((Math.PI * r0) / Math.max(1, Math.round((n * r0) / sum))) * 0.34);
    plate = { cx, cy, w: width * 0.28, h: plateH };
  } else if (kind === 'meeting') {
    let cols = Math.max(6, Math.min(14, Math.round(Math.sqrt(n * 1.6))));
    if (cols >= 8 && cols % 2) cols += 1; // even, so the aisle is centred
    const rows = Math.ceil(n / cols);
    const aisle = cols >= 8;
    const gap = width / (cols + (aisle ? 1.6 : 1));
    dot = Math.min(width * 0.026, gap * 0.3);
    const top = plateH * 1.6;
    plate = { cx: width / 2, cy: plateH * 0.6, w: width * 0.34, h: plateH };
    const order = centreOut(cols);
    for (let r = 0; r < rows; r++) {
      for (const c of order.slice(0, Math.min(cols, n - r * cols))) {
        points.push([gap * (c + 1) + (aisle && c >= cols / 2 ? gap * 0.6 : 0) - gap * 0.2, top + r * gap + gap * 0.3]);
      }
    }
    height = top + rows * gap;
  } else {
    const round = kind === 'focus';
    const seats = round ? 6 : 8;
    const count = Math.ceil(n / seats);
    const cols = Math.min(colsMax || (width < 400 ? (round ? 3 : 2) : round ? 4 : 3), count);
    const rows = Math.ceil(count / cols);
    const cellW = width / cols;
    const cellH = round ? cellW * 0.95 : cellW * 0.62;
    const top = plateH * 1.5;
    plate = { cx: width / 2, cy: plateH * 0.6, w: width * 0.3, h: plateH };
    dot = Math.min(width * 0.026, round ? cellW * 0.075 : cellW * 0.06);
    for (let t = 0; t < count; t++) {
      const cx = cellW * ((t % cols) + 0.5);
      const cy = top + cellH * (Math.floor(t / cols) + 0.5);
      const k = Math.min(seats, n - t * seats);
      if (round) {
        tables.push({ shape: 'circle', cx, cy, r: cellW * 0.2 });
        for (let i = 0; i < k; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
          points.push([cx + cellW * 0.32 * Math.cos(a), cy + cellW * 0.32 * Math.sin(a)]);
        }
      } else {
        const w = cellW * 0.74;
        const h = cellH * 0.26;
        const step = w / 4;
        tables.push({ shape: 'rect', x: cx - w / 2, y: cy - h / 2, w, h });
        for (let i = 0; i < k; i++) {
          points.push([cx - w / 2 + step * ((i % 4) + 0.5), i < 4 ? cy - h / 2 - dot * 1.9 : cy + h / 2 + dot * 1.9]);
        }
      }
    }
    height = top + cellH * rows;
  }

  return { width, height: Math.round(height), dot: Math.max(3, dot), per, points, marks, tables, plate };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * The picture as an SVG string, for the link-preview card. `colors`: table,
 * tableEdge, text, going, maybe, maybeEdge, free.
 */
export function hallSvg(layout, code, colors) {
  const { width, height, dot, points, marks, tables, plate } = layout;
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`];
  for (const t of tables) {
    parts.push(
      t.shape === 'circle'
        ? `<circle cx="${t.cx}" cy="${t.cy}" r="${t.r}" fill="${colors.table}" stroke="${colors.tableEdge}" stroke-width="2"/>`
        : `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="${t.h * 0.25}" fill="${colors.table}" stroke="${colors.tableEdge}" stroke-width="2"/>`,
    );
  }
  if (plate) {
    parts.push(`<rect x="${plate.cx - plate.w / 2}" y="${plate.cy - plate.h / 2}" width="${plate.w}" height="${plate.h}" rx="${plate.h * 0.3}" fill="${colors.table}" stroke="${colors.tableEdge}" stroke-width="2"/>`);
    if (code) parts.push(`<text x="${plate.cx}" y="${plate.cy + plate.h * 0.2}" text-anchor="middle" font-family="monospace" font-size="${plate.h * 0.55}" fill="${colors.text}">${esc(code)}</text>`);
  }
  points.forEach(([x, y], i) => {
    if (marks[i] === 'g') parts.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="${colors.going}"/>`);
    else if (marks[i] === 'm') parts.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="${colors.maybe}" stroke="${colors.maybeEdge}" stroke-width="1.5"/>`);
    else parts.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="none" stroke="${colors.free}" stroke-width="1.5"/>`);
  });
  parts.push('</svg>');
  return parts.join('');
}
