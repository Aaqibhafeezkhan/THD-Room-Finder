import type { CSSProperties, ReactNode } from 'react';
/**
 * One focus signal on a room card or building row (D3). At most one per card,
 * on its own line under the meta so German never squeezes the duration.
 *   own     — filled violet, "Your session · 24:10"
 *   batch   — violet container, "AIN 7 · 2 studying"
 *   claimed — dark-purple container, "Focus session · 40 min"
 */
export type FocusBadgeKind = 'own' | 'batch' | 'claimed';
export interface FocusBadgeProps {
    kind: FocusBadgeKind;
    children: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Focus" subtitle="Own / batch / claimed badge on cards" viewport="700x80"
 */
export declare function FocusBadge(props: FocusBadgeProps): JSX.Element;
