import type { CSSProperties, MouseEventHandler } from 'react';
/**
 * Study together on room detail (T1). While your own focus session runs in
 * the room, a focus-violet shortcut sits at the pill's left end: it turns
 * that session into a study table already in progress (#153), and the label
 * moves right, centred in the space that is left. Two separate buttons, each
 * at least 48 px tall, so neither steals the other's tap.
 */
export interface StudyTogetherButtonProps {
    label: string;
    onClick: MouseEventHandler;
    /** The shortcut, only while a session of yours runs here. */
    convert?: {
        /** Accessible name, e.g. "Invite people to your focus session". */
        label: string;
        onClick: MouseEventHandler;
    };
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="Study together, with the violet shortcut while your session runs" viewport="700x100"
 */
export declare function StudyTogetherButton(props: StudyTogetherButtonProps): JSX.Element;
