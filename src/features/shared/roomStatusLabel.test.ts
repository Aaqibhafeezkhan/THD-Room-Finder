import { describe, expect, it } from 'vitest';
import type { Translate } from '../../i18n';
import { roomStatusLabel } from './roomStatusLabel';

const en: Translate = (e) => e;
const de: Translate = (_e, d) => d;

describe('roomStatusLabel', () => {
  it('keeps the English row words', () => {
    expect(['free', 'soon', 'claimed', 'occupied'].map((s) => roomStatusLabel(s as never, en))).toEqual([
      'free',
      'closing',
      'claimed',
      'busy',
    ]);
  });

  it('translates every status to German', () => {
    expect(roomStatusLabel('free', de)).toBe('frei');
    expect(roomStatusLabel('soon', de)).toBe('bald belegt');
    expect(roomStatusLabel('claimed', de)).toBe('Fokus');
    expect(roomStatusLabel('occupied', de)).toBe('belegt');
  });
});
