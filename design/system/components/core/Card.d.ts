import React from 'react';

export interface CardProps {
  /** Lift to elevation 2 + nudge up on hover. */
  interactive?: boolean;
  /** surface = near-white card; sunken = tinted summary surface. */
  tone?: 'surface' | 'sunken';
  /** Render as an anchor (e.g. a tappable room card). */
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Material 3 ElevatedCard — the universal container for content surfaces.
 * @startingPoint section="Core" subtitle="Elevated surface container" viewport="700x180"
 */
export function Card(props: CardProps): JSX.Element;
