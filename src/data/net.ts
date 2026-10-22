/**
 * Requests that give up. A server that accepts the connection and never
 * answers (a paused project, a captive portal, a dead hotspot) would
 * otherwise leave screens loading forever; after the timeout the request
 * fails like any other, so cached data and error states take over.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

export function timedFetch(ms: number = REQUEST_TIMEOUT_MS): typeof fetch {
  return (input, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('The request timed out', 'TimeoutError')), ms);
    const outer = init.signal;
    if (outer) {
      if (outer.aborted) controller.abort(outer.reason);
      else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true });
    }
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

/** True for a request that timed out or was cut off, not one the server refused. */
export function isTimeout(err: unknown): boolean {
  const e = err as { name?: unknown; message?: unknown } | null;
  return Boolean(e) && (e!.name === 'TimeoutError' || e!.name === 'AbortError' || /timed out/i.test(String(e!.message ?? '')));
}
