import type { CSSProperties } from 'react';
/**
 * The one-line top of Profile (D2): avatar initial, name and the violet batch
 * chip, then the gear. Signed out it reads "Not signed in" with Set Up Study
 * Profile; the gear stays so theme and language are always reachable.
 * Focus order: name → batch chip → Set Up → gear.
 */
export interface ProfileHeaderProps {
    signedIn: boolean;
    /** Display name, or the programme when none is set. */
    name?: string;
    /** "AIN 7" */
    batch?: string;
    /** "Batch AIN 7" */
    batchLabel?: string;
    /** "Not signed in" */
    notSignedIn: string;
    /** "Set Up Study Profile" */
    setupLabel: string;
    /** "Settings" */
    settingsLabel: string;
    /** Omit when study profiles aren't available; Set Up is then hidden. */
    onSetup?: () => void;
    onSettings?: () => void;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="One-line Profile header with batch chip" viewport="700x80"
 */
export declare function ProfileHeader(props: ProfileHeaderProps): JSX.Element;
