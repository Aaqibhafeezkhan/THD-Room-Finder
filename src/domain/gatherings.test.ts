import { describe, expect, it } from 'vitest';
import { peopleCsv, planFor, programmeCounts, registryIssueUrl, roomCapacity, slugFrom } from './gatherings';

const person = (programme: string | null, answer: string, name = 'Lena') => ({
  name, programme, intakeYear: 2023, intakeTerm: 'winter' as const, answer, repliedAt: new Date('2026-10-20T10:00:00Z'),
});

describe('registry', () => {
  it('prefills the issue form with the request', () => {
    const url = new URL(registryIssueUrl({ no: 17, name: 'Campus Connect', slug: 'campus-connect' }));
    expect(url.pathname).toBe('/THD-AI/organizations/issues/new');
    expect(url.searchParams.get('template')).toBe('register.yml');
    expect(url.searchParams.get('request')).toBe('17');
    expect(url.searchParams.get('slug')).toBe('campus-connect');
  });

  it('turns a group name into a short name', () => {
    expect(slugFrom('Campus Connect e.V.')).toBe('campus-connect-e-v');
    expect(slugFrom('Fußball AG')).toBe('fussball-ag');
  });
});

describe('gatherings', () => {
  it('takes the room’s seats as the capacity from 13 on', () => {
    expect(roomCapacity({ seatsRegular: 120 })).toBe(120);
    expect(roomCapacity({ seatsRegular: 12 })).toBeNull();
    expect(roomCapacity({ seatsRegular: 900 })).toBe(300);
  });

  it('plans for everyone going and half the maybes', () => {
    expect(planFor(22, 6)).toBe(25);
  });

  it('counts programmes among going and maybe, most first', () => {
    const c = programmeCounts([person('AIN', 'going'), person('AIN', 'maybe'), person('SE', 'going'), person('ME', 'going'), person('BW', 'going'), person('KI', 'waiting')]);
    expect(c.shown[0]).toEqual(['AIN', 2]);
    expect(c.others).toBe(1);
  });

  it('exports people without email addresses', () => {
    const csv = peopleCsv([person('AIN', 'going', 'Max, Jr.')], new Date('2026-10-20T10:00:00Z'));
    expect(csv.split('\n')[0]).toBe('Name,Batch,Reply,Replied at');
    expect(csv).toContain('"Max, Jr.",AIN 7,going');
    expect(csv).not.toContain('@');
  });
});
