import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { supabaseTablesApi } from '../../data/tablesApi';
import type { StudyTable, TablesApi } from '../../data/tablesApi';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';

/**
 * Study tables (ADR 0007): the service client and the signed-in student's
 * tables. `api` is null when the build has no focus service; table links
 * then explain that instead of failing.
 */
interface TablesValue {
  api: TablesApi | null;
  /** Tables hosted, sat at or said maybe to, next first. */
  mine: StudyTable[];
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

  const refresh = useCallback(async () => {
    if (!api || !email) {
      setMine([]);
      return;
    }
    try {
      setMine(await api.mine());
    } catch {
      /* offline: keep what we have */
    }
  }, [api, email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remember = useCallback((table: StudyTable) => {
    setMine((list) => {
      const rest = list.filter((t) => t.link !== table.link);
      const keep = table.isHost || table.myAnswer !== null;
      return (keep ? [...rest, table] : rest).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });
  }, []);

  const value = useMemo(() => ({ api, mine, refresh, remember }), [api, mine, refresh, remember]);
  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>;
}

const NONE: TablesValue = { api: null, mine: [], refresh: async () => {}, remember: () => {} };

/** Without a provider (isolated trees, tests) tables are simply off. */
export function useTables(): TablesValue {
  return useContext(TablesContext) ?? NONE;
}
