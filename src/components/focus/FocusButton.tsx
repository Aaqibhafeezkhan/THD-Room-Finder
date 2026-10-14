import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { Button } from '../core/Button';
import { IconTimer } from './focusIcons';

/**
 * The two focus actions (D1). Start is the filled primary pill, full width on
 * phones, in every startable state; Join is small and violet, inside the batch
 * activity row. During a lecture neither is rendered: hide it, don't disable it.
 */
export interface FocusButtonProps {
  tone: 'start' | 'join';
  children: ReactNode;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  /** Start only: stretch to the container width (phones). */
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function FocusButton({ tone, children, onClick, disabled, fullWidth = false, style = {} }: FocusButtonProps) {
  if (tone === 'join') {
    return (
      <Button
        variant="tonal"
        size="small"
        onClick={onClick}
        disabled={disabled}
        style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', flexShrink: 0, ...style }}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button
      variant="filled"
      size="large"
      icon={<IconTimer size={18} />}
      onClick={onClick}
      disabled={disabled}
      style={{ width: fullWidth ? '100%' : undefined, ...style }}
    >
      {children}
    </Button>
  );
}
