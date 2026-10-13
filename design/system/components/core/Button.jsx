import React from 'react';

/**
 * Material 3 button — filled (primary), tonal (secondary container),
 * text (low emphasis), and outlined. Pill-shaped (radius xl).
 */
export function Button({
  variant = 'filled',
  size = 'medium',
  icon = null,
  disabled = false,
  href = null,
  onClick,
  children,
  style = {},
  ...rest
}) {
  const pads = {
    small:  { padding: '0.4rem 1rem',    fontSize: '0.8125rem' },
    medium: { padding: '0.625rem 1.5rem', fontSize: '0.875rem' },
    large:  { padding: '0.8rem 1.75rem',  fontSize: '0.9375rem' },
  }[size];

  const variants = {
    filled: {
      background: 'var(--md-primary)',
      color: 'var(--md-on-primary)',
      border: 'none',
    },
    tonal: {
      background: 'var(--md-secondary-container)',
      color: 'var(--md-on-secondary-container)',
      border: 'none',
    },
    text: {
      background: 'transparent',
      color: 'var(--md-primary)',
      border: 'none',
    },
    outlined: {
      background: 'transparent',
      color: 'var(--md-primary)',
      border: '1px solid var(--md-outline)',
    },
  }[variant];

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    letterSpacing: 0,
    borderRadius: 'var(--radius-xl)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    opacity: disabled ? 0.38 : 1,
    minHeight: 'var(--tap-target)',
    transition: 'box-shadow var(--duration-medium) var(--ease-standard), background var(--duration-fast) var(--ease-standard)',
    ...pads,
    ...variants,
    ...style,
  };

  const onEnter = (e) => { if (!disabled && (variant === 'filled' || variant === 'tonal')) e.currentTarget.style.boxShadow = 'var(--md-shadow-1)'; };
  const onLeave = (e) => { e.currentTarget.style.boxShadow = 'none'; };

  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href || undefined}
      onClick={disabled ? undefined : onClick}
      disabled={!href ? disabled : undefined}
      style={base}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      {...rest}
    >
      {icon}
      {children}
    </Tag>
  );
}
