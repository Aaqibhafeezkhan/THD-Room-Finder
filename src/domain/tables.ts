/**
 * Study tables (ADR 0007, docs/product/study-tables.md): the rules the Set a
 * table sheet and the table page share. Framework-free. Times inside the app
 * are campus wall-clock Dates (domain/time.ts); tables travel as real
 * instants, so convert at the edge with fromCampusWallClock.
 */
import type { Room, ScheduledEvent } from './models';
import { toCampusWallClock } from './time';
import { isExcludedVenue, isPriority } from './priority';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export const TABLE_SEATS = [2, 4, 6, 8, 12] as const;
export const DEFAULT_SEATS = 4;
export const TABLE_DAYS_AHEAD = 14;
export const TABLE_MIN_MINUTES = 25;
export const TABLE_MAX_MINUTES = 180;
/** "Starts soon", the reminder and Start focus, minutes before the start. */
export const TABLE_REMINDER_MINUTES = 15;
export const TOPIC_MAX = 40;
/** Lecture block starts at THD: 90-minute blocks with 15-minute breaks. */
export const LECTURE_GRID = ['08:00', '09:45', '11:30', '13:15', '15:00', '16:45', '18:30'] as const;

/** The instant whose Deggendorf wall clock reads `wall` (inverse of toCampusWallClock). */
export function fromCampusWallClock(wall: Date): Date {
  let instant = wall.getTime();
  // Two rounds settle the offset, including across a DST change.
  for (let i = 0; i < 2; i++) {
    const shown = toCampusWallClock(new Date(instant)).getTime();
    instant += wall.getTime() - shown;
  }
  return new Date(instant);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function at(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
}

export interface TableDay {
  /** yyyy-mm-dd on the campus clock. */
  id: string;
  date: Date;
  /** 0 = today, 1 = tomorrow. */
  offset: number;
  /** Opening and closing that day, or null when the campus is closed. */
  open: Date | null;
  close: Date | null;
}

export const dayId = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Today up to 14 days ahead, with each day's opening hours. `hours(day)`
 * returns the opening and closing on that calendar day, or nulls.
 */
export function tableDays(now: Date, hours: (day: Date) => { open: Date | null; close: Date | null }): TableDay[] {
  const today = startOfDay(now);
  return Array.from({ length: TABLE_DAYS_AHEAD + 1 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const h = hours(date);
    return { id: dayId(date), date, offset, open: h.open, close: h.close };
  });
}

export interface FreeSlot {
  /** "13:15" */
  id: string;
  start: Date;
  /** Where the slot ends: the next event, closing, or 3 hours on. */
  end: Date;
  minutes: number;
}

/**
 * The room's free slots on one day, cut to the lecture grid: a grid start
 * inside opening hours, not in the past, free for at least 25 minutes. The
 * slot runs until the next event in the room, closing, or 3 hours
 * (`maxMinutes`; gatherings pass 6 hours).
 */
export function freeSlots(day: TableDay, roomEvents: ScheduledEvent[], now: Date, maxMinutes: number = TABLE_MAX_MINUTES): FreeSlot[] {
  if (!day.open || !day.close) return [];
  const out: FreeSlot[] = [];
  for (const hhmm of LECTURE_GRID) {
    const start = at(day.date, hhmm);
    if (start < day.open || start.getTime() < now.getTime() - 5 * MIN) continue;
    if (roomEvents.some((e) => e.startDateTime <= start && e.endDateTime > start)) continue;
    let end = new Date(Math.min(day.close.getTime(), start.getTime() + maxMinutes * MIN));
    for (const e of roomEvents) if (e.startDateTime > start && e.startDateTime < end) end = e.startDateTime;
    const minutes = Math.round((end.getTime() - start.getTime()) / MIN);
    if (minutes >= TABLE_MIN_MINUTES) out.push({ id: hhmm, start, end, minutes });
  }
  return out;
}

/** "3 h", "1h 30", "45 min" */
export function slotLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export type TableState = 'upcoming' | 'soon' | 'live' | 'ended' | 'cancelled';

export function tableState(table: { startsAt: Date; endsAt: Date; cancelled: boolean }, now: Date): TableState {
  if (table.cancelled) return 'cancelled';
  const t = now.getTime();
  if (t >= table.endsAt.getTime()) return 'ended';
  if (t >= table.startsAt.getTime()) return 'live';
  if (t >= table.startsAt.getTime() - TABLE_REMINDER_MINUTES * MIN) return 'soon';
  return 'upcoming';
}

function overlaps(e: ScheduledEvent, start: Date, end: Date): boolean {
  return e.startDateTime < end && e.endDateTime > start;
}

/** A lecture (or any event) in this room during the table (T17). */
export function roomConflict(events: ScheduledEvent[], ident: string, start: Date, end: Date): ScheduledEvent | null {
  return events.find((e) => e.roomIdent === ident && overlaps(e, start, end)) ?? null;
}

/**
 * Rooms free for the whole window [start, end), main campus first, for
 * "Move to a free room". Only teaching rooms (`eligible`) count.
 */
export function roomsFreeFor(
  rooms: Room[],
  events: ScheduledEvent[],
  start: Date,
  end: Date,
  eligible?: ReadonlySet<string> | null,
): Room[] {
  const busy = new Set(events.filter((e) => overlaps(e, start, end)).map((e) => e.roomIdent));
  return rooms
    .filter((r) => (eligible ? eligible.has(r.ident) : true) && !isExcludedVenue(r) && !busy.has(r.ident))
    // THabella lists a few rooms without a usable code ("--").
    .filter((r) => /[A-Za-z0-9]/.test(r.code))
    .sort((a, b) => (isPriority(b) ? 1 : 0) - (isPriority(a) ? 1 : 0) || a.code.localeCompare(b.code));
}

const tag = (locale: 'en' | 'de') => (locale === 'de' ? 'de-DE' : 'en-GB');
const clock = (d: Date, locale: 'en' | 'de') =>
  new Intl.DateTimeFormat(tag(locale), { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

/**
 * "Today · 13:15–14:45", "Tomorrow · …", or "Thu 22 Oct · …" on the campus
 * clock. Pass `now` for the relative day names.
 */
export function tableWhen(startsAt: Date, endsAt: Date, locale: 'en' | 'de', now?: Date): string {
  const s = toCampusWallClock(startsAt);
  const e = toCampusWallClock(endsAt);
  return `${dayName(s, locale, now ? toCampusWallClock(now) : undefined, true)} · ${clock(s, locale)}–${clock(e, locale)}`;
}

/** A short line for rows: "Thu 13:15", "Today 13:15". */
export function tableShortWhen(startsAt: Date, locale: 'en' | 'de', now: Date): string {
  const s = toCampusWallClock(startsAt);
  return `${dayName(s, locale, toCampusWallClock(now), false)} ${clock(s, locale)}`;
}

/** Today / Tomorrow / weekday (and date when `long`). Wall-clock inputs. */
export function dayName(day: Date, locale: 'en' | 'de', now?: Date, long = false): string {
  if (now) {
    const diff = Math.round((startOfDay(day).getTime() - startOfDay(now).getTime()) / DAY);
    if (diff === 0) return locale === 'de' ? 'Heute' : 'Today';
    if (diff === 1) return locale === 'de' ? 'Morgen' : 'Tomorrow';
  }
  const opts: Intl.DateTimeFormatOptions = long ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'short' };
  return new Intl.DateTimeFormat(tag(locale), opts).format(day).replace(/\.(?=\s|$)/g, '').replace(',', '');
}

/** The share link for a table. */
export function tableLink(link: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}/t/${link}`;
}

/** mossy-lagoon-42, as people may type it (any case, spaces around). */
export function normalizeTableLink(raw: string | undefined): string | null {
  const link = (raw ?? '').trim().toLowerCase();
  return /^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$/.test(link) ? link : null;
}

export type SessionTable = { startsAt: Date; endsAt: Date } | { problem: 'ended' | 'too_short' | 'too_long' };

/**
 * A running focus session as a study table already in progress (#153,
 * ADR 0010). It starts at the session's rhythm anchor, so guests who start
 * together line up with the host's blocks and breaks, and ends at the
 * session's planned end. Others need time to come: under 25 minutes left is
 * `too_short` (set a table for later instead). A session anchored to a batch
 * more than 3 hours before its end is `too_long`. Real instants in and out.
 */
export function tableFromSession(session: { anchorAt: Date; plannedEnd: Date }, now: Date): SessionTable {
  const end = session.plannedEnd.getTime();
  if (end <= now.getTime()) return { problem: 'ended' };
  if (end - now.getTime() < TABLE_MIN_MINUTES * MIN) return { problem: 'too_short' };
  if (end - session.anchorAt.getTime() > TABLE_MAX_MINUTES * MIN) return { problem: 'too_long' };
  return { startsAt: session.anchorAt, endsAt: session.plannedEnd };
}
