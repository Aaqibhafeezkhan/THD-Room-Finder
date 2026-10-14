import type { CSSProperties, ReactNode } from 'react';

/**
 * Material 3 switch row: label (and optional supporting line) on the left, the
 * track on the right, the whole row is one button with role="switch" (D1, D2,
 * D4). The focus tone sits on violet surfaces ("Show my name"); the primary
 * tone is for settings lists and sheets.
 */
export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  /** Supporting line under the label, e.g. 'Shown as "AIN 7 student"'. */
  sub?: ReactNode;
  tone?: 'focus' | 'primary';
  disabled?: boolean;
  style?: CSSProperties;
}

export function Switch({
  checked,
  onChange,
  label,
  sub,
  tone = 'primary',
  disabled = false,
  style = {},
}: SwitchProps) {
  const focus = tone === 'focus';
  const accent = focus ? 'var(--md-focus)' : 'var(--md-primary)';
  const onAccent = focus ? 'var(--md-on-focus)' : 'var(--md-on-primary)';
  const offInk = focus ? 'var(--md-on-focus-container)' : 'var(--md-outline)';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 44,
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'inherit',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, marginTop: 2, opacity: focus ? 1 : 0.8 }}>{sub}</span>}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 52,
          height: 32,
          flexShrink: 0,
          boxSizing: 'border-box',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          padding: checked ? '0 4px' : '0 6px',
          background: checked ? accent : 'transparent',
          border: checked ? 'none' : `2px solid ${offInk}`,
          transition: 'background var(--duration-medium) var(--ease-standard)',
        }}
      >
        <span
          style={{
            width: checked ? 24 : 16,
            height: checked ? 24 : 16,
            borderRadius: 'var(--radius-full)',
            background: checked ? onAccent : offInk,
          }}
        />
      </span>
    </button>
  );
}
