// Mirror of src/components/core/IconButton.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/** Circular icon button (app-bar actions, back, sponsor). 44px tap target. */
export function IconButton({ label, tone = 'standard', href = null, onClick, children, style = {}, className = '', ...rest }) {
    const tones = {
        standard: { color: 'var(--md-on-surface)' },
        sponsor: { color: 'var(--sponsor)' },
        primary: { color: 'var(--md-primary)' },
    }[tone];
    const hoverBg = {
        standard: 'color-mix(in srgb, var(--md-on-surface) 8%, transparent)',
        sponsor: 'var(--sponsor-container)',
        primary: 'var(--md-primary-container)',
    }[tone];
    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'var(--tap-target)',
        height: 'var(--tap-target)',
        border: 'none',
        background: 'transparent',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'background var(--duration-fast) var(--ease-standard)',
        ...tones,
        ...style,
    };
    const Tag = href ? 'a' : 'button';
    return (<Tag className={`thd-icon-button ${className}`.trim()} href={href || undefined} onClick={onClick} aria-label={label} title={label} style={base} onMouseEnter={(e) => {
            e.currentTarget.style.background = hoverBg;
        }} onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
        }} {...rest}>
      {children}
    </Tag>);
}
