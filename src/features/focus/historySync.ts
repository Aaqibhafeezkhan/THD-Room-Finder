import type { HistoryApi } from '../../data/focusHistoryApi';
import type { FocusEntry } from '../../domain/focusHistory';

/**
 * One sync of the focus history with the student's account (ADR 0005):
 * download what other devices added since last time, then upload what this
 * device has that the account may not. The first sync on a device (or after
 * an import) uploads everything; the server ignores ids it already has.
 */
export interface SyncState {
  /** The account this state belongs to; another account starts over. */
  account: string;
  /** Server time of the last download. */
  since: string | null;
  /** Everything on this device has been uploaded once. */
  uploaded: boolean;
  /** Entry ids added on this device and not uploaded yet. */
  pending: string[];
}

const KEY = 'thd_focus_sync';

export function freshState(account: string): SyncState {
  return { account, since: null, uploaded: false, pending: [] };
}

export function loadSyncState(account: string): SyncState {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<SyncState>) : null;
    if (s && s.account === account) {
      return { account, since: s.since ?? null, uploaded: Boolean(s.uploaded), pending: Array.isArray(s.pending) ? s.pending : [] };
    }
  } catch {
    /* start over */
  }
  return freshState(account);
}

export function saveSyncState(s: SyncState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sync again from scratch next time */
  }
}

export interface SyncResult {
  /** Entries from the account that this device didn't have. */
  incoming: FocusEntry[];
  state: SyncState;
}

/** Downloads first, so a failed upload still brings the other devices' focus in. */
export async function syncHistory(api: HistoryApi, local: readonly FocusEntry[], state: SyncState): Promise<SyncResult> {
  const known = new Set(local.map((e) => e.id));
  const pulled = await api.pull(state.since);
  const incoming = pulled.entries.filter((e) => !known.has(e.id));
  const afterPull: SyncState = { ...state, since: pulled.serverNow };
  const pending = new Set(state.pending);
  const upload = state.uploaded ? local.filter((e) => pending.has(e.id)) : [...local];
  if (upload.length === 0) return { incoming, state: { ...afterPull, uploaded: true, pending: [] } };
  try {
    await api.push(upload);
    return { incoming, state: { ...afterPull, uploaded: true, pending: [] } };
  } catch {
    return { incoming, state: afterPull };
  }
}
