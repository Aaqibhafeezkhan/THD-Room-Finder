import { describe, expect, it } from 'vitest';
import type { Translate } from '../../i18n';
import { graphText } from './copy';

const t: Translate = (en) => en;
const tue = new Date(2026, 9, 13, 12, 0);

describe('graphText day detail', () => {
  it('says how much of the day was at home (ADR 0011)', () => {
    const home = new Map([['2026-10-13', 50]]);
    expect(graphText(t, 'en', null, home).cellLabel(tue, 125)).toBe('Tue 13 Oct 2026 · 2 h 5 min · 50 min at home');
    expect(graphText(t, 'en', null, home).cellLabel(tue, 50)).toBe('Tue 13 Oct 2026 · 50 min · at home');
  });

  it('says nothing about home on a campus-only or empty day', () => {
    expect(graphText(t, 'en', null, new Map()).cellLabel(tue, 25)).toBe('Tue 13 Oct 2026 · 25 min');
    expect(graphText(t, 'en', null, new Map([['2026-10-13', 50]])).cellLabel(tue, 0)).toBe('Tue 13 Oct 2026 · No focus');
  });
});
