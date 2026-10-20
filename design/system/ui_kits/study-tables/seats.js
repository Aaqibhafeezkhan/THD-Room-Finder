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

// GatheringRing: the seat ring grown for 13 to 300 people (organizations.md).
// One ring of dots, clockwise from the top in reply order: 'g' going (full),
// 'm' maybe (half), outline = room left. At most 36 dots; above that one dot
// stands for several people. The count sits in the middle.
function gatheringRing(capacity, replies, { size = 168, cancelled = false, label = 'going' } = {}) {
  const most = size < 80 ? 12 : 36;                     // small rings in lists keep 12 dots
  const per = Math.max(1, Math.ceil(capacity / most));
  const n = Math.ceil(capacity / per);
  const marks = [];
  for (let i = 0; i < replies.length && marks.length < n; i += per) marks.push(replies.slice(i, i + per).includes('m') ? 'm' : 'g');
  const going = replies.split('g').length - 1;
  const r = size / 2, orbit = size * 0.42;
  const dot = Math.min(size * (size < 80 ? 0.075 : 0.04), (Math.PI * orbit / n) * 0.62);
  const out = [`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${going} going of ${capacity}" style="opacity:${cancelled ? .38 : 1}">`];
  out.push(`<circle cx="${r}" cy="${r}" r="${size * 0.3}" fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" stroke-width="1.5" ${cancelled ? 'stroke-dasharray="6 5"' : ''}/>`);
  out.push(`<text x="${r}" y="${r + size * 0.04}" text-anchor="middle" font-family="var(--font-sans)" font-weight="600" font-size="${size * 0.16}" fill="var(--md-on-surface)">${going}</text>`);
  out.push(`<text x="${r}" y="${r + size * 0.14}" text-anchor="middle" font-family="var(--font-sans)" font-size="${size * 0.065}" fill="var(--md-on-surface-variant)">of ${capacity}</text>`);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = r + orbit * Math.cos(a), y = r + orbit * Math.sin(a);
    if (marks[i] === 'g') out.push(`<circle cx="${x}" cy="${y}" r="${dot}" fill="var(--md-focus)"/>`);
    else if (marks[i] === 'm') out.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="var(--md-surface)" stroke="var(--md-focus)" stroke-width="1.5"/><path d="M ${x} ${y - dot + 0.75} A ${dot - 0.75} ${dot - 0.75} 0 0 0 ${x} ${y + dot - 0.75} Z" fill="var(--md-focus)"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="${dot - 0.75}" fill="none" stroke="var(--md-outline)" stroke-width="1.5"/>`);
  }
  out.push('</svg>');
  return out.join('');
}

// A reply sequence for specimens: `going` g and `maybe` m, mixed in a fixed order.
function replySeq(going, maybe, seed = 3) {
  const out = []; let g = going, m = maybe, s = seed;
  while (g || m) { s = (s * 9301 + 49297) % 233280; if (m && (!g || s / 233280 < maybe / (going + maybe))) { out.push('m'); m--; } else { out.push('g'); g--; } }
  return out.join('');
}
