import type { FocusEntry } from '../domain/focusHistory';
import { ServiceError, errorCode } from './identityApi';
import type { FocusClient } from './supabaseClient';

/**
 * The signed-in student's focus history on the server (ADR 0005): id, start,
 * end and minutes per entry. Room codes are dropped before upload and never
 * come back.
 */
export interface HistoryApi {
  /** Entries stored after `since` (all when null), and the time to pass next. */
  pull(since: string | null): Promise<{ entries: FocusEntry[]; serverNow: string }>;
  /** Uploads entries; ones already stored are ignored. Returns how many were new. */
  push(entries: FocusEntry[]): Promise<number>;
  clear(): Promise<void>;
}

/** The server takes at most this many entries per call. */
export const PUSH_CHUNK = 500;

export function toRemote(e: FocusEntry) {
  return { id: e.id, started_at: e.startedAt, ended_at: e.endedAt, minutes: e.minutes };
}

export function fromRemote(j: unknown): FocusEntry | null {
  if (!j || typeof j !== 'object') return null;
  const r = j as Record<string, unknown>;
  const startedAt = typeof r.started_at === 'string' ? new Date(r.started_at) : null;
  const endedAt = typeof r.ended_at === 'string' ? new Date(r.ended_at) : null;
  const minutes = Number(r.minutes);
  if (typeof r.id !== 'string' || !startedAt || !endedAt || Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return null;
  }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return null;
  return { id: r.id, startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), minutes };
}

export function supabaseHistoryApi(load: () => Promise<FocusClient>): HistoryApi {
  const call = async (fn: string, args: Record<string, unknown>) => {
    const sb = await load();
    const { data, error } = await (sb.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { hint?: string; code?: string; message?: string } | null }>)(fn, args);
    if (error) throw new ServiceError(errorCode(error));
    return data;
  };
  return {
    async pull(since) {
      const data = (await call('get_focus_history', since ? { p_since: since } : {})) as { server_now?: string; entries?: unknown[] } | null;
      const entries = (data?.entries ?? []).map(fromRemote).filter((e): e is FocusEntry => e !== null);
      return { entries, serverNow: data?.server_now ?? new Date().toISOString() };
    },
    async push(entries) {
      let added = 0;
      for (let i = 0; i < entries.length; i += PUSH_CHUNK) {
        added += Number(await call('put_focus_history', { p_entries: entries.slice(i, i + PUSH_CHUNK).map(toRemote) }));
      }
      return added;
    },
    async clear() {
      await call('clear_focus_history', {});
    },
  };
}
