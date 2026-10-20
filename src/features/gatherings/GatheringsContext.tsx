import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { supabaseGatheringsApi } from '../../data/gatheringsApi';
import type { Gathering, GatheringsApi, MyOrganizations } from '../../data/gatheringsApi';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';

/**
 * Organizations and gatherings (ADR 0008): the service client, the student's
 * gatherings (replied to or hosted by their groups) and their registry
 * requests and groups. `api` is null when the build has no focus service.
 */
interface GatheringsValue {
  api: GatheringsApi | null;
  mine: Gathering[];
  orgs: MyOrganizations;
  /** Verified groups the student organizes for. */
  hosting: MyOrganizations['groups'];
  refresh: () => Promise<void>;
  remember: (gathering: Gathering) => void;
}

const EMPTY: MyOrganizations = { requests: [], groups: [] };
const GatheringsContext = createContext<GatheringsValue | null>(null);

export function GatheringsProvider({ children, api: injected }: { children: ReactNode; api?: GatheringsApi | null }) {
  const [api] = useState<GatheringsApi | null>(() => {
    if (injected !== undefined) return injected;
    return focusServiceConfigured ? supabaseGatheringsApi(loadSupabase) : null;
  });
  const profile = useOptionalStudyProfile();
  const email = profile?.email ?? null;
  const [mine, setMine] = useState<Gathering[]>([]);
  const [orgs, setOrgs] = useState<MyOrganizations>(EMPTY);

  const refresh = useCallback(async () => {
    if (!api || !email) {
      setMine([]);
      setOrgs(EMPTY);
      return;
    }
    try {
      const [g, o] = await Promise.all([api.mine(), api.myOrganizations()]);
      setMine(g);
      setOrgs(o);
    } catch {
      /* offline: keep what we have */
    }
  }, [api, email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remember = useCallback((g: Gathering) => {
    setMine((list) => {
      const rest = list.filter((x) => x.link !== g.link);
      const keep = g.isOrganizer || g.myAnswer !== null;
      return (keep ? [...rest, g] : rest).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });
  }, []);

  const hosting = useMemo(() => orgs.groups.filter((g) => g.verified), [orgs]);
  const value = useMemo(() => ({ api, mine, orgs, hosting, refresh, remember }), [api, mine, orgs, hosting, refresh, remember]);
  return <GatheringsContext.Provider value={value}>{children}</GatheringsContext.Provider>;
}

const NONE: GatheringsValue = { api: null, mine: [], orgs: EMPTY, hosting: [], refresh: async () => {}, remember: () => {} };

/** Without a provider (isolated trees, tests) gatherings are simply off. */
export function useGatherings(): GatheringsValue {
  return useContext(GatheringsContext) ?? NONE;
}
