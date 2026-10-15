import { beforeEach, describe, expect, it } from 'vitest';
import { RHYTHMS } from '../../domain/focusRhythm';
import { loadRhythm } from './rhythmPreference';

describe('rhythm preference', () => {
  beforeEach(() => localStorage.clear());

  it('starts new students on Pomodoro', () => {
    expect(loadRhythm()).toEqual(RHYTHMS.pomodoro);
  });

  it('keeps a rhythm the student picked', () => {
    localStorage.setItem('thd_focus_rhythm', JSON.stringify(RHYTHMS.deep));
    expect(loadRhythm()).toEqual(RHYTHMS.deep);
  });
});
