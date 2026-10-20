import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';
import { timedFetch } from './net';

/**
 * The browser's Supabase client, built from the publishable URL and key
 * (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). When either is
 * missing the shared focus features stay off and the app works as before:
 * schedule, saved rooms and the local-only timer. Never a service-role key.
 *
 * supabase-js is loaded on first use, so the room finder's first paint
 * doesn't carry it. A failed load (offline before the chunk was cached, or
 * a deploy that replaced it) is forgotten so the next call tries again.
 * Every request gives up after 15 s (`timedFetch`).
 */
export type FocusClient = SupabaseClient<Database>;

// Trimmed: a pasted value can carry a newline or a byte-order mark, and a BOM
// in the key makes every fetch throw before it leaves the browser.
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

export const focusServiceConfigured = Boolean(URL_ && KEY);

let client: Promise<FocusClient> | null = null;

export function loadSupabase(): Promise<FocusClient> {
  if (!focusServiceConfigured) return Promise.reject(new Error('focus service not configured'));
  client ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient<Database>(URL_!, KEY!, {
        auth: { persistSession: true, autoRefreshToken: true },
        global: { fetch: timedFetch() },
      }),
    )
    .catch((err) => {
      client = null;
      throw err;
    });
  return client;
}
