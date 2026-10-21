import { describe, expect, it } from 'vitest';
import { hallLayout, hallSvg } from './hall.js';

describe('the gathering picture', () => {
  it('has a place for everyone the room holds, filled in reply order', () => {
    const h = hallLayout('games', 48, 'gmg', { width: 320 });
    expect(h.points).toHaveLength(48);
    expect(h.marks).toEqual(['g', 'm', 'g']);
    expect(h.tables).toHaveLength(6);
  });

  it('draws one dot per two people above 120', () => {
    const h = hallLayout('talk', 240, 'gm'.repeat(10));
    expect(h.per).toBe(2);
    expect(h.points).toHaveLength(120);
    expect(h.marks.every((m) => m === 'm')).toBe(true); // a pair with a maybe is a maybe
  });

  it('seats the first replies of a talk in the middle of the front row', () => {
    const h = hallLayout('talk', 120, 'g', { width: 320 });
    const [x] = h.points[0];
    expect(Math.abs(x - 160)).toBeLessThan(20);
  });

  it('puts the room code on the plate', () => {
    expect(hallSvg(hallLayout('meeting', 40, ''), 'C105', {
      table: '#eee', tableEdge: '#ccc', text: '#000', going: '#60f', maybe: '#ccf', maybeEdge: '#60f', free: '#ddd',
    })).toContain('>C105</text>');
  });
});
