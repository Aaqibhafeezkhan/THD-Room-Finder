import { describe, expect, it } from 'vitest';
import { toTable } from './tablesApi';

describe('tables from the service', () => {
  it('maps a table, its seats, rhythm and the viewer’s reply', () => {
    const table = toTable({
      link: 'mossy-lagoon-42', topic: 'Algorithms', room_key: 'thd:r1', room_code: 'C001',
      starts_at: '2026-10-22T11:15:00Z', ends_at: '2026-10-22T12:45:00Z', seats: 6,
      rhythm: { focus_minutes: 25, break_minutes: 5, long_break_minutes: 15, long_every: 4 },
      host_name: null, host_show_name: false, cancelled: false, changed: true, version: 2,
      is_host: false, my_answer: 'seat', my_show_name: true,
      taken: 3, maybe: 1, seat_names: ['Lena', 7], maybe_names: [],
    });
    expect(table?.seats).toBe(6);
    expect(table?.taken).toBe(3);
    expect(table?.rhythm).toEqual({ focus: 25, break: 5, longBreak: 15, longEvery: 4 });
    expect(table?.myAnswer).toBe('seat');
    expect(table?.seatNames).toEqual(['Lena']);
  });

  it('ignores an unknown answer and an empty reply', () => {
    expect(toTable({ link: 'mossy-lagoon-42', starts_at: '2026-10-22T12:00:00Z', ends_at: '2026-10-22T13:00:00Z', my_answer: 'going' })?.myAnswer).toBeNull();
    expect(toTable(null)).toBeNull();
  });
});
