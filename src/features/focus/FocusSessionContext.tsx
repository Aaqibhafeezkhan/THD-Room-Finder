import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CAMPUSES, roomKey, supabaseFocusApi } from '../../data/focusApi';
import type { FocusApi, RoomSummary, SessionDto, Visibility } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { entryFor } from '../../domain/focusHistory';
import { checkInDeadline, checkInDue, endedBy } from '../../domain/focusSession';
import type { EndReason, PlannedEnd } from '../../domain/focusSession';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { useFocusHistory } from './FocusHistoryContext';

/**
 * The student's running focus session (#19, ADR 0002). One at a time. Signed
 * in, it is shared through the focus service and the lease is renewed while
 * the app is visible; signed out or offline it is a timer on this device that
 * publishes nothing. Either way, ending it adds one entry to the local focus
 * history. A locked or backgrounded phone doesn't end it: coming back after a
 * long gap asks "Still focusing?", and with no answer it ends where the
 * student left. The session survives reloads (localStorage).
 */
export interface ActiveSession {
  roomIdent: string;
  roomCode: string;
  startedAt: string;
  plannedEnd: string;
  reason: EndReason;
  visibility: Visibility;
  showName: boolean;
  /** Set when the focus service holds the session. */
  shared: { id: string; version: number; leaseUntil: string } | null;
  /** Why a signed-in student got a local timer instead. */
  localBecause?: 'offline' | 'unknown_room' | 'error';
}

export interface EndedSession {
  roomIdent: string;
  minutes: number;
}

export interface CheckIn {
  askedAt: number;
  /** When the app was last seen; an unanswered check-in ends here. */
  hiddenAt: number;
}

interface FocusSessionValue {
  active: ActiveSession | null;
  /** Device-clock now, ticking every second while a session runs. */
  now: Date;
  lastEnded: EndedSession | null;
  checkIn: CheckIn | null;
  /** Live activity by room key: undefined while loading or not configured,
   *  null when it couldn't be loaded (activity unknown). */
  summaries: Map<string, RoomSummary> | null | undefined;
  shared: boolean;
  start: (room: { ident: string; code: string }, plan: PlannedEnd, visibility?: Visibility) => Promise<void>;
  end: () => Promise<void>;
  setVisibility: (v: Visibility) => Promise<void>;
  setShowName: (on: boolean) => Promise<void>;
  keepGoing: () => Promise<void>;
  dismissSummary: () => void;
}

const FocusSessionContext = createContext<FocusSessionValue | null>(null);

const STORAGE_KEY = 'thd_focus_session';
const HIDDEN_KEY = 'thd_focus_hidden_at';
const RENEW_MS = 60_000;
const SUMMARY_MS = 60_000;

function loadActive(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
  } catch {
    return null;
  }
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

/** Server times shifted onto the device clock. */
function local(d: Date, skewMs: number): string {
  return new Date(d.getTime() - skewMs).toISOString();
}

function sharedFrom(dto: SessionDto): ActiveSession['shared'] {
  return { id: dto.id, version: dto.version, leaseUntil: local(dto.leaseUntil, dto.skewMs) };
}

const CONFIGURED_API: FocusApi | null = focusServiceConfigured ? supabaseFocusApi(loadSupabase) : null;

