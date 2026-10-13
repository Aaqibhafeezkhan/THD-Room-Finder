import React from 'react';

export interface LogoProps {
  /** Pixel size (square). Default 24. */
  size?: number;
  /** Apply a proportional squircle radius. Default true. */
  rounded?: boolean;
  style?: React.CSSProperties;
}

/**
 * The THD Room Finder brand mark (open door, green light = a free room) as inline SVG.
 * @startingPoint section="Brand" subtitle="App icon / brand mark" viewport="700x120"
 */
export function Logo(props: LogoProps): JSX.Element;
