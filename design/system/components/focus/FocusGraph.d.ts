import type { CSSProperties, ReactNode } from 'react';
import type { FocusDay } from '../../domain/focusGraph';
export type { FocusDay } from '../../domain/focusGraph';
export interface FocusGraphText {
    days: string[];
    months: string[];
    cellLabel: (date: Date, minutes: number) => string;
    less: string;
    more: string;
    closed: string;
    rest?: string;
    share: string;
    shareLabel?: string;
    tableCaption: string;
    weekOf: string;
    weekLabel: (weekStart: Date) => string;
    keyboardHint?: string;
    loading?: string;
}
export interface FocusGraphProps {
    days: FocusDay[];
    today: string;
    weeks?: number;
    /** Retained for existing design specimens; CSS uses the card's actual width. */
    compact?: boolean;
    stats: ReactNode;
    secondaryStats?: ReactNode;
    status?: ReactNode;
    loading?: boolean;
    label: string;
    text: FocusGraphText;
    onShare?: () => void;
    style?: CSSProperties;
}
/** Quiet year overview: native swiping, direct day selection and one keyboard stop. */
/**
 * @startingPoint section="Focus" subtitle="Contribution graph of daily focus minutes" viewport="900x260"
 */
export declare function FocusGraph(props: FocusGraphProps): JSX.Element;
