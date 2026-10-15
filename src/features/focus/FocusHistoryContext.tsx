import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import { dailyMinutes, mergeHistory, parseHistoryFile } from '../../domain/focusHistory';
import type { DayMinutes, FocusEntry } from '../../domain/focusHistory';

/**
 * The student's focus history, on this device only. Screens read the days for
 * the graph; ending a session adds one entry; Settings exports, imports and
 * clears it.
 */
interface FocusHistoryValue {
  ready: boolean;
  entries: FocusEntry[];
  days: DayMinutes[];
  add: (entry: FocusEntry) => Promise<void>;
  /** Returns how many new entries the file added. Throws on a bad file. */
  importFile: (text: string) => Promise<number>;
  clear: () => Promise<void>;
}

const FocusHistoryContext = createContext<FocusHistoryValue | null>(null);

export function FocusHistoryProvider({ children, store }: { children: ReactNode; store?: FocusHistoryStore }) {
  const [backend] = useState<FocusHistoryStore>(() => store ?? defaultStore());
  const [entries, setEntries] = useState<FocusEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    backend
      .all()
      .then((all) => live && setEntries(mergeHistory([], all)))
      .catch(() => undefined)
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [backend]);

  const add = useCallback(
    async (entry: FocusEntry) => {
      setEntries((prev) => mergeHistory(prev, [entry]));
      await backend.put([entry]);
    },
    [backend],
  );

  const importFile = useCallback(
    async (text: string) => {
      const incoming = parseHistoryFile(text);
      const current = await backend.all();
      const merged = mergeHistory(current, incoming);
      const added = merged.length - current.length;
      await backend.put(incoming);
      setEntries(merged);
      return added;
    },
    [backend],
  );

  const clear = useCallback(async () => {
    await backend.clear();
    setEntries([]);
  }, [backend]);

  const value = useMemo<FocusHistoryValue>(
    () => ({ ready, entries, days: dailyMinutes(entries), add, importFile, clear }),
    [ready, entries, add, importFile, clear],
  );
  return <FocusHistoryContext.Provider value={value}>{children}</FocusHistoryContext.Provider>;
}

export function useFocusHistory(): FocusHistoryValue {
  const ctx = useContext(FocusHistoryContext);
  if (!ctx) throw new Error('useFocusHistory must be used within <FocusHistoryProvider>');
  return ctx;
}
