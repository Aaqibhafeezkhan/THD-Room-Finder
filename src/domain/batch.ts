import { semesterOf } from './focusHistory';

/**
 * Batch identity (#18, ADR 0001): a programme plus its intake (year and
 * winter/summer). The semester number is worked out from the intake and the
 * current term, so "AIN 7" moves on each term without asking again.
 * Extension semesters (8, 9, …) simply keep counting.
 */
export type Term = 'winter' | 'summer';

export interface Intake {
  year: number;
  term: Term;
}

/** Terms in order: summer Y, then winter Y (which runs into Y+1). */
function termIndex({ year, term }: Intake): number {
  return year * 2 + (term === 'winter' ? 1 : 0);
}

/** The term `now` falls in, named by the year it starts. */
export function currentTerm(now: Date): Intake {
  const sem = semesterOf(now);
  return { year: Number(sem.start.slice(0, 4)), term: sem.term };
}

/** 1 in the intake term; 0 or less if the intake is still to come. */
export function semesterNumber(intake: Intake, now: Date): number {
  return termIndex(currentTerm(now)) - termIndex(intake) + 1;
}

/** "AIN 7"; just the code before the first term starts. */
export function batchLabel(code: string, intake: Intake, now: Date): string {
  const n = semesterNumber(intake, now);
  return n >= 1 ? `${code} ${n}` : code;
}

/**
 * Intakes to offer in setup, newest first: the current term back `count`
 * terms, limited to the terms the programme starts in.
 */
export function recentIntakes(now: Date, terms: Term[], count = 14): Intake[] {
  const out: Intake[] = [];
  let idx = termIndex(currentTerm(now));
  for (let i = 0; i < count; i++, idx--) {
    const intake: Intake = { year: Math.floor(idx / 2), term: idx % 2 === 1 ? 'winter' : 'summer' };
    if (terms.includes(intake.term)) out.push(intake);
  }
  return out;
}
