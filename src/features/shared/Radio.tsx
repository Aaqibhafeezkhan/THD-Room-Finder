import type { ReactNode } from 'react';

/** A full-width radio row for sheets (setup, rhythm): circle, label, trailing hint. */
export function Radio({ checked, onSelect, children, trailing }: {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 48,
        padding: '8px 4px',
        border: 'none',
        background: 'transparent',
        color: 'var(--md-on-surface)',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--body-large-size)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: '50%',
          border: `2px solid ${checked ? 'var(--md-primary)' : 'var(--md-on-surface-variant)'}`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--md-primary)' }} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {trailing && <span style={{ color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}>{trailing}</span>}
    </button>
  );
}
