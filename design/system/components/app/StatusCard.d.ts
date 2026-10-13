import React from 'react';

export interface StatusCardProps {
  /** free (green) / soon (amber, closing soon) / occupied (red). */
  status?: 'free' | 'soon' | 'occupied';
  /** e.g. "Free now" / "Closing soon" / "Occupied now". */
  title: string;
  /** e.g. "Free until 14:00" / "Occupied until 11:30". */
  sub?: string;
  /** Optional duration hero, e.g. "2h 10m" / "25m" / "all day". */
  duration?: string;
  style?: React.CSSProperties;
}

/**
 * The headline availability banner at the top of a room detail screen —
 * answer-first, with the duration as the hero.
 * @startingPoint section="Room Finder" subtitle="Room detail status banner" viewport="700x120"
 */
export function StatusCard(props: StatusCardProps): JSX.Element;
