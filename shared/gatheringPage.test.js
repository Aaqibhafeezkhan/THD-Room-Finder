import { describe, expect, it } from 'vitest';
import { gatheringPage, gatheringPreview } from './gatheringPage.js';

const preview = {
  kind: 'talk', title: 'Founders talk', org_name: 'Fast Forward', room_code: 'A008',
  starts_at: '2026-11-18T17:30:00Z', ends_at: '2026-11-18T19:00:00Z', capacity: 120, replies: 'ggmg', cancelled: false,
};

describe('gathering link previews', () => {
  it('says what, when, where and who hosts it, with no counts or names', () => {
    const p = gatheringPreview(preview);
    expect(p.title).toBe('Founders talk · Wed 18 Nov, 18:30 · A008');
    expect(p.description).toBe("Talk by Fast Forward. Reply Going, Maybe or Can't.");
    expect(p.description).not.toMatch(/\d+ going/);
    expect(new URLSearchParams(p.card).get('p')).toBe('ggmg');
  });

  it('sends people on to the app and refuses odd links', () => {
    expect(gatheringPage(preview, 'amber-otter-17', 'https://x.test')).toContain('"/g/amber-otter-17?app"');
    expect(gatheringPage(null, 'nope', 'https://x.test')).toContain('"/g/?app"');
  });
});
