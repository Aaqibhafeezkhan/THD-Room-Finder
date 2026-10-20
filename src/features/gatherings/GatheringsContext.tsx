import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { supabaseGatheringsApi } from '../../data/gatheringsApi';
import type { Gathering, GatheringsApi, MyOrganizations } from '../../data/gatheringsApi';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';
import { readAccount, writeAccount } from '../../data/cache';

/**
 * Organizations and gatherings (ADR 0008): the service client, the student's
 * gatherings (replied to or hosted by their groups) and their registry
 * requests and groups. `api` is null when the build has no focus service.
 * The last lists read on this device stay when the service can't be
 * reached, and `failed` says so.
 */
interface GatheringsValue {
  api: GatheringsApi | null;
  mine: Gathering[];
  orgs: MyOrganizations;
  /** The last refresh failed; the lists are what was read before, if anything. */
  failed: boolean;
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
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!api || !email) {
      setMine([]);
      setOrgs(EMPTY);
      setFailed(false);
      return;
    }
    try {
      const [g, o] = await Promise.all([api.mine(), api.myOrganizations()]);
      setMine(g);
      setOrgs(o);
      setFailed(false);
      writeAccount('gatherings', email, { mine: g, orgs: o });
    } catch {
      // Offline or the service is down: show the last lists seen here.
      const cached = readAccount<{ mine: Gathering[]; orgs: MyOrganizations }>('gatherings', email);
      if (cached) {
        setMine((current) => (current.length ? current : cached.mine.map(revive)));
        setOrgs((current) => (current.groups.length || current.requests.length ? current : cached.orgs));
      }
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

  const remember = useCallback((g: Gathering) => {
    setMine((list) => {
      const rest = list.filter((x) => x.link !== g.link);
      const keep = g.isOrganizer || g.myAnswer !== null;
      return (keep ? [...rest, g] : rest).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });
  }, []);

  const hosting = useMemo(() => orgs.groups.filter((g) => g.verified), [orgs]);
  const value = useMemo(() => ({ api, mine, orgs, failed, hosting, refresh, remember }), [api, mine, orgs, failed, hosting, refresh, remember]);
  return <GatheringsContext.Provider value={value}>{children}</GatheringsContext.Provider>;
}

const NONE: GatheringsValue = { api: null, mine: [], orgs: EMPTY, failed: false, hosting: [], refresh: async () => {}, remember: () => {} };

/** Dates come back from storage as strings. */
const revive = (g: Gathering): Gathering => ({ ...g, startsAt: new Date(g.startsAt), endsAt: new Date(g.endsAt) });

/** Without a provider (isolated trees, tests) gatherings are simply off. */
export function useGatherings(): GatheringsValue {
  return useContext(GatheringsContext) ?? NONE;
}
