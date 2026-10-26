import { describe, expect, it } from 'vitest';
import {
  dailyMinutes,
  entryFor,
  exportHistory,
  homeMinutes,
  liveEntry,
  mergeHistory,
  minutesBetween,
  parseHistoryFile,
  semesterOf,
  streak,
  withLive,
} from './focusHistory';
import { RHYTHMS, layout } from './focusRhythm';
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
    { date: '2026-10-08', minutes: 20 },
    { date: '2026-10-09', minutes: 40 },
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

  const week = [5, 6, 7, 8, 9].map((d) => ({ date: `2026-10-${String(d).padStart(2, '0')}`, minutes: 25 }));

  it.each([10, 11, 12])('preserves five weekdays through the weekend and Monday morning (%s)', (d) => {
    expect(streak(week, at(2026, 10, d))).toBe(5);
  });

  it('counts a weekend day with focus and passes over the empty one (ADR 0011)', () => {
    const history = [...week, { date: '2026-10-10', minutes: 90 }, { date: '2026-10-12', minutes: 25 }];
    expect(streak(history, at(2026, 10, 12))).toBe(7);
    expect(streak(history, at(2026, 10, 11))).toBe(6);
    expect(minutesBetween(history, '2026-10-05', '2026-10-12')).toBe(240);
  });

  it('counts focus on a Christmas shutdown day', () => {
    const history = [{ date: '2026-12-23', minutes: 25 }, { date: '2026-12-28', minutes: 50 }, { date: '2027-01-07', minutes: 25 }];
    expect(streak(history, at(2027, 1, 7))).toBe(3);
  });

  it('breaks on a missed Friday as soon as the weekend starts', () => {
    expect(streak(week.slice(0, 4), at(2026, 10, 9))).toBe(4);
    expect(streak(week.slice(0, 4), at(2026, 10, 10))).toBe(0);
    expect(streak(week.slice(0, 4), at(2026, 10, 12))).toBe(0);
  });

  it('never creates streak days from empty history; a weekend with focus starts one', () => {
    expect(streak([], at(2026, 10, 11))).toBe(0);
    expect(streak([{ date: '2026-10-10', minutes: 25 }], at(2026, 10, 12))).toBe(1);
    expect(streak([{ date: '2026-10-10', minutes: 25 }], at(2026, 10, 13))).toBe(0);
  });

  it.each([
    ['2026-03-27', '2026-03-30'], // Berlin DST begins
    ['2026-10-23', '2026-10-26'], // Berlin DST ends
    ['2026-12-23', '2027-01-07'], // Christmas shutdown across the year boundary
  ])('crosses the weekend from %s to %s using calendar days', (friday, monday) => {
    const [y, m, d] = monday.split('-').map(Number);
    expect(streak([{ date: friday, minutes: 25 }, { date: monday, minutes: 25 }], at(y, m, d))).toBe(2);
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

describe('homeMinutes', () => {
  it('sums focus at home per day and leaves campus focus out (ADR 0011)', () => {
    const entries = [
      { ...entry('a', at(2026, 10, 10, 9), 50), home: true as const },
      entry('b', at(2026, 10, 10, 14), 25, 'E 212'),
      { ...entry('c', at(2026, 10, 10, 20), 25), home: true as const },
    ];
    expect([...homeMinutes(entries)]).toEqual([['2026-10-10', 75]]);
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

  it('keeps focus at home through export and import (ADR 0011)', () => {
    const home = { ...entry('h', at(2026, 10, 10, 20), 50), home: true as const };
    const text = exportHistory([...history, home], at(2026, 10, 14));
    expect(parseHistoryFile(text)).toEqual([...history, home]);
    const odd = JSON.stringify({ format: 'thd-room-finder/focus-history', version: 1, entries: [{ ...home, home: 'yes' }] });
    expect(parseHistoryFile(odd)).toEqual([]);
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

describe('liveEntry', () => {
  const start = at(2026, 10, 13, 10);
  const end = at(2026, 10, 13, 12);
  const plan = layout(RHYTHMS.deep, start, start, end)!;
  const session = { id: 's1', startedAt: start, plannedEnd: end, confirmed: 1 };

  it('counts whole minutes of focus so far, without the room', () => {
    expect(liveEntry(session, plan, at(2026, 10, 13, 10, 25))).toMatchObject({ id: 's1', minutes: 25 });
    expect(liveEntry(session, plan, at(2026, 10, 13, 10, 25))?.room).toBeUndefined();
  });

  it('is null under a minute and before the start', () => {
    expect(liveEntry(session, plan, new Date(start.getTime() + 59_000))).toBeNull();
    expect(liveEntry(session, plan, at(2026, 10, 13, 9))).toBeNull();
  });

  it('leaves out breaks, unconfirmed blocks, time away and time past the end', () => {
    // 10:50–11:00 is a break; 11:00 starts block 2, not yet confirmed.
    expect(liveEntry(session, plan, at(2026, 10, 13, 11, 5))?.minutes).toBe(50);
    expect(liveEntry({ ...session, confirmed: 2 }, plan, at(2026, 10, 13, 11, 5))?.minutes).toBe(55);
    const away: [number, number][] = [[at(2026, 10, 13, 10, 10).getTime(), at(2026, 10, 13, 10, 20).getTime()]];
    expect(liveEntry({ ...session, away }, plan, at(2026, 10, 13, 10, 30))?.minutes).toBe(20);
    expect(liveEntry({ ...session, confirmed: 2 }, plan, at(2026, 10, 13, 14))?.minutes).toBe(100);
  });
});

describe('withLive', () => {
  const saved = entry('a', at(2026, 10, 13, 8), 30);
  const live = entry('s1', at(2026, 10, 13, 10), 20);

  it('adds the running session to the saved days', () => {
    expect(dailyMinutes(withLive([saved], live))).toEqual([{ date: '2026-10-13', minutes: 50 }]);
  });

  it('counts a session once when its saved entry already arrived', () => {
    const synced = { ...live, minutes: 45 };
    expect(dailyMinutes(withLive([saved, synced], live))).toEqual([{ date: '2026-10-13', minutes: 75 }]);
    expect(withLive([saved], null)).toEqual([saved]);
  });
});
