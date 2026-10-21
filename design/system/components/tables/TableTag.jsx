// Mirror of src/components/tables/TableTag.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * The one short state on a study table: Soon, Now, Changed, Full, Maybe,
 * Cancelled. focus = violet (soon, now, your table), info = blue (changed,
 * full, maybe), alert = red (cancelled, a lecture appeared).
 */
const TONE = {
    focus: { background: 'var(--md-focus-container)', color: 'var(--md-on-focus-container)' },
    info: { background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' },
    alert: { background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' },
};
export function TableTag({ tone, children, style = {} }) {
    return (<span style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            minHeight: 24,
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
            ...TONE[tone],
            ...style,
        }}>
      {children}
    </span>);
}
