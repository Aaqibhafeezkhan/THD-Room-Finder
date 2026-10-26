import type { CSSProperties, ReactNode } from 'react';
/**
 * The two places on the Focus tab (ADR 0011). `FocusStartCard` starts focus
 * at home: a violet house well, one line on what it means, the Start focus
 * button and one row per choice for this session (rhythm, sounds), each with
 * Change. `OnCampusCard` leads to the room finder: a teal building well and
 * the live state of the campus. Violet stays "your focus", teal "free on
 * campus", so the two places read at a glance without new colours.
 */
export interface FocusStartChoice {
    icon: ReactNode;
    /** "Pomodoro" */
    strong: string;
    /** "25 min focus, 5 min break" */
    rest?: string;
    /** "Change" */
    changeLabel: string;
    onChange?: () => void;
}
export interface FocusStartCardProps {
    /** "At home" */
    title: string;
    /** "Only you see it. It counts in your focus graph." */
    line: string;
    /** "Start focus at home" */
    startLabel: string;
    onStart?: () => void;
    choices?: FocusStartChoice[];
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Focus tab: start at home, and the On campus card" viewport="420x320"
 */
export declare function FocusStartCard(props: FocusStartCardProps): JSX.Element;
export interface OnCampusCardProps {
    /** "On campus" */
    title: string;
    /** "38 rooms free now", "Classroom buildings closed · opens Tue 06:30" */
    line: ReactNode;
    /** "Find a room" */
    actionLabel: string;
    onAction?: () => void;
    style?: CSSProperties;
}
export declare function OnCampusCard({ title, line, actionLabel, onAction, style }: OnCampusCardProps): JSX.Element;
