import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

/**
 * One study table in Your tables (M2): a small seat ring, the topic, one meta
 * line ("Thu 13:15 · C001 · 3 of 6") and at most one TableTag. Rows sit in a
 * list on phones; `card` draws one card each for the grid on wide windows.
 */
export interface TableRowProps {
  ring: ReactNode;
  title: string;
  meta: string;
  /** A second meta line, shown on cards only (e.g. "4 of 6 seats"). */
  detail?: string;
  tag?: ReactNode;
  struck?: boolean;
  card?: boolean;
  onClick?: MouseEventHandler;
  style?: CSSProperties;
}

export function TableRow({ ring, title, meta, detail, tag, struck = false, card = false, onClick, style = {} }: TableRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: card ? 14 : 12,
        width: '100%',
        minHeight: 64,
        padding: card ? 16 : '12px 16px',
        border: 'none',
        borderRadius: card ? 'var(--radius-l)' : 0,
        background: 'var(--md-surface)',
        boxShadow: card ? 'var(--md-shadow-1)' : 'none',
        color: 'var(--md-on-surface)',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {ring}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 'var(--body-large-size)',
            fontWeight: 500,
            textDecoration: struck ? 'line-through' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>{meta}</span>
        {card && detail && <span style={{ fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>{detail}</span>}
      </span>
      {tag && <span style={{ alignSelf: 'flex-start', flexShrink: 0 }}>{tag}</span>}
    </button>
  );
}
