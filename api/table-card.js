import { ImageResponse } from '@vercel/og';

// GET /api/table-card?s=&k=&r=&x= — the og:image of a study table link
// (ADR 0007): the white seat ring on the brand gradient, as the chat preview
// in design/system/ui_kits/study-tables. Drawn from the query alone, which
// /api/share builds from table_preview (no names).

const W = 1200;
const H = 630;
const VIOLET = '#6A4BA8';
const BLUE = '#1565C0';

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) },
});

export function tableCardTree({ seats, taken, room, cancelled }) {
  const size = 500;
  const r = size / 2;
  const orbit = size * 0.37;
  const seat = size * (seats > 8 ? 0.062 : 0.085);
  const table = size * (seats > 8 ? 0.3 : 0.28);
  const dots = Array.from({ length: seats }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
    return h('div', {
      position: 'absolute',
      left: r + orbit * Math.cos(a) - seat,
      top: r + orbit * Math.sin(a) - seat,
      width: seat * 2,
      height: seat * 2,
      borderRadius: seat,
      background: i < taken ? '#FFFFFF' : 'transparent',
      border: i < taken ? 'none' : '5px solid rgba(255,255,255,0.67)',
    });
  });
  // As the chat preview in the design system: the white seat ring alone on
  // the brand gradient. Chat apps print the title and line under it.
  return h('div', {
    width: W, height: H, alignItems: 'center', justifyContent: 'center',
    backgroundImage: `linear-gradient(135deg, ${VIOLET}, ${BLUE})`,
  },
    h('div', { position: 'relative', width: size, height: size, opacity: cancelled ? 0.45 : 1 },
      h('div', {
        position: 'absolute', left: r - table, top: r - table, width: table * 2, height: table * 2, borderRadius: table,
        background: 'rgba(255,255,255,0.13)',
        border: cancelled ? '4px dashed rgba(255,255,255,0.6)' : '3px solid rgba(255,255,255,0.33)',
        alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: size * 0.1, fontFamily: 'monospace',
      }, room.replace(/\s+/g, '').slice(0, 8)),
      ...dots,
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
    cancelled: q.get('x') === '1',
  };
  return new ImageResponse(tableCardTree(props), {
    width: W,
    height: H,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
