import type { Rhythm } from '../domain/focusRhythm';
import { ServiceError, errorCode } from './identityApi';
import type { FocusClient } from './supabaseClient';

/**
 * Study tables (ADR 0007, docs/architecture/focus-service.md): tables shared
 * by a word link, and seat / maybe replies. Reading a table needs no
 * account; everything else needs a study profile. Can't removes the reply.
 */
export type Answer = 'seat' | 'maybe';

export interface StudyTable {
  link: string;
  topic: string | null;
  /** `thd:<THabella ident>` */
  roomKey: string;
  roomCode: string | null;
  startsAt: Date;
  endsAt: Date;
  /** 1 = Just me. */
  seats: number;
  rhythm: Rhythm;
  hostName: string | null;
  hostShowName: boolean;
  cancelled: boolean;
  changed: boolean;
  version: number;
  isHost: boolean;
  myAnswer: Answer | null;
  myShowName: boolean;
  /** Seats taken, the host's included. */
  taken: number;
  maybe: number;
  seatNames: string[];
  maybeNames: string[];
}

export interface TableInput {
  topic: string | null;
  roomKey: string;
  startsAt: Date;
  minutes: number;
  seats: number;
  rhythm: Rhythm;
  showName: boolean;
}

/** A running session as a table already in progress (#153, ADR 0010). */
export interface SessionTableInput {
  /** The same id on a retry returns the same table. */
  requestId: string;
  topic: string | null;
  roomKey: string;
  startsAt: Date;
  endsAt: Date;
  seats: number;
  rhythm: Rhythm;
  /** The shared session, when the focus service holds it. */
  sessionId: string | null;
}

export interface TablesApi {
  set(input: TableInput): Promise<StudyTable>;
  fromSession(input: SessionTableInput): Promise<StudyTable>;
  change(link: string, expectedVersion: number, input: TableInput): Promise<StudyTable>;
  cancel(link: string): Promise<StudyTable>;
  /** null when the link is unknown or the table ended over a day ago. */
  get(link: string): Promise<StudyTable | null>;
  reply(link: string, answer: Answer | 'no', showName: boolean): Promise<StudyTable>;
  mine(): Promise<StudyTable[]>;
}

const answers: readonly Answer[] = ['seat', 'maybe'];
const names = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is string => typeof n === 'string') : []);

export function toTable(j: Record<string, unknown> | null): StudyTable | null {
  if (!j || typeof j.link !== 'string') return null;
  const r = (j.rhythm ?? {}) as Record<string, unknown>;
  return {
    link: j.link,
    topic: (j.topic as string | null) ?? null,
    roomKey: String(j.room_key ?? ''),
    roomCode: (j.room_code as string | null) ?? null,
    startsAt: new Date(j.starts_at as string),
    endsAt: new Date(j.ends_at as string),
    seats: Number(j.seats ?? 4),
    rhythm: {
      focus: Number(r.focus_minutes ?? 25),
      break: Number(r.break_minutes ?? 5),
      longBreak: Number(r.long_break_minutes ?? 0),
      longEvery: Number(r.long_every ?? 0),
    },
    hostName: (j.host_name as string | null) ?? null,
    hostShowName: Boolean(j.host_show_name),
    cancelled: Boolean(j.cancelled),
    changed: Boolean(j.changed),
    version: Number(j.version ?? 1),
    isHost: Boolean(j.is_host),
    myAnswer: answers.includes(j.my_answer as Answer) ? (j.my_answer as Answer) : null,
    myShowName: Boolean(j.my_show_name),
    taken: Number(j.taken ?? 1),
    maybe: Number(j.maybe ?? 0),
    seatNames: names(j.seat_names),
    maybeNames: names(j.maybe_names),
  };
}

function args(input: TableInput) {
  return {
    p_topic: input.topic?.trim() || '',
    p_room_key: input.roomKey,
    p_starts_at: input.startsAt.toISOString(),
    p_minutes: input.minutes,
    p_seats: input.seats,
    p_focus_minutes: input.rhythm.focus,
    p_break_minutes: input.rhythm.break,
    p_long_break_minutes: input.rhythm.longBreak,
    p_long_every: input.rhythm.longEvery,
    p_show_name: input.showName,
  };
}

export function supabaseTablesApi(load: () => Promise<FocusClient>): TablesApi {
  const call = async (fn: () => PromiseLike<{ data: unknown; error: unknown }>) => {
    const { data, error } = await fn();
    if (error) throw new ServiceError(errorCode(error as Parameters<typeof errorCode>[0]));
    return data;
  };
  const one = (data: unknown) => {
    const table = toTable(data as Record<string, unknown> | null);
    if (!table) throw new ServiceError('not_found');
    return table;
  };
  return {
    async set(input) {
      const sb = await load();
      return one(await call(() => sb.rpc('set_table', args(input))));
    },
    async fromSession(input) {
      const sb = await load();
      return one(
        await call(() =>
          sb.rpc('table_from_session', {
            p_request_id: input.requestId,
            p_topic: input.topic?.trim() || '',
            p_room_key: input.roomKey,
            p_starts_at: input.startsAt.toISOString(),
            p_ends_at: input.endsAt.toISOString(),
            p_seats: input.seats,
            p_focus_minutes: input.rhythm.focus,
            p_break_minutes: input.rhythm.break,
            p_long_break_minutes: input.rhythm.longBreak,
            p_long_every: input.rhythm.longEvery,
            ...(input.sessionId && { p_session_id: input.sessionId }),
          }),
        ),
      );
    },
    async change(link, expectedVersion, input) {
      const sb = await load();
      return one(await call(() => sb.rpc('change_table', { p_link: link, p_expected_version: expectedVersion, ...args(input) })));
    },
    async cancel(link) {
      const sb = await load();
      return one(await call(() => sb.rpc('cancel_table', { p_link: link })));
    },
    async get(link) {
      const sb = await load();
      return toTable((await call(() => sb.rpc('get_table', { p_link: link }))) as Record<string, unknown> | null);
    },
    async reply(link, answer, showName) {
      const sb = await load();
      return one(await call(() => sb.rpc('reply_table', { p_link: link, p_answer: answer, p_show_name: showName })));
    },
    async mine() {
      const sb = await load();
      const data = await call(() => sb.rpc('my_tables'));
      return (Array.isArray(data) ? data : [])
        .map((j) => toTable(j as Record<string, unknown>))
        .filter((t): t is StudyTable => t !== null);
    },
  };
}
