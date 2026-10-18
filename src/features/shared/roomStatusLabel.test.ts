import { describe, expect, it } from 'vitest';
import type { Translate } from '../../i18n';
import { freeRoomsLabel, roomStatusLabel } from './roomStatusLabel';

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

describe('availability captions', () => {
  it('distinguishes live, selected-time and opening previews', () => {
    expect(freeRoomsLabel(en, {preview: false, customTime: false})).toBe('rooms free right now');
    expect(freeRoomsLabel(en, {preview: false, customTime: true})).toBe('rooms free at this time');
    expect(freeRoomsLabel(en, {preview: true, customTime: true, building: 'A'})).toBe('rooms free in A when it opens');
    expect(freeRoomsLabel(de, {preview: false, customTime: true})).toBe('Räume frei zur gewählten Zeit');
  });
});
