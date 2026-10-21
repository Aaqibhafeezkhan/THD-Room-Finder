// Mirror of src/components/tables/SeatRing.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * A study table seen from above (M2): the room code on a round table, seats
 * evenly around it. Seats fill clockwise from the top; the first is the
 * host's. Taken seats are filled violet, the viewer's seat gets a ring, free
 * seats are outlined. Cancelled tables fade to 38 % with a dashed edge.
 * 1–12 seats; 12 sit a little smaller and closer to the table.
 */
export function SeatRing({ seats, taken, mine = null, label, size = 168, cancelled = false, title, style = {} }) {
    const n = Math.max(1, Math.min(12, Math.round(seats)));
    const r = size / 2;
    const table = size * (n > 8 ? 0.3 : 0.28);
    // Leaves room for the ring around the viewer's seat inside the box.
    const orbit = size * 0.37;
    const seat = size * (n > 8 ? 0.062 : 0.085);
    const ringGap = Math.max(2, size * 0.024);
    return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title} style={{ display: 'block', flexShrink: 0, opacity: cancelled ? 0.38 : 1, ...style }}>
      <circle cx={r} cy={r} r={table} fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" strokeWidth={1.5} strokeDasharray={cancelled ? '6 5' : undefined}/>
      {label && (<text x={r} y={r + size * 0.035} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={size * 0.1} fill="var(--md-on-surface)">
          {label}
        </text>)}
      {Array.from({ length: n }, (_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const x = r + orbit * Math.cos(a);
            const y = r + orbit * Math.sin(a);
            const filled = i < taken;
            return (<g key={i}>
            {filled ? (<circle cx={x} cy={y} r={seat} fill="var(--md-focus)"/>) : (<circle cx={x} cy={y} r={seat - 1} fill="none" stroke="var(--md-outline)" strokeWidth={2}/>)}
            {mine === i && (<circle cx={x} cy={y} r={seat + ringGap * 1.6} fill="none" stroke="var(--md-focus)" strokeWidth={2}/>)}
          </g>);
        })}
    </svg>);
}
