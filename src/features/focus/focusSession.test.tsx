import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import type { FocusApi, SessionDto, StartInput } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import type { IdentityApi } from '../../data/identityApi';
import { RHYTHMS } from '../../domain/focusRhythm';
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

/** A signed-in AIN 7 student, Private by default; or signed in without a profile. */
function identityApi(signedIn: boolean, withProfile = true): IdentityApi {
  return {
    currentEmail: async () => (signedIn ? 'lena@example.test' : null),
    onAuthChange: () => () => {},
    sendCode: async () => {},
    verifyCode: async () => {},
    signOut: async () => {},
    programmes: async () => [{ id: 'ain-b', code: 'AIN', nameEn: 'AI', nameDe: 'AI', intakeTerms: ['winter'] }],
    getIdentity: async () =>
      signedIn && withProfile
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

async function mount(opts: { signedIn: boolean; api: FocusApi | null; store?: FocusHistoryStore; withProfile?: boolean }) {
  const store = opts.store ?? memoryStore();
  await act(async () =>
    root.render(
      <I18nProvider>
        <FocusHistoryProvider store={store}>
          <StudyProfileProvider api={opts.api ? identityApi(opts.signedIn, opts.withProfile ?? true) : null}>
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
const deep = { rhythm: RHYTHMS.deep };

async function minutes(n: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(n * 60000);
  });
}

const recorded = async (store: FocusHistoryStore) => (await store.all()).map((e) => [e.minutes, e.room]);

describe('focus sessions', () => {
  it('runs on the device without a study profile and records the focus time', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    expect(ctx.active?.shared).toBeNull();
    expect(ctx.status).toMatchObject({ kind: 'focus', phase: { block: 1 } });
    await minutes(25);
    await act(async () => ctx.end());
    expect(ctx.active).toBeNull();
    expect(ctx.lastEnded).toEqual({ roomIdent: E212.ident, minutes: 25, blocks: 1, awayMinutes: 0 });
    expect(await recorded(store)).toEqual([[25, 'E212']]);
  });

  it('signed in without a study profile, nothing reaches the service', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api, withProfile: false });
    await act(async () => ctx.start(E212, plan(), deep));
    expect(api.calls.start).toEqual([]);
    expect(ctx.active?.shared).toBeNull();
  });

  it('takes a break after a block and counts only focus time', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(55);
    expect(ctx.status?.kind).toBe('break');
    await minutes(6);
    expect(ctx.status?.kind).toBe('confirm');
    await act(async () => ctx.confirm());
    expect(ctx.status).toMatchObject({ kind: 'focus', phase: { block: 2 } });
    await minutes(20);
    await act(async () => ctx.end());
    expect(await recorded(store)).toEqual([[71, 'E212']]);
    expect(ctx.lastEnded?.blocks).toBe(2);
  });

  it('leaves time in other apps out of the focus time', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(30);
    const t = Date.now();
    act(() => ctx.addAway([[t - 12 * 60000, t - 4 * 60000]]));
    await act(async () => ctx.end());
    expect(await recorded(store)).toEqual([[22, 'E212']]);
    expect(ctx.lastEnded?.awayMinutes).toBe(8);
  });

  it('with no answer after the break, ends at the end of the last block', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(71);
    expect(ctx.active).toBeNull();
    expect(await recorded(store)).toEqual([[50, 'E212']]);
  });

  it('shares the session with a study profile: private, with its rhythm and length', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan(), deep));
    // 10:00 to the 13:00 cap: three Deep blocks, ending 12:50.
    expect(api.calls.start).toEqual([
      expect.objectContaining({ roomKey: 'thd:r000000053', minutes: 170, visibility: 'private', rhythm: RHYTHMS.deep, replace: true }),
    ]);
    expect(api.calls.start[0].anchorAt).toBeUndefined();
    expect(ctx.active?.shared?.id).toBe('s1');
    await act(async () => ctx.end());
    expect(api.calls.end).toEqual(['s1']);
  });

  it('joining follows the batch rhythm and anchor', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api });
    const anchorAt = new Date(2026, 9, 13, 9, 40);
    await act(async () =>
      ctx.start(E212, plan(), { ...deep, visibility: 'public', join: { rhythm: RHYTHMS.pomodoro, anchorAt } }),
    );
    expect(api.calls.start[0]).toMatchObject({ visibility: 'public', rhythm: RHYTHMS.pomodoro, anchorAt });
    // The batch started Pomodoro at 09:40: its first block ends 10:05, so
    // this one does too, and the break comes together.
    expect(ctx.plan?.phases[0]).toMatchObject({ kind: 'focus', end: new Date(2026, 9, 13, 10, 5) });
  });

  it('renews the lease while the app is visible', async () => {
    const api = fakeFocusApi();
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan(), deep));
    const before = api.calls.renew;
    await minutes(3);
    expect(api.calls.renew - before).toBeGreaterThanOrEqual(3);
  });

  it('ends locally when the server already ended the session', async () => {
    const api = fakeFocusApi();
    const store = await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(10);
    api.serverEnds();
    await minutes(1);
    expect(ctx.active).toBeNull();
    expect(api.calls.end).toEqual([]);
    expect((await store.all()).map((e) => e.minutes)).toEqual([11]);
  });

  it('falls back to the device in a room the service does not know', async () => {
    const api = fakeFocusApi();
    api.failStart('unknown_room');
    await mount({ signedIn: true, api });
    await act(async () => ctx.start(E212, plan(), deep));
    expect(ctx.active?.shared).toBeNull();
    expect(ctx.active?.localBecause).toBe('unknown_room');
  });

  it('ends by itself before the next lecture', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, planEnd(new Date(), new Date(2026, 9, 13, 10, 30), null)!, deep));
    await minutes(31);
    expect(ctx.active).toBeNull();
    expect((await store.all())[0].minutes).toBe(30);
  });

  it('starting in another room ends the first session', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(15);
    await act(async () => ctx.start({ ident: 'r000000001', code: 'A008' }, plan(), deep));
    expect(ctx.active?.roomCode).toBe('A008');
    expect((await store.all())[0]).toMatchObject({ minutes: 15, room: 'E212' });
  });

  it('survives a reload, and a long absence ends it at the last block', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount({ signedIn: false, api: null, store });
    expect(ctx.active?.roomIdent).toBe(E212.ident);
    await act(async () => root.unmount());
    vi.setSystemTime(new Date(2026, 9, 13, 12, 0));
    root = createRoot(container);
    await mount({ signedIn: false, api: null, store });
    expect(ctx.active).toBeNull();
    expect(await recorded(store)).toEqual([[50, 'E212']]);
  });
});
