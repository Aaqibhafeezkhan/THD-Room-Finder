import { describe, expect, it } from 'vitest';
import type { SessionDto } from '../../data/focusApi';
import { RHYTHMS } from '../../domain/focusRhythm';
import { adoptSession } from './adoptSession';

const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);

const dto = (over: Partial<SessionDto> = {}): SessionDto => ({
  id: 's1',
  roomKey: 'thd:r000000712',
  roomCode: 'C011',
  visibility: 'private',
  showName: false,
  startedAt: at(10),
  plannedEnd: at(12),
  leaseUntil: at(11),
  renewedAt: at(10),
  endedAt: null,
  endReason: null,
  version: 1,
  rhythm: RHYTHMS.pomodoro,
  anchorAt: at(10),
  skewMs: 0,
  ...over,
});

describe('adoptSession', () => {
  it('takes the room, rhythm and plan from the other device', () => {
    expect(adoptSession(dto(), at(10, 10))).toMatchObject({
      roomIdent: 'r000000712',
      roomCode: 'C011',
      startedAt: at(10).toISOString(),
      plannedEnd: at(12).toISOString(),
      reason: 'lecture',
      confirmed: 1,
      adopted: true,
      shared: { id: 's1', version: 1 },
    });
  });

  it('counts blocks begun before the last renewal as confirmed', () => {
    expect(adoptSession(dto({ renewedAt: at(10, 31) }), at(10, 40))?.confirmed).toBe(2);
  });

  it('moves server times onto this device clock', () => {
    // The server is 2 minutes ahead of this device.
    const s = adoptSession(dto({ startedAt: at(10, 2), anchorAt: at(10, 2), plannedEnd: at(12, 2), leaseUntil: at(11, 2), skewMs: 120000 }), at(10, 10));
    expect(s?.startedAt).toBe(at(10).toISOString());
  });

  it('never adopts a session that ended or ran out', () => {
    expect(adoptSession(dto({ endedAt: at(10, 5) }), at(10, 10))).toBeNull();
    expect(adoptSession(dto(), at(11, 1))).toBeNull();
  });
});
