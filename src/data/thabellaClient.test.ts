import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bundledRooms,
  cachedRooms,
  cachedTeaching,
  getRooms,
  getTeachingRoomIdents,
  loadEvents,
  validPeriods,
  validRooms,
} from './thabellaClient';

const ROOM = { id: 1, ident: 'r1', name: 'E212 - Seminarraum' };
const period = (day: string, ident: string) => ({ id: 7, startDateTime: `${day} 10:00`, duration: 90, room_ident: { [ident]: 'x' } });

/** Answers by URL; anything not listed fails like an outage (504). */
function serve(routes: Record<string, unknown>) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    calls.push(url);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response('{"error":"upstream timeout"}', { status: 504 });
    return new Response(JSON.stringify(routes[key]), { status: 200 });
  });
  return calls;
}

const save = (key: string, data: unknown, at: number) => localStorage.setItem(key, JSON.stringify({ timestamp: at, data }));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 22, 9, 45));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('validation', () => {
  it('keeps only rooms and periods that can be used', () => {
    expect(validRooms([ROOM, { ident: '' }, null, 'x'])).toEqual([ROOM]);
    expect(validRooms({ error: 'x' })).toBeNull();
    expect(validRooms([])).toBeNull();
    expect(validPeriods([])).toEqual([]);
    expect(validPeriods('<html>')).toBeNull();
  });

  it('ships a usable room catalogue without staff details', () => {
    expect(bundledRooms.rooms.length).toBeGreaterThan(80);
    expect(bundledRooms.rooms.every((r) => !('inCharge' in r))).toBe(true);
  });
});

describe('rooms', () => {
  it('falls back to the bundled catalogue on a first visit while THabella is down', async () => {
    serve({});
    const rooms = await getRooms();
    expect(rooms.source).toBe('bundled');
    expect(rooms.data.length).toBe(bundledRooms.rooms.length);
  });

  it('keeps the last good copy when THabella sends something else', async () => {
    save('thd_rooms', [ROOM], Date.now() - 2 * 864e5);
    serve({ '/api/rooms': { error: 'maintenance' } });
    const rooms = await getRooms();
    expect(rooms).toMatchObject({ source: 'cache', data: [{ ident: 'r1', code: 'E212' }] });
    expect(JSON.parse(localStorage.getItem('thd_rooms')!).data).toEqual([ROOM]);
  });

  it('ignores a corrupt copy', () => {
    localStorage.setItem('thd_rooms', '{not json');
    expect(cachedRooms().source).toBe('bundled');
  });
});

describe('events', () => {
  it("never answers a day with another day's copy", async () => {
    save('thd_events_2026-10-21', [period('2026-10-21', 'r1')], Date.now() - 864e5);
    serve({});
    await expect(loadEvents(new Date())).rejects.toThrow();
  });

  it('uses an earlier copy of the same day, dated', async () => {
    const at = Date.now() - 40 * 60000;
    save('thd_events_2026-10-22', [period('2026-10-22', 'r1')], at);
    serve({});
    const events = await loadEvents(new Date());
    expect(events.source).toBe('cache');
    expect(events.at?.getTime()).toBe(at);
    expect(events.data).toHaveLength(1);
  });

  it('asks THabella once for the same day at the same time', async () => {
    const calls = serve({ '/api/periods': [] });
    await Promise.all([loadEvents(new Date()), loadEvents(new Date())]);
    expect(calls).toHaveLength(1);
  });
});

describe('teaching rooms', () => {
  it('adds the days that loaded to the last known set when one weekday fails', async () => {
    save('thd_teaching_2026-10-12', ['r9'], Date.now() - 7 * 864e5);
    // Monday to Thursday answer, Friday doesn't.
    serve(Object.fromEntries(['19', '20', '21', '22'].map((d) => [`2026-10-${d}`, [period(`2026-10-${d}`, `r${d}`)]])));
    const set = await getTeachingRoomIdents(new Date());
    expect([...set.data].sort()).toEqual(['r19', 'r20', 'r21', 'r22', 'r9']);
    expect(set).toMatchObject({ source: 'cache', week: '2026-10-12' });
    expect(localStorage.getItem('thd_teaching_2026-10-19')).toBeNull();
  });

  it("saves a full week's set", async () => {
    serve({ '/api/periods': [period('2026-10-20', 'r1')] });
    const set = await getTeachingRoomIdents(new Date());
    expect(set).toMatchObject({ source: 'live', week: '2026-10-19' });
    expect(cachedTeaching(new Date()).week).toBe('2026-10-19');
  });

  it('starts from the bundled week with nothing saved', () => {
    expect(cachedTeaching(new Date())).toMatchObject({ source: 'bundled', week: bundledRooms.week });
  });
});
