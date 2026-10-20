import type { CSSProperties, ReactNode } from 'react';
/**
 * Two rows of chips for setting a table (M2): days, then that day's free
 * slots in one room, cut to the lecture grid. Day chips use the focus
 * container when picked; slot chips use teal (free). A slot shows its start
 * and, small, how long the room stays free. Closed days are shown, not
 * selectable. Days sit in one row that scrolls sideways; slots wrap.
 * `slots = null` shows skeleton chips while the day loads.
 */
export interface SlotDay {
    id: string;
    label: string;
    /** Closed or out of range: shown with its note, not selectable. */
    disabled?: boolean;
    note?: string;
}
export interface SlotOption {
    id: string;
    start: string;
    /** e.g. "1h 30". */
    free: string;
}
export interface SlotChipsProps {
    days: SlotDay[];
    day: string;
    onDay: (id: string) => void;
    slots: SlotOption[] | null;
    slot: string | null;
    onSlot: (id: string) => void;
    /** Shown instead of slot chips when the day has none. */
    empty?: ReactNode;
    daysLabel: string;
    slotsLabel: string;
    style?: CSSProperties;
}
/** The chip look, for other choices in the same sheet (seats). */
export declare const choiceChip: (on: boolean, tone: "focus" | "free", disabled?: boolean) => CSSProperties;
/**
 * @startingPoint section="Study tables" subtitle="Days, then the free slots of one room" viewport="700x160"
 */
export declare function SlotChips(props: SlotChipsProps): JSX.Element;
