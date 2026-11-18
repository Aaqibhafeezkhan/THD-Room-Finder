import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Crawlers and AI agents get a front door (#252): /about, robots.txt,
// sitemap.xml and llms.txt are indexable; every other path on the app host
// answers with the SPA shell and must carry X-Robots-Tag: noindex.
const root = join(import.meta.dirname, '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const vercel = JSON.parse(read('vercel.json'));

const noindexRule = vercel.headers.find((h) =>
  h.headers.some((x) => x.key === 'X-Robots-Tag' && x.value === 'noindex'),
);
const noindexed = (path) => new RegExp(`^${noindexRule.source}$`).test(path);

const ORIGIN = 'https://thd-room-finder.vercel.app';
const sitemapPaths = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, loc]) => loc.replace(ORIGIN, ''),
);

describe('crawler front door', () => {
  it('keeps the front doors indexable', () => {
    for (const path of ['/', '/about', '/llms.txt', '/robots.txt', '/sitemap.xml']) {
      expect(noindexed(path), path).toBe(false);
    }
  });

  it('keeps app screens, shared links and unknown paths out of search', () => {
    for (const path of ['/rooms', '/focus', '/profile', '/room/C011', '/t/abc', '/g/abc', '/f/x', '/o/thd-ai', '/nope']) {
      expect(noindexed(path), path).toBe(true);
    }
  });

  it('lists only indexable pages that exist in the sitemap', () => {
    expect(sitemapPaths).toEqual(['/', '/about']);
    for (const path of sitemapPaths) {
      expect(noindexed(path), path).toBe(false);
      expect(existsSync(join(root, path === '/' ? 'index.html' : `public${path}/index.html`)), path).toBe(true);
    }
  });

  it('rewrites /about to its static page before the SPA catch-all', () => {
    const sources = vercel.rewrites.map((r) => r.source);
    expect(sources.indexOf('/about')).toBeGreaterThan(-1);
    expect(sources.indexOf('/about')).toBeLessThan(sources.indexOf('/((?!api/).*)'));
  });

  it('keeps crawlers off the THabella proxy and points them at the sitemap', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/^Disallow: \/api\/$/m);
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('serves the about page without scripts, in English and German', () => {
    const about = read('public/about/index.html');
    expect(about).not.toContain('<script');
    expect(about).toContain(`<link rel="canonical" href="${ORIGIN}/about">`);
    expect(about).toMatch(/<section id="de" lang="de"/);
  });
});
