/**
 * THabella data client. One source of truth for both targets:
 *   • Web  — calls the same-origin Vercel proxy under `/api` (see `api/*.js`),
 *            which adds CORS + caching in front of THabella.
 *   • Android (Capacitor) — calls THabella directly via the native HTTP bridge,
 *            bypassing browser CORS and preserving the "no backend" promise.
 *
 * Results are cached (localStorage) and every answer says where it came from
 * (#154), so screens can tell live data from an older copy:
 *   • rooms — live, the last good copy (any age) or the bundled catalogue of
 *     rooms that recently hosted teaching; known rooms never disappear;
 *   • a day's events — live, or an earlier copy of the same day. There is no
 *     fallback across days: a day nobody could load is unknown, never empty;
 *   • the teaching-room set — this week's, or a dated earlier one.
 * Malformed answers are rejected before they can replace a good copy.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { PeriodDto, RoomDto } from './dto';
import type { Room, ScheduledEvent } from '../domain/models';
import { toEvents, toRooms } from './mappers';
import { mondayOf, teachingRoomIdents, weekDates } from '../domain/teachingRooms';
import { keysWith, readDated, readFresh, write } from './cache';
import { REQUEST_TIMEOUT_MS, timedFetch } from './net';
import fallback from './fallbackRooms.json';

const THABELLA = 'https://thabella.th-deg.de/thabella/opn';
/** Same-origin on web; empty base yields relative `/api/...`. */
const API_BASE = '';

const ROOMS_TTL_MS = 24 * 60 * 60 * 1000;
const EVENTS_TTL_MS = 5 * 60 * 1000;
const TEACHING_TTL_MS = 24 * 60 * 60 * 1000;

const ROOMS_KEY = 'thd_rooms';
const EVENTS_PREFIX = 'thd_events_';
const TEACHING_PREFIX = 'thd_teaching_';

/** Where an answer came from: THabella just now, this device's earlier
 *  copy, or the catalogue shipped with the app. */
export type Source = 'live' | 'cache' | 'bundled';

export interface Loaded<T> {
  data: T;
  source: Source;
  /** When THabella gave this answer; null for the bundled catalogue. */
  at: Date | null;
}

export interface TeachingSet extends Loaded<Set<string>> {
  /** Monday (YYYY-MM-DD) of the week the set was seen in. A different week
   *  than the one asked for means it is an older, dated fallback. */
  week: string;
}

