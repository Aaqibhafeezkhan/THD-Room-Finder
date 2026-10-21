import type { CSSProperties, MouseEventHandler } from 'react';
/**
 * The group behind a gathering with its verified shield (M3), top right of
 * the card. A link to the group's page when `onClick` is given. A group that
 * is no longer verified shows without the shield, in grey.
 */
export interface VerifiedTagProps {
    name: string;
    verified?: boolean;
    /** Accessible word for the shield, e.g. "Verified". */
    verifiedLabel: string;
    onClick?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Gatherings" subtitle="The group with its verified shield" viewport="700x60"
 */
export declare function VerifiedTag(props: VerifiedTagProps): JSX.Element;
