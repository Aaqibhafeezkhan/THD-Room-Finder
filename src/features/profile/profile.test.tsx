import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../lib/theme';
import { MapPrefsProvider } from '../../lib/mapPrefs';
import { I18nProvider } from '../../i18n';
import { memoryStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import { exportHistory } from '../../domain/focusHistory';
import { FocusHistoryProvider } from '../focus/FocusHistoryContext';
import { SettingsScreen } from './SettingsScreen';

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('thd_locale', 'en');
  document.documentElement.removeAttribute('data-accent');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

function Providers({ children, path, store = memoryStore() }: { children: ReactNode; path: string; store?: FocusHistoryStore }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <MapPrefsProvider>
          <I18nProvider>
            <FocusHistoryProvider store={store}>{children}</FocusHistoryProvider>
          </I18nProvider>
        </MapPrefsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

function button(name: string): HTMLButtonElement {
  const el = [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === name);
  if (!el) throw new Error(`no button ${name}`);
  return el;
}

const session = {
  id: 's1',
  startedAt: '2026-10-13T08:00:00.000Z',
  endedAt: '2026-10-13T09:25:00.000Z',
  minutes: 85,
  room: 'E 212',
};

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

function radio(name: string): HTMLElement {
  const el = [...container.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.trim() === name);
  if (!el) throw new Error(`no radio ${name}`);
  return el;
}

describe('Settings', () => {
  it('sets the focus graph colour on the root element and remembers it', async () => {
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => radio('Orchid').click());
    expect(document.documentElement.getAttribute('data-accent')).toBe('orchid');
    expect(localStorage.getItem('thd_accent')).toBe('orchid');

    await act(async () => radio('Violet').click());
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('restores a saved graph colour on start', async () => {
    localStorage.setItem('thd_accent', 'graphite');
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    expect(document.documentElement.getAttribute('data-accent')).toBe('graphite');
    expect(radio('Graphite').getAttribute('aria-checked')).toBe('true');
  });

  it('switches the language from the settings list', async () => {
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => radio('Deutsch').click());
    expect(container.textContent).toContain('Darstellung');
  });
});

describe('Focus history settings', () => {
  it('imports an exported file into the device store', async () => {
    const store = memoryStore();
    await render(
      <Providers path="/profile/settings" store={store}>
        <SettingsScreen />
      </Providers>,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File([exportHistory([session], new Date())], 'h.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    });
    expect(await store.all()).toEqual([session]);
    expect(container.textContent).toContain('1 session imported');
  });

  it('clears the history only after confirming', async () => {
    const store = memoryStore([session]);
    await render(
      <Providers path="/profile/settings" store={store}>
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => button('Clear history').click());
    expect(await store.all()).toHaveLength(1);
    await act(async () => button('Clear').click());
    expect(await store.all()).toHaveLength(0);
    expect(container.textContent).toContain('0 sessions');
  });
});
