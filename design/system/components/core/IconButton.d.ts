import React from 'react';

export interface IconButtonProps {
  /** Accessible label (also the tooltip). Required. */
  label: string;
  /** standard = neutral; sponsor = pink heart; primary = blue. */
  tone?: 'standard' | 'sponsor' | 'primary';
  href?: string;
  onClick?: () => void;
  /** Inline SVG glyph. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Circular 44px icon button for app-bar actions (back, sponsor heart, overflow).
 * @startingPoint section="Core" subtitle="Circular app-bar icon button" viewport="700x100"
 */
export function IconButton(props: IconButtonProps): JSX.Element;
