import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { supabaseIdentityApi } from '../../data/identityApi';
import type { Identity, IdentityApi, IdentityInput, Programme } from '../../data/identityApi';
import { batchLabel } from '../../domain/batch';
import { forgetAccount, readAccount, readStale, write, writeAccount } from '../../data/cache';

/**
 * The signed-in student and their study profile (#18). Browsing, saved rooms
 * and the local timer never need it. `available` is false when the build has
 * no focus service configured; Set Up is then hidden rather than broken.
 * When the service can't be reached the last profile read on this device
 * stays, and `unreachable` says so, instead of looking signed out.
 */
interface StudyProfileValue {
  available: boolean;
  /** True until the stored session and profile have been read. */
  loading: boolean;
  /** Signed in, but the last read of the profile failed (offline, server down). */
  unreachable: boolean;
  email: string | null;
  identity: Identity | null;
  programmes: Programme[];
  programme: Programme | null;
  /** "AIN 7", or null without a listed programme. */
  batch: string | null;
  /** Display name, else the batch, else null. */
  displayName: string | null;
  api: IdentityApi | null;
  /** Re-reads the profile after sign-in; resolves to the stored one, if any. */
  refresh: () => Promise<Identity | null>;
  save: (input: IdentityInput) => Promise<Identity>;
  remove: () => Promise<void>;
  signOut: () => Promise<void>;
}

const StudyProfileContext = createContext<StudyProfileValue | null>(null);

export function StudyProfileProvider({ children, api: injected }: { children: ReactNode; api?: IdentityApi | null }) {
  const [api] = useState<IdentityApi | null>(() => {
    if (injected !== undefined) return injected;
    return focusServiceConfigured ? supabaseIdentityApi(loadSupabase) : null;
  });
  const [loading, setLoading] = useState(Boolean(api));
  const [email, setEmail] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [unreachable, setUnreachable] = useState(false);

  const refresh = useCallback(async () => {
    if (!api) return null;
    let mail: string | null = null;
    try {
      // Read from the stored session; no request.
      mail = await api.currentEmail();
      setEmail(mail);
      if (!mail) {
        setIdentity(null);
        setUnreachable(false);
        forgetAccount();
        return null;
      }
      const stored = await api.getIdentity();
      setIdentity(stored);
      setUnreachable(false);
      writeAccount('identity', mail, stored);
      return stored;
    } catch {
      // Offline or the service is down: keep the last profile seen here.
      const cached = mail ? readAccount<Identity | null>('identity', mail) : null;
      setIdentity((current) => current ?? cached);
      setUnreachable(Boolean(mail));
      return cached;
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!api) return;
    void refresh();
    // The programme list names the batch; the last one read stands in offline.
    api
      .programmes()
      .then((list) => {
        setProgrammes(list);
        write('thd_programmes', list);
      })
      .catch(() => setProgrammes((current) => (current.length ? current : (readStale<Programme[]>('thd_programmes') ?? []))));
    const again = () => void refresh();
    window.addEventListener('online', again);
    const stop = api.onAuthChange((mail) => {
      setEmail(mail);
      if (!mail) {
        setIdentity(null);
        setUnreachable(false);
      }
    });
    return () => {
      stop();
      window.removeEventListener('online', again);
    };
  }, [api, refresh]);

  const save = useCallback(
    async (input: IdentityInput) => {
      if (!api) throw new Error('unavailable');
      const saved = await api.saveIdentity(input, identity?.version ?? null);
      setIdentity(saved);
      setUnreachable(false);
      if (email) writeAccount('identity', email, saved);
      return saved;
    },
    [api, identity?.version, email],
  );

  const remove = useCallback(async () => {
    if (!api) return;
    await api.deleteIdentity();
    await api.signOut();
    forgetAccount();
    setIdentity(null);
    setEmail(null);
  }, [api]);

  const signOut = useCallback(async () => {
    if (!api) return;
    await api.signOut();
    forgetAccount();
    setIdentity(null);
    setEmail(null);
  }, [api]);

  const value = useMemo<StudyProfileValue>(() => {
    const programme = programmes.find((p) => p.id === identity?.programmeId) ?? null;
    const batch =
      programme && identity?.intakeYear && identity.intakeTerm
        ? batchLabel(programme.code, { year: identity.intakeYear, term: identity.intakeTerm }, new Date())
        : null;
    return {
      available: Boolean(api),
      loading,
      unreachable,
      email,
      identity,
      programmes,
      programme,
      batch,
      displayName: identity?.displayName ?? batch,
      api,
      refresh,
      save,
      remove,
      signOut,
    };
  }, [api, loading, unreachable, email, identity, programmes, refresh, save, remove, signOut]);

  return <StudyProfileContext.Provider value={value}>{children}</StudyProfileContext.Provider>;
}

export function useStudyProfile(): StudyProfileValue {
  const ctx = useContext(StudyProfileContext);
  if (!ctx) throw new Error('useStudyProfile must be used within <StudyProfileProvider>');
  return ctx;
}

/** The profile when a provider is present; null in isolated trees (tests). */
export function useOptionalStudyProfile(): StudyProfileValue | null {
  return useContext(StudyProfileContext);
}
