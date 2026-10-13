import React from 'react';

export interface BadgeProps {
  /** Semantic tone. free=green, allday=blue, occupied=red, neutral=grey. */
  tone?: 'free' | 'allday' | 'occupied' | 'neutral';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Small status pill for room availability ("Until 14:00", "All day", "Occupied now").
 * @startingPoint section="Core" subtitle="Availability status pills" viewport="700x110"
 */
export function Badge(props: BadgeProps): JSX.Element;
