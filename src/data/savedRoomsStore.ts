/**
 * This device's saved rooms, and the last list it agreed on with the account
 * (the sync base, ADR 0013). Both live in localStorage. The base outlives
 * signing out, so signing back in can still tell a removal from an addition.
 */
const ROOMS_KEY = 'thd_favorites';
const BASE_KEY = 'thd_saved_rooms_sync';

interface SyncBase {
  /** The account this base belongs to; another account starts over. */
  account: string;
  rooms: string[];
}

export const SAVED_ROOMS_STORAGE_KEY = ROOMS_KEY;

/** A base storage refused, kept for as long as the app stays open. */
let unsaved: SyncBase | null = null;

function strings(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : null;
}

export function loadSavedRooms(): string[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(ROOMS_KEY);
  } catch {
    return [];
  }
  let rooms: string[] | null = null;
  try {
    rooms = raw === null ? null : strings(JSON.parse(raw));
  } catch {
    /* unreadable */
  }
  if (rooms) return rooms;
  // A list that's missing or unreadable is unknown, not empty: without the
  // base, the next sync can only add rooms and never reads this as removals.
  forgetSyncBase();
  return [];
}

/** Returns false when storage refused the list. */
export function saveSavedRooms(rooms: readonly string[]): boolean {
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    return true;
  } catch {
    return false;
  }
}

export function loadSyncBase(account: string): string[] {
  if (unsaved?.account === account) return unsaved.rooms;
  try {
    const raw = localStorage.getItem(BASE_KEY);
    const base = raw ? (JSON.parse(raw) as Partial<SyncBase>) : null;
    if (base?.account === account) return strings(base.rooms) ?? [];
  } catch {
    /* start over */
  }
  return [];
}

/**
 * `durable: false` keeps the base in memory only. The list and its base must
 * stay a matching pair on disk, so one that wasn't written holds the base back.
 */
export function saveSyncBase(account: string, rooms: string[], durable = true): void {
  const base: SyncBase = { account, rooms };
  if (!durable) {
    unsaved = base;
    return;
  }
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify(base));
    unsaved = null;
  } catch {
    unsaved = base;
  }
}

/** After deleting the account: a new one must start from a plain merge. */
export function forgetSyncBase(): void {
  unsaved = null;
  try {
    localStorage.removeItem(BASE_KEY);
  } catch {
    /* nothing was kept either */
  }
}
