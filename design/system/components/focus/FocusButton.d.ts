import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
/**
 * The two focus actions (D1). Start is the filled primary pill, full width on
 * phones, in every startable state; Join is small and violet, inside the batch
 * activity row. During a lecture neither is rendered: hide it, don't disable it.
 */
export interface FocusButtonProps {
    tone: 'start' | 'join';
    children: ReactNode;
    onClick?: MouseEventHandler;
    disabled?: boolean;
    /** Start only: stretch to the container width (phones). */
    fullWidth?: boolean;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Start focus and Join" viewport="700x100"
 */
export declare function FocusButton(props: FocusButtonProps): JSX.Element;
