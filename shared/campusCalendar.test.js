// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { academicBreak, classroomDay, easterSunday, isStudyRestDate } from './campusCalendar.js';

describe('source-backed classroom calendar', () => {
  it.each([[2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16']])('moves Easter correctly in %s', (year, expected) => {
    expect(easterSunday(year).toISOString().slice(0, 10)).toBe(expected);
  });
  it.each(['2026-04-02', '2026-04-07', '2027-03-25', '2027-03-30'])('annotates the lecture-free Easter period without inventing a locked door (%s)', iso => {
    expect(academicBreak(iso)).toBe('easter');
    expect(classroomDay(iso)).toEqual({ access: 'unconfirmed', reason: 'easter' });
  });
  it('tracks Whitsun, presidential days and holidays without extending them to another year', () => {
    expect(academicBreak('2026-05-22')).toBe('pentecost');
    expect(academicBreak('2026-05-26')).toBe('pentecost');
    expect(academicBreak('2026-11-02')).toBe('lecture-free');
    expect(academicBreak('2028-11-02')).toBe(null);
    expect(classroomDay('2026-05-01').access).toBe('unconfirmed');
    expect(classroomDay('2025-08-15').access).toBe('unconfirmed');
    expect(academicBreak('2024-12-23')).toBe('lecture-free');
    expect(academicBreak('2028-01-07')).toBe('lecture-free');
    expect(classroomDay('2028-01-07').access).toBe('unconfirmed');
  });
  it('keeps normal study weekdays open to the default policy in both exam and semester-break periods', () => {
    expect(classroomDay('2026-07-14').access).toBe('scheduled');
    expect(classroomDay('2026-08-12').access).toBe('scheduled');
  });
  it('keeps product rest days distinct from unconfirmed physical access', () => {
    expect(classroomDay('2026-07-04')).toEqual({ access: 'unconfirmed', reason: 'weekend' });
    expect(isStudyRestDate('2026-07-04')).toBe(true);
    expect(isStudyRestDate('2026-12-29')).toBe(true);
    expect(isStudyRestDate('2026-04-02')).toBe(false);
  });
});
