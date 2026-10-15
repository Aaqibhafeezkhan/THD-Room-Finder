import { describe, expect, it } from 'vitest';
import { RHYTHMS, customRhythm, focusedMs, layout, rhythmId, statusAt } from './focusRhythm';
import type { SessionPlan } from './focusRhythm';

const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const shape = (plan: SessionPlan | null) =>
  plan?.phases.map((p) => `${p.kind === 'focus' ? 'F' : 'B'}${p.block} ${hm(p.start)}-${hm(p.end)}`);

describe('layout', () => {
  it('fits two Deep blocks into a free slot and never ends on a break', () => {
    const plan = layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(11, 30));
    expect(shape(plan)).toEqual(['F1 09:30-10:20', 'B1 10:20-10:30', 'F2 10:30-11:20']);
    expect(hm(plan!.end)).toBe('11:20');
    expect(plan!.blocks).toBe(2);
  });

  it('shortens the last block to the next lecture', () => {
    expect(shape(layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(11, 0)))).toEqual([
      'F1 09:30-10:20',
      'B1 10:20-10:30',
      'F2 10:30-11:00',
    ]);
  });

  it('drops a last block shorter than 10 minutes, but never the first', () => {
    expect(shape(layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(10, 35)))).toEqual(['F1 09:30-10:20']);
    expect(shape(layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(9, 37)))).toEqual(['F1 09:30-09:37']);
  });

  it('takes a long break after every fourth Pomodoro', () => {
    const plan = layout(RHYTHMS.pomodoro, at(8), at(8), at(11));
    expect(shape(plan)!.slice(6, 9)).toEqual(['F4 09:30-09:55', 'B4 09:55-10:10', 'F5 10:10-10:35']);
  });

  it('runs Open as hour-long blocks with no breaks', () => {
    expect(shape(layout(RHYTHMS.open, at(14), at(14), at(16, 30)))).toEqual([
      'F1 14:00-15:00',
      'F2 15:00-16:00',
      'F3 16:00-16:30',
    ]);
  });

  it('joins mid-block in step with the group', () => {
    expect(shape(layout(RHYTHMS.deep, at(9, 30), at(9, 50), at(11, 30)))).toEqual([
      'F1 09:50-10:20',
      'B1 10:20-10:30',
      'F2 10:30-11:20',
    ]);
  });

  it('joining during a break starts focus straight away until the group breaks again', () => {
    expect(shape(layout(RHYTHMS.deep, at(9, 30), at(10, 25), at(11, 30)))).toEqual(['F1 10:25-11:20']);
  });
});

describe('statusAt', () => {
  const plan = layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(11, 30))!;

  it('counts down a block, then the break', () => {
    expect(statusAt(plan, 1, at(10))).toMatchObject({ kind: 'focus', phase: { block: 1 } });
    expect(statusAt(plan, 1, at(10, 25))).toMatchObject({ kind: 'break', next: { block: 2 } });
  });

  it('asks to start the next block when the break is over', () => {
    const s = statusAt(plan, 1, at(10, 31));
    expect(s.kind).toBe('confirm');
    expect(s.kind === 'confirm' && hm(s.deadline)).toBe('10:40');
    expect(statusAt(plan, 2, at(10, 31))).toMatchObject({ kind: 'focus', phase: { block: 2 } });
  });

  it('with no answer ends at the end of the last confirmed block', () => {
    const s = statusAt(plan, 1, at(10, 40));
    expect(s).toMatchObject({ kind: 'done', reason: 'unconfirmed' });
    expect(s.kind === 'done' && hm(s.at)).toBe('10:20');
  });

  it('is over at the planned end', () => {
    expect(statusAt(plan, 2, at(11, 20))).toMatchObject({ kind: 'done', reason: 'planned' });
  });
});

describe('focusedMs', () => {
  const plan = layout(RHYTHMS.deep, at(9, 30), at(9, 30), at(11, 30))!;
  const minutes = (ms: number) => ms / 60000;

  it('counts focus only, never the break', () => {
    expect(minutes(focusedMs(plan, 2, at(10, 45)))).toBe(65);
  });

  it('a late answer still counts the block from its start', () => {
    expect(minutes(focusedMs(plan, 2, at(11, 20)))).toBe(100);
  });

  it('an unconfirmed block counts nothing', () => {
    expect(minutes(focusedMs(plan, 1, at(10, 38)))).toBe(50);
  });

  it('subtracts time in other apps during a block, not during a break', () => {
    const away: [number, number][] = [
      [at(9, 40).getTime(), at(9, 46).getTime()],
      [at(9, 44).getTime(), at(9, 48).getTime()],
      [at(10, 21).getTime(), at(10, 29).getTime()],
    ];
    expect(minutes(focusedMs(plan, 2, at(11, 20), away))).toBe(92);
  });
});

describe('rhythm ids', () => {
  it('recognises presets and keeps custom rhythms in bounds', () => {
    expect(rhythmId(RHYTHMS.pomodoro)).toBe('pomodoro');
    expect(rhythmId(customRhythm(40, 8))).toBe('custom');
    expect(customRhythm(200, 1)).toEqual({ focus: 120, break: 5, longBreak: 0, longEvery: 0 });
    expect(customRhythm(42, 12)).toEqual({ focus: 40, break: 10, longBreak: 0, longEvery: 0 });
  });
});
