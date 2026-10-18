// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cardTree } from '../api/card.js';

function elements(node) {
  return [node, ...(node.props?.children ?? []).flatMap((child) =>
    child && typeof child === 'object' ? elements(child) : [])];
}

describe('focus link-preview closures', () => {
  it.each([false, true])('matches the classroom calendar and keeps future slots (dark=%s)', (dark) => {
    // Start on a Wednesday to ensure dates, rather than grid rows, determine closure.
    const start = '2026-10-07';
    const tree = cardTree({ start, weeks: 2, today: 10, levels: Array(11).fill(4),
      dark, accent: 'orchid', lang: 'en', minutes: 275, streak: 5 }, 'https://example.test');
    const cells = elements(tree).filter((node) => node.props?.style?.marginBottom !== undefined);
    expect(cells).toHaveLength(14);
    for (let i = 0; i < cells.length; i++) {
      const style = cells[i].props.style;
      if (i > 10) expect(style.background).toBe('transparent');
      else expect(style.background).toBe(dark ? '#F3BCE6' : '#7E1F6E');
    }
    // Activity on Saturday remains visible and today remains outlined.
    expect(cells[10].props.style.border).toContain('3px solid');
  });

  it('marks an empty Christmas closure without erasing study on another closed day', () => {
    const tree = cardTree({ start: '2026-12-24', weeks: 1, today: 2, levels: [0, 4, 0], dark: false, accent: 'violet', lang: 'en', minutes: 175, streak: 5 }, 'https://example.test');
    const cells = elements(tree).filter(node => node.props?.style?.marginBottom !== undefined);
    expect(cells[0].props.style.background).toBe('#EFEEF5');
    expect(cells[0].props.children).toHaveLength(1);
    expect(cells[1].props.style.background).toBe('#4A2A91');
    expect(cells[1].props.children).toHaveLength(0);
    expect(cells[3].props.style.background).toBe('transparent');
  });
});

