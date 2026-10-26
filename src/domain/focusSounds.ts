import { CONFIRM_GRACE_MINUTES, statusAt } from './focusRhythm';
import type { SessionPlan } from './focusRhythm';

/**
 * When a running session makes a sound (ADR 0012): a break starts, a break is
 * over (or "Still focusing?" in the Open rhythm) with one quieter reminder
 * five minutes later, and the plan ends. Nothing plays for a tap the student
 * just made, nor when a session ends unanswered. Like the notification, this
 * only looks ahead to the next answer the session needs.
 */
export type SoundEvent = 'break' | 'back' | 'done';

export interface SoundMoment {
  at: Date;
  event: SoundEvent;
  /** The reminder plays at a lower volume. */
  quiet?: boolean;
}

/** Minutes after "Break's over" that the reminder plays, if still unanswered. */
export const REMINDER_MINUTES = 5;

const MIN = 60_000;

export function soundMoments(plan: SessionPlan, confirmed: number, now: Date): SoundMoment[] {
  const status = statusAt(plan, confirmed, now);
  if (status.kind === 'done') return [];
  const t = now.getTime();
  const out: SoundMoment[] = [];
  const answer = (start: number, end: number) => {
    const deadline = Math.min(start + CONFIRM_GRACE_MINUTES * MIN, end);
    out.push({ at: new Date(start), event: 'back' });
    if (start + REMINDER_MINUTES * MIN < deadline) out.push({ at: new Date(start + REMINDER_MINUTES * MIN), event: 'back', quiet: true });
  };

  if (status.kind === 'confirm') {
    answer(status.phase.start.getTime(), status.phase.end.getTime());
    return out.filter((m) => m.at.getTime() > t);
  }

  const from = plan.phases.indexOf(status.phase);
  for (let i = from; i < plan.phases.length; i++) {
    const p = plan.phases[i];
    if (p.kind === 'break') {
      out.push({ at: p.start, event: 'break' });
    } else if (p.block > confirmed) {
      answer(p.start.getTime(), p.end.getTime());
      return out.filter((m) => m.at.getTime() > t);
    }
  }
  out.push({ at: plan.end, event: 'done' });
  return out.filter((m) => m.at.getTime() > t);
}
