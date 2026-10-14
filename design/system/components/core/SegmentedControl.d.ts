import type { CSSProperties, ReactNode } from 'react';
/**
 * Material 3 segmented control as a single-choice radiogroup (D1). The focus
 * tone sits on violet surfaces (Private | Public in the focus surface); the
 * primary tone is the neutral version (the language toggle is one instance).
 * Segments wrap onto a new line rather than truncate, so German fits.
 */
export interface SegmentOption<T extends string = string> {
    id: T;
    label: ReactNode;
    icon?: ReactNode;
}
export interface SegmentedControlProps<T extends string = string> {
    options: SegmentOption<T>[];
    value: T;
    onChange?: (id: T) => void;
    /** focus = on a violet surface; primary = THD blue on a neutral surface. */
    tone?: 'focus' | 'primary';
    /** Accessible name of the group, e.g. "Who sees this session". */
    label: string;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Core" subtitle="Single-choice segmented radiogroup (focus / primary)" viewport="700x120"
 */
export declare function SegmentedControl<T extends string = string>(props: SegmentedControlProps<T>): JSX.Element;
