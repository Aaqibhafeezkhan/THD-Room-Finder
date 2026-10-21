import { ImageResponse } from '@vercel/og';
import { hallLayout, hallSvg } from '../shared/hall.js';

// GET /api/gathering-card?k=&c=&r=&p=&x= — the og:image of a gathering link
// (ADR 0008): the room set up for its kind with the people in it, in white
// on the brand gradient, as the G4 chat preview. Drawn from the query alone,
// which /api/share builds from gathering_preview (no names, no counts).

const W = 1200;
const H = 630;
const KINDS = ['focus', 'games', 'talk', 'meeting'];
const WHITE = {
  table: 'rgba(255,255,255,0.15)',
  tableEdge: 'rgba(255,255,255,0.3)',
  text: '#FFFFFF',
  going: '#FFFFFF',
  maybe: 'rgba(255,255,255,0.4)',
  maybeEdge: '#FFFFFF',
  free: 'rgba(255,255,255,0.3)',
};

export function GET(request) {
  const q = new URL(request.url).searchParams;
  const kind = KINDS.includes(q.get('k')) ? q.get('k') : 'meeting';
  const capacity = Math.max(13, Math.min(300, Number(q.get('c')) || 13));
  const room = (q.get('r') ?? '').replace(/\s+/g, '').slice(0, 8);
  const replies = (q.get('p') ?? '').replace(/[^gm]/g, '').slice(0, 300);
  const cancelled = q.get('x') === '1';
  // Fewer, larger dots so they read at chat size.
  const layout = hallLayout(kind, capacity, replies, { width: 760, maxDots: 60, cols: kind === 'games' ? 3 : kind === 'focus' ? 4 : undefined });
  // The SVG renderer has no fonts, so the room code is a text layer on top.
  const svg = hallSvg(layout, '', WHITE);
  const scale = Math.min(1, 520 / layout.height);
  const w = layout.width * scale;
  const h = layout.height * scale;
  const { plate } = layout;
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: { display: 'flex', width: W, height: H, alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #6A4BA8, #1565C0)' },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', position: 'relative', width: w, height: h, opacity: cancelled ? 0.45 : 1 },
              children: [
                { type: 'img', props: { src, width: w, height: h } },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', position: 'absolute', alignItems: 'center', justifyContent: 'center',
                      left: (plate.cx - plate.w / 2) * scale, top: (plate.cy - plate.h / 2) * scale,
                      width: plate.w * scale, height: plate.h * scale,
                      color: '#FFFFFF', fontSize: plate.h * scale * 0.55, fontFamily: 'monospace',
                    },
                    children: room,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
