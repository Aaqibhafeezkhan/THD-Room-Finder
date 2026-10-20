import { ImageResponse } from '@vercel/og';

// GET /api/table-card?s=&k=&r=&t=&w=&x= — the og:image of a study table link
// (ADR 0007): the seat ring on the violet brand panel, then topic, time and
// room. Drawn from the query alone, which /api/share builds from
// table_preview (no names), so the CDN may keep each variant.

const W = 1200;
const H = 630;
const VIOLET = '#6A4BA8';

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) },
});

export function tableCardTree({ seats, taken, room, topic, when, cancelled }) {
  const size = 420;
  const r = size / 2;
  const orbit = size * 0.37;
  const seat = size * (seats > 8 ? 0.062 : 0.085);
  const table = size * (seats > 8 ? 0.3 : 0.28);
  const dots = Array.from({ length: seats }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
    const x = r + orbit * Math.cos(a) - seat;
    const y = r + orbit * Math.sin(a) - seat;
    return h('div', {
      position: 'absolute', left: x, top: y, width: seat * 2, height: seat * 2, borderRadius: seat,
      background: i < taken ? '#FFFFFF' : 'transparent',
      border: i < taken ? 'none' : '4px solid rgba(255,255,255,0.7)',
    });
  });
  const ring = h('div', { position: 'relative', width: size, height: size, opacity: cancelled ? 0.45 : 1 },
    h('div', {
      position: 'absolute', left: r - table, top: r - table, width: table * 2, height: table * 2, borderRadius: table,
      background: 'rgba(255,255,255,0.16)', border: cancelled ? '3px dashed rgba(255,255,255,0.6)' : '3px solid rgba(255,255,255,0.35)',
      alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 44, fontFamily: 'monospace',
    }, room.replace(/\s+/g, '').slice(0, 8)),
    ...dots,
  );
  const line = cancelled
    ? 'Cancelled by the host'
    : taken >= seats ? `Full · ${taken} of ${seats} seats` : `${taken} of ${seats} seats taken`;
  return h('div', { width: W, height: H, background: '#FDFCFF', fontFamily: 'sans-serif' },
    h('div', { width: 560, height: H, background: VIOLET, alignItems: 'center', justifyContent: 'center' }, ring),
    h('div', { flex: 1, flexDirection: 'column', padding: '64px 56px 48px', color: '#1C1B1F' },
      h('div', { fontSize: 30, color: VIOLET, fontWeight: 600 }, 'Study table'),
      h('div', { fontSize: 60, fontWeight: 700, lineHeight: 1.1, marginTop: 18 }, topic),
      h('div', { fontSize: 34, color: '#44464F', marginTop: 22 }, when),
      h('div', { fontSize: 34, color: '#44464F', marginTop: 6 }, room),
      h('div', { fontSize: 34, color: cancelled ? '#BA1A1A' : VIOLET, fontWeight: 600, marginTop: 'auto' }, line),
      h('div', { fontSize: 24, color: '#44464F', marginTop: 18, width: '100%', justifyContent: 'space-between' }, h('span', {}, 'THD Room Finder'), h('span', {}, 'An invite, not a room booking')),
    ),
  );
}

export function GET(request) {
  const q = new URL(request.url).searchParams;
  const seats = Math.max(1, Math.min(12, Number(q.get('s')) || 4));
  const props = {
    seats,
    taken: Math.max(1, Math.min(seats, Number(q.get('k')) || 1)),
    room: (q.get('r') ?? '').slice(0, 24),
    topic: (q.get('t') || 'Study table').slice(0, 40),
    when: (q.get('w') ?? '').slice(0, 40),
    cancelled: q.get('x') === '1',
  };
  return new ImageResponse(tableCardTree(props), {
    width: W,
    height: H,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
