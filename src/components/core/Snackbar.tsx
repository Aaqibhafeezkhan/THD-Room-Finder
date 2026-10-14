import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * M3 snackbar (D4): one line on the inverse surface, no action, polite
 * announcement, focus never moves. Sits above the bottom navigation on phones;
 * pass `bottom` to clear it. Closes itself after `duration` ms.
 */
export interface SnackbarProps {
  /** Nothing renders while empty. */
  message?: ReactNode;
  onClose?: () => void;
  /** Milliseconds before onClose; 0 keeps it open. */
  duration?: number;
  /** Distance from the bottom of the positioned parent, e.g. 96 above a nav bar. */
  bottom?: number;
  style?: CSSProperties;
}

export function Snackbar({ message, onClose, duration = 4000, bottom = 16, style = {} }: SnackbarProps) {
  useEffect(() => {
    if (!message || !duration || !onClose) return;
    const id = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(id);
  }, [message, duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {message && (
        <div
          style={{
            maxWidth: 560,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--md-inverse-surface)',
            color: 'var(--md-inverse-on-surface)',
            boxShadow: 'var(--md-shadow-2)',
            font: '400 14px/1.4 var(--font-sans)',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
