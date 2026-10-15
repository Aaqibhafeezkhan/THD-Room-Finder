/**
 * Focus session timing (ADR 0002, #19): where a new session should end and
 * how the timer reads. Blocks, breaks and when a session is over live in
 * `focusRhythm.ts` (ADR 0004). Times are local Date objects.
 */

/** Hard cap from ADR 0002: a session never runs longer than 3 hours. */
export const MAX_SESSION_MINUTES = 180;

export type EndReason = 'cap' | 'lecture' | 'closing';

export interface PlannedEnd {
  end: Date;
  minutes: number;
  reason: EndReason;
}

/**
 * Default end: the room's next lecture (or campus closing), capped at 3 h.
 * Null when less than a minute is left, so no session can start.
 */
export function planEnd(now: Date, nextLecture: Date | null, closing: Date | null): PlannedEnd | null {
  let end = new Date(now.getTime() + MAX_SESSION_MINUTES * 60000);
  let reason: EndReason = 'cap';
  if (nextLecture && nextLecture < end) {
    end = nextLecture;
    reason = 'lecture';
  }
  // Availability caps a free window at closing, so a window that ends exactly
  // at closing time ends because of closing, not a lecture.
  if (closing && closing <= end) {
    end = closing;
    reason = 'closing';
  }
  // The server takes whole minutes; the end shown stays the real boundary.
  const minutes = Math.floor((end.getTime() - now.getTime()) / 60000);
  if (minutes < 1) return null;
  return { end, minutes, reason };
}

/** "24:10" under an hour, "1:05:40" from an hour. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
