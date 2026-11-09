import type { SavedRoomChanges } from '../domain/savedRooms';
import { ServiceError, errorCode } from './identityApi';
import type { FocusClient } from './supabaseClient';

/** The signed-in student's saved rooms on the server (ADR 0013). */
export interface SavedRoomsApi {
  /** Applies the changes and returns every room now saved on the account. */
  sync(changes: SavedRoomChanges): Promise<string[]>;
}

export function supabaseSavedRoomsApi(load: () => Promise<FocusClient>): SavedRoomsApi {
  return {
    async sync(changes) {
      const sb = await load();
      const { data, error } = await sb.rpc('sync_saved_rooms', { p_add: changes.add, p_remove: changes.remove });
      if (error) throw new ServiceError(errorCode(error));
      // Unknown is not empty: an empty list here would clear the device.
      if (!Array.isArray(data)) throw new ServiceError('unknown');
      return data.filter((x): x is string => typeof x === 'string');
    },
  };
}
