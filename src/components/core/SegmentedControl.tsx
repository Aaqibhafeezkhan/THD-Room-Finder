import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

/**
 * Material 3 segmented control as a single-choice radiogroup (D1). The focus
 * tone sits on violet surfaces (Private | Public in the focus surface); the
 * primary tone is the neutral version (the language toggle is one instance).
 * Segments wrap onto a new line rather than truncate, so German fits.
 */
export interface SegmentOption<T extends string = string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange?: (id: T) => void;
  /** focus = on a violet surface; primary = THD blue on a neutral surface. */
  tone?: 'focus' | 'primary';
  /** Accessible name of the group, e.g. "Who sees this session". */
  label: string;
  style?: CSSProperties;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  tone = 'focus',
  label,
  style = {},
}: SegmentedControlProps<T>) {
  const focus = tone === 'focus';
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step || !onChange) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.id === value);
    const next = options[(i + step + options.length) % options.length];
    onChange(next.id);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[options.indexOf(next)]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        padding: 4,
        gap: 4,
        borderRadius: 'var(--radius-xl)',
        background: focus
          ? 'color-mix(in srgb, var(--md-on-focus-container) 10%, transparent)'
          : 'var(--md-surface-variant)',
        ...style,
      }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => !on && onChange && onChange(o.id)}
            style={{
              flex: '1 1 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 40,
              padding: '8px 14px',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              background: on ? (focus ? 'var(--md-focus)' : 'var(--md-primary)') : 'transparent',
              color: on
                ? focus
                  ? 'var(--md-on-focus)'
                  : 'var(--md-on-primary)'
                : focus
                  ? 'var(--md-on-focus-container)'
                  : 'var(--md-on-surface-variant)',
              font: '500 14px var(--font-sans)',
              cursor: on ? 'default' : 'pointer',
              transition: 'background var(--duration-medium) var(--ease-standard)',
            }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
