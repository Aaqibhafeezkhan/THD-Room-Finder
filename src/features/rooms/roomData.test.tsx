import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { toRooms } from '../../data/mappers';
import type { Loaded, TeachingSet } from '../../data/thabellaClient';
import type { Room, ScheduledEvent } from '../../domain/models';
import { RoomDataProvider, useRoomData } from './RoomDataContext';
import type { RoomDataClient, RoomData } from './RoomDataContext';

let container: HTMLDivElement;
let root: Root;
let data: RoomData;

function Probe() {
  data = useRoomData();
  return null;
}

const ROOMS = toRooms([
  { id: 1, ident: 'r1', name: 'E212 - Seminarraum', seatsRegular: 40 },
  { id: 2, ident: 'r2', name: 'A008 - Labor', seatsRegular: 20 },
]);
const lecture = (ident: string, h: number): ScheduledEvent => ({
  id: 1,
  roomIdent: ident,
  roomName: null,
  startDateTime: new Date(2026, 9, 22, h, 0),
  endDateTime: new Date(2026, 9, 22, h + 1, 30),
  durationMinutes: 90,
  eventType: 'Vorlesung',
});

/** A THabella that is down until `up()`; rooms come from the bundled list. */
function fakeClient(cachedDay: Loaded<ScheduledEvent[]> | null = null) {
  let online = false;
  const calls = { events: 0 };
  const bundled: Loaded<Room[]> = { data: ROOMS, source: 'bundled', at: null };
  const teaching: TeachingSet = { data: new Set(['r1', 'r2']), source: 'bundled', at: null, week: '2026-10-12' };
  const client: RoomDataClient = {
    cachedRooms: () => bundled,
    cachedTeaching: () => teaching,
    cachedEvents: () => cachedDay,
    getRooms: async () => (online ? { data: ROOMS, source: 'live', at: new Date() } : bundled),
    getTeachingRoomIdents: async () => (online ? { ...teaching, source: 'live', week: '2026-10-19', at: new Date() } : teaching),
    loadEvents: async () => {
      calls.events += 1;
      if (online) return { data: [lecture('r2', 9)], source: 'live', at: new Date() };
      if (cachedDay) return cachedDay;
      throw new Error('THabella HTTP 504');
    },
  };
  return { client, calls, up: () => (online = true) };
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 22, 9, 45));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

async function mount(client: RoomDataClient) {
  await act(async () =>
    root.render(
      <RoomDataProvider client={client}>
        <Probe />
      </RoomDataProvider>,
    ),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe('room data while THabella is down', () => {
  it('knows the rooms but claims none are free', async () => {
    const { client } = fakeClient();
    await mount(client);
    expect(data.schedule).toBe('unavailable');
    expect(data.loading).toBe(false);
    expect(data.freeRooms).toEqual([]);
    expect(data.known.map((r) => r.ident).sort()).toEqual(['r1', 'r2']);
    expect(data.eligibility).toMatchObject({ source: 'bundled', current: false, week: '2026-10-12' });
  });

  it('shows an earlier copy of today as stale, with its time', async () => {
    const at = new Date(2026, 9, 22, 8, 50);
    const { client } = fakeClient({ data: [lecture('r2', 9)], source: 'cache', at });
    await mount(client);
    expect(data.schedule).toBe('stale');
    expect(data.scheduleAt).toEqual(at);
    expect(data.freeRooms.map((f) => f.room.ident)).toEqual(['r1']);
  });

  it('tries again on its own and recovers without a tap', async () => {
    const thabella = fakeClient();
    await mount(thabella.client);
    expect(thabella.calls.events).toBe(1);
    thabella.up();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(thabella.calls.events).toBe(2);
    expect(data.schedule).toBe('fresh');
    expect(data.freeRooms.map((f) => f.room.ident)).toEqual(['r1']);
    expect(data.eligibility.current).toBe(true);
  });

  it('backs off between retries', async () => {
    const thabella = fakeClient();
    await mount(thabella.client);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(thabella.calls.events).toBe(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(thabella.calls.events).toBe(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(thabella.calls.events).toBe(3);
  });
});
