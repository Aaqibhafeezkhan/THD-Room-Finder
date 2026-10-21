import type { CSSProperties, ReactNode } from 'react';
/**
 * The 15-minute reminder for a study table (M2): a floating violet container
 * above the bottom bar on phones, at the bottom left of the content on wide
 * windows (never under the rail or drawer). Open goes to the table; the
 * cross dismisses it for this session.
 */
export interface TableBannerProps {
    children: ReactNode;
    openLabel: string;
    dismissLabel: string;
    onOpen: () => void;
    onDismiss: () => void;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="15-minute reminder above the nav" viewport="700x90"
 */
export declare function TableBanner(props: TableBannerProps): JSX.Element;
