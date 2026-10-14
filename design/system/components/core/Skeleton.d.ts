import type { CSSProperties } from 'react';
/**
 * Static loading placeholder (D2, D3): flat blocks in surface-variant, no
 * shimmer, so nothing moves for reduced-motion users or anyone else. The
 * wrapper is aria-busy and carries a visually hidden status line such as
 * "Checking rooms…".
 */
export interface SkeletonProps {
    /** Announced once to screen readers, e.g. "Loading E 212…". */
    label: string;
    /** Height of each block in px, top to bottom. */
    blocks?: number[];
    /** Corner radius of the blocks; cards use radius-l. */
    radius?: string;
    gap?: number;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Core" subtitle="Static loading blocks, no shimmer" viewport="700x200"
 */
export declare function Skeleton(props: SkeletonProps): JSX.Element;
