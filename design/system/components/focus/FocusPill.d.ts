import type { CSSProperties, MouseEventHandler } from 'react';
/**
 * Your running session, visible from every other screen (D1, D3): trailing in
 * the brand app bar on phones, in the list-pane header on tablet and desktop.
 * Tapping it opens the room. The aria-label is a full sentence, e.g.
 * "Focus session in E 212, 24:10. Open room."
 */
export interface FocusPillProps {
    /** Elapsed time, e.g. "24:10" or "1:05:40". */
    elapsed: string;
    /** Room code, e.g. "E 212". */
    room: string;
    /** Full-sentence accessible name. */
    label: string;
    onOpen?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Running session from any screen" viewport="700x80"
 */
export declare function FocusPill(props: FocusPillProps): JSX.Element;
