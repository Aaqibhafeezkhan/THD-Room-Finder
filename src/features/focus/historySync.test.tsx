import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import type { HistoryApi } from '../../data/focusHistoryApi';
import { fromRemote, toRemote } from '../../data/focusHistoryApi';
import type { IdentityApi } from '../../data/identityApi';
import type { FocusEntry } from '../../domain/focusHistory';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { FocusHistoryProvider, useFocusHistory } from './FocusHistoryContext';
import { freshState, loadSyncState, saveSyncState, syncHistory } from './historySync';

const entry = (id: string, day: number, minutes = 25, room?: string): FocusEntry => ({
  id,
  startedAt: new Date(2026, 9, day, 10).toISOString(),
  endedAt: new Date(2026, 9, day, 10, minutes).toISOString(),
  minutes,
  ...(room ? { room } : {}),
});

/** The account's copy, as the server keeps it: no rooms, union by id. */
function fakeAccount(initial: FocusEntry[] = []) {
  let rows = initial.map((e) => ({ e: { id: e.id, startedAt: e.startedAt, endedAt: e.endedAt, minutes: e.minutes }, at: 1 }));
  let clock = 1;
  const api: HistoryApi & { rows: () => FocusEntry[]; pushes: FocusEntry[][]; offline: boolean } = {
    pushes: [],
    offline: false,
    rows: () => rows.map((r) => r.e),
    async pull(since) {
      if (api.offline) throw new Error('network');
      const after = since ? Number(since) : 0;
      return { entries: rows.filter((r) => r.at > after).map((r) => r.e), serverNow: String(clock) };
    },
    async push(entries) {
      if (api.offline) throw new Error('network');
      api.pushes.push(entries);
      clock += 1;
      let added = 0;
      for (const e of entries) {
        if (rows.some((r) => r.e.id === e.id)) continue;
        rows.push({ e: { id: e.id, startedAt: e.startedAt, endedAt: e.endedAt, minutes: e.minutes }, at: clock });
        added += 1;
      }
      return added;
    },
    async clear() {
      if (api.offline) throw new Error('network');
      rows = [];
    },
  };
  return api;
}

beforeEach(() => localStorage.clear());

describe('syncHistory', () => {
  it('first sync on a device uploads everything and brings in what other devices added', async () => {
    const account = fakeAccount([entry('laptop-1', 12, 50)]);
    const local = [entry('phone-1', 13, 25, 'E 212')];
    const { incoming, state } = await syncHistory(account, local, freshState('lena@example.test'));
    expect(incoming.map((e) => e.id)).toEqual(['laptop-1']);
    expect(account.rows().map((e) => e.id).sort()).toEqual(['laptop-1', 'phone-1']);
    expect(state).toMatchObject({ uploaded: true, pending: [], since: '1' });
  });

  it('later syncs upload only the entries added since', async () => {
    const account = fakeAccount();
    const local = [entry('a', 12), entry('b', 13)];
    const first = await syncHistory(account, local, freshState('lena@example.test'));
    const next = await syncHistory(account, [...local, entry('c', 14)], { ...first.state, pending: ['c'] });
    expect(account.pushes.map((p) => p.map((e) => e.id))).toEqual([['a', 'b'], ['c']]);
    expect(next.state.pending).toEqual([]);
  });

  it('an upload that fails keeps the entries pending', async () => {
    const account = fakeAccount([entry('laptop-1', 12)]);
    account.push = async () => {
      throw new Error('network');
    };
    const { incoming, state } = await syncHistory(account, [entry('x', 13)], { ...freshState('lena@example.test'), uploaded: true, pending: ['x'] });
    expect(incoming.map((e) => e.id)).toEqual(['laptop-1']);
    expect(state.pending).toEqual(['x']);
  });

  it('room codes never leave the device', () => {
    expect(toRemote(entry('a', 12, 25, 'E 212'))).toEqual({
      id: 'a',
      started_at: entry('a', 12).startedAt,
      ended_at: entry('a', 12).endedAt,
      minutes: 25,
    });
    expect(fromRemote({ id: 'a', started_at: '2026-10-12T08:00:00Z', ended_at: '2026-10-12T08:25:00Z', minutes: 25, room: 'E 212' })).not.toHaveProperty('room');
    expect(fromRemote({ id: 'a', started_at: 'nope', ended_at: '2026-10-12T08:25:00Z', minutes: 25 })).toBeNull();
  });

  it('another account on the same device starts over', () => {
    saveSyncState({ account: 'lena@example.test', since: '5', uploaded: true, pending: [] });
    expect(loadSyncState('max@example.test')).toEqual(freshState('max@example.test'));
    expect(loadSyncState('lena@example.test').since).toBe('5');
  });
});

// ── The provider, signed in on a second device ─────────────────────────
let container: HTMLDivElement;
let root: Root;
let view: ReturnType<typeof useFocusHistory> | null = null;

function Probe() {
  view = useFocusHistory();
  return null;
}

const signedIn: IdentityApi = {
  currentEmail: async () => 'lena@example.test',
  onAuthChange: () => () => {},
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

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  view = null;
});

async function mount(account: HistoryApi, local: FocusEntry[], identity: IdentityApi | null = signedIn) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const store = memoryStore(local);
  await act(async () =>
    root.render(
      <StudyProfileProvider api={identity}>
        <FocusHistoryProvider store={store} remote={account}>
          <Probe />
        </FocusHistoryProvider>
      </StudyProfileProvider>,
    ),
  );
  for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
  return store;
}

describe('FocusHistoryProvider sync', () => {
  it('signed in, the graph shows the focus from the other device too', async () => {
    const account = fakeAccount([entry('laptop-1', 12, 50)]);
    const store = await mount(account, [entry('phone-1', 13)]);
    expect(view?.syncedWith).toBe('lena@example.test');
    expect(view?.entries.map((e) => e.id)).toEqual(['laptop-1', 'phone-1']);
    expect((await store.all()).map((e) => e.id).sort()).toEqual(['laptop-1', 'phone-1']);
    expect(account.rows().map((e) => e.id).sort()).toEqual(['laptop-1', 'phone-1']);
  });

  it('a session finished here reaches the account', async () => {
    const account = fakeAccount();
    await mount(account, []);
    await act(async () => view!.add(entry('new', 15, 25, 'C011')));
    for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
    expect(account.rows()).toEqual([{ id: 'new', startedAt: entry('new', 15).startedAt, endedAt: entry('new', 15).endedAt, minutes: 25 }]);
  });

  it('clearing offline clears nothing and says so', async () => {
    const account = fakeAccount([entry('a', 12)]);
    await mount(account, [entry('a', 12)]);
    account.offline = true;
    let failed = false;
    await act(async () => {
      try {
        await view!.clear();
      } catch {
        failed = true;
      }
    });
    expect(failed).toBe(true);
    expect(view?.entries).toHaveLength(1);
    expect(account.rows()).toHaveLength(1);
    account.offline = false;
    await act(async () => view!.clear());
    expect(view?.entries).toHaveLength(0);
    expect(account.rows()).toHaveLength(0);
  });

  it('signed out, nothing leaves the device', async () => {
    const account = fakeAccount();
    await mount(account, [entry('a', 12)], null);
    expect(view?.syncedWith).toBeNull();
    expect(account.pushes).toHaveLength(0);
  });
});
