import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore } from '../../data/focusHistoryStore';
import { ServiceError } from '../../data/identityApi';
import { toRooms } from '../../data/mappers';
import type { SessionTableInput, StudyTable, TablesApi } from '../../data/tablesApi';
import { RHYTHMS } from '../../domain/focusRhythm';
import { I18nProvider } from '../../i18n';
import { FocusHistoryProvider } from '../focus/FocusHistoryContext';
import { FocusSessionProvider } from '../focus/FocusSessionContext';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { RoomDataProvider } from '../rooms/RoomDataContext';
import type { RoomDataClient } from '../rooms/RoomDataContext';
import { SessionTableSheet, sessionTableLink } from './SessionTableSheet';
import { TablesProvider } from './TablesContext';

let container: HTMLDivElement;
let root: Root;

const [E212] = toRooms([{ id: 53, ident: 'r000000053', name: 'E212 - EDV' }]);
const NOW = new Date(2026, 9, 22, 10, 25);
const ANCHOR = new Date(2026, 9, 22, 9, 45);

/** A Pomodoro session in E212 since 09:45, planned to `end`. */
function seedSession(end: Date) {
  localStorage.setItem(
    'thd_focus_session',
    JSON.stringify({
      roomIdent: E212.ident,
      roomCode: 'E212',
      startedAt: ANCHOR.toISOString(),
      plannedEnd: end.toISOString(),
      reason: 'cap',
      rhythm: RHYTHMS.pomodoro,
      anchorAt: ANCHOR.toISOString(),
      confirmed: 2,
      visibility: 'private',
      showName: false,
      shared: null,
    }),
  );
}

const client: RoomDataClient = {
  cachedRooms: () => ({ data: [E212], source: 'cache', at: NOW }),
  cachedTeaching: () => ({ data: new Set([E212.ident]), source: 'cache', at: NOW, week: '2026-10-19' }),
  cachedEvents: () => null,
  getRooms: async () => ({ data: [E212], source: 'live', at: new Date() }),
  getTeachingRoomIdents: async () => ({ data: new Set([E212.ident]), source: 'live', at: new Date(), week: '2026-10-19' }),
  loadEvents: async () => ({ data: [], source: 'live', at: new Date() }),
};

function fakeTables() {
  const calls: SessionTableInput[] = [];
  let failNext = true;
  const api = {
    calls,
    async fromSession(input: SessionTableInput) {
      calls.push(input);
      if (failNext) {
        failNext = false;
        throw new ServiceError('network');
      }
      return { link: 'candid-harbor-63', startsAt: input.startsAt, endsAt: input.endsAt } as StudyTable;
    },
    async mine() {
      return [];
    },
  } as unknown as TablesApi & { calls: SessionTableInput[] };
  return api;
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
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

async function mount(api: TablesApi, onSaved: (t: StudyTable) => void = () => {}) {
  await act(async () =>
    root.render(
      <I18nProvider>
        <RoomDataProvider client={client}>
          <FocusHistoryProvider store={memoryStore()}>
            <StudyProfileProvider api={null}>
              <TablesProvider api={api}>
                <FocusSessionProvider api={null}>
                  <SessionTableSheet open room={E212} onClose={() => {}} onSaved={onSaved} />
                </FocusSessionProvider>
              </TablesProvider>
            </StudyProfileProvider>
          </FocusHistoryProvider>
        </RoomDataProvider>
      </I18nProvider>,
    ),
  );
  await act(async () => {
    await Promise.resolve();
  });
}

const invite = () => [...document.querySelectorAll('button')].find((b) => /Invite people/.test(b.textContent ?? ''))!;

describe('turning a running session into a study table', () => {
  it('makes a table in progress from the anchor, retries without a second table and leaves the timer alone', async () => {
    seedSession(new Date(2026, 9, 22, 12, 45));
    const before = localStorage.getItem('thd_focus_session');
    const api = fakeTables();
    const saved: StudyTable[] = [];
    await mount(api, (t) => saved.push(t));

    await act(async () => invite().click());
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/offline/i);
    await act(async () => invite().click());

    expect(api.calls).toHaveLength(2);
    expect(api.calls[1].requestId).toBe(api.calls[0].requestId);
    expect(api.calls[1]).toMatchObject({ startsAt: ANCHOR, endsAt: new Date(2026, 9, 22, 12, 45), seats: 4, sessionId: null, rhythm: RHYTHMS.pomodoro });
    expect(saved.map((t) => t.link)).toEqual(['candid-harbor-63']);
    expect(localStorage.getItem('thd_focus_session')).toBe(before);
    expect(sessionTableLink({ roomIdent: E212.ident, startedAt: ANCHOR.toISOString() })).toBe('candid-harbor-63');
  });

  it('explains instead of inviting with under 25 minutes left', async () => {
    seedSession(new Date(2026, 9, 22, 10, 45));
    const api = fakeTables();
    await mount(api);
    expect(invite().disabled).toBe(true);
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/Less than 25 minutes/);
    expect(api.calls).toHaveLength(0);
  });
});
