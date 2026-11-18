import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Crawlers and AI agents get a front door (#252): /about, /about/de,
// robots.txt, sitemap.xml and llms.txt are indexable; every other path on the
// app host answers with the SPA shell and must carry X-Robots-Tag: noindex.
const root = join(import.meta.dirname, '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const vercel = JSON.parse(read('vercel.json'));

const noindexRule = vercel.headers.find((h) =>
  h.headers.some((x) => x.key === 'X-Robots-Tag' && x.value === 'noindex'),
);
// Vercel matches the whole path, case-sensitively (/About gets the app shell).
const noindexed = (path) => new RegExp(`^${noindexRule.source}$`).test(path);

const ORIGIN = 'https://thd-room-finder.vercel.app';
const sitemapPaths = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, loc]) => loc.replace(ORIGIN, ''),
);
const pageFile = (path) => (path === '/' ? 'index.html' : `public${path}/index.html`);

// robots.txt as the bots that honour it read it: the longest matching rule wins.
const robots = read('public/robots.txt');
const rules = [...robots.matchAll(/^(Allow|Disallow): (\S+)$/gm)].map(([, kind, prefix]) => ({ kind, prefix }));
const crawlable = (path) => {
  const match = rules
    .filter((r) => path.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return !match || match.kind === 'Allow';
};

describe('crawler front door', () => {
  it('keeps the front doors indexable', () => {
    for (const path of ['/', '/about', '/about/', '/about/de', '/llms.txt', '/robots.txt', '/sitemap.xml']) {
      expect(noindexed(path), path).toBe(false);
    }
  });

  it('keeps app screens, shared links and unknown paths out of search', () => {
    for (const path of [
      '/rooms', '/focus', '/profile', '/profile/about', '/room/C011', '/t/abc', '/g/abc', '/f/x', '/i/x',
      '/o/thd-ai', '/nope', '/About', '/aboutus', '/about/en', '/llms.txt.bak', '/llmsxtxt',
    ]) {
      expect(noindexed(path), path).toBe(true);
    }
  });

  it('lists only indexable pages that exist in the sitemap', () => {
    expect(sitemapPaths).toEqual(['/', '/about', '/about/de']);
    for (const path of sitemapPaths) {
      expect(noindexed(path), path).toBe(false);
      expect(existsSync(join(root, pageFile(path))), path).toBe(true);
    }
  });

  it('rewrites the about pages to their static files before the SPA catch-all', () => {
    const sources = vercel.rewrites.map((r) => r.source);
    const catchAll = sources.indexOf('/((?!api/).*)');
    for (const path of ['/about', '/about/de']) {
      expect(sources.indexOf(path), path).toBeGreaterThan(-1);
      expect(sources.indexOf(path), path).toBeLessThan(catchAll);
    }
  });

  it('keeps crawlers off the THabella proxy but lets chat apps load preview images', () => {
    expect(crawlable('/api/rooms')).toBe(false);
    expect(crawlable('/api/periods')).toBe(false);
    for (const page of ['sharePage', 'tablePage', 'gatheringPage']) {
      const images = [...read(`shared/${page}.js`).matchAll(/\/api\/[a-z-]+/g)].map(([path]) => path);
      expect(images.length, page).toBeGreaterThan(0);
      for (const path of images) expect(crawlable(path), path).toBe(true);
    }
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it.each([
    ['/about', 'en', '/about/de'],
    ['/about/de', 'de', '/about'],
  ])('serves %s without scripts, in its language, linked to the other', (path, lang, other) => {
    const page = read(pageFile(path));
    expect(page).not.toContain('<script');
    expect(page).toContain(`<html lang="${lang}">`);
    expect(page).toContain(`<link rel="canonical" href="${ORIGIN}${path}">`);
    expect(page).toContain(`hreflang="${lang === 'en' ? 'de' : 'en'}" href="${ORIGIN}${other}"`);
    expect(page).toContain(`<a href="${other}"`);
  });

  // The pages and the JSON-LD are kept by hand in several places; keep them in step.
  it('keeps the English and German about pages linking to the same places', () => {
    const links = (path) =>
      new Set([...read(pageFile(path)).matchAll(/href="([^"]+)"/g)].map(([, href]) => href).filter((h) => !h.startsWith('/about')));
    expect(links('/about/de')).toEqual(links('/about'));
  });

  it('describes the app the same way on the app and the landing page', () => {
    const ldBlocks = (file) =>
      [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, json]) => [JSON.parse(json)].flat());
    const app = (file) => ldBlocks(file).find((block) => block['@type'] === 'WebApplication');
    expect(app('website/index.html')).toEqual(app('index.html'));
  });

  it('marks up exactly the FAQ the landing page shows', () => {
    const page = read('website/index.html');
    const text = (html) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    const shown = [...page.matchAll(/<details><summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p><\/details>/g)].map(
      ([, q, a]) => [text(q), text(a)],
    );
    const faq = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(([, json]) => [JSON.parse(json)].flat())
      .find((block) => block['@type'] === 'FAQPage');
    expect(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(shown);
  });
});
