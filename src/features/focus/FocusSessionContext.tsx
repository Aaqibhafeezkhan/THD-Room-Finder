import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CAMPUSES, roomKey, supabaseFocusApi } from '../../data/focusApi';
import type { FocusApi, RoomSummary, SessionDto, Visibility } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { entryFor } from '../../domain/focusHistory';
import { RHYTHMS, focusedMs, layout, statusAt } from '../../domain/focusRhythm';
import type { AwaySpan, FocusStatus, Rhythm, SessionPlan } from '../../domain/focusRhythm';
import { MAX_SESSION_MINUTES } from '../../domain/focusSession';
import type { EndReason, PlannedEnd } from '../../domain/focusSession';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { adoptSession } from './adoptSession';
import { useFocusHistory } from './FocusHistoryContext';

/**
 * The student's running focus session (#19, ADR 0002 and 0004). One at a
 * time, laid out as focus blocks and breaks from an anchor. Each block after
 * the first is confirmed; with no answer within 10 minutes the session ends
 * at the end of the last confirmed block. With a study profile it is shared
 * through the focus service and the lease is renewed while the app is
 * visible and at each confirmation; without one, offline or in a room the
 * service doesn't know, it runs on this device only. Ending adds the focus
 * time (breaks excluded) to the local focus history. The session survives
 * reloads (localStorage).
 */
export interface ActiveSession {
  roomIdent: string;
  roomCode: string;
  startedAt: string;
  /** End of the last block; at or before the next lecture or 3 h. */
  plannedEnd: string;
  reason: EndReason;
  /** The next lecture, campus closing or 3 h cap the plan was cut at. */
  limitAt?: string;
  rhythm: Rhythm;
  /** When the rhythm started: the start, or the batch's anchor after Join. */
  anchorAt: string;
  /** The last block the student confirmed (Start confirms block 1). */
  confirmed: number;
  /** Time spent in other apps (Android), subtracted from focus time. */
  away?: AwaySpan[];
  visibility: Visibility;
  showName: boolean;
  /** Set when the focus service holds the session. */
  shared: { id: string; version: number; leaseUntil: string } | null;
  /** Why a student with a study profile got a device-only session. */
  localBecause?: 'offline' | 'unknown_room' | 'error';
  /** Started on another device of the same student and picked up here
   *  (ADR 0005); this device stays quiet until a block is confirmed on it. */
  adopted?: boolean;
}

export interface EndedSession {
  roomIdent: string;
  minutes: number;
  blocks: number;
  /** Minutes spent in other apps during blocks, already left out. */
  awayMinutes: number;
}

export interface StartOptions {
  rhythm: Rhythm;
  visibility?: Visibility;
  /** Join: follow this batch session's rhythm and anchor (server clock). */
  join?: { rhythm: Rhythm; anchorAt: Date };
}

interface FocusSessionValue {
  active: ActiveSession | null;
  plan: SessionPlan | null;
  /** Where the session stands now; null without one. */
  status: FocusStatus | null;
  /** Device-clock now, ticking every second while a session runs. */
  now: Date;
  lastEnded: EndedSession | null;
  /** Live activity by room key: undefined while loading or not configured,
   *  null when it couldn't be loaded (activity unknown). */
  summaries: Map<string, RoomSummary> | null | undefined;
  /** Sessions are shared (a study profile and the service). */
  shared: boolean;
  start: (room: { ident: string; code: string }, planned: PlannedEnd, opts: StartOptions) => Promise<void>;
  /** A session runs on another device: where, until the student decides. */
  conflict: { roomCode: string } | null;
  /** Move the other device's session here, or keep it there. */
  resolveConflict: (move: boolean) => Promise<void>;
  end: () => Promise<void>;
  /** Start the block that is waiting for an answer. */
  confirm: () => Promise<void>;
  /** Record time spent in other apps (Android). */
  addAway: (spans: AwaySpan[]) => void;
  /** End the plan by `end` for a lecture it didn't know about (#154): now
   *  ends the session, later shortens it. Never extends or restarts it. */
  limitTo: (end: Date) => Promise<void>;
  setVisibility: (v: Visibility) => Promise<void>;
  setShowName: (on: boolean) => Promise<void>;
  dismissSummary: () => void;
}

const FocusSessionContext = createContext<FocusSessionValue | null>(null);

const STORAGE_KEY = 'thd_focus_session';
const RENEW_MS = 60_000;
const SUMMARY_MS = 60_000;

