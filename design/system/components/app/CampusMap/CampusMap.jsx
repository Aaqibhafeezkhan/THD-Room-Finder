import React from 'react';

/* =====================================================================
   CampusMap — self-contained axonometric 2.5D campus map.
   Real OSM footprints + surroundings → local metres → rotate(bearing)
   → axonometric projection → extruded prisms tinted by availability.
   No tiles, no WebGL, no API. Data in via props, selection out via
   onSelect. Every colour lives in the THEME (override via `theme`).
   ===================================================================== */

/* ---- colour helpers ---- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = c => 'rgb(' + c.map(v => Math.round(v)).join(',') + ')';

/* ---- default THEME (deep-merge with `theme` prop) ---- */
const DEFAULT_THEME = {
  // Availability ramp (full → wide-open) on THD's teal "free" family.
  ramp: ['#C4C6D0', '#9DC3BC', '#5FB3A6', '#2E9E8C', '#00897B'], // full → wide-open
  rampStops: [0, 0.18, 0.42, 0.7, 1],
  status: { full: '#C4C6D0', some: '#4DB6AC', free: '#00796B', busy: '#B3261E' },
  selOutline: { dark: '#90CAF9', light: '#1565C0' }, // THD blue selection
  donau: '#5C7E91',
  light: { ground: '#E7EAF2', green: '#CBD8CE', water: '#BBD4E4', road: '#FDFCFF', roadBig: '#D5D8E2', path: '#DDE0EA',
           wallR: '#CFD3DE', wallL: '#A7ABBA', trunk: '#7C7A70', text: '#1C1B1F', halo: '#F4F6FA', street: '#74777F',
           tree: ['#88AE86', '#6E9A72', '#9DBE96'], shadow: 0.12 },
  dark: { ground: '#111318', green: '#1E2A22', water: '#1B2B38', road: '#2A2E36', roadBig: '#3A3F49', path: '#242832',
          wallR: '#4A505C', wallL: '#363B45', trunk: '#3A3128', text: '#E6E1E5', halo: '#14161A', street: '#8E9099',
          tree: ['#3F6A50', '#335A44', '#4C7A5A'], shadow: 0.26 },
};
function mergeTheme(o) {
  if (!o) return DEFAULT_THEME;
  const t = { ...DEFAULT_THEME, ...o,
    status: { ...DEFAULT_THEME.status, ...(o.status || {}) },
    selOutline: { ...DEFAULT_THEME.selOutline, ...(o.selOutline || {}) },
    light: { ...DEFAULT_THEME.light, ...(o.light || {}) },
    dark: { ...DEFAULT_THEME.dark, ...(o.dark || {}) } };
  return t;
}

/* ---- geo → local metres (memoised per data) ---- */
function buildLocal(campus, context) {
  const feats = campus.features;
  const lat0 = feats.reduce((s, f) => s + f.properties.lat, 0) / feats.length;
  const lon0 = feats.reduce((s, f) => s + f.properties.lon, 0) / feats.length;
  const MLON = 111320 * Math.cos(lat0 * Math.PI / 180), MLAT = 110540;
  const toM = ([lon, lat]) => [(lon - lon0) * MLON, -(lat - lat0) * MLAT];
  const ringsOf = g => g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]);
  const B = feats.map(f => {
    const ring = ringsOf(f.geometry)[0].slice(0, -1).map(toM);
    let cx = 0, cy = 0; ring.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= ring.length; cy /= ring.length;
    const p = f.properties;
    return { key: p.key, label: p.label, sat: !!p.sat, name: p.name, ring, c: [cx, cy], height: p.height || 12, free: p.free, total: p.total };
  });
  const C = context || {};
  const roads = (C.roads || []).map(r => ({ g: r.g.map(toM), n: r.n, big: r.big }));
  const paths = (C.paths || []).map(r => r.g.map(toM));
  const water = (C.water || []).map(r => r.map(toM));
  const river = (C.river || []).map(r => r.map(toM));
  const green = (C.green || []).map(r => r.map(toM));
  const trees = (C.trees || []).map(toM);
  const best = {};
  roads.forEach(r => { if (!r.n) return; for (let i = 0; i < r.g.length - 1; i++) { const a = r.g[i], b = r.g[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!best[r.n] || L > best[r.n].L) best[r.n] = { L, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; } });
  const streets = Object.entries(best).filter(([, v]) => v.L > 40).map(([n, v]) => ({ n, mid: v.mid }));
  return { B, roads, paths, water, river, green, trees, streets };
}

