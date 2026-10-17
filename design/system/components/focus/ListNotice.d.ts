import type { CSSProperties, ReactNode } from 'react';
/**
 * One quiet line under the room list header (D3) that explains why the list
 * looks different:
 *   quiet   — "AIN 7 sessions show as claimed (Settings)."
 *   time    — "Schedule only. Focus activity shows for now." (time travel)
 *   unknown — "Focus activity unknown" (never "empty"); announced as status
 */
export interface ListNoticeProps {
    kind: 'quiet' | 'time' | 'unknown';
    children: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Quiet / time travel / unknown line over the list" viewport="700x60"
 */
export declare function ListNotice(props: ListNoticeProps): JSX.Element;
