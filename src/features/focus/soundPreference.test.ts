import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SOUNDS, isPlayable, loadSounds } from './soundPreference';

describe('sound preference (ADR 0012)', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to Coffee break at home and the phone sound on campus', () => {
    expect(loadSounds()).toEqual({ home: 'coffee', campus: 'phone' });
    expect(DEFAULT_SOUNDS).toEqual(loadSounds());
  });

  it('keeps a valid choice per place and ignores anything else', () => {
    localStorage.setItem('thd_focus_sounds', JSON.stringify({ home: 'jingle', campus: 'trumpet' }));
    expect(loadSounds()).toEqual({ home: 'jingle', campus: 'phone' });
    localStorage.setItem('thd_focus_sounds', 'not json');
    expect(loadSounds()).toEqual(DEFAULT_SOUNDS);
  });

  it('plays its own files only for the three sets', () => {
    expect(['coffee', 'jingle', 'chimes', 'phone', 'silent'].map((s) => isPlayable(s as never))).toEqual([true, true, true, false, false]);
  });
});
