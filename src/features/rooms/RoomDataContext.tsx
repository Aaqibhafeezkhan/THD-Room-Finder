import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { FreeRoom, Room, ScheduledEvent } from '../../domain/models';
import { computeFreeRooms, knownRooms } from '../../domain/availability';
import { campusNow } from '../../domain/time';
import { getCampusHours } from '../../domain/openingHours';
import type { CampusHours } from '../../domain/openingHours';
import { mondayOf } from '../../domain/teachingRooms';
import * as thabella from '../../data/thabellaClient';
import type { Loaded, Source, TeachingSet } from '../../data/thabellaClient';

const REFRESH_MS = 5 * 60 * 1000;
/** A copy of the day's timetable older than this is shown as stale. */
const STALE_MS = 15 * 60 * 1000;
/** Retries after a failed load, while the app stays open (#154). */
const RETRY_MS = [30_000, 60_000, 120_000, 300_000];

/**
 * How much the room list can say about the query day (#154):
 *   • loading — nothing for this day yet, first answer pending;
 *   • fresh — the timetable as THabella has it now;
 *   • stale — an earlier copy of the same day, after a refresh failed;
 *   • unavailable — nobody could load this day. Rooms are still known, but
 *     whether they are free is not: never treat this as "no lectures".
 */
export type ScheduleState = 'loading' | 'fresh' | 'stale' | 'unavailable';

export interface RoomData {
  /** No timetable for the query day yet and the first answer is pending. */
  loading: boolean;
  /** Set when the query day's timetable couldn't be loaded at all. */
  error: string | null;
  /** Known rooms: live, a saved copy or the bundled catalogue. */
  rooms: Room[];
  roomsSource: Source;
  /** Events for the query day (drives detail schedules + availability).
   *  Empty when `schedule` is unavailable, which does NOT mean free. */
  events: ScheduledEvent[];
  schedule: ScheduleState;
  /** When THabella gave the query day's timetable. */
  scheduleAt: Date | null;
  /** Teaching-room eligibility set for the current week (offices excluded). */
  teachingIdents: Set<string> | null;
  /** Where the eligibility set comes from; `current` is false for an older,
   *  dated week or the bundled catalogue. */
  eligibility: { source: Source; week: string; current: boolean };
  /** Eligible rooms without any status, for when availability is unknown. */
  known: Room[];
  /** Free rooms at `planningTime`, duration-ranked and teaching-filtered; each
   *  room's window is capped at closing time. Populated whenever the campus is
   *  open OR closed-but-opening-later-today (`preview`), and only when the
   *  timetable is known; empty otherwise. */
  freeRooms: FreeRoom[];
  /** Campus opening state at `queryTime` (open/closed, today's window, next open). */
  campusHours: CampusHours;
  queryTime: Date;
  /** The instant `freeRooms` is computed for: `queryTime` when open, else today's
   *  opening moment while previewing. Use this (not `queryTime`) to render each
   *  room's status/remaining duration so a preview reads from opening time. */
  planningTime: Date;
  /** True when the campus is closed now but opens later today, so `freeRooms`
   *  is a plan-ahead preview of the opening moment rather than live availability. */
  preview: boolean;
  isCustomTime: boolean;
  /** When the shown timetable was fetched (= `scheduleAt`). */
  lastUpdated: Date | null;
  setQueryTime: (d: Date) => void;
  resetTime: () => void;
  refresh: () => void;
}

/** What the provider reads THabella through; tests pass a fake. */
export type RoomDataClient = Pick<
  typeof thabella,
  'getRooms' | 'cachedRooms' | 'loadEvents' | 'cachedEvents' | 'getTeachingRoomIdents' | 'cachedTeaching'
>;

const RoomDataContext = createContext<RoomData | null>(null);

function dayOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface DaySchedule {
  day: string;
  state: ScheduleState;
  events: ScheduledEvent[];
  at: Date | null;
}

function scheduleFrom(day: string, loaded: Loaded<ScheduledEvent[]> | null, now: number): DaySchedule {
  if (!loaded) return { day, state: 'loading', events: [], at: null };
  const old = loaded.source !== 'live' && loaded.at !== null && now - loaded.at.getTime() > STALE_MS;
  return { day, state: old ? 'stale' : 'fresh', events: loaded.data, at: loaded.at };
}

