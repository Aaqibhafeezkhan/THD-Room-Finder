// Mirror of src/components/gatherings/KindIcon.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * One plain mark per gathering kind (M3), on a 24 px grid in currentColor:
 * a round table (Group focus), a long table (Game night), seats facing a
 * stage (Talk), rows facing the front (Meeting). Used in the kind picker and
 * in list rows, where a small hall would be unreadable.
 */
const ROUND = [[12, 3.5], [19.4, 7.8], [19.4, 16.2], [12, 20.5], [4.6, 16.2], [4.6, 7.8]];
const ARC = [[4, 15], [6.3, 9.3], [12, 7], [17.7, 9.3], [20, 15]];
export function KindIcon({ kind, size = 24, style = {} }) {
    return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'block', flexShrink: 0, ...style }}>
      {kind === 'focus' && (<>
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          {ROUND.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8"/>)}
        </>)}
      {kind === 'games' && (<>
          <rect x="3" y="9.5" width="18" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          {[6, 12, 18].map((x) => <circle key={`t${x}`} cx={x} cy="5.5" r="1.8"/>)}
          {[6, 12, 18].map((x) => <circle key={`b${x}`} cx={x} cy="18.5" r="1.8"/>)}
        </>)}
      {kind === 'talk' && (<>
          <rect x="8" y="17" width="8" height="4" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          {ARC.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7"/>)}
        </>)}
      {kind === 'meeting' && (<>
          <rect x="6" y="2.5" width="12" height="3.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          {[5, 10, 14, 19].map((x) => <circle key={`a${x}`} cx={x} cy="11" r="1.7"/>)}
          {[5, 10, 14, 19].map((x) => <circle key={`b${x}`} cx={x} cy="17.5" r="1.7"/>)}
        </>)}
    </svg>);
}
