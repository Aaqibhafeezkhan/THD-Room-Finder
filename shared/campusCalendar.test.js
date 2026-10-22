// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { academicBreak, classroomDay, easterSunday, isStudyRestDate, restDayReason } from './campusCalendar.js';

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
    expect(classroomDay('2026-04-02').access).toBe('unconfirmed');
  });

  it('rests on public holidays and the Christmas shutdown, when the campus is shut', () => {
    for (const day of ['2026-04-03', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25', '2026-06-04', '2026-08-15', '2026-10-03', '2026-11-01', '2026-12-28']) {
      expect(isStudyRestDate(day)).toBe(true);
    }
    expect(restDayReason('2026-04-03')).toBe('holiday'); // Good Friday, inside the Easter break
    expect(restDayReason('2026-05-25')).toBe('holiday'); // Whit Monday, inside the Pentecost break
    expect(restDayReason('2027-01-04')).toBe('christmas');
  });

  it('keeps lecture-free days with open buildings as study days', () => {
    expect(isStudyRestDate('2026-04-02')).toBe(false); // Maundy Thursday, Easter break
    expect(isStudyRestDate('2026-04-07')).toBe(false); // Easter Tuesday
    expect(isStudyRestDate('2026-05-22')).toBe(false); // Friday before Pentecost
    expect(isStudyRestDate('2026-05-26')).toBe(false); // Tuesday after Pentecost
    expect(isStudyRestDate('2026-06-05')).toBe(false); // dated lecture-free day
    expect(isStudyRestDate('2026-11-02')).toBe(false);
    expect(isStudyRestDate('2026-12-22')).toBe(false); // lecture-free before the shutdown
    expect(isStudyRestDate('2026-08-17')).toBe(false); // an ordinary Monday
    expect(restDayReason('2026-04-02')).toBe(null);
  });
});
