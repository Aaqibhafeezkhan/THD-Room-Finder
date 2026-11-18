import type { CSSProperties, ReactNode } from 'react';

/** Where the logo and wordmark lead, e.g. the about page in the current language. */
export interface BrandTarget {
  href: string;
  /** Accessible name of the link. */
  label: string;
  /** Opens outside the app (the Android app has no about page of its own). */
  external?: boolean;
}

/**
 * Wraps the logo (and wordmark) in a link when the app gives it a target;
 * without one it renders its children as they are.
 */
export function BrandLink({ to, children, style = {} }: { to?: BrandTarget; children: ReactNode; style?: CSSProperties }) {
  if (!to) return <>{children}</>;
  return (
    <a
      href={to.href}
      aria-label={to.label}
      target={to.external ? '_blank' : undefined}
      rel={to.external ? 'noreferrer' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'inherit',
        minWidth: 0,
        color: 'inherit',
        textDecoration: 'none',
        borderRadius: 'var(--radius-s)',
        ...style,
      }}
    >
      {children}
    </a>
  );
}
