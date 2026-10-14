import type { CSSProperties, MouseEventHandler } from 'react';
import type { FocusBadgeKind } from '../focus/FocusBadge';
/**
 * Tappable room list row — a Material 3 ElevatedCard, redesigned answer-first.
 * The row leads with the ONE fact a student is after: how long the room stays
 * free. Duration is the departure-board hero on the right (mono, tabular,
 * status-colored); the room code + building/seats sit on the left as identity.
 *
 * Focus layer (D3): a claimed room keeps its real free duration but tints the
 * overline and duration dark purple; one focus badge at most sits on its own
 * line under the meta. A claimed room that is also closing soon passes
 * status "soon" with a claimed badge, so the duration stays amber.
 */
export type RoomCardStatus = 'free' | 'soon' | 'occupied' | 'claimed';
export interface RoomCardFocus {
    kind: FocusBadgeKind;
    /** "AIN 7 · 2 studying", "Focus session · 40 min", "Your session · 24:10". */
    label: string;
}
export interface RoomCardProps {
    /** Room display name / code, e.g. "A008". */
    name: string;
    /** Identity meta, not availability, e.g. "Building A · 45 seats". */
    meta: string;
    /** free (teal) / soon (amber) / claimed (dark purple) / occupied (red). */
    status?: RoomCardStatus;
    /** Override the small status tag (defaults to a word derived from `status`),
     *  e.g. "closed" when the campus is shut, or the German overline. */
    statusLabel?: string;
    /** The duration hero, e.g. "2h 10m", "all day", "25m", "until 11:30". */
    duration?: string;
    /** Optional soft caveat appended to the meta line, e.g. "may be locked". Shown
     *  in amber after another "·" separator, so it reads as a gentle warning. */
    hint?: string;
    /** One focus signal under the meta (D3). */
    focus?: RoomCardFocus;
    /** Full sentence for screen readers, e.g.
     *  "E 212, Building E · 60 seats, free for 6h. AIN 7 · 2 studying." */
    ariaLabel?: string;
    /** Desktop list-detail: outline the open room. */
    selected?: boolean;
    href?: string;
    onClick?: MouseEventHandler;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Room Finder" subtitle="Duration-first free-room list row with focus badge" viewport="700x130"
 */
export declare function RoomCard(props: RoomCardProps): JSX.Element;
