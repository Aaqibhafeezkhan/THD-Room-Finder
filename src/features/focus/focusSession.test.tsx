import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import type { FocusApi, SessionDto, StartInput } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import type { IdentityApi } from '../../data/identityApi';
import { planEnd } from '../../domain/focusSession';
import { I18nProvider } from '../../i18n';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { FocusHistoryProvider } from './FocusHistoryContext';
import { FocusSessionProvider, useFocusSession } from './FocusSessionContext';

let container: HTMLDivElement;
let root: Root;
let ctx: ReturnType<typeof useFocusSession>;

function Probe() {
  ctx = useFocusSession();
  return null;
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 13, 10, 0));
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

/** A signed-in AIN 7 student, Private by default. */
function identityApi(signedIn: boolean): IdentityApi {
  return {
    currentEmail: async () => (signedIn ? 'lena@example.test' : null),
    onAuthChange: () => () => {},
    sendCode: async () => {},
    verifyCode: async () => {},
    signOut: async () => {},
    programmes: async () => [{ id: 'ain-b', code: 'AIN', nameEn: 'AI', nameDe: 'AI', intakeTerms: ['winter'] }],
    getIdentity: async () =>
      signedIn
        ? { displayName: 'Lena', programmeId: 'ain-b', intakeYear: 2023, intakeTerm: 'winter', defaultVisibility: 'private', showName: false, version: 1 }
        : null,
    saveIdentity: async () => {
      throw new Error('unused');
    },
    deleteIdentity: async () => {},
  };
}

function fakeFocusApi() {
  const calls: { start: StartInput[]; end: string[]; renew: number } = { start: [], end: [], renew: 0 };
  let session: SessionDto | null = null;
  const api: FocusApi & { calls: typeof calls; serverEnds: () => void; failStart: (code: string) => void } = {
    calls,
    serverEnds: () => {
      session = null;
    },
    failStart: (code) => {
      api.start = async () => {
        throw new ServiceError(code);
      };
    },
    async start(input) {
      calls.start.push(input);
      const now = new Date();
      session = {
        id: 's1',
        roomKey: input.roomKey,
        visibility: input.visibility,
        showName: input.showName,
        startedAt: now,
        plannedEnd: new Date(now.getTime() + input.minutes * 60000),
        leaseUntil: new Date(now.getTime() + 60 * 60000),
        endedAt: null,
        endReason: null,
        version: 1,
        rhythm: input.rhythm ?? { focus: 60, break: 0, longBreak: 0, longEvery: 0 },
        anchorAt: input.anchorAt ?? now,
        skewMs: 0,
      };
      return session;
    },
    async renew() {
      calls.renew += 1;
      if (!session) throw new ServiceError('not_active');
      session = { ...session, version: session.version + 1, leaseUntil: new Date(Date.now() + 60 * 60000) };
      return session;
    },
    async update(_id, _v, visibility, showName) {
      session = { ...session!, visibility, showName, version: session!.version + 1 };
      return session;
    },
    async end(id) {
      calls.end.push(id);
      session = null;
    },
    async current() {
      return session;
    },
    async summaries() {
      return [];
    },
  };
  return api;
}

async function mount(opts: { signedIn: boolean; api: FocusApi | null; store?: FocusHistoryStore }) {
  const store = opts.store ?? memoryStore();
  await act(async () =>
    root.render(
      <I18nProvider>
        <FocusHistoryProvider store={store}>
          <StudyProfileProvider api={opts.api ? identityApi(opts.signedIn) : null}>
            <FocusSessionProvider api={opts.api}>
              <Probe />
            </FocusSessionProvider>
          </StudyProfileProvider>
        </FocusHistoryProvider>
      </I18nProvider>,
    ),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  return store;
}

const E212 = { ident: 'r000000053', code: 'E212' };
const plan = () => planEnd(new Date(), new Date(2026, 9, 13, 16, 0), null)!;

async function minutes(n: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(n * 60000);
  });
}

describe('focus sessions', () => {
  it('runs a local timer when signed out and records it when it ends', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan()));
    expect(ctx.active?.shared).toBeNull();
    await minutes(25);
    await act(async () => ctx.end());
    expect(ctx.active).toBeNull();
    expect(ctx.lastEnded).toEqual({ roomIdent: E212.ident, minutes: 25 });
    expect((await store.all()).map((e) => [e.minutes, e.room])).toEqual([[25, 'E212']]);
  });

  it('shares the session when signed in: private by default, ends at the next lecture or 3 h', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan()));
    expect(api.calls.start).toEqual([
      expect.objectContaining({ roomKey: 'thd:r000000053', minutes: 180, visibility: 'private', showName: false, replace: true }),
    ]);
    expect(ctx.active?.shared?.id).toBe('s1');
    await act(async () => ctx.end());
    expect(api.calls.end).toEqual(['s1']);
  });

  it('renews the lease while the app is visible', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan()));
    const before = api.calls.renew;
    await minutes(3);
    expect(api.calls.renew - before).toBeGreaterThanOrEqual(3);
  });

  it('ends locally when the server already ended the session', async () => {
    const api = fakeFocusApi();
    const store = await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan()));
    await minutes(10);
    api.serverEnds();
    await minutes(1);
    expect(ctx.active).toBeNull();
    expect(api.calls.end).toEqual([]);
    expect((await store.all()).map((e) => e.minutes)).toEqual([11]);
  });

  it('falls back to a local timer in a room the service does not know', async () => {
    const api = fakeFocusApi();
    api.failStart('unknown_room');
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan()));
    expect(ctx.active?.shared).toBeNull();
    expect(ctx.active?.localBecause).toBe('unknown_room');
  });

  it('ends by itself at the planned end', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, planEnd(new Date(), new Date(2026, 9, 13, 10, 30), null)!));
    await minutes(31);
    expect(ctx.active).toBeNull();
    expect((await store.all())[0].minutes).toBe(30);
  });

  it('asks after a long time in the background and ends where the student left', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan()));
    await minutes(20);
    const hide = (state: 'hidden' | 'visible') => {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    };
    await act(async () => hide('hidden'));
    await minutes(50);
    await act(async () => hide('visible'));
    expect(ctx.checkIn).not.toBeNull();
    await minutes(11);
    expect(ctx.active).toBeNull();
    expect((await store.all())[0].minutes).toBe(20);
  });

  it('starting in another room ends the first session', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan()));
    await minutes(15);
    await act(async () => ctx.start({ ident: 'r000000001', code: 'A008' }, plan()));
    expect(ctx.active?.roomCode).toBe('A008');
    expect((await store.all())[0]).toMatchObject({ minutes: 15, room: 'E212' });
  });

  it('survives a reload', async () => {
    await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan()));
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount({ signedIn: false, api: null });
    expect(ctx.active?.roomIdent).toBe(E212.ident);
  });
});
