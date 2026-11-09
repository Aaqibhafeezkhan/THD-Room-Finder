/**
 * Saved rooms across a student's devices (ADR 0013). The account holds a plain
 * set of room identifiers; each device remembers the last set it agreed on
 * with the account (the base). Comparing against the base tells an added room
 * from one removed elsewhere, so removals stick without the server keeping a
 * record of what was removed or when.
 */
export interface SavedRoomChanges {
  add: string[];
  remove: string[];
}

/** What this device changed since it last agreed with the account. */
export function savedRoomChanges(base: readonly string[], local: readonly string[]): SavedRoomChanges {
  const was = new Set(base);
  const now = new Set(local);
  return {
    add: [...now].filter((ident) => !was.has(ident)),
    remove: [...was].filter((ident) => !now.has(ident)),
  };
}

export function hasSavedRoomChanges(changes: SavedRoomChanges): boolean {
  return changes.add.length > 0 || changes.remove.length > 0;
}

/**
 * Three-way merge: a room stays when either side added it since the base, or
 * when the base had it and neither side removed it. With an empty base (the
 * first sign-in on a device) that is the union of both lists. Keeps the
 * device's order; rooms new to the device go at the end.
 */
export function mergeSavedRooms(
  base: readonly string[],
  local: readonly string[],
  remote: readonly string[],
): string[] {
  const was = new Set(base);
  const onAccount = new Set(remote);
  const kept = [...new Set(local)].filter((ident) => !was.has(ident) || onAccount.has(ident));
  const known = new Set(local);
  const incoming = [...onAccount].filter((ident) => !was.has(ident) && !known.has(ident));
  return [...kept, ...incoming];
}
