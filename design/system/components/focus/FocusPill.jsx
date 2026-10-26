// Mirror of src/components/focus/FocusPill.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { IconBreak, IconHome, IconTimer } from './focusIcons.jsx';

/**
 * Your running session, visible from every other screen (D1, D3): trailing in
 * the brand app bar on phones, in the list-pane header on tablet and desktop.
 * Tapping it opens the room. Filled violet while focusing; tonal with a cup
 * during a break or when the next block is waiting (ADR 0004). At home a
 * house stands in for the room code and the pill opens Focus (ADR 0011).
 * The aria-label is a full sentence, e.g. "Focus in E 212, 32 minutes left.
 * Open room."
 */
export function FocusPill({ elapsed, phase = 'focus', room, home = false, label, onOpen, style = {} }) {
    const focusing = phase === 'focus';
    return (<button type="button" aria-label={label} onClick={onOpen} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px 0 10px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            background: focusing ? 'var(--md-focus)' : 'var(--md-focus-container)',
            color: focusing ? 'var(--md-on-focus)' : 'var(--md-on-focus-container)',
            font: '500 13px var(--font-sans)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: 'var(--md-shadow-1)',
            ...style,
        }}>
      {focusing ? <IconTimer size={16}/> : <IconBreak size={16}/>}
      <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>
      {home ? <IconHome size={16}/> : <span>{room}</span>}
    </button>);
}
