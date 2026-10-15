import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import { supabaseHistoryApi } from '../../data/focusHistoryApi';
import type { HistoryApi } from '../../data/focusHistoryApi';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { dailyMinutes, mergeHistory, parseHistoryFile } from '../../domain/focusHistory';
import type { DayMinutes, FocusEntry } from '../../domain/focusHistory';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';
import { loadSyncState, saveSyncState, syncHistory } from './historySync';

/**
 * The student's focus history. It always lives on the device (IndexedDB);
 * signed in, it also syncs with the account (ADR 0005): dates and minutes,
 * never rooms. Screens read the days for the graph; ending a session adds
 * one entry; Settings exports, imports and clears it.
 */
interface FocusHistoryValue {
  ready: boolean;
  entries: FocusEntry[];
  days: DayMinutes[];
  /** The account the history syncs with, or null on this device only. */
  syncedWith: string | null;
  add: (entry: FocusEntry) => Promise<void>;
  /** Returns how many new entries the file added. Throws on a bad file. */
  importFile: (text: string) => Promise<number>;
  /** Clears this device and, signed in, the account. Throws when the
   *  account copy couldn't be cleared (offline), leaving both as they were. */
  clear: () => Promise<void>;
}

const FocusHistoryContext = createContext<FocusHistoryValue | null>(null);

const CONFIGURED_REMOTE: HistoryApi | null = focusServiceConfigured ? supabaseHistoryApi(loadSupabase) : null;
/** Least time between syncs triggered by opening the app. */
const RESYNC_MS = 60_000;

export function FocusHistoryProvider({
  children,
  store,
  remote = CONFIGURED_REMOTE,
}: {
  children: ReactNode;
  store?: FocusHistoryStore;
  remote?: HistoryApi | null;
}) {
  const [backend] = useState<FocusHistoryStore>(() => store ?? defaultStore());
  const [entries, setEntries] = useState<FocusEntry[]>([]);
  const [ready, setReady] = useState(false);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const account = useOptionalStudyProfile()?.email ?? null;
  const syncedWith = remote && account ? account : null;
  const syncing = useRef(false);
  const lastSync = useRef(0);

  useEffect(() => {
    let live = true;
    backend
      .all()
      .then((all) => live && setEntries((prev) => mergeHistory(prev, all)))
      .catch(() => undefined)
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [backend]);

  const sync = useCallback(async () => {
    if (!remote || !syncedWith || syncing.current) return;
    syncing.current = true;
    lastSync.current = Date.now();
    try {
      const { incoming, state } = await syncHistory(remote, entriesRef.current, loadSyncState(syncedWith));
      saveSyncState(state);
      if (incoming.length) {
        await backend.put(incoming);
        setEntries((prev) => mergeHistory(prev, incoming));
      }
    } catch {
      /* offline or signed out meanwhile: try again next time */
    } finally {
      syncing.current = false;
    }
  }, [backend, remote, syncedWith]);

  // Sync when the history is loaded and signed in, and when the app comes back.
  useEffect(() => {
    if (!ready || !syncedWith) return;
    void sync();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSync.current > RESYNC_MS) void sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ready, syncedWith, sync]);

  const add = useCallback(
    async (entry: FocusEntry) => {
      setEntries((prev) => mergeHistory(prev, [entry]));
      entriesRef.current = mergeHistory(entriesRef.current, [entry]);
      await backend.put([entry]);
      if (syncedWith) {
        const s = loadSyncState(syncedWith);
        saveSyncState({ ...s, pending: [...new Set([...s.pending, entry.id])] });
        void sync();
      }
    },
    [backend, sync, syncedWith],
  );

  const importFile = useCallback(
    async (text: string) => {
      const incoming = parseHistoryFile(text);
      const current = await backend.all();
      const merged = mergeHistory(current, incoming);
      const added = merged.length - current.length;
      await backend.put(incoming);
      setEntries(merged);
      entriesRef.current = merged;
      if (syncedWith) {
        // Upload everything once more; the account ignores what it has.
        saveSyncState({ ...loadSyncState(syncedWith), uploaded: false });
        void sync();
      }
      return added;
    },
    [backend, sync, syncedWith],
  );

  const clear = useCallback(async () => {
    if (remote && syncedWith) {
      await remote.clear();
      saveSyncState({ ...loadSyncState(syncedWith), uploaded: true, pending: [] });
    }
    await backend.clear();
    setEntries([]);
  }, [backend, remote, syncedWith]);

  const value = useMemo<FocusHistoryValue>(
    () => ({ ready, entries, days: dailyMinutes(entries), syncedWith, add, importFile, clear }),
    [ready, entries, syncedWith, add, importFile, clear],
  );
  return <FocusHistoryContext.Provider value={value}>{children}</FocusHistoryContext.Provider>;
}

export function useFocusHistory(): FocusHistoryValue {
  const ctx = useContext(FocusHistoryContext);
  if (!ctx) throw new Error('useFocusHistory must be used within <FocusHistoryProvider>');
  return ctx;
}
