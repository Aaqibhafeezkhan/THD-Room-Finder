import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabaseSavedRoomsApi } from '../../data/savedRoomsApi';
import type { SavedRoomsApi } from '../../data/savedRoomsApi';
import {
  SAVED_ROOMS_STORAGE_KEY,
  loadSavedRooms,
  loadSyncBase,
  saveSavedRooms,
  saveSyncBase,
} from '../../data/savedRoomsStore';
import { focusServiceConfigured, loadSupabase } from '../../data/supabaseClient';
import { hasSavedRoomChanges, mergeSavedRooms, savedRoomChanges } from '../../domain/savedRooms';
import { useOptionalStudyProfile } from '../profile/StudyProfileContext';

/**
 * Saved rooms — a student stars the rooms they keep coming back to (their usual
 * quiet spot on J's second floor), and Profile answers "is it free right now?".
 * The list always lives on the device and works without an account; signed in,
 * it also syncs with the account (ADR 0013). A change is on the device first,
 * and anything the account hasn't received goes out on the next sync.
 */
export type SavedRoomsSync =
  /** No account: the list is on this device only. */
  | 'device'
  /** Signed in, and the first answer from the account hasn't come yet. */
  | 'pending'
  | 'synced'
  /** The last sync failed; the list still works and will sync later. */
  | 'failed';

interface FavoritesValue {
  favorites: string[];
  isFavorite: (ident: string) => boolean;
  toggle: (ident: string) => void;
  sync: SavedRoomsSync;
  retrySync: () => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

const CONFIGURED_REMOTE: SavedRoomsApi | null = focusServiceConfigured ? supabaseSavedRoomsApi(loadSupabase) : null;
/** Least time between syncs triggered by coming back to the app. */
const RESYNC_MS = 60_000;

export function FavoritesProvider({
  children,
  remote = CONFIGURED_REMOTE,
}: {
  children: ReactNode;
  remote?: SavedRoomsApi | null;
}) {
  const [favorites, setFavorites] = useState<string[]>(loadSavedRooms);
  const [status, setStatus] = useState<'pending' | 'synced' | 'failed'>('pending');
  const current = useRef(favorites);

  const email = useOptionalStudyProfile()?.email ?? null;
  const account = remote ? email : null;
  const signedInAs = useRef(account);
  signedInAs.current = account;

  const running = useRef(false);
  const again = useRef(false);
  const lastSync = useRef(0);
  const latestSync = useRef<() => Promise<void>>(async () => {});

  const show = useCallback((rooms: string[]) => {
    current.current = rooms;
    setFavorites(rooms);
  }, []);

  const sync = useCallback(async () => {
    if (!remote || !account) return;
    // One request at a time; changes made meanwhile go out right after it.
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    lastSync.current = Date.now();
    try {
      do {
        again.current = false;
        const sent = current.current;
        const stored = await remote.sync(savedRoomChanges(loadSyncBase(account), sent));
        if (signedInAs.current !== account) return;
        // `sent` is the base here: a star tapped during the request survives.
        const merged = mergeSavedRooms(sent, current.current, stored);
        show(merged);
        saveSyncBase(account, stored, saveSavedRooms(merged));
        setStatus('synced');
        if (hasSavedRoomChanges(savedRoomChanges(stored, merged))) again.current = true;
      } while (again.current);
    } catch {
      // Offline, paused or refused: the list stays, and the difference from
      // the base is what the next sync sends.
      if (signedInAs.current === account) setStatus('failed');
    } finally {
      running.current = false;
      if (again.current) {
        again.current = false;
        void latestSync.current();
      }
    }
  }, [remote, account, show]);
  latestSync.current = sync;

  // Sync on sign-in and app open, then whenever the app or the network returns.
  useEffect(() => {
    setStatus('pending');
    if (!account) return;
    void sync();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSync.current > RESYNC_MS) void sync();
    };
    const onOnline = () => void sync();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [account, sync]);

  // Another tab changed the list: follow it, so this tab doesn't write back an old one.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_ROOMS_STORAGE_KEY || e.key === null) show(loadSavedRooms());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [show]);

  const toggle = useCallback(
    (ident: string) => {
      const prev = current.current;
      const next = prev.includes(ident) ? prev.filter((i) => i !== ident) : [...prev, ident];
      show(next);
      saveSavedRooms(next);
      void sync();
    },
    [show, sync],
  );

  const retrySync = useCallback(() => void sync(), [sync]);

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites,
      isFavorite: (ident) => favorites.includes(ident),
      toggle,
      sync: account ? status : 'device',
      retrySync,
    }),
    [favorites, toggle, account, status, retrySync],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>');
  return ctx;
}
