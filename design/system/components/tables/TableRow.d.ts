import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
/**
 * One study table in Your tables (M2): a small seat ring, the topic, one meta
 * line ("Thu 13:15 · C001 · 3 of 6") and at most one TableTag. Rows sit in a
 * list on phones; `card` draws one card each for the grid on wide windows.
 */
export interface TableRowProps {
    ring: ReactNode;
    title: string;
    meta: string;
    /** A second meta line, shown on cards only (e.g. "4 of 6 seats"). */
    detail?: string;
    tag?: ReactNode;
    struck?: boolean;
    card?: boolean;
    onClick?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="One table in Your tables, row or card" viewport="700x200"
 */
export declare function TableRow(props: TableRowProps): JSX.Element;
