import { describe, expect, it } from 'vitest';
import type { ScheduledEvent } from './models';
import {
  tableFromSession,
  dayName,
  freeSlots,
  fromCampusWallClock,
  normalizeTableLink,
  slotLength,
  tableDays,
  tableState,
} from './tables';
import { toCampusWallClock } from './time';

const event = (start: string, end: string, roomIdent = 'r1'): ScheduledEvent =>
  ({ roomIdent, startDateTime: new Date(start), endDateTime: new Date(end) }) as ScheduledEvent;

const thursday = { id: '2026-10-22', date: new Date(2026, 9, 22), offset: 2, open: new Date(2026, 9, 22, 7), close: new Date(2026, 9, 22, 20) };
const early = new Date(2026, 9, 20, 9);

describe('freeSlots', () => {
  it('offers the lecture grid starts while the room is free, up to 3 hours', () => {
    const slots = freeSlots(thursday, [], early);
    expect(slots.map((s) => s.id)).toEqual(['08:00', '09:45', '11:30', '13:15', '15:00', '16:45', '18:30']);
    expect(slots[0].minutes).toBe(180);
    expect(slots[slots.length - 1].minutes).toBe(90); // 18:30 until closing at 20:00
  });

  it('skips starts during a lecture and ends a slot at the next one', () => {
    const slots = freeSlots(thursday, [event('2026-10-22T09:45', '2026-10-22T11:15'), event('2026-10-22T14:00', '2026-10-22T15:30')], early);
    expect(slots.map((s) => s.id)).not.toContain('09:45');
    const s1315 = slots.find((s) => s.id === '13:15')!;
    expect(s1315.minutes).toBe(45);
    expect(slots.find((s) => s.id === '08:00')!.minutes).toBe(105);
  });

  it('drops slots shorter than 25 minutes and slots already past', () => {
    const now = new Date(2026, 9, 22, 12);
    const slots = freeSlots(thursday, [event('2026-10-22T13:30', '2026-10-22T15:00')], now);
    expect(slots.map((s) => s.id)).toEqual(['15:00', '16:45', '18:30']);
  });

  it('has nothing on a closed day', () => {
    expect(freeSlots({ ...thursday, open: null, close: null }, [], early)).toEqual([]);
  });
});

describe('tableDays', () => {
  it('runs from today to 14 days ahead with each day’s hours', () => {
    const days = tableDays(new Date(2026, 9, 20, 15), (d) => (d.getDay() % 6 === 0 ? { open: null, close: null } : { open: new Date(d), close: new Date(d) }));
    expect(days).toHaveLength(15);
    expect(days[0].id).toBe('2026-10-20');
    expect(days.find((d) => d.id === '2026-10-24')!.open).toBeNull(); // Saturday
  });
});

describe('tableState', () => {
  const t = { startsAt: new Date('2026-10-22T11:15:00Z'), endsAt: new Date('2026-10-22T12:45:00Z'), cancelled: false };
  it('is soon from 15 minutes before, live during, ended after', () => {
    expect(tableState(t, new Date('2026-10-22T10:59:00Z'))).toBe('upcoming');
    expect(tableState(t, new Date('2026-10-22T11:01:00Z'))).toBe('soon');
    expect(tableState(t, new Date('2026-10-22T12:00:00Z'))).toBe('live');
    expect(tableState(t, new Date('2026-10-22T12:45:00Z'))).toBe('ended');
    expect(tableState({ ...t, cancelled: true }, new Date('2026-10-22T12:00:00Z'))).toBe('cancelled');
  });
});

describe('links and words', () => {
  it('accepts a word link however it is typed', () => {
    expect(normalizeTableLink(' Mossy-Lagoon-42 ')).toBe('mossy-lagoon-42');
    expect(normalizeTableLink('mossy-lagoon-4')).toBeNull();
    expect(normalizeTableLink('AbCdEf1234')).toBeNull();
  });

  it('writes slot lengths short', () => {
    expect(slotLength(180)).toBe('3 h');
    expect(slotLength(90)).toBe('1h 30');
    expect(slotLength(45)).toBe('45 min');
  });

  it('names today and tomorrow, then weekdays', () => {
    const now = new Date(2026, 9, 20, 9);
    expect(dayName(new Date(2026, 9, 20, 13), 'en', now)).toBe('Today');
    expect(dayName(new Date(2026, 9, 21), 'de', now)).toBe('Morgen');
    expect(dayName(new Date(2026, 9, 22), 'en', now)).toBe('Thu');
  });

  it('turns a campus wall clock back into the instant', () => {
    const wall = new Date(2026, 9, 22, 13, 15);
    expect(toCampusWallClock(fromCampusWallClock(wall)).getTime()).toBe(wall.getTime());
  });
});

describe('tableFromSession', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 22, h, m);
  const session = { anchorAt: at(9, 45), plannedEnd: at(11, 25) };

  it('starts at the anchor, already in progress, and ends with the session', () => {
    expect(tableFromSession(session, at(10, 25))).toEqual({ startsAt: at(9, 45), endsAt: at(11, 25) });
  });

  it('needs 25 minutes left so others can come', () => {
    expect(tableFromSession(session, at(11, 0))).toEqual({ startsAt: at(9, 45), endsAt: at(11, 25) });
    expect(tableFromSession(session, at(11, 1))).toEqual({ problem: 'too_short' });
    expect(tableFromSession(session, at(11, 25))).toEqual({ problem: 'ended' });
  });

  it('refuses a batch anchor more than 3 hours before the end', () => {
    expect(tableFromSession({ anchorAt: at(8), plannedEnd: at(11, 30) }, at(10))).toEqual({ problem: 'too_long' });
  });
});
