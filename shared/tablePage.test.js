import { describe, expect, it } from 'vitest';
import { tablePage, tablePreview } from './tablePage.js';

const preview = {
  topic: 'Algorithms', room_code: 'C001', starts_at: '2026-10-22T11:15:00Z', ends_at: '2026-10-22T12:45:00Z',
  seats: 6, taken: 3, cancelled: false,
};

describe('table link previews', () => {
  it('says what, when, where and how full, with no names', () => {
    const p = tablePreview(preview);
    expect(p.title).toBe('Algorithms · Thu 22 Oct, 13:15 · C001');
    expect(p.description).toContain('3 of 6 seats taken');
    expect(new URLSearchParams(p.card).get('s')).toBe('6');
  });

  it('marks full and cancelled tables', () => {
    expect(tablePreview({ ...preview, taken: 6 }).description).toContain('Full');
    expect(tablePreview({ ...preview, cancelled: true }).title).toMatch(/^Cancelled: /);
  });

  it('sends people on to the app and refuses odd links', () => {
    expect(tablePage(preview, 'mossy-lagoon-42', 'https://x.test')).toContain('"/t/mossy-lagoon-42?app"');
    expect(tablePage(null, '<script>', 'https://x.test')).not.toContain('<script>"');
  });
});
