// Mirror of src/components/focus/ListNotice.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { IconGroup, IconInfo } from './focusIcons.jsx';

/**
 * One quiet line under the room list header (D3) that explains why the list
 * looks different:
 *   quiet   — "AIN 7 sessions show as claimed (Settings)."
 *   time    — "Schedule only. Focus activity shows for now." (time travel)
 *   unknown — "Focus activity unknown" (never "empty"); announced as status
 */
function CalendarIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4"/>
      <path d="M8 2v4"/>
      <path d="M3 10h18"/>
    </svg>);
}
export function ListNotice({ kind, children, style = {} }) {
    return (<div role={kind === 'unknown' ? 'status' : undefined} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 4px',
            fontSize: 13,
            color: 'var(--md-on-surface-variant)',
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
      {kind === 'quiet' ? <IconGroup size={16}/> : kind === 'time' ? <CalendarIcon /> : <IconInfo size={16}/>}
      <span style={{ textWrap: 'pretty' }}>{children}</span>
    </div>);
}
