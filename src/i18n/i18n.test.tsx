import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider, localeFromSearch, useI18n } from './index';

describe('localeFromSearch', () => {
  it('reads the language a link asks for', () => {
    expect(localeFromSearch('?lang=de')).toBe('de');
    expect(localeFromSearch('?x=1&lang=en')).toBe('en');
  });

  it('ignores anything else', () => {
    expect(localeFromSearch('')).toBeNull();
    expect(localeFromSearch('?lang=fr')).toBeNull();
    expect(localeFromSearch('?lang=DE')).toBeNull();
  });
});

describe('I18nProvider', () => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  function Shown() {
    const { locale } = useI18n();
    return <span>{locale}</span>;
  }

  async function render() {
    const container = document.createElement('div');
    await act(async () => createRoot(container).render(<I18nProvider><Shown /></I18nProvider>));
    return container;
  }

  it('opens in the language of the link over the saved one, saves it and drops it from the address', async () => {
    localStorage.setItem('thd_locale', 'en');
    window.history.replaceState(null, '', '/?lang=de#top');
    const container = await render();
    expect(container.textContent).toBe('de');
    expect(localStorage.getItem('thd_locale')).toBe('de');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('#top');
  });

  it('keeps the saved language when the link asks for none', async () => {
    localStorage.setItem('thd_locale', 'de');
    const container = await render();
    expect(container.textContent).toBe('de');
  });
});
