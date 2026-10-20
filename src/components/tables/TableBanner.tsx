import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../core/Button';

/**
 * The 15-minute reminder for a study table (M2): a floating violet container
 * above the bottom bar on phones, at the bottom left of the content on wide
 * windows (never under the rail or drawer). Open goes to the table; the
 * cross dismisses it for this session.
 */
export interface TableBannerProps {
  children: ReactNode;
  openLabel: string;
  dismissLabel: string;
  onOpen: () => void;
  onDismiss: () => void;
  style?: CSSProperties;
}

export function TableBanner({ children, openLabel, dismissLabel, onOpen, onDismiss, style = {} }: TableBannerProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 4px 6px 16px',
        borderRadius: 'var(--radius-l)',
        background: 'var(--md-focus-container)',
        color: 'var(--md-on-focus-container)',
        boxShadow: 'var(--md-shadow-2)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--body-medium-size)',
        ...style,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      <Button variant="text" onClick={onOpen} style={{ color: 'var(--md-focus)' }}>
        {openLabel}
      </Button>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
        style={{
          width: 'var(--tap-target)',
          height: 'var(--tap-target)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
