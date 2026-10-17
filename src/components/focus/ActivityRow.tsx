import type { CSSProperties, ReactNode } from 'react';
import { IconGroup, IconOffline, IconPerson } from './focusIcons';

/**
 * Focus activity in a room, under the status card on room detail (D1):
 *   batch   — violet: your batch is studying here publicly, with Join.
 *   claimed — dark purple: someone else's session. A claim is not a booking.
 *   unknown — neutral: activity could not be loaded (never says "empty").
 * Icon, words and colour always together; announced as a status.
 */
export type ActivityKind = 'batch' | 'claimed' | 'unknown';

export interface ActivityRowProps {
  kind: ActivityKind;
  /** e.g. "AIN 7 · 2 studying", "Focus session · started 25 min ago". */
  title: ReactNode;
  /** Supporting line, e.g. "A claim is not a booking, so you can still focus here." */
  sub?: ReactNode;
  /** Trailing action; the batch row takes a Join button. */
  action?: ReactNode;
  style?: CSSProperties;
}

const KIND = {
  batch: {
    bg: 'var(--md-focus-container)',
    fg: 'var(--md-on-focus-container)',
    dotBg: 'var(--md-focus)',
    dotFg: 'var(--md-on-focus)',
    sub: 'inherit',
    Icon: IconGroup,
  },
  claimed: {
    bg: 'var(--md-claimed-container)',
    fg: 'var(--md-on-claimed-container)',
    dotBg: 'var(--md-claimed)',
    dotFg: 'var(--md-on-claimed)',
    sub: 'inherit',
    Icon: IconPerson,
  },
  unknown: {
    bg: 'var(--md-surface-variant)',
    fg: 'var(--md-on-surface)',
    dotBg: 'var(--md-surface)',
    dotFg: 'var(--md-on-surface-variant)',
    sub: 'var(--md-on-surface-variant)',
    Icon: IconOffline,
  },
} as const;

export function ActivityRow({ kind, title, sub, action, style = {} }: ActivityRowProps) {
  const k = KIND[kind];
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: action ? '12px 12px 12px 14px' : '12px 14px',
        borderRadius: 'var(--radius-l)',
        background: k.bg,
        color: k.fg,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-full)',
          background: k.dotBg,
          color: k.dotFg,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <k.Icon size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.4, color: k.sub, textWrap: 'pretty' }}>{sub}</div>
        )}
      </div>
      {action}
    </div>
  );
}
