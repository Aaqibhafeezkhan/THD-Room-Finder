import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SavedRoomsApi } from '../../data/savedRoomsApi';
import { supabaseSavedRoomsApi } from '../../data/savedRoomsApi';
import { forgetSyncBase, loadSyncBase, saveSyncBase } from '../../data/savedRoomsStore';
import type { FocusClient } from '../../data/supabaseClient';
import type { IdentityApi } from '../../data/identityApi';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { FavoritesProvider, useFavorites } from './favorites';

const LENA = 'lena@example.test';
const DEVICE_KEY = 'thd_favorites';

/** The account's copy, as the server keeps it: a set of identifiers. */
function fakeAccount(initial: string[] = []) {
  const rooms = new Set(initial);
  const api: SavedRoomsApi & { rows: () => string[]; calls: number; offline: boolean; hold: Promise<void> | null } = {
    calls: 0,
    offline: false,
    hold: null,
    rows: () => [...rooms].sort(),
    async sync({ add, remove }) {
      api.calls += 1;
      if (api.offline) throw new Error('network');
      if (api.hold) await api.hold;
      remove.forEach((r) => rooms.delete(r));
      add.forEach((r) => rooms.add(r));
      return api.rows();
    },
  };
  return api;
}

function identity(email: string | null): IdentityApi & { signIn: (mail: string | null) => void } {
  let notify: (mail: string | null) => void = () => {};
  let currentMail = email;
  return {
    signIn(mail) {
      currentMail = mail;
      notify(mail);
    },
    currentEmail: async () => currentMail,
    onAuthChange: (cb) => {
      notify = cb;
      return () => {};
    },
    sendCode: async () => {},
    verifyCode: async () => {},
    signOut: async () => {},
    programmes: async () => [],
    getIdentity: async () => null,
    saveIdentity: async () => {
      throw new Error('unused');
    },
    deleteIdentity: async () => {},
  };
}

let container: HTMLDivElement;
let root: Root | null = null;
let view: ReturnType<typeof useFavorites> | null = null;

function Probe() {
  view = useFavorites();
  return null;
}

const settle = async () => {
  for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
};

async function open(account: SavedRoomsApi | null, user: IdentityApi | null = identity(LENA)) {
  if (root) await close();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () =>
    root!.render(
      <StudyProfileProvider api={user}>
        <FavoritesProvider remote={account}>
          <Probe />
        </FavoritesProvider>
      </StudyProfileProvider>,
    ),
  );
  await settle();
}

async function close() {
  if (root) await act(async () => root!.unmount());
  root = null;
  container?.remove();
}

const device = (rooms: string[]) => localStorage.setItem(DEVICE_KEY, JSON.stringify(rooms));
const onDevice = () => JSON.parse(localStorage.getItem(DEVICE_KEY) ?? 'null') as string[] | null;
const tap = async (room: string) => {
  await act(async () => view!.toggle(room));
  await settle();
};
const comeOnline = async () => {
  await act(async () => void window.dispatchEvent(new Event('online')));
  await settle();
};

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  localStorage.clear();
  forgetSyncBase();
});
afterEach(async () => {
  await close();
  view = null;
});

describe('saved rooms without an account', () => {
  it('stars and unstars on the device and never calls the service', async () => {
    const account = fakeAccount();
    await open(account, identity(null));
    await tap('a');
    await tap('b');
    await tap('a');
    expect(view?.favorites).toEqual(['b']);
    expect(onDevice()).toEqual(['b']);
    expect(view?.sync).toBe('device');
    expect(account.calls).toBe(0);
  });

  it('works in a build with no focus service', async () => {
    device(['a']);
    await open(null, null);
    await tap('b');
    expect(view?.favorites).toEqual(['a', 'b']);
    expect(view?.sync).toBe('device');
  });
});

describe('saved rooms on sign-in', () => {
  it('merges the device and the account without losing either', async () => {
    device(['phone']);
    const account = fakeAccount(['laptop']);
    await open(account);
    expect(view?.favorites).toEqual(['phone', 'laptop']);
    expect(onDevice()).toEqual(['phone', 'laptop']);
    expect(account.rows()).toEqual(['laptop', 'phone']);
    expect(view?.sync).toBe('synced');
  });

  it('signing in while the app is open merges too', async () => {
    device(['phone']);
    const account = fakeAccount(['laptop']);
    const user = identity(null);
    await open(account, user);
    expect(account.calls).toBe(0);
    await act(async () => user.signIn(LENA));
    await settle();
    expect(account.rows()).toEqual(['laptop', 'phone']);
  });
});

