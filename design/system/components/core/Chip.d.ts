import React from 'react';

export interface ChipProps {
  /** Selected state — fills with secondary container. */
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Material 3 filter chip. Horizontally scrollable rows of these drive the building filter.
 * @startingPoint section="Core" subtitle="M3 filter chips for building filters" viewport="700x120"
 */
export function Chip(props: ChipProps): JSX.Element;
