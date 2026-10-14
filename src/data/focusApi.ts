import { ServiceError, errorCode } from './identityApi';
import type { FocusClient } from './supabaseClient';

/**
 * Focus session calls (docs/architecture/focus-service.md): start, renew,
 * change visibility, end, read the caller's session, and the per-room
 * summaries anyone may read. Room keys are `thd:<THabella ident>`.
 */
export type Visibility = 'private' | 'public';

export interface SessionDto {
  id: string;
  roomKey: string;
  visibility: Visibility;
  showName: boolean;
  startedAt: Date;
  plannedEnd: Date;
  leaseUntil: Date;
  endedAt: Date | null;
  endReason: string | null;
  version: number;
  /** Server clock minus device clock, in ms, at the time of the reply. */
  skewMs: number;
}

export interface RoomSummary {
  roomKey: string;
  /** Sessions shown as anonymous claims to the caller. */
  claims: number;
  claimSince: Date | null;
  /** Public sessions of the caller's own batch. */
  batchCount: number;
  batchSince: Date | null;
  batchNames: string[];
  /** The caller's own session is in this room. */
  own: boolean;
}

export interface StartInput {
  roomKey: string;
  minutes: number;
  visibility: Visibility;
  showName: boolean;
  requestId: string;
  /** End a running session elsewhere first (moving rooms). */
  replace: boolean;
}

export interface FocusApi {
  start(input: StartInput): Promise<SessionDto>;
  renew(id: string, version: number): Promise<SessionDto>;
  update(id: string, version: number, visibility: Visibility, showName: boolean): Promise<SessionDto>;
  end(id: string): Promise<void>;
  current(): Promise<SessionDto | null>;
  summaries(campus: string): Promise<RoomSummary[]>;
}

/** Campuses `room_summaries` is scoped by (scripts/dev/focus-rooms-sql.py). */
export const CAMPUSES = ['deggendorf', 'pfarrkirchen', 'cham', 'other'] as const;

export function roomKey(ident: string): string {
  return `thd:${ident}`;
}

function toSession(j: Record<string, unknown> | null): SessionDto | null {
  if (!j) return null;
  const date = (v: unknown) => (v ? new Date(String(v)) : null);
  const serverNow = date(j.server_now);
  return {
    id: String(j.id),
    roomKey: String(j.room_key),
    visibility: j.visibility === 'public' ? 'public' : 'private',
    showName: Boolean(j.show_name),
    startedAt: date(j.started_at)!,
    plannedEnd: date(j.planned_end)!,
    leaseUntil: date(j.lease_until)!,
    endedAt: date(j.ended_at),
    endReason: (j.end_reason as string | null) ?? null,
    version: Number(j.version),
    skewMs: serverNow ? serverNow.getTime() - Date.now() : 0,
  };
}

export function supabaseFocusApi(load: () => Promise<FocusClient>): FocusApi {
  const call = async (fn: string, args: Record<string, unknown>) => {
    const sb = await load();
    // The generated types know every function; the loose call keeps this
    // wrapper short.
    const { data, error } = await (sb.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { hint?: string; code?: string; message?: string } | null }>)(fn, args);
    if (error) throw new ServiceError(errorCode(error));
    return data;
  };
  return {
    async start(i) {
      const data = await call('start_focus', {
        p_room_key: i.roomKey,
        p_planned_minutes: i.minutes,
        p_visibility: i.visibility,
        p_show_name: i.showName,
        p_request_id: i.requestId,
        p_replace: i.replace,
      });
      return toSession(data as Record<string, unknown>)!;
    },
    async renew(id, version) {
      return toSession((await call('renew_focus', { p_session_id: id, p_expected_version: version })) as Record<string, unknown>)!;
    },
    async update(id, version, visibility, showName) {
      const data = await call('update_focus', {
        p_session_id: id,
        p_expected_version: version,
        p_visibility: visibility,
        p_show_name: showName,
      });
      return toSession(data as Record<string, unknown>)!;
    },
    async end(id) {
      await call('end_focus', { p_session_id: id });
    },
    async current() {
      return toSession((await call('get_focus', {})) as Record<string, unknown> | null);
    },
    async summaries(campus) {
      const rows = (await call('room_summaries', { p_campus: campus })) as Record<string, unknown>[] | null;
      return (rows ?? []).map((r) => ({
        roomKey: String(r.room_key),
        claims: Number(r.claims ?? 0),
        claimSince: r.claim_since ? new Date(String(r.claim_since)) : null,
        batchCount: Number(r.batch_count ?? 0),
        batchSince: r.batch_since ? new Date(String(r.batch_since)) : null,
        batchNames: Array.isArray(r.batch_names) ? (r.batch_names as string[]) : [],
        own: Boolean(r.own),
      }));
    },
  };
}
