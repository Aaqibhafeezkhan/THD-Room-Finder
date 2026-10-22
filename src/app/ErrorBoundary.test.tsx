import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary, isChunkError } from './ErrorBoundary';

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

function Boom(): never {
  throw new Error('bad data');
}

describe('ErrorBoundary', () => {
  it('shows a way out instead of a blank page', async () => {
    await render(<ErrorBoundary inShell><Boom /></ErrorBoundary>);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Something went wrong here');
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons).toEqual(['Reload', 'Go to Campus']);
  });

  it('gives the next screen a fresh try', async () => {
    await render(<ErrorBoundary inShell resetKey="/a"><Boom /></ErrorBoundary>);
    await render(<ErrorBoundary inShell resetKey="/b"><p>fine</p></ErrorBoundary>);
    expect(container.textContent).toBe('fine');
  });

  it('recognises a script file that could not load', () => {
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(isChunkError(new Error('bad data'))).toBe(false);
  });
});
