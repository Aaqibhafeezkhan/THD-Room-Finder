import type { CSSProperties, ReactNode } from 'react';
/**
 * Shown on room detail right after a session ends (D1): what was added to the
 * focus graph, today's total and the streak, and a way to the graph. Start
 * focus sits under it again.
 */
export interface FocusSummaryProps {
    /** "Session ended" */
    title: string;
    /** The minutes just added, e.g. "1 h 25 min". */
    added: string;
    /** "added to your focus graph" */
    addedLabel: string;
    /** "Today 2 h 10 min · 12-day streak" */
    todayLine: ReactNode;
    /** "View Focus Graph" */
    viewGraphLabel: string;
    onViewGraph?: () => void;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Session ended, added to the graph" viewport="420x200"
 */
export declare function FocusSummary(props: FocusSummaryProps): JSX.Element;
