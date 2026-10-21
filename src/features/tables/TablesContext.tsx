import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { supabaseTablesApi } from '../../data/tablesApi';
import type { StudyTable, TablesApi } from '../../data/tablesApi';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';
import { readAccount, writeAccount } from '../../data/cache';

/**
 * Study tables (ADR 0007): the service client and the signed-in student's
 * tables. `api` is null when the build has no focus service; table links
 * then explain that instead of failing. The last list read on this device
 * stays when the service can't be reached, and `failed` says so.
 */
interface TablesValue {
  api: TablesApi | null;
  /** Tables hosted, sat at or said maybe to, next first. */
  mine: StudyTable[];
  /** The last refresh failed; `mine` is what was read before, if anything. */
  failed: boolean;
  refresh: () => Promise<void>;
  /** Put a just-saved table into the list without a round trip. */
  remember: (table: StudyTable) => void;
}

const TablesContext = createContext<TablesValue | null>(null);

export function TablesProvider({ children, api: injected }: { children: ReactNode; api?: TablesApi | null }) {
  const [api] = useState<TablesApi | null>(() => {
    if (injected !== undefined) return injected;
    return focusServiceConfigured ? supabaseTablesApi(loadSupabase) : null;
  });
  const profile = useOptionalStudyProfile();
  const email = profile?.email ?? null;
  const [mine, setMine] = useState<StudyTable[]>([]);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!api || !email) {
      setMine([]);
      setFailed(false);
      return;
    }
    try {
      const list = await api.mine();
      setMine(list);
      setFailed(false);
      writeAccount('tables', email, list);
    } catch {
      // Offline or the service is down: show the last list seen here.
      const cached = readAccount<StudyTable[]>('tables', email) ?? [];
      setMine((current) => (current.length ? current : cached.map(revive)));
      setFailed(true);
    }
  }, [api, email]);

  useEffect(() => {
    void refresh();
    // Back online: read again instead of showing the old list.
    const again = () => void refresh();
    window.addEventListener('online', again);
    return () => window.removeEventListener('online', again);
  }, [refresh]);

  const remember = useCallback((table: StudyTable) => {
    setMine((list) => {
      const rest = list.filter((t) => t.link !== table.link);
      const keep = table.isHost || table.myAnswer !== null;
      return (keep ? [...rest, table] : rest).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });
  }, []);

  const value = useMemo(() => ({ api, mine, failed, refresh, remember }), [api, mine, failed, refresh, remember]);
  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>;
}

const NONE: TablesValue = { api: null, mine: [], failed: false, refresh: async () => {}, remember: () => {} };

/** Dates come back from storage as strings. */
const revive = (x: StudyTable): StudyTable => ({ ...x, startsAt: new Date(x.startsAt), endsAt: new Date(x.endsAt) });

/** Without a provider (isolated trees, tests) tables are simply off. */
export function useTables(): TablesValue {
  return useContext(TablesContext) ?? NONE;
}
