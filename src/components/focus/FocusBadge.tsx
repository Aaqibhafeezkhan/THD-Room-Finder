import type { CSSProperties, ReactNode } from 'react';
import { IconGroup, IconPerson, IconTimer } from './focusIcons';

/**
 * One focus signal on a room card or building row (D3). At most one per card,
 * on its own line under the meta so German never squeezes the duration.
 *   own     — filled violet, "Your session · 24:10"
 *   batch   — violet container, "AIN 7 · 2 studying"
 *   claimed — dark-purple container, "Focus session · 40 min"
 */
export type FocusBadgeKind = 'own' | 'batch' | 'claimed';

export interface FocusBadgeProps {
  kind: FocusBadgeKind;
  children: ReactNode;
  style?: CSSProperties;
}

const KIND = {
  own: { bg: 'var(--md-focus)', fg: 'var(--md-on-focus)', Icon: IconTimer },
  batch: { bg: 'var(--md-focus-container)', fg: 'var(--md-on-focus-container)', Icon: IconGroup },
  claimed: { bg: 'var(--md-claimed-container)', fg: 'var(--md-on-claimed-container)', Icon: IconPerson },
} as const;

export function FocusBadge({ kind, children, style = {} }: FocusBadgeProps) {
  const k = KIND[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 24,
        padding: '2px 8px',
        borderRadius: 'var(--radius-s)',
        background: k.bg,
        color: k.fg,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.3,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <k.Icon size={14} />
      {children}
    </span>
  );
}
