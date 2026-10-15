import { describe, expect, it } from 'vitest';
import { formatElapsed, planEnd } from './focusSession';

const at = (h: number, m = 0) => new Date(2026, 9, 13, h, m);

describe('planEnd', () => {
  it('ends at the next lecture when it comes first', () => {
    expect(planEnd(at(10), at(16), at(22))).toEqual({ end: at(13), minutes: 180, reason: 'cap' });
    expect(planEnd(at(10), at(11, 30), at(22))).toEqual({ end: at(11, 30), minutes: 90, reason: 'lecture' });
  });

  it('stops at campus closing', () => {
    expect(planEnd(at(21), null, at(22))).toEqual({ end: at(22), minutes: 60, reason: 'closing' });
    // A free window capped at closing is closing, not a lecture.
    expect(planEnd(at(21), at(22), at(22))?.reason).toBe('closing');
  });

  it('keeps the real end time when the start has seconds', () => {
    const now = new Date(2026, 9, 13, 10, 0, 30);
    expect(planEnd(now, at(11), null)).toEqual({ end: at(11), minutes: 59, reason: 'lecture' });
  });

  it('refuses to start with less than a minute left', () => {
    expect(planEnd(new Date(2026, 9, 13, 11, 29, 30), at(11, 30), null)).toBeNull();
  });
});

describe('formatElapsed', () => {
  it('shows minutes and seconds, then hours', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed((24 * 60 + 10) * 1000)).toBe('24:10');
    expect(formatElapsed((3600 + 5 * 60 + 40) * 1000)).toBe('1:05:40');
  });
});
