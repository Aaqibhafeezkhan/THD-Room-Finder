import { describe, expect, it } from 'vitest';
import { calendarMonth, dayKey, focusCalendar, focusGridMove } from './focusGraph';

describe('focus calendar model', () => {
  it('keeps exact dates through a leap day and adds sessions on one day', () => {
    const columns = focusCalendar([{date: '2028-02-29', minutes: 25}, {date: '2028-02-29', minutes: 50}], '2028-03-01', 2);
    const cells = columns.flatMap(column => column.cells);
    expect(cells.find(cell => cell.date === '2028-02-29')?.minutes).toBe(75);
    expect(cells.filter(cell => cell.today)).toHaveLength(1);
    expect(cells.filter(cell => cell.future)).toHaveLength(4);
    expect(new Set(cells.map(cell => dayKey(cell.dateValue))).size).toBe(14);
  });
  it('does not skip or repeat a calendar date across the autumn clock change', () => {
    const cells = focusCalendar([], '2026-10-25', 2).flatMap(column => column.cells);
    expect(cells.map(cell => cell.date)).toContain('2026-10-25');
    expect(new Set(cells.map(cell => cell.date)).size).toBe(14);
    expect(cells[0].date).toBe('2026-10-12');
    expect(cells[13].date).toBe('2026-10-25');
  });
  it('omits a partial leading month in both the calendar and exported images', () => {
    const first = new Date(2026, 8, 27);
    expect(calendarMonth(first, 0)).toBe(null);
    expect(calendarMonth(first, 1)).toBe(9);
    expect(calendarMonth(first, 2)).toBe(null);
    expect(calendarMonth(new Date(2026, 2, 1), 0)).toBe(2);
  });
  it('groups Saturday and Sunday below the five weekdays', () => {
    const column = focusCalendar([], '2026-10-18', 1)[0];
    expect(column.weekStart.getDay()).toBe(1);
    expect(column.cells.map(cell => cell.dateValue.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(column.cells.map(cell => cell.rest)).toEqual([false, false, false, false, false, true, true]);
    expect(column.cells[6].today).toBe(true);
  });
  it('keeps rest policy separate from physical closure', () => {
    const weekend = focusCalendar([], '2026-10-18', 1)[0].cells[6];
    expect(weekend.rest).toBe(true);
    expect(weekend.closed).toBe(false);
    const christmas = focusCalendar([], '2026-12-25', 1)[0].cells[4];
    expect(christmas.closed).toBe(true);
    expect(christmas.rest).toBe(true);
  });
  it.each([[0, 'ArrowLeft', 0], [0, 'ArrowUp', 0], [6, 'ArrowDown', 6], [9, 'ArrowRight', 16],
    [16, 'ArrowRight', 16], [16, 'ArrowDown', 16], [15, 'Home', 1], [1, 'End', 15]])('navigates index %s with %s without wrapping', (index, key, expected) => {
    expect(focusGridMove(index as number, 16, key as string)).toBe(expected);
  });
});
