import React from 'react';

export interface ButtonProps {
  /** Visual emphasis. filled = primary action, tonal = secondary, text/outlined = low emphasis. */
  variant?: 'filled' | 'tonal' | 'text' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  /** Optional leading icon node (an inline SVG). */
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Render as an anchor when provided. */
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Material 3 pill button used across THD Room Finder for all actions.
 * @startingPoint section="Core" subtitle="M3 filled / tonal / text / outlined buttons" viewport="700x160"
 */
export function Button(props: ButtonProps): JSX.Element;
