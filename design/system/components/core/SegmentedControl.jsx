// Mirror of src/components/core/SegmentedControl.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * Material 3 segmented control as a single-choice radiogroup (D1). The focus
 * tone sits on violet surfaces (Private | Public in the focus surface); the
 * primary tone is the neutral version (the language toggle is one instance).
 * Segments wrap onto a new line rather than truncate, so German fits.
 */
export function SegmentedControl({ options, value, onChange, tone = 'focus', label, style = {}, }) {
    const focus = tone === 'focus';
    const onKey = (e) => {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step || !onChange)
            return;
        e.preventDefault();
        const i = options.findIndex((o) => o.id === value);
        const next = options[(i + step + options.length) % options.length];
        onChange(next.id);
        const buttons = e.currentTarget.querySelectorAll('[role="radio"]');
        buttons[options.indexOf(next)]?.focus();
    };
    return (<div role="radiogroup" aria-label={label} onKeyDown={onKey} style={{
            display: 'flex',
            flexWrap: 'wrap',
            padding: 4,
            gap: 4,
            borderRadius: 'var(--radius-xl)',
            background: focus
                ? 'color-mix(in srgb, var(--md-on-focus-container) 10%, transparent)'
                : 'var(--md-surface-variant)',
            ...style,
        }}>
      {options.map((o) => {
            const on = o.id === value;
            return (<button key={o.id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => !on && onChange && onChange(o.id)} style={{
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
                }}>
            {o.icon}
            {o.label}
          </button>);
        })}
    </div>);
}
