import { describe, expect, it } from 'vitest';
import { focusLayoutFor, navigationVariantFor } from './useWindowClass';

describe('navigation across orientations', () => {
  it.each([[390, 844, 'bar'], [844, 390, 'rail'], [768, 1024, 'bar'], [1024, 768, 'drawer'],
    [768, 600, 'rail'], [1920, 1080, 'drawer']])('uses a sensible navigation form at %s by %s', (width, height, expected) => {
    expect(navigationVariantFor(width as number, height as number)).toBe(expected);
  });
});

describe('Focus tab layout', () => {
  it.each([
    [390, 844, 'stack'], [320, 568, 'stack'], [844, 390, 'split'], [780, 360, 'split'], [500, 400, 'stack'],
    [768, 1024, 'stage'], [1024, 768, 'stage'], [1280, 500, 'split'], [1920, 1080, 'stage'], [3440, 1440, 'stage'],
  ])('at %s by %s it is %s', (width, height, expected) => {
    expect(focusLayoutFor(width as number, height as number)).toBe(expected);
  });
});
