import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
/** Circular icon button (app-bar actions, back, sponsor). 44px tap target. */
export interface IconButtonProps {
    label: string;
    tone?: 'standard' | 'sponsor' | 'primary';
    href?: string | null;
    onClick?: MouseEventHandler;
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    [key: string]: unknown;
}
/**
 * @startingPoint section="Core" subtitle="Icon action with a visible keyboard focus ring" viewport="400x100"
 */
export declare function IconButton(props: IconButtonProps): JSX.Element;