/** THabella date format: "YYYY-MM-DD HH:mm" (local). */
export function toSqlDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}`
  );
}

function dateKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// ── Validation ──────────────────────────────────────────────────

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Rooms with the fields everything else relies on; null when the answer
 *  isn't a room list at all. An empty catalogue is never right. */
export function validRooms(data: unknown): RoomDto[] | null {
  if (!Array.isArray(data)) return null;
  const rooms = data.filter(
    (r): r is RoomDto => isObject(r) && typeof r.ident === 'string' && r.ident.length > 0 && typeof r.name === 'string',
  );
  return rooms.length > 0 ? rooms : null;
}

/** Periods that can be placed in time; null when the answer isn't a list.
 *  An empty list is a real answer (a Sunday). */
export function validPeriods(data: unknown): PeriodDto[] | null {
  if (!Array.isArray(data)) return null;
  return data.filter((p): p is PeriodDto => isObject(p) && typeof p.startDateTime === 'string');
}

const validIdents = (data: unknown): string[] | null =>
  Array.isArray(data) && data.length > 0 && data.every((x) => typeof x === 'string') ? (data as string[]) : null;

// ── Raw network (platform-specific) ─────────────────────────────

// Gives up after 15 s, so a hanging timetable falls back to the cache.
const request = timedFetch();
/** One request per URL at a time: the week lookup and the day view share
 *  today's request instead of asking twice. */
const inFlight = new Map<string, Promise<unknown>>();

function once<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const p = run().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

async function post(path: string, body: unknown, proxy: string): Promise<unknown> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.post({
      url: `${THABELLA}${path}`,
      headers: { 'Content-Type': 'application/json' },
      data: body,
      connectTimeout: REQUEST_TIMEOUT_MS,
      readTimeout: REQUEST_TIMEOUT_MS,
    });
    if (res.status < 200 || res.status >= 300) throw new Error(`THabella HTTP ${res.status}`);
    return res.data;
  }
  const res = await request(`${API_BASE}${proxy}`);
  if (!res.ok) throw new Error(`THabella HTTP ${res.status}`);
  return res.json();
}

async function rawRooms(): Promise<RoomDto[]> {
  const data = await once('rooms', () => post('/room/findRooms', {}, '/api/rooms'));
  const rooms = validRooms(data);
  if (!rooms) throw new Error('THabella sent no rooms');
  return rooms;
}

async function rawPeriods(sqlDate: string): Promise<PeriodDto[]> {
  const data = await once(`periods ${sqlDate}`, () =>
    post(`/period/findByDate/${encodeURIComponent(sqlDate)}`, { sqlDate }, `/api/periods?date=${encodeURIComponent(sqlDate)}`),
  );
  const periods = validPeriods(data);
  if (!periods) throw new Error('THabella sent no timetable');
  return periods;
}

// ── Rooms ───────────────────────────────────────────────────────

/** Rooms that recently hosted teaching, shipped with the app
 *  (scripts/dev/fallback-rooms.mjs). */
export const bundledRooms: { week: string; rooms: RoomDto[] } = {
  week: fallback.week,
  rooms: validRooms(fallback.rooms) ?? [],
};

/** The best rooms on hand without asking THabella: the last good copy, else
 *  the bundled catalogue. For the first paint. */
export function cachedRooms(): Loaded<Room[]> {
  const cached = readDated<unknown>(ROOMS_KEY);
  const rooms = cached ? validRooms(cached.data) : null;
  if (cached && rooms) return { data: toRooms(rooms), source: 'cache', at: cached.at };
  return { data: toRooms(bundledRooms.rooms), source: 'bundled', at: null };
}

export async function getRooms(): Promise<Loaded<Room[]>> {
  const fresh = readFresh<unknown>(ROOMS_KEY, ROOMS_TTL_MS);
  const freshRooms = fresh ? validRooms(fresh) : null;
  if (freshRooms) return { data: toRooms(freshRooms), source: 'cache', at: readDated(ROOMS_KEY)?.at ?? new Date() };
  try {
    const dtos = await rawRooms();
    write(ROOMS_KEY, dtos);
    return { data: toRooms(dtos), source: 'live', at: new Date() };
  } catch {
    return cachedRooms();
  }
}

// ── Events ──────────────────────────────────────────────────────

/** A day's events from this device's copy, if that day was ever loaded. */
export function cachedEvents(date: Date): Loaded<ScheduledEvent[]> | null {
  const cached = readDated<unknown>(EVENTS_PREFIX + dateKey(date));
  const periods = cached ? validPeriods(cached.data) : null;
  return cached && periods ? { data: toEvents(periods), source: 'cache', at: cached.at } : null;
}

/** All events on the calendar day of `date` (one THabella query). Throws
 *  when that day is unknown: no answer now and none saved for that day. */
export async function loadEvents(date: Date): Promise<Loaded<ScheduledEvent[]>> {
  const key = EVENTS_PREFIX + dateKey(date);
  const fresh = readFresh<unknown>(key, EVENTS_TTL_MS);
  const freshPeriods = fresh ? validPeriods(fresh) : null;
  if (freshPeriods) return { data: toEvents(freshPeriods), source: 'cache', at: readDated(key)?.at ?? new Date() };
  try {
    const dtos = await rawPeriods(toSqlDate(date));
    write(key, dtos);
    return { data: toEvents(dtos), source: 'live', at: new Date() };
  } catch (err) {
    const cached = cachedEvents(date);
    if (cached) return cached;
    throw err;
  }
}

/** Just the events; throws when the day is unknown, so callers can't
 *  mistake "couldn't load" for "no lectures". */
export async function getEventsForDate(date: Date): Promise<ScheduledEvent[]> {
  return (await loadEvents(date)).data;
}

// ── Teaching rooms ──────────────────────────────────────────────

function teachingFrom(key: string): TeachingSet | null {
  const cached = readDated<unknown>(key);
  const idents = cached ? validIdents(cached.data) : null;
  return cached && idents ? { data: new Set(idents), source: 'cache', at: cached.at, week: key.slice(TEACHING_PREFIX.length) } : null;
}

/** The best teaching set on hand without asking THabella: this week's, the
 *  latest earlier week's, else the bundled catalogue's week. */
export function cachedTeaching(reference: Date = new Date()): TeachingSet {
  const thisWeek = teachingFrom(TEACHING_PREFIX + dateKey(mondayOf(reference)));
  if (thisWeek) return thisWeek;
  const latest = keysWith(TEACHING_PREFIX)
    .sort()
    .reverse()
    .map(teachingFrom)
    .find((s): s is TeachingSet => s !== null);
  if (latest) return latest;
  return { data: new Set(bundledRooms.rooms.map((r) => r.ident)), source: 'bundled', at: null, week: bundledRooms.week };
}

/**
 * The teaching-room set for `reference`'s week (Mon–Fri): every room that
 * hosts ≥1 event. Cached 24h keyed by the week's Monday — this is the
 * display-eligibility filter that hides offices and always-closed spaces.
 * When a weekday can't be loaded, the days that could are added to the best
 * earlier set instead of shrinking the list; that partial set isn't saved.
 */
export async function getTeachingRoomIdents(reference: Date = new Date()): Promise<TeachingSet> {
  const week = dateKey(mondayOf(reference));
  const key = TEACHING_PREFIX + week;
  const fresh = readFresh<unknown>(key, TEACHING_TTL_MS);
  if (fresh && validIdents(fresh)) return teachingFrom(key)!;
  const days = await Promise.allSettled(weekDates(reference).map(loadEvents));
  const loaded = days.flatMap((d) => (d.status === 'fulfilled' ? [d.value.data] : []));
  if (loaded.length === days.length) {
    const idents = teachingRoomIdents(loaded.flat());
    if (idents.size > 0) {
      write(key, [...idents]);
      return { data: idents, source: 'live', at: new Date(), week };
    }
  }
  const earlier = cachedTeaching(reference);
  const seen = teachingRoomIdents(loaded.flat());
  return { ...earlier, data: new Set([...earlier.data, ...seen]) };
}
