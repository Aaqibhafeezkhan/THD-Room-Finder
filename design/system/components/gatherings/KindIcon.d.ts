import type { CSSProperties } from 'react';
type HallKind = 'focus' | 'games' | 'talk' | 'meeting';
/**
 * One plain mark per gathering kind (M3), on a 24 px grid in currentColor:
 * a round table (Group focus), a long table (Game night), seats facing a
 * stage (Talk), rows facing the front (Meeting). Used in the kind picker and
 * in list rows, where a small hall would be unreadable.
 */
export interface KindIconProps {
    kind: HallKind;
    size?: number;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Gatherings" subtitle="Group focus, Game night, Talk, Meeting marks" viewport="700x80"
 */
export declare function KindIcon(props: KindIconProps): JSX.Element;
