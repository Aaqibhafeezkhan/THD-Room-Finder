import type { CSSProperties, ReactNode } from 'react';
/**
 * The one short state on a study table: Soon, Now, Changed, Full, Maybe,
 * Cancelled. focus = violet (soon, now, your table), info = blue (changed,
 * full, maybe), alert = red (cancelled, a lecture appeared).
 */
export type TableTagTone = 'focus' | 'info' | 'alert';
export interface TableTagProps {
    tone: TableTagTone;
    children: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="Soon, Now, Changed, Full, Cancelled" viewport="700x80"
 */
export declare function TableTag(props: TableTagProps): JSX.Element;
