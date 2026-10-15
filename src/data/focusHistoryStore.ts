import type { FocusEntry } from '../domain/focusHistory';

/**
 * Device-only storage for finished focus sessions (#38, ADR 0002 §3). One
 * IndexedDB object store keyed by entry id; nothing here talks to a server.
 * When IndexedDB is unavailable (private windows in some browsers, tests) the
 * history lives in memory for the session.
 */
export interface FocusHistoryStore {
  all(): Promise<FocusEntry[]>;
  put(entries: FocusEntry[]): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = 'thd-focus';
const STORE = 'sessions';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function indexedDbStore(idb: IDBFactory = indexedDB): FocusHistoryStore {
  let db: Promise<IDBDatabase> | null = null;
  const open = () => {
    db ??= new Promise((resolve, reject) => {
      const req = idb.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return db;
  };
  return {
    async all() {
      const tx = (await open()).transaction(STORE, 'readonly');
      return request(tx.objectStore(STORE).getAll() as IDBRequest<FocusEntry[]>);
    },
    async put(entries) {
      const tx = (await open()).transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      for (const e of entries) store.put(e);
      await done(tx);
    },
    async clear() {
      const tx = (await open()).transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      await done(tx);
    },
  };
}

export function memoryStore(initial: FocusEntry[] = []): FocusHistoryStore {
  const map = new Map(initial.map((e) => [e.id, e]));
  return {
    async all() {
      return [...map.values()];
    },
    async put(entries) {
      for (const e of entries) map.set(e.id, e);
    },
    async clear() {
      map.clear();
    },
  };
}

export function defaultStore(): FocusHistoryStore {
  return typeof indexedDB === 'undefined' ? memoryStore() : indexedDbStore();
}
