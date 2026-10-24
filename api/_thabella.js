// Shared by api/rooms.js, api/periods.js and the Vite dev proxy. Files that
// start with "_" are not deployed as functions of their own.

export const THABELLA = 'https://thabella.th-deg.de/thabella/opn';

/** Gives up before the function's 10 s limit, so the app gets a clear 504
 *  and its own fallback instead of Vercel's timeout page (#154). */
export const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * POSTs to THabella and returns `{ status, body }` for the response to send.
 * Anything but a JSON array (an error page, a login wall, a changed API) is
 * a 502, so a CDN never caches it as data and the app keeps its fallback.
 */
export async function thabella(path, body) {
  let upstream;
  try {
    upstream = await fetch(`${THABELLA}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return { status: timedOut ? 504 : 502, body: { error: timedOut ? 'upstream timeout' : 'upstream unreachable' } };
  }
  if (!upstream.ok) return { status: upstream.status >= 500 ? upstream.status : 502, body: { error: 'upstream error', status: upstream.status } };
  try {
    const data = await upstream.json();
    if (!Array.isArray(data)) return { status: 502, body: { error: 'unexpected upstream response' } };
    return { status: 200, body: data };
  } catch {
    return { status: 502, body: { error: 'unexpected upstream response' } };
  }
}
