import { describe, expect, it } from 'vitest';
import { RHYTHMS, layout } from '../../domain/focusRhythm';
import type { Translate } from '../../i18n';
import type { ActiveSession } from './FocusSessionContext';
import { notificationStages } from './notificationStages';

const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);
const t: Translate = (en) => en;

const session = (rhythm = RHYTHMS.deep, confirmed = 1): ActiveSession => ({
  roomIdent: 'r000000139',
  roomCode: 'B004',
  startedAt: at(9, 30).toISOString(),
  plannedEnd: at(11, 20).toISOString(),
  reason: 'lecture',
  rhythm,
  anchorAt: at(9, 30).toISOString(),
  confirmed,
  visibility: 'private',
  showName: false,
  shared: null,
});
const plan = (s: ActiveSession) => layout(s.rhythm, new Date(s.anchorAt), new Date(s.startedAt), new Date(s.plannedEnd))!;
const brief = (st: ReturnType<typeof notificationStages>) =>
  st.map((x) => `${new Date(x.at).getHours()}:${String(new Date(x.at).getMinutes()).padStart(2, '0')} ${x.clear ? 'clear' : x.title}`);

describe('notificationStages', () => {
  it('runs from the block through the break to "Break\'s over", then clears', () => {
    const s = session();
    const stages = notificationStages(s, plan(s), at(9, 45), t);
    expect(brief(stages)).toEqual(['9:45 Focus · B004', '10:20 Break · B004', "10:30 Break's over · B004", '10:40 clear']);
    expect(stages[0]).toMatchObject({ text: 'Block 1 of 2 · break at 10:20', countdownTo: at(10, 20).getTime(), alert: false });
    expect(stages[2]).toMatchObject({ confirmLabel: 'Start Block 2', alert: true });
  });

  it('after the last block is confirmed, ends with a note', () => {
    const s = session(RHYTHMS.deep, 2);
    expect(brief(notificationStages(s, plan(s), at(10, 45), t))).toEqual(['10:45 Focus · B004', '11:20 Session done · B004']);
  });

  it('never shows a name or batch', () => {
    const s = { ...session(), visibility: 'public' as const, showName: true };
    const text = JSON.stringify(notificationStages(s, plan(s), at(9, 45), t));
    expect(text).not.toMatch(/AIN|Lena/);
  });

  it('Open counts up and asks every hour', () => {
    const s = { ...session(RHYTHMS.open), plannedEnd: at(12, 0).toISOString() };
    const stages = notificationStages(s, plan(s), at(9, 45), t);
    expect(brief(stages)).toEqual(['9:45 Focus · B004', '10:30 Still focusing? · B004', '10:40 clear']);
    expect(stages[0].countUpFrom).toBe(at(9, 30).getTime());
  });
});
