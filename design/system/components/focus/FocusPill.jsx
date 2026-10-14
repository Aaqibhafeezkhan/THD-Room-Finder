// Mirror of src/components/focus/FocusPill.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { IconTimer } from './focusIcons.jsx';

/**
 * Your running session, visible from every other screen (D1, D3): trailing in
 * the brand app bar on phones, in the list-pane header on tablet and desktop.
 * Tapping it opens the room. The aria-label is a full sentence, e.g.
 * "Focus session in E 212, 24:10. Open room."
 */
export function FocusPill({ elapsed, room, label, onOpen, style = {} }) {
    return (<button type="button" aria-label={label} onClick={onOpen} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px 0 10px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            background: 'var(--md-focus)',
            color: 'var(--md-on-focus)',
            font: '500 13px var(--font-sans)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: 'var(--md-shadow-1)',
            ...style,
        }}>
      <IconTimer size={16}/>
      <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>
      <span>{room}</span>
    </button>);
}
