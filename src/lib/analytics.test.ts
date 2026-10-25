import { describe, expect, it } from 'vitest';
import { publicPath } from './analytics';

const ORIGIN = 'https://thd-room-finder.vercel.app';

describe('what analytics records', () => {
  it('never records a study table or gathering link', () => {
    expect(publicPath(`${ORIGIN}/t/k3Xq9pLm?app=1`)).toBe(`${ORIGIN}/t/[link]`);
    expect(publicPath(`${ORIGIN}/g/ab12cd34`)).toBe(`${ORIGIN}/g/[link]`);
  });

  it('keeps public paths and drops query strings and fragments', () => {
    expect(publicPath(`${ORIGIN}/room/r42?from=map#schedule`)).toBe(`${ORIGIN}/room/r42`);
    expect(publicPath(`${ORIGIN}/o/esn-deggendorf`)).toBe(`${ORIGIN}/o/esn-deggendorf`);
    expect(publicPath(`${ORIGIN}/`)).toBe(`${ORIGIN}/`);
  });
});
