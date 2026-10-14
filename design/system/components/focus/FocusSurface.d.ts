import type { CSSProperties, ReactNode } from 'react';
/**
 * The running session on room detail (D1): a violet focus-container card with
 * the timer, the planned end and why, Private | Public (Private is the
 * default), one plain line on what others see, "Show my name" in Public only,
 * the lock-screen note and End. Signed out it is a local timer: no visibility
 * control, a line saying the room is not claimed, and Set Up Study Profile.
 * Focus order: timer → visibility → name → End.
 */
export type FocusVisibility = 'private' | 'public';
export interface FocusSurfaceText {
    /** "Focus session" */
    title: string;
    /** "Private" */
    private: string;
    /** "Public · AIN 7" */
    public: string;
    /** Group name for the segmented control, "Who sees this session". */
    visibility: string;
    /** "Others see that someone is focusing here, not who." */
    explainPrivate: string;
    /** "AIN 7 sees you here and can join. Everyone else sees a focus session." */
    explainPublic: string;
    /** "Show my name" */
    showName: string;
    /** 'Shown as "AIN 7 student"' / "Shown as Lena", matching showName. */
    nameSub: string;
    /** "Keeps running when your phone is locked. We check in about once an hour." */
    lockedNote: string;
    /** "End" */
    end: string;
    /** Signed out: "Only you see this timer; the room doesn't show as claimed. …" */
    signedOut: string;
    /** "Set Up Study Profile" */
    setup: string;
}
export interface FocusSurfaceProps {
    /** Elapsed time, e.g. "24:10". */
    elapsed: string;
    /** Full-sentence timer label, e.g. "24 minutes 10 seconds focused". */
    elapsedLabel?: string;
    /** e.g. "Planned end 12:36 · 3 h max" or "Planned end 15:55 · before the 16:00 lecture". */
    plannedLine: ReactNode;
    visibility: FocusVisibility;
    showName: boolean;
    signedIn: boolean;
    text: FocusSurfaceText;
    onVisibility?: (v: FocusVisibility) => void;
    onShowName?: (on: boolean) => void;
    onEnd?: () => void;
    onSetup?: () => void;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="The running session on room detail" viewport="420x420"
 */
export declare function FocusSurface(props: FocusSurfaceProps): JSX.Element;
