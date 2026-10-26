import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import type { SoundPlayer } from '../../data/focusSounds';
import type { SoundMoment } from '../../domain/focusSounds';
import { RHYTHMS } from '../../domain/focusRhythm';
import { planEnd } from '../../domain/focusSession';
import { I18nProvider } from '../../i18n';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { FocusHistoryProvider } from './FocusHistoryContext';
import { FocusSessionProvider, useFocusSession } from './FocusSessionContext';
import { FocusSounds } from './FocusSounds';

let container: HTMLDivElement;
let root: Root;
let ctx: ReturnType<typeof useFocusSession>;

function Probe() {
  ctx = useFocusSession();
  return null;
}

function fakePlayer(schedules = true) {
  const calls: { set: string; moments: string[] }[] = [];
  let cancels = 0;
  const player: SoundPlayer = {
    schedules,
    unlock: () => {},
    locked: () => false,
    onChange: () => () => {},
    schedule: async (set: string, moments: SoundMoment[]) => {
      calls.push({ set, moments: moments.map((m) => `${m.at.getHours()}:${String(m.at.getMinutes()).padStart(2, '0')} ${m.event}${m.quiet ? ' quiet' : ''}`) });
    },
    cancel: () => {
      cancels += 1;
    },
    preview: async () => {},
  };
  return { player, calls, cancels: () => cancels };
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 27, 20, 0));
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

async function mount(player: SoundPlayer) {
  await act(async () =>
    root.render(
      <I18nProvider>
        <FocusHistoryProvider store={memoryStore()}>
          <StudyProfileProvider api={null}>
            <FocusSessionProvider api={null}>
              <Probe />
              <FocusSounds player={player} />
            </FocusSessionProvider>
          </StudyProfileProvider>
        </FocusHistoryProvider>
      </I18nProvider>,
    ),
  );
}

const minutes = (n: number) => act(async () => {
  await vi.advanceTimersByTimeAsync(n * 60000);
});

describe('session sounds in the page (ADR 0012)', () => {
  it('at home plays Coffee break: the break, then the call back with a reminder', async () => {
    const { player, calls } = fakePlayer();
    await mount(player);
    await act(async () => ctx.startHome({ rhythm: RHYTHMS.deep }));
    expect(calls[calls.length - 1]).toEqual({ set: 'coffee', moments: ['20:50 break', '21:00 back', '21:05 back quiet'] });
    await minutes(61);
    await act(async () => ctx.confirm());
    expect(calls[calls.length - 1]?.moments).toEqual(['21:50 break', '22:00 back', '22:05 back quiet']);
  });

  it('on campus keeps the phone sound, so the page plays nothing', async () => {
    const { player, calls } = fakePlayer();
    await mount(player);
    await act(async () => ctx.start({ ident: 'r1', code: 'C211' }, planEnd(new Date(), null, null)!, { rhythm: RHYTHMS.deep }));
    expect(calls).toEqual([]);
  });

  it('follows the choice for the place and stops when muted', async () => {
    localStorage.setItem('thd_focus_sounds', JSON.stringify({ home: 'jingle', campus: 'chimes' }));
    const { player, calls, cancels } = fakePlayer();
    await mount(player);
    await act(async () => ctx.start({ ident: 'r1', code: 'C211' }, planEnd(new Date(), null, null)!, { rhythm: RHYTHMS.deep }));
    expect(calls[calls.length - 1]?.set).toBe('chimes');
    const before = cancels();
    act(() => ctx.setMuted(true));
    expect(cancels()).toBeGreaterThan(before);
    const scheduled = calls.length;
    await minutes(51);
    expect(calls.length).toBe(scheduled);
  });

  it('in the Android app leaves it to the notification', async () => {
    const { player, calls } = fakePlayer(false);
    await mount(player);
    await act(async () => ctx.startHome({ rhythm: RHYTHMS.deep }));
    expect(calls).toEqual([]);
  });
});
