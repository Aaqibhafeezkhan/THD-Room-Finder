import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Hall } from './Hall';
import { KindPicker } from './KindPicker';

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

describe('Hall', () => {
  it('draws everyone in reply order with the room code on the plate', async () => {
    await render(<Hall kind="games" capacity={16} replies="gmg" code="I112" title="I 112: 2 going, 1 maybe" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-label')).toBe('I 112: 2 going, 1 maybe');
    expect(svg.textContent).toBe('I112');
    const dots = [...svg.querySelectorAll('circle')];
    expect(dots).toHaveLength(16);
    expect(dots.slice(0, 3).map((c) => c.getAttribute('fill'))).toEqual(['var(--md-focus)', 'var(--md-focus-container)', 'var(--md-focus)']);
    expect(dots[3].getAttribute('fill')).toBe('none');
  });
});

describe('KindPicker', () => {
  it('picks one of the four kinds', async () => {
    const picked: string[] = [];
    await render(
      <KindPicker value="games" onChange={(k) => picked.push(k)} label="Kind"
        labels={{ focus: 'Group focus', games: 'Game night', talk: 'Talk', meeting: 'Meeting' }} />,
    );
    const tiles = [...container.querySelectorAll('[role="radio"]')] as HTMLButtonElement[];
    expect(tiles.map((b) => b.textContent)).toEqual(['Group focus', 'Game night', 'Talk', 'Meeting']);
    expect(tiles[1].getAttribute('aria-checked')).toBe('true');
    await act(async () => tiles[2].click());
    expect(picked).toEqual(['talk']);
  });
});
