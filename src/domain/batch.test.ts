import { describe, expect, it } from 'vitest';
import { batchLabel, currentTerm, recentIntakes, semesterNumber } from './batch';

const on = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

describe('semesterNumber', () => {
  it('makes a winter 2023 intake AIN 7 in winter 2026', () => {
    expect(semesterNumber({ year: 2023, term: 'winter' }, on(2026, 10, 13))).toBe(7);
    expect(batchLabel('AIN', { year: 2023, term: 'winter' }, on(2026, 10, 13))).toBe('AIN 7');
  });

  it('moves on at the winter/summer boundaries', () => {
    const intake = { year: 2025, term: 'winter' as const };
    expect(semesterNumber(intake, on(2025, 10, 1))).toBe(1);
    expect(semesterNumber(intake, on(2026, 3, 14))).toBe(1);
    expect(semesterNumber(intake, on(2026, 3, 15))).toBe(2);
    expect(semesterNumber(intake, on(2026, 9, 30))).toBe(2);
    expect(semesterNumber(intake, on(2026, 10, 1))).toBe(3);
  });

  it('counts summer intakes too', () => {
    expect(semesterNumber({ year: 2026, term: 'summer' }, on(2026, 3, 20))).toBe(1);
    expect(semesterNumber({ year: 2026, term: 'summer' }, on(2026, 10, 20))).toBe(2);
  });

  it('keeps counting into extension semesters', () => {
    expect(semesterNumber({ year: 2022, term: 'winter' }, on(2026, 10, 13))).toBe(9);
  });

  it('shows only the code before the intake term starts', () => {
    expect(batchLabel('KI', { year: 2027, term: 'winter' }, on(2026, 10, 13))).toBe('KI');
  });
});

describe('currentTerm', () => {
  it('names the winter term by the year it starts', () => {
    expect(currentTerm(on(2027, 1, 20))).toEqual({ year: 2026, term: 'winter' });
  });
});

describe('recentIntakes', () => {
  it('lists only the terms a programme starts in, newest first', () => {
    const list = recentIntakes(on(2026, 10, 13), ['winter'], 6);
    expect(list).toEqual([
      { year: 2026, term: 'winter' },
      { year: 2025, term: 'winter' },
      { year: 2024, term: 'winter' },
    ]);
    expect(recentIntakes(on(2026, 10, 13), ['winter', 'summer'], 3)).toEqual([
      { year: 2026, term: 'winter' },
      { year: 2026, term: 'summer' },
      { year: 2025, term: 'winter' },
    ]);
  });
});
