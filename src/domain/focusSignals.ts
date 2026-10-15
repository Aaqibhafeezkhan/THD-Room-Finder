import type { RoomStatus } from './models';

/**
 * Focus signals on the room list and campus map (#20, focus-sessions spec
 * "Ordering", ADR 0002 §4). Pure: the caller supplies each room's live
 * activity (from the focus service) and whether the student is looking at
 * now; nothing here hides or recolours a lecture, which is never in the free
 * list to begin with.
 */
export interface RoomActivity {
  /** Sessions the viewer sees as anonymous claims. */
  claims: number;
  claimSince: Date | null;
  /** Public sessions of the viewer's own batch. */
  batchCount: number;
  batchSince: Date | null;
  batchNames: string[];
  /** The viewer's own shared session is here. */
  own: boolean;
}

export type FocusSignal =
  | { kind: 'own' }
  | { kind: 'batch'; count: number; names: string[]; since: Date | null }
  | { kind: 'claimed'; count: number; since: Date | null };

/**
 * One signal per room, strongest first: your session, then your batch, then
 * a claim. Quiet treats your batch's sessions as claims too.
 */
export function focusSignal(a: RoomActivity | undefined, opts: { quiet: boolean; ownHere: boolean }): FocusSignal | null {
  if (opts.ownHere || a?.own) return { kind: 'own' };
  if (!a) return null;
  if (a.batchCount > 0 && !opts.quiet) {
    return { kind: 'batch', count: a.batchCount, names: a.batchNames, since: a.batchSince };
  }
  const count = a.claims + (opts.quiet ? a.batchCount : 0);
  if (count === 0) return null;
  const since = [a.claimSince, opts.quiet ? a.batchSince : null]
    .filter((d): d is Date => d !== null)
    .sort((x, y) => x.getTime() - y.getTime())[0];
  return { kind: 'claimed', count, since: since ?? null };
}

/**
 * Bucket of a free room: 0 free (no activity, your batch, or you), 1 closing
 * soon, 2 claimed by someone else's focus session. A claimed room closing
 * soon stays claimed (and keeps its amber duration).
 */
export function focusBucket(status: RoomStatus, signal: FocusSignal | null): 0 | 1 | 2 {
  if (signal?.kind === 'claimed') return 2;
  return status === 'soon' ? 1 : 0;
}

/** Stable partition by bucket: the incoming order (longest free first,
 *  saved rooms first) is kept inside each bucket. */
export function rankByBucket<T>(items: readonly T[], bucket: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, b: bucket(item) }))
    .sort((x, y) => x.b - y.b || x.index - y.index)
    .map((x) => x.item);
}

export interface BuildingFocus {
  /** Public sessions of your batch: the violet ring and its count. */
  batch: number;
  /** Claims: the dark-purple dot and its count. */
  claims: number;
  /** Your own session is in this building. */
  own: boolean;
}

/** Signals summed per map building; buildings without activity are left out. */
export function buildingFocus(
  rooms: readonly { ident: string; building: string | null }[],
  signalOf: (ident: string) => FocusSignal | null,
): Record<string, BuildingFocus> {
  const out: Record<string, BuildingFocus> = {};
  for (const r of rooms) {
    if (!r.building) continue;
    const s = signalOf(r.ident);
    if (!s) continue;
    const b = (out[r.building] ??= { batch: 0, claims: 0, own: false });
    if (s.kind === 'own') b.own = true;
    else if (s.kind === 'batch') b.batch += s.count;
    else b.claims += s.count;
  }
  return out;
}
