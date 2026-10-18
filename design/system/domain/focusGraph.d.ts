export interface FocusDay {
    date: string;
    minutes: number;
}
export interface FocusCell extends FocusDay {
    dateValue: Date;
    future: boolean;
    today: boolean;
    closed: boolean;
    rest: boolean;
    level: number;
}
export interface FocusColumn {
    sunday: Date;
    month: number | null;
    cells: FocusCell[];
}
/** Stable Pomodoro thresholds shared by the graph and exported images. */
export declare function focusLevel(minutes: number): 0 | 1 | 2 | 3 | 4;
export declare function parseDay(iso: string): Date;
export declare function dayKey(d: Date): string;
export declare function addDays(d: Date, n: number): Date;
export declare function sundayOf(d: Date): Date;
/** Skip a short leading month so adjacent month labels cannot collide. */
export declare function calendarMonth(first: Date, week: number): number | null;
/** Calendar arithmetic stays on local dates, including daylight-saving changes. */
export declare function focusCalendar(days: FocusDay[], today: string, weeks: number): FocusColumn[];
/** A data grid does not wrap at row/column edges or enter future dates. */
export declare function focusGridMove(index: number, last: number, key: string, control?: boolean): number;
