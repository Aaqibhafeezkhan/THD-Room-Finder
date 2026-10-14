import type { CSSProperties, ReactNode } from 'react';
/**
 * Modal surface (D1 check-in, D2 setup and delete, D4 share): a bottom sheet on
 * compact windows, a centred dialog on medium and expanded ones. Scrim at 32 %
 * black, Escape and the scrim close it, Tab stays inside, and focus moves to
 * the first element marked `data-autofocus` (else the surface itself) and back
 * to whatever was focused before when it closes. No slide under reduced motion.
 */
export interface SheetProps {
    open: boolean;
    onClose?: () => void;
    /** Accessible name; usually the visible title. */
    label: string;
    /** sheet = bottom sheet (compact); dialog = centred (medium and up). */
    variant?: 'sheet' | 'dialog';
    /** alertdialog for destructive confirmations. */
    role?: 'dialog' | 'alertdialog';
    /** Dialog width; the bottom sheet always spans the window. */
    width?: number;
    /** Position inside the nearest positioned parent instead of the viewport
     *  (specimens and device frames). */
    contained?: boolean;
    children?: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Core" subtitle="Bottom sheet on phones, dialog on larger windows" viewport="700x360"
 */
export declare function Sheet(props: SheetProps): JSX.Element | null;