describe('saved rooms signed in', () => {
  it('a star reaches the account', async () => {
    const account = fakeAccount();
    await open(account);
    await tap('a');
    expect(account.rows()).toEqual(['a']);
  });

  it('a removal reaches the account and stays removed on the next open', async () => {
    device(['a', 'b']);
    const account = fakeAccount(['a', 'b']);
    await open(account);
    await tap('a');
    expect(account.rows()).toEqual(['b']);
    await open(account);
    expect(view?.favorites).toEqual(['b']);
    expect(account.rows()).toEqual(['b']);
  });

  it('a room removed on another device is not brought back by this one', async () => {
    device(['a', 'b']);
    const account = fakeAccount(['a', 'b']);
    await open(account);
    await close();
    await account.sync({ add: [], remove: ['a'] }); // the laptop removes it
    await open(account);
    expect(view?.favorites).toEqual(['b']);
    expect(account.rows()).toEqual(['b']);
  });

  it('a removal elsewhere still sticks when this device was signed out meanwhile', async () => {
    device(['a', 'b']);
    const account = fakeAccount(['a', 'b']);
    const user = identity(LENA);
    await open(account, user);
    await act(async () => user.signIn(null));
    await settle();
    expect(view?.favorites).toEqual(['a', 'b']);
    await account.sync({ add: [], remove: ['a'] });
    await act(async () => user.signIn(LENA));
    await settle();
    expect(view?.favorites).toEqual(['b']);
    expect(account.rows()).toEqual(['b']);
  });

  it('a star tapped while a sync is running is neither lost nor undone', async () => {
    const account = fakeAccount(['a']);
    await open(account);
    let release: () => void = () => {};
    account.hold = new Promise((r) => (release = r));
    await tap('b');
    await tap('c');
    await tap('a');
    expect(view?.favorites).toEqual(['b', 'c']);
    account.hold = null;
    await act(async () => release());
    await settle();
    expect(view?.favorites).toEqual(['b', 'c']);
    expect(account.rows()).toEqual(['b', 'c']);
  });

  it('a sync that answers after signing out does not touch the list', async () => {
    const account = fakeAccount(['a']);
    let release: () => void = () => {};
    account.hold = new Promise((r) => (release = r));
    const user = identity(LENA);
    device(['mine']);
    await open(account, user);
    await act(async () => user.signIn(null));
    await settle();
    account.hold = null;
    await act(async () => release());
    await settle();
    expect(view?.favorites).toEqual(['mine']);
    expect(view?.sync).toBe('device');
  });

  it('another account on the same device starts from a plain merge', async () => {
    saveSyncBase(LENA, ['a']);
    expect(loadSyncBase('max@example.test')).toEqual([]);
    expect(loadSyncBase(LENA)).toEqual(['a']);
  });
});

describe('saved rooms when the service fails', () => {
  it('offline, the list still changes and says it has not synced', async () => {
    device(['a']);
    const account = fakeAccount(['a']);
    await open(account);
    account.offline = true;
    await tap('b');
    await tap('a');
    expect(view?.favorites).toEqual(['b']);
    expect(onDevice()).toEqual(['b']);
    expect(view?.sync).toBe('failed');
    expect(account.rows()).toEqual(['a']);
  });

  it('back online, offline adds and removals both reach the account', async () => {
    device(['a']);
    const account = fakeAccount(['a']);
    await open(account);
    account.offline = true;
    await tap('b');
    await tap('a');
    account.offline = false;
    await comeOnline();
    expect(account.rows()).toEqual(['b']);
    expect(view?.favorites).toEqual(['b']);
    expect(view?.sync).toBe('synced');
  });

  it('changes made offline survive closing the app', async () => {
    device(['a']);
    const account = fakeAccount(['a']);
    await open(account);
    account.offline = true;
    await tap('a');
    await tap('b');
    await close();
    account.offline = false;
    await open(account);
    expect(view?.favorites).toEqual(['b']);
    expect(account.rows()).toEqual(['b']);
  });

  it('a service that is down at sign-in leaves the device list alone', async () => {
    device(['a']);
    const account = fakeAccount(['b']);
    account.offline = true;
    await open(account);
    expect(view?.favorites).toEqual(['a']);
    expect(view?.sync).toBe('failed');
  });

  it('Try again syncs without waiting for an event', async () => {
    device(['a']);
    const account = fakeAccount();
    account.offline = true;
    await open(account);
    account.offline = false;
    await act(async () => view!.retrySync());
    await settle();
    expect(view?.sync).toBe('synced');
    expect(account.rows()).toEqual(['a']);
  });

  it('an unreadable device list is unknown, so it removes nothing from the account', async () => {
    device(['a', 'b']);
    const account = fakeAccount(['a', 'b']);
    await open(account);
    await close();
    localStorage.setItem(DEVICE_KEY, '{not json');
    await open(account);
    expect(view?.favorites).toEqual(['a', 'b']);
    expect(account.rows()).toEqual(['a', 'b']);
  });

  it('follows a change made in another tab', async () => {
    device(['a']);
    await open(null, null);
    device(['a', 'b']);
    await act(async () => void window.dispatchEvent(new StorageEvent('storage', { key: DEVICE_KEY })));
    expect(view?.favorites).toEqual(['a', 'b']);
  });
});

describe('supabaseSavedRoomsApi', () => {
  const client = (result: { data: unknown; error: unknown }) =>
    (async () => ({ rpc: async () => result }) as unknown as FocusClient) as () => Promise<FocusClient>;

  it('returns the rooms the account now holds', async () => {
    const api = supabaseSavedRoomsApi(client({ data: ['a'], error: null }));
    await expect(api.sync({ add: ['a'], remove: [] })).resolves.toEqual(['a']);
  });

  it('treats a missing answer as a failure, never as an empty list', async () => {
    const api = supabaseSavedRoomsApi(client({ data: null, error: null }));
    await expect(api.sync({ add: [], remove: [] })).rejects.toThrow();
  });

  it('turns a refused call into a service error', async () => {
    const api = supabaseSavedRoomsApi(client({ data: null, error: { hint: 'saved_rooms_full' } }));
    await expect(api.sync({ add: ['a'], remove: [] })).rejects.toThrow('saved_rooms_full');
  });
});
