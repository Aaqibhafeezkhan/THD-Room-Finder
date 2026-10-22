import type { CSSProperties } from 'react';
type HallKind = 'focus' | 'games' | 'talk' | 'meeting';
/**
 * A gathering's picture (M3): the room set up for its kind, with the room
 * code where the front is (the stage, the front plate, or a plate above the
 * tables), and one dot per person in the order they replied. Going is
 * violet, maybe light violet, free places a faint outline, so a new
 * gathering reads as a start, not as empty. Dots are people, not seats.
 * Scales to its container; `width` sets the drawing's own grid.
 */
export interface HallProps {
    kind: HallKind;
    /** The room's seats, 13 to 300. */
    capacity: number;
    /** Reply order: 'g' going, 'm' maybe. */
    replies: string;
    /** Room code on the plate; omit on small pictures. */
    code?: string;
    width?: number;
    /** At most this many dots; above it one dot stands for several people. */
    maxDots?: number;
    cancelled?: boolean;
    /** Accessible summary, e.g. "I 112: 21 going, 7 maybe". */
    title: string;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Gatherings" subtitle="The room set up for its kind, people in reply order" viewport="700x320"
 */
export declare function Hall(props: HallProps): JSX.Element;
