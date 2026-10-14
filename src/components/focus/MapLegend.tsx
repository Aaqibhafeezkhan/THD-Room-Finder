import type { CSSProperties, ReactNode } from 'react';
import { IconInfo } from './focusIcons';

/**
 * Key for the campus map (D3, option A · ring), bottom-left over the map. The
 * swatches mirror the marks exactly: teal roof = free rooms, violet outline =
 * your batch studying, dark-purple dot = a focus session. With time travel or
 * unknown activity the focus items give way to a single note
 * ("Schedule only", "Focus activity unknown"). Wraps in German.
 */
export interface MapLegendProps {
  /** "Free rooms" */
  free: string;
  /** "AIN 7 studying"; omit together with claim to show `note`. */
  batch?: string;
  /** "Focus session" */
  claim?: string;
  /** "Schedule only" / "Focus activity unknown". */
  note?: ReactNode;
  style?: CSSProperties;
}

const swatch: CSSProperties = { width: 16, height: 12, borderRadius: 3, flexShrink: 0 };
const item: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 };

export function MapLegend({ free, batch, claim, note, style = {} }: MapLegendProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px 14px',
        maxWidth: 'calc(100% - 24px)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-m)',
        background: 'var(--md-surface)',
        color: 'var(--md-on-surface)',
        boxShadow: 'var(--md-shadow-1)',
        fontSize: 12,
        lineHeight: 1.3,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <span style={item}>
        <i
          aria-hidden="true"
          style={{ ...swatch, background: 'var(--md-tertiary-container)', boxShadow: 'inset 0 0 0 1.5px var(--md-tertiary)' }}
        />
        {free}
      </span>
      {batch && (
        <span style={item}>
          <i
            aria-hidden="true"
            style={{ ...swatch, background: 'var(--md-tertiary-container)', boxShadow: 'inset 0 0 0 2.5px var(--md-focus)' }}
          />
          {batch}
        </span>
      )}
      {claim && (
        <span style={item}>
          <i
            aria-hidden="true"
            style={{ width: 12, height: 12, borderRadius: 'var(--radius-full)', flexShrink: 0, background: 'var(--md-claimed)' }}
          />
          {claim}
        </span>
      )}
      {note && (
        <span style={{ ...item, color: 'var(--md-on-surface-variant)' }}>
          <IconInfo size={14} />
          {note}
        </span>
      )}
    </div>
  );
}
