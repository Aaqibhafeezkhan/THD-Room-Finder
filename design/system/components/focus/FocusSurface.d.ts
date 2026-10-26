import type { CSSProperties, ReactNode } from 'react';
/**
 * The running session on room detail (D1, ADR 0004): a violet focus-container
 * card with the phase ("Focus", "Break", "Break's over") and block count, a
 * countdown to the end of the phase, a track of blocks and breaks, the planned
 * end and why, Private | Public (Private is the default), one plain line on
 * what others see, "Show my name" in Public only, the lock-screen note and
 * End. When a break is over, "Start block 3" leads. Without a study profile
 * the session runs on the device: no visibility control, a line saying the
 * room is not claimed, and Set Up Study Profile.
 * On the Focus tab (ADR 0011) a chip names the place ("At home", "C211"), a
 * plain note replaces the controls, breaks carry a tip, and wide windows get
 * a larger timer. A speaker button turns the session's sounds off and on
 * (ADR 0012): next to the place chip, or at the end of the title row.
 * Focus order: Start block → timer → visibility → name → End.
 */
export type FocusVisibility = 'private' | 'public';
export type FocusPhase = 'focus' | 'break' | 'confirm';
/** One block or break on the track; `progress` 0–1 on the current one. */
export interface FocusTrackSegment {
    kind: 'focus' | 'break';
    minutes: number;
    state: 'done' | 'now' | 'next';
    progress?: number;
}
export interface FocusSurfaceText {
    /** The phase: "Focus", "Break" or "Break's over". */
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
    /** "Keeps running when your phone is locked. After each break, tap to start the next block." */
    lockedNote: string;
    /** "End" */
    end: string;
    /** Signed out: "Only you see this timer; the room doesn't show as claimed. …" */
    signedOut: string;
    /** "Set Up Study Profile" */
    setup: string;
}
export interface FocusSurfaceProps {
    /** The big timer: time left in the phase ("32:10"), or elapsed in Open. */
    elapsed: string;
    /** Full-sentence timer label, e.g. "32 minutes left in block 2". */
    elapsedLabel?: string;
    phase?: FocusPhase;
    /** "Block 2 of 3" */
    phaseLabel?: string;
    /** Blocks and breaks; omitted in the Open rhythm. */
    track?: FocusTrackSegment[];
    /** "Start block 3", shown while the phase is confirm. */
    confirmLabel?: string;
    onConfirm?: () => void;
    /** e.g. "Planned end 12:36 · 3 h max" or "Planned end 15:55 · before the 16:00 lecture". */
    plannedLine: ReactNode;
    visibility: FocusVisibility;
    showName: boolean;
    signedIn: boolean;
    text: FocusSurfaceText;
    onVisibility?: (v: FocusVisibility) => void;
    onShowName?: (on: boolean) => void;
    onEnd?: () => void;
    /** Omit to hide Set Up (no focus service in this build). */
    onSetup?: () => void;
    /** Where the session runs, as a chip at the top; omitted on room detail,
     *  whose page already says it. */
    place?: {
        home: boolean;
        label: string;
    };
    /** Replaces Private/Public and the signed-out note with one line, e.g.
     *  "Only you see this session." at home. */
    note?: ReactNode;
    /** A short suggestion shown during breaks: "Stand up and stretch." */
    tip?: string;
    /** Under the note, e.g. "Open C211". */
    action?: ReactNode;
    /** A larger timer, for wide windows. */
    large?: boolean;
    /** The speaker button: on = sounds play; `label` names it, "Sounds for this session". */
    sound?: {
        on: boolean;
        label: string;
        onToggle?: () => void;
    };
    /** A line under the timer while sounds wait for a tap. */
    soundHint?: string;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="The running session, on room detail and the Focus tab" viewport="420x460"
 */
export declare function FocusSurface(props: FocusSurfaceProps): JSX.Element;
