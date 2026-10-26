import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import { toRooms } from '../../data/mappers';
import type { Loaded, TeachingSet } from '../../data/thabellaClient';
import type { Room } from '../../domain/models';
import { RHYTHMS } from '../../domain/focusRhythm';
import { planEnd } from '../../domain/focusSession';
import { I18nProvider } from '../../i18n';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { RoomDataProvider } from '../rooms/RoomDataContext';
import type { RoomDataClient } from '../rooms/RoomDataContext';
import { FocusHistoryProvider } from './FocusHistoryContext';
import { FocusScreen } from './FocusScreen';
import { FocusSessionProvider, useFocusSession } from './FocusSessionContext';

const ROOMS = toRooms([{ id: 1, ident: 'r1', name: 'C211 - Seminarraum', seatsRegular: 40 }]);
const client: RoomDataClient = {
  cachedRooms: () => ({ data: ROOMS, source: 'bundled', at: null }) as Loaded<Room[]>,
  cachedTeaching: () => ({ data: new Set(['r1']), source: 'bundled', at: null, week: '2026-10-26' }) as TeachingSet,
  cachedEvents: () => ({ data: [], source: 'live', at: new Date() }),
  getRooms: async () => ({ data: ROOMS, source: 'live', at: new Date() }),
  getTeachingRoomIdents: async () => ({ data: new Set(['r1']), source: 'live', at: new Date(), week: '2026-10-26' }),
  loadEvents: async () => ({ data: [], source: 'live', at: new Date() }),
};

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

async function mount() {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/focus']}>
        <I18nProvider>
          <FocusHistoryProvider store={memoryStore()}>
            <StudyProfileProvider api={null}>
              <FocusSessionProvider api={null}>
                <RoomDataProvider client={client}>
                  <Probe />
                  <FocusScreen />
                </RoomDataProvider>
              </FocusSessionProvider>
            </StudyProfileProvider>
          </FocusHistoryProvider>
        </I18nProvider>
      </MemoryRouter>,
    ),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

const text = () => container.textContent ?? '';
const press = async (label: string) => {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!button) throw new Error(`no button "${label}"`);
  await act(async () => button.click());
};
const minutes = (n: number) => act(async () => {
  await vi.advanceTimersByTimeAsync(n * 60000);
});

describe('the Focus tab (ADR 0011)', () => {
  it('in the evening offers focus at home and says the campus is closed', async () => {
    vi.setSystemTime(new Date('2026-10-27T20:30:00Z')); // Tue 21:30 in Deggendorf
    await mount();
    expect(text()).toContain('Start focus at home');
    expect(text()).toContain('Only you see it. It counts in your focus graph.');
    expect(text()).toContain('Classroom buildings closed · opens Wed 06:30');
    expect(text()).toContain('Plan');
    expect(text()).toContain('No focus yet today');
    expect(text()).not.toContain('0-day streak');
  });

  it('starts at home, takes a break with a tip, and ends with the summary', async () => {
    vi.setSystemTime(new Date('2026-10-27T19:00:00Z'));
    await mount();
    await press('Start focus at home');
    expect(ctx.active?.place).toBe('home');
    expect(text()).toContain('At home');
    expect(text()).toContain('Only you see this session.');
    expect(text()).toContain('Block 1 of 6');
    expect(text()).not.toContain('Start focus at home');
    await minutes(26);
    expect(text()).toContain('Break');
    expect(text()).toContain('Stand up and stretch.');
    await press('End');
    expect(text()).toContain('Session ended');
    expect(text()).toContain('25 min');
    expect(text()).toContain('Start focus at home');
  });

  it('shows a campus session with its room and the way back to it', async () => {
    vi.setSystemTime(new Date('2026-10-27T09:00:00Z')); // Tue 10:00
    await mount();
    expect(text()).toContain('1 room free now');
    await act(async () =>
      ctx.start({ ident: 'r1', code: 'C211' }, planEnd(new Date(), null, null)!, { rhythm: RHYTHMS.deep }),
    );
    expect(text()).toContain('C211');
    expect(text()).toContain('Open C211');
    expect(text()).toContain("On this device only; the room isn't claimed.");
    expect(text()).not.toContain('Only you see this session.');
  });
});
