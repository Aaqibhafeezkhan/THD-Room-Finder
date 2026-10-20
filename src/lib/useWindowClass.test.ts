import { describe, expect, it } from 'vitest';
import { navigationVariantFor } from './useWindowClass';

describe('navigation across orientations', () => {
  it.each([[390, 844, 'bar'], [844, 390, 'rail'], [768, 1024, 'bar'], [1024, 768, 'drawer'],
    [768, 600, 'rail'], [1920, 1080, 'drawer']])('uses a sensible navigation form at %s by %s', (width, height, expected) => {
    expect(navigationVariantFor(width as number, height as number)).toBe(expected);
  });
});