/* ---- build the SVG body + framing bounds for one camera/state ---- */
function renderBody(geo, st) {
  const { bear, ang, dark, sel, showLabels, showTrees, THEME, avail } = st;
  const pal = THEME[dark ? 'dark' : 'light'];
  const COSA = Math.cos(ang), SINA = Math.sin(ang), cb = Math.cos(bear), sb = Math.sin(bear);
  const rot = ([x, y]) => [x * cb - y * sb, x * sb + y * cb];
  const proj = ([x, y], h) => [(x - y) * COSA, (x + y) * SINA - (h || 0)];
  const P = ([x, y]) => x.toFixed(1) + ',' + y.toFixed(1);
  const polyPts = (pts, h) => pts.map(p => P(proj(rot(p), h))).join(' ');
  const STOPS = THEME.ramp.map((c, i) => [THEME.rampStops[i], hex(c)]);
  const ramp = r => { for (let i = 1; i < STOPS.length; i++) { if (r <= STOPS[i][0]) { const a = STOPS[i - 1], b = STOPS[i]; return mix(a[1], b[1], (r - a[0]) / (b[0] - a[0])); } } return STOPS[STOPS.length - 1][1]; };
  const stoneR = hex(pal.wallR), stoneL = hex(pal.wallL);
  const avFor = b => { const o = avail && avail[b.key]; const free = o ? o.free : b.free, total = o ? o.total : b.total; const f = free == null ? 0 : free, t = total == null ? 0 : total; return { ratio: t ? f / t : 0 }; };

  function prism(b) {
    const poly = b.ring.map(rot), h = b.height, n = poly.length;
    let cx = 0, cy = 0; poly.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= n; cy /= n;
    const rc = ramp(avFor(b).ratio), rim = mix(rc, [255, 255, 255], 0.4);
    let s = '<polygon points="' + poly.map(p => P(proj(p, 0))).join(' ') + '" fill="rgba(0,0,0,' + pal.shadow + ')" transform="translate(2,3.5)"/>';
    const walls = [];
    for (let i = 0; i < n; i++) {
      const A = poly[i], C = poly[(i + 1) % n], ed = [C[0] - A[0], C[1] - A[1]];
      let nm = [ed[1], -ed[0]]; const mid = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2], co = [mid[0] - cx, mid[1] - cy];
      if (nm[0] * co[0] + nm[1] * co[1] < 0) nm = [-nm[0], -nm[1]];
      if ((nm[0] + nm[1]) <= 0) continue;
      const L = Math.hypot(nm[0], nm[1]) || 1, t = Math.abs(nm[0] / L) / (Math.abs(nm[0] / L) + Math.abs(nm[1] / L) + 1e-6);
      const q = [proj(A, 0), proj(C, 0), proj(C, h), proj(A, h)];
      walls.push({ d: mid[0] + mid[1], s: '<polygon points="' + q.map(P).join(' ') + '" fill="' + rgb(mix(stoneL, stoneR, t)) + '" stroke="rgba(0,0,0,.14)" stroke-width="0.4"/>' });
    }
    walls.sort((a, b) => a.d - b.d);
    const roof = poly.map(p => P(proj(p, h))).join(' ');
    const isSel = b.key === sel;
    let lbl = '';
    if (showLabels) { const lp = proj([cx, cy], h);
      lbl = '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 2.6).toFixed(1) + '" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="700" font-size="' + (b.label.length > 2 ? 5 : 7.5) + '" fill="' + pal.text + '" stroke="' + pal.halo + '" stroke-width="1.5" paint-order="stroke">' + b.label + '</text>'; }
    return '<g class="cm-bld" data-id="' + b.key + '">' + s + walls.map(w => w.s).join('')
      + '<polygon points="' + roof + '" fill="' + rgb(rc) + '" stroke="' + rgb(rim) + '" stroke-width="0.9" stroke-linejoin="round"/>'
      + (isSel ? '<polygon points="' + roof + '" fill="none" stroke="' + THEME.selOutline[dark ? 'dark' : 'light'] + '" stroke-width="1.8" stroke-linejoin="round"/>' : '') + lbl + '</g>';
  }
  function tree(loc) { const b = proj(loc, 0), t = proj(loc, 5);
    return '<g><ellipse cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" rx="2.6" ry="1.2" fill="rgba(0,0,0,' + pal.shadow + ')"/>'
      + '<line x1="' + b[0].toFixed(1) + '" y1="' + b[1].toFixed(1) + '" x2="' + t[0].toFixed(1) + '" y2="' + t[1].toFixed(1) + '" stroke="' + pal.trunk + '" stroke-width="0.9"/>'
      + '<circle cx="' + t[0].toFixed(1) + '" cy="' + t[1].toFixed(1) + '" r="3" fill="' + pal.tree[0] + '"/><circle cx="' + (t[0] - 1.3).toFixed(1) + '" cy="' + (t[1] + 0.7).toFixed(1) + '" r="2.1" fill="' + pal.tree[1] + '"/><circle cx="' + (t[0] + 1.3).toFixed(1) + '" cy="' + (t[1] - 0.4).toFixed(1) + '" r="2.1" fill="' + pal.tree[2] + '"/></g>'; }

  // ground extent
  let gx0 = 1e9, gy0 = 1e9, gx1 = -1e9, gy1 = -1e9;
  const ext = p => { const q = proj(rot(p), 0); if (q[0] < gx0) gx0 = q[0]; if (q[0] > gx1) gx1 = q[0]; if (q[1] < gy0) gy0 = q[1]; if (q[1] > gy1) gy1 = q[1]; };
  geo.green.forEach(r => r.forEach(ext)); geo.water.forEach(r => r.forEach(ext)); geo.B.forEach(b => b.ring.forEach(ext)); geo.roads.forEach(r => r.g.forEach(ext));
  const gp = 60;
  const ground = '<rect x="' + (gx0 - gp).toFixed(1) + '" y="' + (gy0 - gp).toFixed(1) + '" width="' + (gx1 - gx0 + 2 * gp).toFixed(1) + '" height="' + (gy1 - gy0 + 2 * gp).toFixed(1) + '" fill="' + pal.ground + '"/>';
  const green = geo.green.map(r => '<polygon points="' + polyPts(r, 0) + '" fill="' + pal.green + '"/>').join('');
  const water = geo.water.map(r => '<polygon points="' + polyPts(r, 0) + '" fill="' + pal.water + '"/>').join('')
    + geo.river.map(r => '<polyline points="' + polyPts(r, 0) + '" fill="none" stroke="' + pal.water + '" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const paths = geo.paths.map(r => '<polyline points="' + polyPts(r, 0) + '" fill="none" stroke="' + pal.path + '" stroke-width="1.4" stroke-linecap="round"/>').join('');
  const roads = geo.roads.map(r => '<polyline points="' + polyPts(r.g, 0) + '" fill="none" stroke="' + (r.big ? pal.roadBig : pal.road) + '" stroke-width="' + (r.big ? 5 : 3) + '" stroke-linecap="round" stroke-linejoin="round"/>').join('');

  const items = [];
  if (showTrees) geo.trees.forEach(loc => { const rl = rot(loc); items.push({ d: rl[0] + rl[1], s: tree(rl) }); });
  geo.B.forEach(b => { const rc = rot(b.c); items.push({ d: rc[0] + rc[1], s: prism(b) }); });
  items.sort((a, b) => a.d - b.d);

  let labels = '';
  if (showLabels) {
    labels = geo.streets.map(s => { const p = proj(rot(s.mid), 0);
      return '<text x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="500" font-size="4.4" fill="' + pal.street + '" stroke="' + pal.halo + '" stroke-width="1" paint-order="stroke" opacity="0.9">' + s.n + '</text>'; }).join('');
    if (geo.river[0]) { const m = geo.river[0][Math.floor(geo.river[0].length / 2)]; const p = proj(rot(m), 0);
      labels += '<text x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="600" font-size="6" letter-spacing="2" fill="' + THEME.donau + '" stroke="' + pal.halo + '" stroke-width="1.1" paint-order="stroke">DONAU</text>'; }
  }

  // framing bounds: riverside core, OR include the selected satellite
  const focus = geo.B.filter(b => !b.sat || b.key === sel);
  const xs = [], ys = [];
  focus.forEach(b => b.ring.forEach(p => { const q = proj(rot(p), b.height); xs.push(q[0]); ys.push(q[1]); const q0 = proj(rot(p), 0); xs.push(q0[0]); ys.push(q0[1]); }));
  const pad = 46, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const bb = { minX, minY, w: Math.max(...xs) - minX + pad, h: Math.max(...ys) - minY + pad };
  return { html: ground + green + water + paths + roads + items.map(i => i.s).join('') + labels, bb };
}

/**
 * CampusMap — the reusable 2.5D campus map.
 * See CampusMap.d.ts for prop documentation.
 */
export function CampusMap({
  campus, context, availability, mode = 'auto', theme,
  bearing = -22, tilt = 34, selectedKey, onSelect,
  interactive = true, showLabels = true, showTrees = true, style = {},
}) {
  const svgRef = React.useRef(null);
  const camRef = React.useRef({ zoom: 1, panx: 0, pany: 0, bb: null, moved: false });
  const prefersDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const [dark, setDark] = React.useState(mode === 'dark' ? true : mode === 'light' ? false : prefersDark);
  const [bear] = React.useState(bearing * Math.PI / 180);
  const [ang] = React.useState(tilt * Math.PI / 180);
  const [selInternal, setSelInternal] = React.useState(() => selectedKey || (campus.features[0] && campus.features[0].properties.key));
  const sel = selectedKey !== undefined ? selectedKey : selInternal;

  const THEME = React.useMemo(() => mergeTheme(theme), [theme]);
  const geo = React.useMemo(() => buildLocal(campus, context), [campus, context]);

  React.useEffect(() => { if (mode === 'auto') return;
    setDark(mode === 'dark'); }, [mode]);
  React.useEffect(() => { if (mode !== 'auto' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)'); const fn = e => setDark(e.matches);
    mq.addEventListener('change', fn); return () => mq.removeEventListener('change', fn); }, [mode]);

  const applyVB = React.useCallback(() => {
    const svg = svgRef.current, c = camRef.current; if (!svg || !c.bb) return;
    const cx = c.bb.minX + c.bb.w / 2 - c.panx, cy = c.bb.minY + c.bb.h / 2 - c.pany, w = c.bb.w / c.zoom, h = c.bb.h / c.zoom;
    svg.setAttribute('viewBox', (cx - w / 2).toFixed(1) + ' ' + (cy - h / 2).toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1));
  }, []);

  // reproject + paint when geometry/camera/theme/state change
  React.useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const { html, bb } = renderBody(geo, { bear, ang, dark, sel, showLabels, showTrees, THEME, avail: availability });
    svg.innerHTML = html; camRef.current.bb = bb; applyVB();
  }, [geo, bear, ang, dark, sel, showLabels, showTrees, THEME, availability, applyVB]);

  // selection reframes when a satellite is picked
  const pick = React.useCallback(k => {
    const wasSat = geo.B.find(b => b.key === sel)?.sat, willSat = geo.B.find(b => b.key === k)?.sat;
    if (wasSat || willSat) { camRef.current.panx = 0; camRef.current.pany = 0; }
    if (selectedKey === undefined) setSelInternal(k);
    if (onSelect) onSelect(k);
  }, [geo, sel, selectedKey, onSelect]);

  // interaction: click (delegated), drag-pan, wheel-zoom — viewBox only, no reproject
  React.useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    let drag = null;
    const down = e => { if (!interactive) return; drag = { x: e.clientX, y: e.clientY, px: camRef.current.panx, py: camRef.current.pany }; camRef.current.moved = false; svg.style.cursor = 'grabbing'; };
    const move = e => { if (!drag) return; const vb = svg.viewBox.baseVal, sc = vb.width / svg.clientWidth;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3) camRef.current.moved = true;
      camRef.current.panx = drag.px + (e.clientX - drag.x) * sc; camRef.current.pany = drag.py + (e.clientY - drag.y) * sc; applyVB(); };
    const up = () => { drag = null; svg.style.cursor = interactive ? 'grab' : 'default'; };
    const click = e => { if (camRef.current.moved) return; const g = e.target.closest && e.target.closest('[data-id]'); if (g) pick(g.dataset.id); };
    const wheel = e => { if (!interactive) return; e.preventDefault(); const c = camRef.current; c.zoom = Math.min(7, Math.max(0.5, c.zoom * (e.deltaY < 0 ? 1.12 : 0.89))); applyVB(); };
    svg.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    svg.addEventListener('click', click); svg.addEventListener('wheel', wheel, { passive: false });
    svg.style.cursor = interactive ? 'grab' : 'default';
    return () => { svg.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); svg.removeEventListener('click', click); svg.removeEventListener('wheel', wheel); };
  }, [interactive, applyVB, pick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: THEME[dark ? 'dark' : 'light'].ground, overflow: 'hidden', ...style }}>
      <svg ref={svgRef} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} aria-label="THD campus 2.5D map" />
    </div>
  );
}
