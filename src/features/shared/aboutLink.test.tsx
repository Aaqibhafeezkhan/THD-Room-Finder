import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { AdaptiveNav, AppBar } from '../../components';
import { aboutTarget } from './aboutLink';

describe('aboutTarget', () => {
  it('leads to the about page in the app language', () => {
    expect(aboutTarget('en', false)).toEqual({ href: '/about/', label: 'About THD Room Finder', external: false });
    expect(aboutTarget('de', false)).toEqual({ href: '/about/de/', label: 'Über THD Room Finder', external: false });
  });

  it('opens the website from the Android app', () => {
    expect(aboutTarget('de', true)).toEqual({
      href: 'https://thd-room-finder.vercel.app/about/de/',
      label: 'Über THD Room Finder',
      external: true,
    });
  });
});

describe('the brand link', () => {
  async function render(node: React.ReactNode) {
    const container = document.createElement('div');
    await act(async () => createRoot(container).render(node));
    return container;
  }

  it('wraps the logo and wordmark in the app bar', async () => {
    const c = await render(<AppBar brand={aboutTarget('de', false)} />);
    const link = c.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/about/de/');
    expect(link?.textContent).toBe('THD Room Finder');
    expect(link?.querySelector('img')).not.toBeNull();
  });

  it('leaves a page title out of the link', async () => {
    const c = await render(<AppBar title="Campus" brand={aboutTarget('en', false)} />);
    expect(c.querySelector('a')?.textContent).toBe('');
    expect(c.textContent).toContain('Campus');
  });

  it('wraps the logo and name in the navigation drawer', async () => {
    const c = await render(<AdaptiveNav variant="drawer" items={[]} brand={aboutTarget('en', false)} />);
    expect(c.querySelector('a')?.getAttribute('href')).toBe('/about/');
    expect(c.querySelector('a')?.textContent).toBe('THD Room Finder');
  });

  it('opens the website in the browser from the Android app', async () => {
    const c = await render(<AdaptiveNav variant="rail" items={[]} brand={aboutTarget('en', true)} />);
    const link = c.querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noreferrer');
  });
});
