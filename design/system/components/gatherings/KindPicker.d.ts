import type { CSSProperties } from 'react';
type HallKind = 'focus' | 'games' | 'talk' | 'meeting';
/**
 * The four gathering kinds as tiles (G1, New gathering): icon over label,
 * the picked one in the focus container. A radiogroup.
 */
export interface KindPickerProps {
    value: HallKind;
    onChange: (kind: HallKind) => void;
    labels: Record<HallKind, string>;
    label: string;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Gatherings" subtitle="The four kinds as tiles" viewport="420x100"
 */
export declare function KindPicker(props: KindPickerProps): JSX.Element;
