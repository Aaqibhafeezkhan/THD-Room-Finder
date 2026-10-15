/**
 * Focus rhythms (ADR 0004): a session is focus blocks and breaks laid out
 * from an anchor time, so every phase boundary follows from the anchor and
 * the rhythm alone. All lengths are minutes. `break` 0 is the Open rhythm: a
 * plain stopwatch that asks "Still focusing?" after every `focus` minutes. A
 * long break replaces every `longEvery`-th break when both are set.
 */
export interface Rhythm {
  focus: number;
  break: number;
  longBreak: number;
  longEvery: number;
}

export type PresetId = 'deep' | 'pomodoro' | 'lecture' | 'open';
export type RhythmId = PresetId | 'custom';

export const RHYTHMS: Record<PresetId, Rhythm> = {
  // Two blocks fill one free slot of THD's 90-minute lecture grid.
  deep: { focus: 50, break: 10, longBreak: 0, longEvery: 0 },
  pomodoro: { focus: 25, break: 5, longBreak: 15, longEvery: 4 },
  lecture: { focus: 90, break: 15, longBreak: 0, longEvery: 0 },
  open: { focus: 60, break: 0, longBreak: 0, longEvery: 0 },
};

export const DEFAULT_RHYTHM_ID: PresetId = 'deep';
/** Late answers to "Start block 2" still count from the block's start. */
export const CONFIRM_GRACE_MINUTES = 10;
/** A last block shorter than this is dropped (except the first). */
export const MIN_LAST_BLOCK_MINUTES = 10;
/** Custom rhythm bounds, in steps of 5 minutes. */
export const CUSTOM_FOCUS = { min: 15, max: 120 } as const;
export const CUSTOM_BREAK = { min: 5, max: 30 } as const;

const MIN = 60_000;

export function isOpen(r: Rhythm): boolean {
  return r.break <= 0;
}

export function rhythmId(r: Rhythm): RhythmId {
  const match = (Object.keys(RHYTHMS) as PresetId[]).find((id) => {
    const p = RHYTHMS[id];
    return p.focus === r.focus && p.break === r.break && p.longBreak === r.longBreak && p.longEvery === r.longEvery;
  });
  return match ?? 'custom';
}

/** A custom rhythm inside the allowed bounds, in steps of 5 minutes. */
export function customRhythm(focus: number, brk: number): Rhythm {
  const step = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v / 5) * 5));
  return {
    focus: step(focus, CUSTOM_FOCUS.min, CUSTOM_FOCUS.max),
    break: step(brk, CUSTOM_BREAK.min, CUSTOM_BREAK.max),
    longBreak: 0,
    longEvery: 0,
  };
}

/** A focus block or the break after it. `block` counts from 1 per session. */
export interface Phase {
  kind: 'focus' | 'break';
  block: number;
  start: Date;
  end: Date;
}

export interface SessionPlan {
  phases: Phase[];
  end: Date;
  blocks: number;
}

function breakAfter(r: Rhythm, block: number): number {
  return r.longEvery > 0 && r.longBreak > 0 && block % r.longEvery === 0 ? r.longBreak : r.break;
}

/**
 * The phases of a session that runs from `from` to at most `until`, in a
 * rhythm that started at `anchor` (now, or a batch session's anchor when
 * joining). A session never ends on a break and drops a last block shorter
 * than 10 minutes. Joining during a break starts focus straight away, up to
 * the end of the group's next block. Null when nothing fits.
 */
export function layout(r: Rhythm, anchor: Date, from: Date, until: Date): SessionPlan | null {
  const begin = from.getTime();
  const stop = until.getTime();
  if (stop <= begin || r.focus <= 0) return null;

  const raw: Phase[] = [];
  let t = anchor.getTime();
  for (let block = 1; t < stop && block <= 1000; block++) {
    const focusEnd = t + r.focus * MIN;
    raw.push({ kind: 'focus', block, start: new Date(t), end: new Date(focusEnd) });
    const pause = breakAfter(r, block);
    if (pause > 0) raw.push({ kind: 'break', block, start: new Date(focusEnd), end: new Date(focusEnd + pause * MIN) });
    t = focusEnd + Math.max(0, pause) * MIN;
  }

  let phases = raw
    .filter((p) => p.end.getTime() > begin && p.start.getTime() < stop)
    .map((p) => ({
      ...p,
      start: new Date(Math.max(p.start.getTime(), begin)),
      end: new Date(Math.min(p.end.getTime(), stop)),
    }));

  if (phases[0]?.kind === 'break') {
    const [pause, next] = phases;
    phases = next
      ? [{ ...next, start: pause.start }, ...phases.slice(2)]
      : [{ kind: 'focus', block: pause.block + 1, start: pause.start, end: pause.end }];
  }

  const dropBreaks = () => {
    while (phases.length && phases[phases.length - 1].kind === 'break') phases.pop();
  };
  dropBreaks();
  const last = phases[phases.length - 1];
  const focusCount = phases.filter((p) => p.kind === 'focus').length;
  if (!isOpen(r) && focusCount > 1 && last && last.end.getTime() - last.start.getTime() < MIN_LAST_BLOCK_MINUTES * MIN) {
    phases.pop();
    dropBreaks();
  }
  if (!phases.length) return null;

  const first = phases[0].block;
  phases = phases.map((p) => ({ ...p, block: p.block - first + 1 }));
  return {
    phases,
    end: phases[phases.length - 1].end,
    blocks: phases.filter((p) => p.kind === 'focus').length,
  };
}

export type FocusStatus =
  | { kind: 'focus' | 'break'; phase: Phase; next: Phase | null }
  /** A block began that nobody confirmed yet; it may be until `deadline`. */
  | { kind: 'confirm'; phase: Phase; deadline: Date }
  /** Over: at the planned end, or at the end of the last confirmed block. */
  | { kind: 'done'; at: Date; reason: 'planned' | 'unconfirmed' };

/** Where a session stands at `now`, given the last block confirmed. */
export function statusAt(plan: SessionPlan, confirmed: number, now: Date): FocusStatus {
  const t = now.getTime();
  const pending = plan.phases.find((p) => p.kind === 'focus' && p.block > confirmed);
  if (pending && t >= pending.start.getTime()) {
    const deadline = new Date(Math.min(pending.start.getTime() + CONFIRM_GRACE_MINUTES * MIN, pending.end.getTime()));
    if (t < deadline.getTime()) return { kind: 'confirm', phase: pending, deadline };
    const lastDone = plan.phases.find((p) => p.kind === 'focus' && p.block === confirmed);
    return { kind: 'done', at: lastDone ? lastDone.end : plan.phases[0].start, reason: 'unconfirmed' };
  }
  if (t >= plan.end.getTime()) return { kind: 'done', at: plan.end, reason: 'planned' };
  let i = plan.phases.findIndex((p) => t >= p.start.getTime() && t < p.end.getTime());
  if (i < 0) i = 0;
  const phase = plan.phases[i];
  return { kind: phase.kind, phase, next: plan.phases[i + 1] ?? null };
}

/** Focus time of confirmed blocks up to `until`; breaks never count. */
export function focusedMs(plan: SessionPlan, confirmed: number, until: Date): number {
  const u = until.getTime();
  return plan.phases
    .filter((p) => p.kind === 'focus' && p.block <= confirmed)
    .reduce((sum, p) => sum + Math.max(0, Math.min(p.end.getTime(), u) - p.start.getTime()), 0);
}
