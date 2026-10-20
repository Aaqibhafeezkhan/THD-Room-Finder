import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTimeout, timedFetch } from './net';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('timedFetch', () => {
  it('gives up on a server that never answers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    );
    const pending = timedFetch(1000)('https://example.test').catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    const err = await pending;
    expect(isTimeout(err)).toBe(true);
  });

  it('passes an answer through', async () => {
    vi.stubGlobal('fetch', async () => new Response('ok'));
    expect(await (await timedFetch(1000)('https://example.test')).text()).toBe('ok');
  });

  it('keeps the caller able to cancel', async () => {
    vi.stubGlobal('fetch', (_: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    );
    const outer = new AbortController();
    const pending = timedFetch(60_000)('https://example.test', { signal: outer.signal }).catch((e) => e);
    outer.abort(new DOMException('stop', 'AbortError'));
    expect((await pending).name).toBe('AbortError');
  });
});
