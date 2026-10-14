import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../lib/theme';
import { MapPrefsProvider } from '../../lib/mapPrefs';
import { I18nProvider } from '../../i18n';
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

function Providers({ children, path }: { children: ReactNode; path: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <MapPrefsProvider>
          <I18nProvider>{children}</I18nProvider>
        </MapPrefsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

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
