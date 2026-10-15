import { describe, expect, it } from 'vitest';
import {
  dailyMinutes,
  entryFor,
  exportHistory,
  mergeHistory,
  minutesBetween,
  parseHistoryFile,
  semesterOf,
  streak,
} from './focusHistory';
import type { FocusEntry } from './focusHistory';

const at = (y: number, m: number, d: number, h = 10, min = 0) => new Date(y, m - 1, d, h, min);

function entry(id: string, start: Date, minutes: number, room?: string): FocusEntry {
  return {
    id,
    startedAt: start.toISOString(),
    endedAt: new Date(start.getTime() + minutes * 60000).toISOString(),
    minutes,
    ...(room ? { room } : {}),
  };
}

describe('dailyMinutes', () => {
  it('adds up sessions per local day, oldest first', () => {
    const days = dailyMinutes([
      entry('a', at(2026, 10, 13, 9), 50),
      entry('b', at(2026, 10, 12, 14), 30),
      entry('c', at(2026, 10, 13, 15), 35),
    ]);
    expect(days).toEqual([
      { date: '2026-10-12', minutes: 30 },
      { date: '2026-10-13', minutes: 85 },
    ]);
  });
});

describe('streak', () => {
  const days = [
    { date: '2026-10-10', minutes: 20 },
    { date: '2026-10-11', minutes: 40 },
    { date: '2026-10-12', minutes: 10 },
  ];

  it('counts back from yesterday while today has no focus yet', () => {
    expect(streak(days, at(2026, 10, 13))).toBe(3);
  });

  it('includes today once it has focus', () => {
    expect(streak([...days, { date: '2026-10-13', minutes: 5 }], at(2026, 10, 13))).toBe(4);
  });

  it('is zero after a missed day', () => {
    expect(streak(days, at(2026, 10, 14))).toBe(0);
  });
});

describe('semesterOf', () => {
  it('starts the winter term on 1 October', () => {
    expect(semesterOf(at(2026, 10, 1))).toEqual({ term: 'winter', start: '2026-10-01', end: '2027-03-14' });
    expect(semesterOf(at(2026, 9, 30))).toEqual({ term: 'summer', start: '2026-03-15', end: '2026-09-30' });
  });

  it('keeps January to mid-March in the previous winter term', () => {
    expect(semesterOf(at(2027, 3, 14))).toEqual({ term: 'winter', start: '2026-10-01', end: '2027-03-14' });
    expect(semesterOf(at(2027, 3, 15)).term).toBe('summer');
  });

  it('totals only the days inside the term', () => {
    const days = [
      { date: '2026-09-30', minutes: 60 },
      { date: '2026-10-01', minutes: 25 },
      { date: '2026-10-13', minutes: 85 },
    ];
    const sem = semesterOf(at(2026, 10, 13));
    expect(minutesBetween(days, sem.start, sem.end)).toBe(110);
  });
});

describe('entryFor', () => {
  it('drops sessions under a minute and caps at 3 h', () => {
    expect(entryFor(at(2026, 10, 13, 10, 0), at(2026, 10, 13, 10, 0))).toBeNull();
    expect(entryFor(at(2026, 10, 13, 9), at(2026, 10, 13, 14), 'E 212')?.minutes).toBe(180);
  });
});

describe('export and import', () => {
  const history = [entry('a', at(2026, 10, 12), 30, 'E 212'), entry('b', at(2026, 10, 13), 85)];

  it('round-trips an exported file', () => {
    const text = exportHistory(history, at(2026, 10, 14));
    expect(parseHistoryFile(text)).toEqual(history);
  });

  it('rejects files that are not a focus history', () => {
    expect(() => parseHistoryFile('nope')).toThrow('not-json');
    expect(() => parseHistoryFile('{"entries":[]}')).toThrow('not-history');
  });

  it('skips malformed entries instead of failing the whole file', () => {
    const text = JSON.stringify({
      format: 'thd-room-finder/focus-history',
      version: 1,
      entries: [history[0], { id: 'x', minutes: 9999, startedAt: 'never', endedAt: 'never' }],
    });
    expect(parseHistoryFile(text)).toEqual([history[0]]);
  });

  it('merges without duplicates, so importing twice adds nothing', () => {
    const once = mergeHistory([history[0]], history);
    expect(once.map((e) => e.id)).toEqual(['a', 'b']);
    expect(mergeHistory(once, history)).toEqual(once);
  });
});
