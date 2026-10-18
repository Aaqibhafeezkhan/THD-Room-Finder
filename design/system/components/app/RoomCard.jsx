// Mirror of src/components/app/RoomCard.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { FocusBadge } from '../focus/FocusBadge.jsx';

/**
 * Tappable room list row — a Material 3 ElevatedCard, redesigned answer-first.
 * The row leads with the ONE fact a student is after: how long the room stays
 * free. Duration is the departure-board hero on the right (mono, tabular,
 * status-colored); the room code + building/seats sit on the left as identity.
 *
 * Focus layer (D3): a claimed room keeps its real free duration but tints the
 * overline and duration dark purple; one focus badge at most sits on its own
 * line under the meta. A claimed room that is also closing soon passes
 * status "soon" with a claimed badge, so the duration stays amber.
 */
export function RoomCard({ name, meta, status = 'free', statusLabel, duration = '', hint, focus, ariaLabel, selected = false, href = '#', onClick, style = {}, }) {
    const TONE = {
        free: { fg: 'var(--status-free)', label: 'free' },
        soon: { fg: 'var(--status-soon)', label: 'closing' },
        claimed: { fg: 'var(--status-claimed)', label: 'claimed' },
        occupied: { fg: 'var(--status-occupied)', label: 'busy' },
        unavailable: { fg: 'var(--md-on-surface-variant)', label: 'unavailable' },
    }[status];
    const card = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-l)',
        background: 'var(--md-surface)',
        boxShadow: 'var(--md-shadow-1)',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        outline: selected ? '2px solid var(--md-primary)' : 'none',
        outlineOffset: -2,
        transition: 'box-shadow var(--duration-medium) var(--ease-standard)',
        ...style,
    };
    return (<a href={href} onClick={onClick} aria-label={ariaLabel} aria-current={selected ? 'true' : undefined} style={card} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--md-shadow-2)';
        }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--md-shadow-1)';
        }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
            fontWeight: 500,
            fontSize: '1rem',
            color: 'var(--md-on-surface)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }}>
          {name}
        </div>
        <div style={{
            fontSize: '0.8125rem',
            color: 'var(--md-on-surface-variant)',
            marginTop: '0.15rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }}>
          {meta}
          {hint && <span style={{ color: 'var(--status-soon)' }}> · {hint}</span>}
        </div>
        {focus && (<FocusBadge kind={focus.kind} style={{ marginTop: 6 }}>
            {focus.label}
          </FocusBadge>)}
      </div>
      <div style={{
            flexShrink: 0,
            maxWidth: '55%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.1rem',
            textAlign: 'right',
        }}>
        <div style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: TONE.fg,
            overflowWrap: 'anywhere',
        }}>
          {statusLabel ?? TONE.label}
        </div>
        <div style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '1.125rem',
            fontWeight: 500,
            color: TONE.fg,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
        }}>
          {duration}
        </div>
      </div>
    </a>);
}
