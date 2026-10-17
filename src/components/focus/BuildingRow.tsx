import type { CSSProperties, MouseEventHandler } from 'react';
import { FocusBadge } from './FocusBadge';

/**
 * One building in the list beside or under the campus map (D3). It is the
 * accessible equivalent of the map: every ring and dot on the map is a badge
 * here, in words. A button of at least 64 px; tapping it opens the building's
 * rooms. Rows are meant to sit in one surface card, divided by hairlines.
 */
export interface BuildingRowProps {
  /** Short code in the tile, e.g. "E", "ITC". */
  code: string;
  /** "Rohde & Schwarz Forum" */
  name: string;
  /** "4 of 20 rooms free" */
  freeLine: string;
  /** "AIN 7 · 2 studying" */
  batch?: string;
  /** "Your session" */
  own?: string;
  /** "1 focus session" */
  claims?: string;
  /** Full sentence; defaults to the visible text joined with " · ". */
  ariaLabel?: string;
  /** Draw the hairline above (every row but the first). */
  divider?: boolean;
  selected?: boolean;
  onOpen?: MouseEventHandler;
  style?: CSSProperties;
}

export function BuildingRow({
  code,
  name,
  freeLine,
  batch,
  own,
  claims,
  ariaLabel,
  divider = false,
  selected = false,
  onOpen,
  style = {},
}: BuildingRowProps) {
  const label = ariaLabel ?? [name, freeLine, own, batch, claims].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      aria-current={selected ? 'true' : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        padding: '10px 16px',
        border: 'none',
        borderTop: divider ? '1px solid var(--md-outline-variant)' : 'none',
        background: selected ? 'color-mix(in srgb, var(--md-primary) 8%, transparent)' : 'transparent',
        color: 'var(--md-on-surface)',
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
        cursor: 'pointer',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-m)',
          background: 'var(--md-surface-variant)',
          color: 'var(--md-on-surface-variant)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          font: '500 13px var(--font-mono)',
        }}
      >
        {code}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, textWrap: 'pretty' }}>{name}</span>
        <span style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>{freeLine}</span>
        {(batch || own || claims) && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {own && <FocusBadge kind="own">{own}</FocusBadge>}
            {batch && <FocusBadge kind="batch">{batch}</FocusBadge>}
            {claims && <FocusBadge kind="claimed">{claims}</FocusBadge>}
          </span>
        )}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0, color: 'var(--md-on-surface-variant)' }}
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}
