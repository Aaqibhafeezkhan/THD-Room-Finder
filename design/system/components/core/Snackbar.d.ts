import type { CSSProperties, ReactNode } from 'react';
/**
 * M3 snackbar (D4): one line on the inverse surface, no action, polite
 * announcement, focus never moves. Sits above the bottom navigation on phones;
 * pass `bottom` to clear it. Closes itself after `duration` ms.
 */
export interface SnackbarProps {
    /** Nothing renders while empty. */
    message?: ReactNode;
    onClose?: () => void;
    /** Milliseconds before onClose; 0 keeps it open. */
    duration?: number;
    /** Distance from the bottom of the positioned parent, e.g. 96 above a nav bar. */
    bottom?: number;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Core" subtitle="One-line status on the inverse surface" viewport="700x120"
 */
export declare function Snackbar(props: SnackbarProps): JSX.Element;
