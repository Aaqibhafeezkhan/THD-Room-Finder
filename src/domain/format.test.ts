import { describe, it, expect } from 'vitest';
import type { Room } from './models';
import { formatDuration, formatTime, formatDayTime, roomMeta, statusBannerText } from './format';

describe('formatDuration', () => {
  it('formats hours and minutes, dropping zero parts', () => {
    expect(formatDuration(130)).toBe('2h 10m');
    expect(formatDuration(180)).toBe('3h');
    expect(formatDuration(25)).toBe('25m');
    expect(formatDuration(null)).toBe('all day');
    expect(formatDuration(-5)).toBe('0m');
  });
});

describe('formatTime', () => {
  it('renders a zero-padded 24h clock', () => {
    expect(formatTime(new Date('2026-07-06T09:05:00'))).toBe('09:05');
    expect(formatTime(new Date('2026-07-06T14:30:00'))).toBe('14:30');
  });
});

describe('statusBannerText', () => {
  const now = new Date('2026-07-06T10:00:00');
  it('describes an occupied room', () => {
    const t = statusBannerText(
      { status: 'occupied', freeUntil: null, occupiedUntil: new Date('2026-07-06T11:30:00') },
      now,
    );
    expect(t.title).toBe('Occupied now');
    expect(t.duration).toBe('until 11:30');
  });
  it('describes a free-all-day room', () => {
    const t = statusBannerText({ status: 'free', freeUntil: null, occupiedUntil: null }, now);
    expect(t.duration).toBe('all day');
  });
  it('describes a closing-soon room', () => {
    const t = statusBannerText(
      { status: 'soon', freeUntil: new Date('2026-07-06T10:25:00'), occupiedUntil: null },
      now,
    );
    expect(t.title).toBe('Closing soon');
    expect(t.duration).toBe('25m');
  });
});

describe('formatDayTime', () => {
  it('identifies the actual reopening date across a Christmas shutdown', () => {
    const date = new Date(2027, 0, 7, 6, 30);
    expect(formatDayTime(date, 'en')).toContain('7 Jan 2027');
    expect(formatDayTime(date, 'de')).toContain('7. Jan. 2027');
    expect(formatDayTime(date, 'en')).toContain('06:30');
  });
});

describe('roomMeta', () => {
  const room = (name: string, building: string, seats: number): Room => ({
    id: 1, ident: name, name, code: name.split(' - ')[0], building, floor: 0, displayName: name,
    seatsRegular: seats, seatsExam: 0, facilities: [], bookable: false,
    inChargeName: null, inChargeEmail: null, untisLongname: null,
  });

  it('names the building and seats for a Deggendorf room', () => {
    expect(roomMeta(room('C211 - EDV', 'C', 24))).toBe('Building C · 24 seats');
  });

  it('leads with the campus for a Cham room, even without the Badstraße suffix', () => {
    expect(roomMeta(room('B 0.13 Hörsaal 1 (Badstraße)', 'B', 40))).toBe('Cham · Building B · 40 seats');
    expect(roomMeta(room('B 1.06', 'B', 0), 'de')).toBe('Cham · Gebäude B');
  });

  it('leads with Pfarrkirchen for an ECRI room', () => {
    expect(roomMeta(room('EC 1.07 - 1.10', 'EC', 90))).toBe('Pfarrkirchen · Building EC · 90 seats');
  });
});
