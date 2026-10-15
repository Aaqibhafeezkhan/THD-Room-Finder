import { describe, expect, it } from 'vitest';
import { buildingFocus, focusBucket, focusSignal, rankByBucket } from './focusSignals';
import type { FocusSignal, RoomActivity } from './focusSignals';
import type { RoomStatus } from './models';

const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);
const activity = (o: Partial<RoomActivity>): RoomActivity => ({
  claims: 0,
  claimSince: null,
  batchCount: 0,
  batchSince: null,
  batchNames: [],
  own: false,
  ...o,
});
const loud = { quiet: false, ownHere: false };
const quiet = { quiet: true, ownHere: false };

describe('focusSignal', () => {
  it.each<[string, RoomActivity | undefined, typeof loud, FocusSignal['kind'] | null]>([
    ['no activity', undefined, loud, null],
    ['empty summary', activity({}), loud, null],
    ['someone claimed it', activity({ claims: 1 }), loud, 'claimed'],
    ['your batch is studying', activity({ batchCount: 2, claims: 1 }), loud, 'batch'],
    ['quiet: your batch counts as a claim', activity({ batchCount: 2 }), quiet, 'claimed'],
    ['your shared session', activity({ own: true, batchCount: 2 }), loud, 'own'],
    ['your device-only session', undefined, { quiet: false, ownHere: true }, 'own'],
  ])('%s', (_name, a, opts, kind) => {
    expect(focusSignal(a, opts)?.kind ?? null).toBe(kind);
  });

  it('quiet adds your batch to the claim count and keeps the earliest start', () => {
    expect(focusSignal(activity({ claims: 1, claimSince: at(10), batchCount: 2, batchSince: at(9) }), quiet)).toEqual({
      kind: 'claimed',
      count: 3,
      since: at(9),
    });
  });
});

describe('focusBucket', () => {
  const batch: FocusSignal = { kind: 'batch', count: 1, names: [], since: null };
  const claim: FocusSignal = { kind: 'claimed', count: 1, since: null };
  it.each<[RoomStatus, FocusSignal | null, number]>([
    ['free', null, 0],
    ['free', batch, 0],
    ['free', { kind: 'own' }, 0],
    ['soon', null, 1],
    ['soon', batch, 1],
    ['free', claim, 2],
    ['soon', claim, 2],
  ])('%s with %o → bucket %i', (status, signal, bucket) => {
    expect(focusBucket(status, signal)).toBe(bucket);
  });
});

describe('rankByBucket', () => {
  it('moves claimed rooms below free and closing-soon ones, keeping the order inside each', () => {
    const rooms = [
      { id: 'E212', b: 2 },
      { id: 'I112', b: 0 },
      { id: 'J213', b: 1 },
      { id: 'C104', b: 2 },
      { id: 'A008', b: 0 },
    ];
    expect(rankByBucket(rooms, (r) => r.b).map((r) => r.id)).toEqual(['I112', 'A008', 'J213', 'E212', 'C104']);
  });

  it('with no activity the order is unchanged', () => {
    expect(rankByBucket(['a', 'b', 'c'], () => 0)).toEqual(['a', 'b', 'c']);
  });
});

describe('buildingFocus', () => {
  it('sums batch sessions and claims per building', () => {
    const signals: Record<string, FocusSignal> = {
      e1: { kind: 'batch', count: 2, names: [], since: null },
      e2: { kind: 'claimed', count: 1, since: null },
      i1: { kind: 'own' },
    };
    const rooms = [
      { ident: 'e1', building: 'E' },
      { ident: 'e2', building: 'E' },
      { ident: 'i1', building: 'I' },
      { ident: 'x', building: 'A' },
      { ident: 'y', building: null },
    ];
    expect(buildingFocus(rooms, (id) => signals[id] ?? null)).toEqual({
      E: { batch: 2, claims: 1, own: false },
      I: { batch: 0, claims: 0, own: true },
    });
  });
});
