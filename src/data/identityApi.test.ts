import { describe, expect, it } from 'vitest';
import { errorCode } from './identityApi';

describe('errorCode', () => {
  const failedFetch = { message: 'Failed to fetch' };

  it('calls a request that never left an offline device offline', () => {
    expect(errorCode(failedFetch, false)).toBe('network');
  });

  it('calls it blocked when the device is online, as with Brave Shields', () => {
    expect(errorCode(failedFetch, true)).toBe('blocked');
  });

  it('calls a timeout or a server error unavailable, not blocked', () => {
    expect(errorCode({ message: 'TimeoutError: The request timed out' }, true)).toBe('unavailable');
    expect(errorCode({ message: '', status: 503 }, true)).toBe('unavailable');
    expect(errorCode({ message: 'TimeoutError: The request timed out' }, false)).toBe('network');
  });

  it('keeps server answers apart from transport failures', () => {
    expect(errorCode({ code: 'otp_expired' }, true)).toBe('code_expired');
    expect(errorCode({ status: 429 }, true)).toBe('rate_limited');
  });
});
