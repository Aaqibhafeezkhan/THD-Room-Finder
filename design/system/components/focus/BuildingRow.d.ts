import type { CSSProperties, MouseEventHandler } from 'react';
/**
 * One building in the list beside or under the campus map (D3). It is the
 * accessible equivalent of the map: every ring and dot on the map is a badge
 * here, in words. A button of at least 64 px; tapping it opens the building's
 * rooms. Rows are meant to sit in one surface card, divided by hairlines.
 */
export interface BuildingRowProps {
    /** Short code in the tile, e.g. "E", "ITC". */
    code: string;
    /** "Rohde & Schwarz Forum" */
    name: string;
    /** "4 of 20 rooms free" */
    freeLine: string;
    /** "AIN 7 · 2 studying" */
    batch?: string;
    /** "Your session" */
    own?: string;
    /** "1 focus session" */
    claims?: string;
    /** Full sentence; defaults to the visible text joined with " · ". */
    ariaLabel?: string;
    /** Draw the hairline above (every row but the first). */
    divider?: boolean;
    selected?: boolean;
    onOpen?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Building list row, the map in words" viewport="700x100"
 */
export declare function BuildingRow(props: BuildingRowProps): JSX.Element;
