/**
 * Focus rhythms (ADR 0004): a session is focus blocks and breaks, all in
 * minutes. `break` 0 is the Open rhythm: a plain stopwatch that asks
 * "Still focusing?" after every `focus` minutes. A long break replaces every
 * `longEvery`-th break when both are set.
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