export function FocusSessionProvider({ children, api = CONFIGURED_API }: { children: ReactNode; api?: FocusApi | null }) {
  const profile = useStudyProfile();
  const history = useFocusHistory();
  const [active, setActiveState] = useState<ActiveSession | null>(loadActive);
  const [now, setNow] = useState(() => new Date());
  const [lastEnded, setLastEnded] = useState<EndedSession | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [summaries, setSummaries] = useState<Map<string, RoomSummary> | null | undefined>(undefined);
  const activeRef = useRef(active);
  activeRef.current = active;

  // A claim needs a study profile (ADR 0004); without one focus stays local.
  const signedIn = Boolean(api && profile.email && profile.identity);

  const setActive = useCallback((next: ActiveSession | null) => {
    activeRef.current = next;
    setActiveState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const finish = useCallback(
    async (endedAt: Date, tellServer = true) => {
      const s = activeRef.current;
      if (!s) return;
      setActive(null);
      setCheckIn(null);
      const until = new Date(Math.min(endedAt.getTime(), new Date(s.plannedEnd).getTime()));
      const entry = entryFor(new Date(s.startedAt), until, s.roomCode);
      // Under a minute adds nothing, so there is nothing to sum up either.
      if (entry) {
        await history.add(entry);
        setLastEnded({ roomIdent: s.roomIdent, minutes: entry.minutes });
      }
      if (tellServer && s.shared && api) await api.end(s.shared.id).catch(() => undefined);
    },
    [api, history, setActive],
  );

  const start = useCallback<FocusSessionValue['start']>(
    async (room, plan, visibility) => {
      const current = activeRef.current;
      if (current?.roomIdent === room.ident) return;
      // Moving rooms ends the old session first (the server replaces it too).
      if (current) await finish(new Date(), false);
      setLastEnded(null);
      const vis: Visibility = visibility ?? profile.identity?.defaultVisibility ?? 'private';
      const base: ActiveSession = {
        roomIdent: room.ident,
        roomCode: room.code,
        startedAt: new Date().toISOString(),
        plannedEnd: plan.end.toISOString(),
        reason: plan.reason,
        visibility: signedIn ? vis : 'private',
        showName: signedIn && vis === 'public' ? Boolean(profile.identity?.showName) : false,
        shared: null,
      };
      if (!signedIn || !api) {
        setActive(base);
        return;
      }
      try {
        const dto = await api.start({
          roomKey: roomKey(room.ident),
          minutes: plan.minutes,
          visibility: base.visibility,
          showName: base.showName,
          requestId: uuid(),
          replace: true,
        });
        setActive({
          ...base,
          visibility: dto.visibility,
          showName: dto.showName,
          startedAt: local(dto.startedAt, dto.skewMs),
          plannedEnd: local(dto.plannedEnd, dto.skewMs),
          shared: sharedFrom(dto),
        });
      } catch (e) {
        const code = e instanceof ServiceError ? e.code : 'error';
        setActive({
          ...base,
          localBecause: code === 'network' ? 'offline' : code === 'unknown_room' ? 'unknown_room' : 'error',
        });
      }
    },
    [api, finish, profile.identity, setActive, signedIn],
  );

  const end = useCallback(() => finish(new Date()), [finish]);

  const updateShared = useCallback(
    async (visibility: Visibility, showName: boolean) => {
      const s = activeRef.current;
      if (!s) return;
      if (!s.shared || !api) {
        setActive({ ...s, visibility, showName });
        return;
      }
      const dto = await api.update(s.shared.id, s.shared.version, visibility, showName);
      setActive({ ...s, visibility: dto.visibility, showName: dto.showName, shared: sharedFrom(dto) });
    },
    [api, setActive],
  );

  const setVisibility = useCallback(
    (v: Visibility) => updateShared(v, v === 'public' ? (activeRef.current?.showName ?? false) : false),
    [updateShared],
  );
  const setShowName = useCallback(
    (on: boolean) => updateShared(activeRef.current?.visibility ?? 'private', on),
    [updateShared],
  );

  /** Renews the lease; a session the server already ended ends here too. */
  const renew = useCallback(async () => {
    const s = activeRef.current;
    if (!s?.shared || !api) return;
    try {
      const dto = await api.renew(s.shared.id, s.shared.version);
      if (activeRef.current?.shared?.id === dto.id) setActive({ ...activeRef.current, shared: sharedFrom(dto) });
    } catch (e) {
      const code = e instanceof ServiceError ? e.code : '';
      if (code === 'not_active' || code === 'stale_version') {
        const server = await api.current().catch(() => null);
        if (server && server.id === s.shared.id && !server.endedAt) {
          setActive({ ...s, shared: sharedFrom(server), visibility: server.visibility, showName: server.showName });
        } else {
          // Ended elsewhere (another device, a profile change or the lease):
          // count up to now at most.
          const ended = server?.id === s.shared.id && server.endedAt ? new Date(server.endedAt.getTime() - server.skewMs) : new Date();
          await finish(new Date(Math.min(ended.getTime(), new Date(s.shared.leaseUntil).getTime())), false);
        }
      }
    }
  }, [api, finish, setActive]);

  const keepGoing = useCallback(async () => {
    setCheckIn(null);
    await renew();
  }, [renew]);

  // Tick once a second while a session runs; end it at its planned end, when
  // the lease has run out, or when a check-in went unanswered.
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const t = new Date();
      setNow(t);
      const s = activeRef.current;
      if (!s) return;
      const lease = s.shared && document.visibilityState !== 'visible' ? new Date(s.shared.leaseUntil) : null;
      const by = endedBy(t, new Date(s.plannedEnd), lease);
      if (by === 'planned') void finish(new Date(s.plannedEnd));
      else if (by === 'expired') {
        // The lease ran out in the background: count up to when the app was
        // last seen, not the end of the lease.
        let hiddenAt = 0;
        try {
          hiddenAt = Number(localStorage.getItem(HIDDEN_KEY)) || 0;
        } catch {
          /* ignore */
        }
        void finish(new Date(hiddenAt || s.shared!.leaseUntil), false);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active?.roomIdent, active?.startedAt, finish]);

  useEffect(() => {
    if (checkIn && now >= checkInDeadline(new Date(checkIn.askedAt))) void finish(new Date(checkIn.hiddenAt));
  }, [checkIn, now, finish]);

  // Renew while visible; on return from the background, ask or renew.
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try {
          localStorage.setItem(HIDDEN_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
        return;
      }
      let hiddenAt: number | null = null;
      try {
        hiddenAt = Number(localStorage.getItem(HIDDEN_KEY)) || null;
        localStorage.removeItem(HIDDEN_KEY);
      } catch {
        /* ignore */
      }
      if (hiddenAt && checkInDue(new Date(hiddenAt), new Date())) setCheckIn({ askedAt: Date.now(), hiddenAt });
      else void renew();
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !checkIn) void renew();
    }, RENEW_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(id);
    };
  }, [active?.roomIdent, active?.shared?.id, renew, checkIn]);

  // Live activity for every room, refreshed while the app is visible.
  useEffect(() => {
    if (!api) return;
    let live = true;
    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const lists = await Promise.all(CAMPUSES.map((c) => api.summaries(c)));
        if (live) setSummaries(new Map(lists.flat().map((s) => [s.roomKey, s])));
      } catch {
        if (live) setSummaries(null);
      }
    };
    void load();
    const id = window.setInterval(load, SUMMARY_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      live = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', load);
    };
  }, [api, profile.email, active?.shared?.id]);

  const value = useMemo<FocusSessionValue>(
    () => ({
      active,
      now,
      lastEnded,
      checkIn,
      summaries,
      shared: signedIn,
      start,
      end,
      setVisibility,
      setShowName,
      keepGoing,
      dismissSummary: () => setLastEnded(null),
    }),
    [active, now, lastEnded, checkIn, summaries, signedIn, start, end, setVisibility, setShowName, keepGoing],
  );
  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

export function useFocusSession(): FocusSessionValue {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) throw new Error('useFocusSession must be used within <FocusSessionProvider>');
  return ctx;
}
