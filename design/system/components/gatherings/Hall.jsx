// Mirror of src/components/gatherings/Hall.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { hallLayout } from './hall.js';

/**
 * A gathering's picture (M3): the room set up for its kind, with the room
 * code where the front is (the stage, the front plate, or a plate above the
 * tables), and one dot per person in the order they replied. Going is
 * violet, maybe light violet, free places a faint outline, so a new
 * gathering reads as a start, not as empty. Dots are people, not seats.
 * Scales to its container; `width` sets the drawing's own grid.
 */
export function Hall({ kind, capacity, replies, code, width = 320, maxDots = 120, cancelled = false, title, style = {} }) {
    const h = hallLayout(kind, capacity, replies, { width, maxDots });
    return (<svg viewBox={`0 0 ${h.width} ${h.height}`} role="img" aria-label={title} style={{ display: 'block', width: '100%', maxWidth: h.width, height: 'auto', opacity: cancelled ? 0.38 : 1, ...style }}>
      {h.tables.map((t, i) => t.shape === 'circle' ? (<circle key={i} cx={t.cx} cy={t.cy} r={t.r} fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" strokeWidth={1.5}/>) : (<rect key={i} x={t.x} y={t.y} width={t.w} height={t.h} rx={t.h * 0.25} fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" strokeWidth={1.5}/>))}
      <rect x={h.plate.cx - h.plate.w / 2} y={h.plate.cy - h.plate.h / 2} width={h.plate.w} height={h.plate.h} rx={h.plate.h * 0.3} fill="var(--md-surface-variant)" stroke="var(--md-outline-variant)" strokeWidth={1.5} strokeDasharray={cancelled ? '6 5' : undefined}/>
      {code && (<text x={h.plate.cx} y={h.plate.cy + h.plate.h * 0.2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={h.plate.h * 0.55} fill="var(--md-on-surface)">
          {code}
        </text>)}
      {h.points.map(([x, y], i) => h.marks[i] === 'g' ? (<circle key={i} cx={x} cy={y} r={h.dot} fill="var(--md-focus)"/>) : h.marks[i] === 'm' ? (<circle key={i} cx={x} cy={y} r={h.dot} fill="var(--md-focus-container)" stroke="var(--md-focus)" strokeWidth={1.25}/>) : (<circle key={i} cx={x} cy={y} r={h.dot - 0.75} fill="none" stroke="var(--md-outline-variant)" strokeWidth={1.25}/>))}
    </svg>);
}
