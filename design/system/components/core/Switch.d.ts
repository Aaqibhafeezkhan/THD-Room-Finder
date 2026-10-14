import type { CSSProperties, ReactNode } from 'react';
/**
 * Material 3 switch row: label (and optional supporting line) on the left, the
 * track on the right, the whole row is one button with role="switch" (D1, D2,
 * D4). The focus tone sits on violet surfaces ("Show my name"); the primary
 * tone is for settings lists and sheets.
 */
export interface SwitchProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label: ReactNode;
    /** Supporting line under the label, e.g. 'Shown as "AIN 7 student"'. */
    sub?: ReactNode;
    tone?: 'focus' | 'primary';
    disabled?: boolean;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Core" subtitle="M3 switch row with label and supporting line" viewport="700x100"
 */
export declare function Switch(props: SwitchProps): JSX.Element;
