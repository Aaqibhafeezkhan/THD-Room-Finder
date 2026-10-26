import { describe, expect, it } from 'vitest';
import { RHYTHMS, layout } from './focusRhythm';
import { soundMoments } from './focusSounds';

const at = (h: number, m = 0) => new Date(2026, 9, 27, h, m);
const brief = (ms: ReturnType<typeof soundMoments>) =>
  ms.map((m) => `${m.at.getHours()}:${String(m.at.getMinutes()).padStart(2, '0')} ${m.event}${m.quiet ? ' quiet' : ''}`);

describe('soundMoments (ADR 0012)', () => {
  const deep = layout(RHYTHMS.deep, at(20), at(20), at(23))!;

  it('plays the break, then calls back with one quieter reminder, up to the next answer', () => {
    expect(brief(soundMoments(deep, 1, at(20, 10)))).toEqual(['20:50 break', '21:00 back', '21:05 back quiet']);
  });

  it('during "Break\'s over" only the reminder is left, and nothing after it', () => {
    expect(brief(soundMoments(deep, 1, at(21, 2)))).toEqual(['21:05 back quiet']);
    expect(soundMoments(deep, 1, at(21, 6))).toEqual([]);
  });

  it('ends with the done sound once every block is confirmed', () => {
    expect(brief(soundMoments(deep, 3, at(22, 30)))).toEqual(['22:50 done']);
  });

  it('nothing once the session is over or left unanswered', () => {
    expect(soundMoments(deep, 1, at(21, 11))).toEqual([]);
    expect(soundMoments(deep, 3, at(23, 1))).toEqual([]);
  });

  it('the Open rhythm asks "Still focusing?" every hour with the back sound', () => {
    const open = layout(RHYTHMS.open, at(20), at(20), at(23))!;
    expect(brief(soundMoments(open, 1, at(20, 30)))).toEqual(['21:00 back', '21:05 back quiet']);
  });

  it('Pomodoro: short breaks, then the long one after the fourth block', () => {
    const pomodoro = layout(RHYTHMS.pomodoro, at(20), at(20), at(23))!;
    expect(brief(soundMoments(pomodoro, 4, at(21, 40)))).toEqual(['21:55 break', '22:10 back', '22:15 back quiet']);
  });
});
