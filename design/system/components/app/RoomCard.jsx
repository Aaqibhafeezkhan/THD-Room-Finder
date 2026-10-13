import React from 'react';

/**
 * Tappable room list row — a Material 3 ElevatedCard, redesigned answer-first.
 * The row leads with the ONE fact a student is after: how long the room stays
 * free. Duration is the departure-board hero on the right (mono, tabular,
 * status-colored); the room code + building/seats sit on the left as identity.
 *
 * Status drives the color + the small overline label:
 *   free    → teal   "free"      (e.g. "2h 10m", "all day")
 *   soon    → amber  "closing"   (free, but < ~40 min left)
 *   occupied→ red    "busy"      (e.g. "until 11:30")
 *
 * Legacy props (availText / badgeTone / badgeText) are still accepted and
 * mapped onto the new model so older screens keep rendering.
 */
export function RoomCard({
  name, meta,
  status, duration,
  availText, badgeTone, badgeText, // legacy — mapped below
  href = '#', onClick, style = {},
}) {
  // Back-compat: derive the new model from legacy props when needed.
  const st = status
    || (badgeTone === 'allday' ? 'free'
      : badgeTone === 'occupied' ? 'occupied'
      : badgeTone === 'soon' ? 'soon' : 'free');
  const dur = duration != null ? duration : (badgeText || availText || '');

  const TONE = {
    free:     { fg: 'var(--status-free)',     label: 'free' },
    soon:     { fg: 'var(--status-soon)',     label: 'closing' },
    occupied: { fg: 'var(--status-occupied)', label: 'busy' },
  }[st] || { fg: 'var(--status-free)', label: 'free' };

  const card = {
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem',
    borderRadius: 'var(--radius-l)', background: 'var(--md-surface)',
    boxShadow: 'var(--md-shadow-1)', textDecoration: 'none', color: 'inherit',
    cursor: 'pointer', transition: 'box-shadow var(--duration-medium) var(--ease-standard)', ...style,
  };
  return (
    <a href={href} onClick={onClick} style={card}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--md-shadow-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--md-shadow-1)'; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--md-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem', textAlign: 'right' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: TONE.fg }}>{TONE.label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.125rem', fontWeight: 500, color: TONE.fg, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{dur}</div>
      </div>
    </a>
  );
}
