import type { CSSProperties, ReactNode } from 'react';
/**
 * Key for the campus map (D3, option A · ring), bottom-left over the map. The
 * swatches mirror the marks exactly: teal roof = free rooms, violet outline =
 * your batch studying, dark-purple dot = a focus session. With time travel or
 * unknown activity the focus items give way to a single note
 * ("Schedule only", "Focus activity unknown"). Wraps in German.
 */
export interface MapLegendProps {
    /** "Free rooms" */
    free: string;
    /** "AIN 7 studying"; omit together with claim to show `note`. */
    batch?: string;
    /** "Focus session" */
    claim?: string;
    /** "Schedule only" / "Focus activity unknown". */
    note?: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Campus map key: free, batch ring, claim dot" viewport="700x80"
 */
export declare function MapLegend(props: MapLegendProps): JSX.Element;
