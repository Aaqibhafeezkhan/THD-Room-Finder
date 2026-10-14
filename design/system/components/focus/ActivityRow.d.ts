import type { CSSProperties, ReactNode } from 'react';
/**
 * Focus activity in a room, under the status card on room detail (D1):
 *   batch   — violet: your batch is studying here publicly, with Join.
 *   claimed — dark purple: someone else's session. A claim is not a booking.
 *   unknown — neutral: activity could not be loaded (never says "empty").
 * Icon, words and colour always together; announced as a status.
 */
export type ActivityKind = 'batch' | 'claimed' | 'unknown';
export interface ActivityRowProps {
    kind: ActivityKind;
    /** e.g. "AIN 7 · 2 studying", "Focus session · started 25 min ago". */
    title: ReactNode;
    /** Supporting line, e.g. "A claim is not a booking, so you can still focus here." */
    sub?: ReactNode;
    /** Trailing action; the batch row takes a Join button. */
    action?: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Batch / claimed / unknown activity in a room" viewport="700x110"
 */
export declare function ActivityRow(props: ActivityRowProps): JSX.Element;
