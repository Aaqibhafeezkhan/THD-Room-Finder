import type { CSSProperties } from 'react';
/**
 * A study table seen from above (M2): the room code on a round table, seats
 * evenly around it. Seats fill clockwise from the top; the first is the
 * host's. Taken seats are filled violet, the viewer's seat gets a ring, free
 * seats are outlined. Cancelled tables fade to 38 % with a dashed edge.
 * 1–12 seats; 12 sit a little smaller and closer to the table.
 */
export interface SeatRingProps {
    seats: number;
    /** Seats taken, the host's included. */
    taken: number;
    /** Index of the viewer's seat (0 = host), or null when they have none. */
    mine?: number | null;
    /** Text on the table, usually the room code. Omit on small rings. */
    label?: string;
    size?: number;
    cancelled?: boolean;
    /** Accessible summary, e.g. "3 of 6 seats taken". */
    title: string;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="A round table from above: seats taken, yours, free" viewport="700x220"
 */
export declare function SeatRing(props: SeatRingProps): JSX.Element;
