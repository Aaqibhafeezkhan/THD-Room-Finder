import React from 'react';

export interface RoomCardProps {
  /** Room display name, e.g. "A.011". */
  name: string;
  /** Meta line — identity, not availability, e.g. "Building A · 60 seats". */
  meta: string;
  /**
   * Availability status — drives the color + overline label.
   * free = teal "free", soon = amber "closing", occupied = red "busy".
   */
  status?: 'free' | 'soon' | 'occupied';
  /** The duration hero, e.g. "2h 10m", "all day", "25m", "until 11:30". */
  duration?: string;
  /** @deprecated Legacy availability text; use `duration`. */
  availText?: string;
  /** @deprecated Legacy badge tone; use `status`. */
  badgeTone?: 'free' | 'soon' | 'allday' | 'occupied';
  /** @deprecated Legacy badge text; use `duration`. */
  badgeText?: string;
  href?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * The core list item of the room finder — one room, answer-first: it leads with
 * how long the room stays free (the departure-board duration on the right).
 * @startingPoint section="Room Finder" subtitle="Duration-first free-room list row" viewport="700x110"
 */
export function RoomCard(props: RoomCardProps): JSX.Element;
