import type { SessionDto } from '../../data/focusApi';
import { layout, statusAt } from '../../domain/focusRhythm';
import { MAX_SESSION_MINUTES } from '../../domain/focusSession';
import type { ActiveSession } from './FocusSessionContext';

/**
 * A running shared session, as another device of the same student sees it
 * (ADR 0005 §2). Times move onto this device's clock; the plan is laid out
 * from the same anchor, so blocks and breaks line up on both devices.
 * Blocks that started before the last renewal count as confirmed; a block
 * that began after it asks "Start block" here too. Null when the session has
 * already run out.
 */
export function adoptSession(dto: SessionDto, now: Date): ActiveSession | null {
  if (dto.endedAt) return null;
  const shift = (d: Date) => new Date(d.getTime() - dto.skewMs);
  const startedAt = shift(dto.startedAt);
  const anchorAt = shift(dto.anchorAt);
  const plannedEnd = shift(dto.plannedEnd);
  if (shift(dto.leaseUntil) <= now || plannedEnd <= now) return null;
  const plan = layout(dto.rhythm, anchorAt, startedAt, plannedEnd);
  if (!plan) return null;
  const renewed = dto.renewedAt ? shift(dto.renewedAt) : startedAt;
  const confirmed = Math.max(1, ...plan.phases.filter((p) => p.kind === 'focus' && p.start <= renewed).map((p) => p.block));
  if (statusAt(plan, confirmed, now).kind === 'done') return null;
  const ident = dto.roomKey.replace(/^thd:/, '');
  const capped = plannedEnd.getTime() - startedAt.getTime() >= (MAX_SESSION_MINUTES - 1) * 60000;
  return {
    roomIdent: ident,
    roomCode: dto.roomCode ?? ident,
    startedAt: startedAt.toISOString(),
    plannedEnd: plannedEnd.toISOString(),
    reason: capped ? 'cap' : 'lecture',
    rhythm: dto.rhythm,
    anchorAt: anchorAt.toISOString(),
    confirmed,
    visibility: dto.visibility,
    showName: dto.showName,
    shared: { id: dto.id, version: dto.version, leaseUntil: shift(dto.leaseUntil).toISOString() },
    adopted: true,
  };
}