function loadActive(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<ActiveSession> & Pick<ActiveSession, 'startedAt'>;
    // Sessions saved before rhythms existed run as one Open block.
    return { rhythm: RHYTHMS.open, anchorAt: s.startedAt, confirmed: 1, ...s } as ActiveSession;
  } catch {
    return null;
  }
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function sharedFrom(dto: SessionDto): ActiveSession['shared'] {
  // Server times shifted onto the device clock.
  return { id: dto.id, version: dto.version, leaseUntil: new Date(dto.leaseUntil.getTime() - dto.skewMs).toISOString() };
}

export function planOf(s: ActiveSession): SessionPlan | null {
  return layout(s.rhythm, new Date(s.anchorAt), new Date(s.startedAt), new Date(s.plannedEnd));
}

const CONFIGURED_API: FocusApi | null = focusServiceConfigured ? supabaseFocusApi(loadSupabase) : null;

export function FocusSessionProvider({ children, api = CONFIGURED_API }: { children: ReactNode; api?: FocusApi | null }) {
  const profile = useStudyProfile();
  const history = useFocusHistory();
  const [active, setActiveState] = useState<ActiveSession | null>(loadActive);
  const [now, setNow] = useState(() => new Date());
  const [lastEnded, setLastEnded] = useState<EndedSession | null>(null);
  const [summaries, setSummaries] = useState<Map<string, RoomSummary> | null | undefined>(undefined);
  const [conflict, setConflict] = useState<{ roomCode: string; retry: () => Promise<void> } | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  /** Shared sessions this device ended, never to be adopted back. */
  const endedHere = useRef(new Set<string>());

  // A claim needs a study profile (ADR 0004); without one focus stays local.
  const signedIn = Boolean(api && profile.email && profile.identity);

  const plan = useMemo(() => (active ? planOf(active) : null), [active]);

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
      if (s.shared) endedHere.current.add(s.shared.id);
      const p = planOf(s);
      const until = new Date(Math.min(endedAt.getTime(), new Date(s.plannedEnd).getTime()));
      const ms = p ? focusedMs(p, s.confirmed, until, s.away) : 0;
      const plain = p ? focusedMs(p, s.confirmed, until) : 0;
      // A shared session's entry is named after it, so two devices that both
      // record it store one entry once synced (ADR 0005).
      const entry = entryFor(new Date(s.startedAt), until, s.roomCode, s.shared?.id, ms);
      // Under a minute adds nothing, so there is nothing to sum up either.
      if (entry) {
        await history.add(entry);
        const blocks = p ? p.phases.filter((x) => x.kind === 'focus' && x.block <= s.confirmed && x.start < until).length : 1;
        setLastEnded({ roomIdent: s.roomIdent, minutes: entry.minutes, blocks, awayMinutes: Math.round((plain - ms) / 60000) });
      }
      if (tellServer && s.shared && api) await api.end(s.shared.id).catch(() => undefined);
    },
    [api, history, setActive],
  );

  const begin = useCallback(
    async (room: { ident: string; code: string }, planned: PlannedEnd, opts: StartOptions, force: boolean): Promise<void> => {
      const current = activeRef.current;
      if (current?.roomIdent === room.ident) return;
      const t = new Date();
      const rhythm = opts.join?.rhythm ?? opts.rhythm;
      const joinAnchor = opts.join && opts.join.anchorAt <= t ? opts.join.anchorAt : null;
      const anchor = joinAnchor ?? t;
      const p = layout(rhythm, anchor, t, planned.end);
      if (!p) return;
      // Moving rooms ends the old session first (the server replaces it too).
      if (current) await finish(t, false);
      setLastEnded(null);
      const vis: Visibility = opts.visibility ?? profile.identity?.defaultVisibility ?? 'private';
      const base: ActiveSession = {
        roomIdent: room.ident,
        roomCode: room.code,
        startedAt: t.toISOString(),
        plannedEnd: p.end.toISOString(),
        reason: planned.reason,
        limitAt: planned.end.toISOString(),
        rhythm,
        anchorAt: anchor.toISOString(),
        confirmed: 1,
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
          minutes: Math.min(MAX_SESSION_MINUTES, Math.max(1, Math.ceil((p.end.getTime() - t.getTime()) / 60000))),
          visibility: base.visibility,
          showName: base.showName,
          requestId: uuid(),
          // Replace only what this device knows about; a session it doesn't
          // know (another device) is the student's call.
          replace: force || Boolean(current),
          rhythm,
          ...(joinAnchor && { anchorAt: joinAnchor }),
        });
        setActive({ ...base, visibility: dto.visibility, showName: dto.showName, shared: sharedFrom(dto) });
      } catch (e) {
        const code = e instanceof ServiceError ? e.code : 'error';
        if (code === 'already_active') {
          const elsewhere = await api.current().catch(() => null);
          setActive(null);
          setConflict({
            roomCode: elsewhere?.roomCode ?? elsewhere?.roomKey.replace(/^thd:/, '') ?? '',
            retry: () => begin(room, planned, opts, true),
          });
          return;
        }
        setActive({
          ...base,
          localBecause: code === 'network' ? 'offline' : code === 'unknown_room' ? 'unknown_room' : 'error',
        });
      }
    },
    [api, finish, profile.identity, setActive, signedIn],
  );

  const start = useCallback<FocusSessionValue['start']>(
    (room, planned, opts) => {
      setConflict(null);
      return begin(room, planned, opts, false);
    },
    [begin],
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
          // Ended elsewhere (another device or a profile change): count up to
          // then, and never past now.
          const ended = server?.id === s.shared.id && server.endedAt ? new Date(server.endedAt.getTime() - server.skewMs) : new Date();
          await finish(new Date(Math.min(ended.getTime(), Date.now())), false);
        }
      }
    }
  }, [api, finish, setActive]);

  const confirm = useCallback(async () => {
    const s = activeRef.current;
    const p = s && planOf(s);
    if (!s || !p) return;
    const st = statusAt(p, s.confirmed, new Date());
    if (st.kind !== 'confirm') return;
    setActive({ ...s, confirmed: st.phase.block, adopted: false });
    await renew();
  }, [renew, setActive]);

  const addAway = useCallback(
    (spans: AwaySpan[]) => {
      const s = activeRef.current;
      if (!s || !spans.length) return;
      setActive({ ...s, away: [...(s.away ?? []), ...spans] });
    },
    [setActive],
  );

  const limitTo = useCallback(
    async (end: Date) => {
      const s = activeRef.current;
      if (!s || end >= new Date(s.plannedEnd)) return;
      const t = new Date();
      const p = end > t ? layout(s.rhythm, new Date(s.anchorAt), new Date(s.startedAt), end) : null;
      if (!p) {
        await finish(t);
        return;
      }
      setActive({ ...s, plannedEnd: p.end.toISOString(), reason: 'lecture', limitAt: end.toISOString() });
    },
    [finish, setActive],
  );

  /** Picks up a session this student runs on another device (ADR 0005). */
  const adopt = useCallback(async () => {
    if (!signedIn || !api || activeRef.current) return;
    const dto = await api.current().catch(() => null);
    if (!dto || activeRef.current || endedHere.current.has(dto.id)) return;
    const s = adoptSession(dto, new Date());
    if (s) setActive(s);
  }, [api, setActive, signedIn]);

  /** Move the other device's session here, or leave it running there and
   *  show it on this device too. */
  const resolveConflict = useCallback(
    async (move: boolean) => {
      const c = conflict;
      setConflict(null);
      if (move && c) await c.retry();
      else void adopt();
    },
    [adopt, conflict],
  );

  useEffect(() => {
    if (!signedIn) return;
    void adopt();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void adopt();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [adopt, signedIn]);

  // Tick once a second while a session runs; end it at its planned end or
  // when a block went unconfirmed (counted to the last confirmed block).
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const t = new Date();
      setNow(t);
      const s = activeRef.current;
      const p = s && planOf(s);
      if (!s || !p) return;
      const st = statusAt(p, s.confirmed, t);
      if (st.kind === 'done') void finish(st.at);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active?.roomIdent, active?.startedAt, finish]);

  // Renew while visible and when the app comes back.
  useEffect(() => {
    if (!active?.shared) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void renew();
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    const id = window.setInterval(onVisibility, RENEW_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(id);
    };
  }, [active?.shared?.id, renew]);

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

  const status = useMemo(() => (active && plan ? statusAt(plan, active.confirmed, now) : null), [active, plan, now]);

  const value = useMemo<FocusSessionValue>(
    () => ({
      active,
      plan,
      status,
      now,
      lastEnded,
      summaries,
      shared: signedIn,
      start,
      conflict: conflict ? { roomCode: conflict.roomCode } : null,
      resolveConflict,
      end,
      confirm,
      addAway,
      limitTo,
      setVisibility,
      setShowName,
      dismissSummary: () => setLastEnded(null),
    }),
    [active, plan, status, now, lastEnded, summaries, signedIn, start, conflict, resolveConflict, end, confirm, addAway, limitTo, setVisibility, setShowName],
  );
  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

/** The session, or null outside the provider (design specimens, tests). */
export function useOptionalFocusSession(): FocusSessionValue | null {
  return useContext(FocusSessionContext);
}

export function useFocusSession(): FocusSessionValue {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) throw new Error('useFocusSession must be used within <FocusSessionProvider>');
  return ctx;
}