export function RoomDataProvider({ children, client = thabella }: { children: ReactNode; client?: RoomDataClient }) {
  const [queryTime, setQueryTimeState] = useState<Date>(() => campusNow());
  const [isCustomTime, setIsCustomTime] = useState(false);
  // First paint from what the device already has: no spinner for known rooms.
  const [rooms, setRooms] = useState<Loaded<Room[]>>(() => client.cachedRooms());
  const [teaching, setTeaching] = useState<TeachingSet>(() => client.cachedTeaching(queryTime));
  const [schedule, setSchedule] = useState<DaySchedule>(() =>
    scheduleFrom(dayOf(queryTime), client.cachedEvents(queryTime), Date.now()),
  );
  const [failures, setFailures] = useState(0);
  const latest = useRef(queryTime);

  const load = useCallback(
    async (when: Date) => {
      latest.current = when;
      const day = dayOf(when);
      // Another day: show what the device has for it, or loading. Never the
      // previous day's events.
      setSchedule((prev) => (prev.day === day ? prev : scheduleFrom(day, client.cachedEvents(when), Date.now())));
      // Each answer is published on its own; one failure keeps the others.
      const [roomList, idents, events] = await Promise.allSettled([
        client.getRooms(),
        client.getTeachingRoomIdents(when),
        client.loadEvents(when),
      ]);
      if (roomList.status === 'fulfilled') setRooms(roomList.value);
      if (idents.status === 'fulfilled') setTeaching(idents.value);
      if (latest.current !== when) return;
      if (events.status === 'fulfilled') {
        setSchedule(scheduleFrom(day, events.value, Date.now()));
        // A copy older than the cache's 5 minutes means THabella didn't answer.
        const at = events.value.at?.getTime() ?? 0;
        const fellBack = events.value.source !== 'live' && Date.now() - at > REFRESH_MS;
        setFailures((n) => (fellBack ? n + 1 : 0));
      } else {
        // Keep an earlier copy of this day if there is one, marked stale.
        setSchedule((prev) => (prev.day === day && prev.events.length && prev.at ? { ...prev, state: 'stale' } : { day, state: 'unavailable', events: [], at: null }));
        setFailures((n) => n + 1);
      }
    },
    [client],
  );

  useEffect(() => {
    void load(queryTime);
  }, [queryTime, load]);

  // After a failure, try again on a back-off and when the device is back
  // online, without waiting for a tap (#154).
  useEffect(() => {
    if (!failures) return;
    const again = () => void load(latest.current);
    const id = window.setTimeout(again, RETRY_MS[Math.min(failures, RETRY_MS.length) - 1]);
    window.addEventListener('online', again);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('online', again);
    };
  }, [failures, load]);

  // 5-minute silent auto-refresh — only while pinned to "now".
  useEffect(() => {
    const id = setInterval(() => {
      if (!isCustomTime) setQueryTimeState(campusNow());
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [isCustomTime]);

  const campusHours = useMemo(() => getCampusHours(queryTime), [queryTime]);

  // When closed but opening later today, plan ahead from the opening moment so
  // students can see what will be free (and free all day) once the doors open.
  const preview = useMemo(
    () => !campusHours.open && !!campusHours.todayOpen && queryTime < campusHours.todayOpen,
    [campusHours, queryTime],
  );
  const planningTime = useMemo(
    () => (preview && campusHours.todayOpen ? campusHours.todayOpen : queryTime),
    [preview, campusHours, queryTime],
  );

  const known = schedule.state === 'fresh' || schedule.state === 'stale';
  const freeRooms = useMemo(
    () =>
      known && (campusHours.open || preview)
        ? computeFreeRooms(rooms.data, schedule.events, planningTime, {
            eligibleIdents: teaching.data,
            closesAt: campusHours.todayClose,
          })
        : [],
    [known, rooms, schedule.events, planningTime, teaching, campusHours, preview],
  );
  const knownList = useMemo(() => knownRooms(rooms.data, teaching.data), [rooms, teaching]);
  const thisWeek = useMemo(() => {
    const m = mondayOf(queryTime);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
  }, [queryTime]);

  const setQueryTime = useCallback((d: Date) => {
    setIsCustomTime(true);
    setQueryTimeState(d);
  }, []);
  const resetTime = useCallback(() => {
    setIsCustomTime(false);
    setQueryTimeState(campusNow());
  }, []);
  const refresh = useCallback(() => setQueryTimeState(campusNow()), []);

  const value = useMemo<RoomData>(
    () => ({
      loading: schedule.state === 'loading',
      error: schedule.state === 'unavailable' ? 'THabella unavailable' : null,
      rooms: rooms.data,
      roomsSource: rooms.source,
      events: schedule.events,
      schedule: schedule.state,
      scheduleAt: schedule.at,
      teachingIdents: teaching.data,
      eligibility: { source: teaching.source, week: teaching.week, current: teaching.source !== 'bundled' && teaching.week === thisWeek },
      known: knownList,
      freeRooms,
      campusHours,
      queryTime,
      planningTime,
      preview,
      isCustomTime,
      lastUpdated: schedule.at,
      setQueryTime,
      resetTime,
      refresh,
    }),
    [schedule, rooms, teaching, thisWeek, knownList, freeRooms, campusHours, queryTime, planningTime, preview, isCustomTime, setQueryTime, resetTime, refresh],
  );

  return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}

export function useRoomData(): RoomData {
  const ctx = useContext(RoomDataContext);
  if (!ctx) throw new Error('useRoomData must be used within <RoomDataProvider>');
  return ctx;
}
