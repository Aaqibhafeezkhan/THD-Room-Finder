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
import { useFocusStats } from './useFocusStats';

let container: HTMLDivElement;
let root: Root;
let ctx: ReturnType<typeof useFocusSession>;
let stats: ReturnType<typeof useFocusStats>;
let saved: ReturnType<typeof useFocusStats>;

function Probe() {
  ctx = useFocusSession();
  stats = useFocusStats(new Date());
  saved = useFocusStats(new Date(), { live: false });
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
      // Like the service: a running session is a conflict unless replaced.
      if (session && !input.replace) throw new ServiceError('already_active');
      const now = new Date();
      session = {
        id: 's1',
        roomKey: input.roomKey,
        roomCode: input.roomKey === 'thd:r000000712' ? 'C011' : null,
        visibility: input.visibility,
        showName: input.showName,
        startedAt: now,
        plannedEnd: new Date(now.getTime() + input.minutes * 60000),
        leaseUntil: new Date(now.getTime() + 60 * 60000),
        renewedAt: now,
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
      session = { ...session, version: session.version + 1, leaseUntil: new Date(Date.now() + 60 * 60000), renewedAt: new Date() };
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

  it('counts the running session in the graph before it ends, then once', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(30);
    expect(stats.todayMinutes).toBe(30);
    expect(stats.live).toEqual({ date: '2026-10-13', minutes: 30 });
    expect(stats.hasHistory).toBe(true);
    expect(saved.todayMinutes).toBe(0);
    expect(await store.all()).toEqual([]);
    // The break and the unanswered next block add nothing.
    await minutes(25);
    expect(ctx.status?.kind).toBe('break');
    expect(stats.todayMinutes).toBe(50);
    await minutes(6);
    expect(ctx.status?.kind).toBe('confirm');
    expect(stats.todayMinutes).toBe(50);
    await act(async () => ctx.confirm());
    await minutes(10);
    expect(stats.todayMinutes).toBe(61);
    await act(async () => ctx.end());
    expect(stats.live).toBeNull();
    expect(stats.todayMinutes).toBe(61);
    expect(await recorded(store)).toEqual([[61, 'E212']]);
  });

  it('makes room for a lecture it learns about later, keeping the focus so far', async () => {
    const store = await mount({ signedIn: false, api: null });
    await act(async () => ctx.start(E212, plan(), deep));
    await minutes(20);
    await act(async () => ctx.limitTo(new Date(Date.now() + 30 * 60000)));
    expect(ctx.active?.reason).toBe('lecture');
    expect(new Date(ctx.active!.plannedEnd).getTime()).toBe(new Date(2026, 9, 13, 10, 50).getTime());
    // A later answer never extends the plan again.
    await act(async () => ctx.limitTo(new Date(2026, 9, 13, 15, 0)));
    expect(new Date(ctx.active!.plannedEnd).getTime()).toBe(new Date(2026, 9, 13, 10, 50).getTime());
    await minutes(5);
    await act(async () => ctx.limitTo(new Date()));
    expect(ctx.active).toBeNull();
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
      expect.objectContaining({ roomKey: 'thd:r000000053', minutes: 170, visibility: 'private', rhythm: RHYTHMS.deep, replace: false }),
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
  describe('across devices (ADR 0005)', () => {
    const C011 = { roomKey: 'thd:r000000712', minutes: 120, visibility: 'private' as const, showName: false, requestId: 'phone', replace: false, rhythm: RHYTHMS.pomodoro };

    it('shows a session started on another device, with its blocks lined up', async () => {
      const api = fakeFocusApi();
      await api.start(C011); // on the phone, at 10:00
      vi.setSystemTime(new Date(2026, 9, 13, 10, 10));
      await mount({ signedIn: true, api });
      expect(ctx.active).toMatchObject({ roomIdent: 'r000000712', roomCode: 'C011', adopted: true, confirmed: 1 });
      expect(ctx.status).toMatchObject({ kind: 'focus', phase: { block: 1 } });
      await minutes(16); // 10:26, the phone's first break
      expect(ctx.status?.kind).toBe('break');
    });

    it('a block that began after the last renewal asks again here', async () => {
      const api = fakeFocusApi();
      await api.start(C011);
      vi.setSystemTime(new Date(2026, 9, 13, 10, 32)); // block 2 began at 10:30
      await mount({ signedIn: true, api });
      expect(ctx.status).toMatchObject({ kind: 'confirm', phase: { block: 2 } });
      await act(async () => ctx.confirm());
      expect(ctx.active?.adopted).toBe(false);
    });

    it('records the session once, under its server id', async () => {
      const api = fakeFocusApi();
      await api.start(C011);
      vi.setSystemTime(new Date(2026, 9, 13, 10, 20));
      const store = await mount({ signedIn: true, api });
      await act(async () => ctx.end());
      expect(api.calls.end).toEqual(['s1']);
      expect((await store.all()).map((e) => [e.id, e.minutes])).toEqual([['s1', 20]]);
      expect(ctx.active).toBeNull();
    });

    it('starting in another room while one runs elsewhere asks first', async () => {
      const api = fakeFocusApi();
      await mount({ signedIn: true, api });
      await api.start(C011); // the phone starts after this device last looked
      await act(async () => ctx.start(E212, plan(), deep));
      expect(ctx.conflict).toEqual({ roomCode: 'C011' });
      expect(ctx.active).toBeNull();
      await act(async () => ctx.resolveConflict(true));
      expect(ctx.conflict).toBeNull();
      expect(ctx.active?.roomIdent).toBe(E212.ident);
      expect(api.calls.start[api.calls.start.length - 1].replace).toBe(true);
    });

    it("keeping it there shows the other device's session here", async () => {
      const api = fakeFocusApi();
      await mount({ signedIn: true, api });
      await api.start(C011);
      await act(async () => ctx.start(E212, plan(), deep));
      await act(async () => ctx.resolveConflict(false));
      expect(ctx.active).toMatchObject({ roomIdent: 'r000000712', adopted: true });
    });
  });
});
