import type { CSSProperties } from 'react';
/**
 * The guest's three replies to a study table (M2). Take a seat is filled
 * violet; Maybe and Can't are text buttons. Seated or maybe: a status line
 * with the other two answers. Full: Take a seat is disabled, Maybe stays.
 * The host never sees this bar.
 */
export type ReplyAnswer = 'seat' | 'maybe' | null;
export interface ReplyBarText {
    seat: string;
    maybe: string;
    cant: string;
    /** "Can't make it" when there is room for the long form. */
    cantLong: string;
    seated: string;
    maybeStatus: string;
    full: string;
}
export interface ReplyBarProps {
    answer: ReplyAnswer;
    full?: boolean;
    busy?: boolean;
    onReply: (answer: 'seat' | 'maybe' | 'no') => void;
    text: ReplyBarText;
    /** Lay the buttons out in one row (wide windows). */
    inline?: boolean;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="Take a seat, Maybe, Can't; seated and full states" viewport="700x200"
 */
export declare function ReplyBar(props: ReplyBarProps): JSX.Element;
