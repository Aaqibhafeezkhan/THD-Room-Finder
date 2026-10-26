import type { CSSProperties, MouseEventHandler } from 'react';
/**
 * Your running session, visible from every other screen (D1, D3): trailing in
 * the brand app bar on phones, in the list-pane header on tablet and desktop.
 * Tapping it opens the room. Filled violet while focusing; tonal with a cup
 * during a break or when the next block is waiting (ADR 0004). At home a
 * house stands in for the room code and the pill opens Focus (ADR 0011).
 * The aria-label is a full sentence, e.g. "Focus in E 212, 32 minutes left.
 * Open room."
 */
export interface FocusPillProps {
    /** Time left in the phase, e.g. "32:10", or elapsed in the Open rhythm. */
    elapsed: string;
    phase?: 'focus' | 'break' | 'confirm';
    /** Room code, e.g. "E 212". */
    room: string;
    /** A session at home: a house instead of the room code. */
    home?: boolean;
    /** Full-sentence accessible name. */
    label: string;
    onOpen?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Running session from any screen" viewport="700x80"
 */
export declare function FocusPill(props: FocusPillProps): JSX.Element;
