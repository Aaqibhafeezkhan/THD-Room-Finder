import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { copyLanding } from '../build/about.mjs';

// Crawlers and AI agents get a front door (#252): the landing site served at
// /about/, plus robots.txt, sitemap.xml and llms.txt, are indexable; every
// other path on the app host answers with the SPA shell and must carry
// X-Robots-Tag: noindex.
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

// robots.txt as the bots that honour it read it: the longest matching rule wins.
const robots = read('public/robots.txt');
const rules = [...robots.matchAll(/^(Allow|Disallow): (\S+)$/gm)].map(([, kind, prefix]) => ({ kind, prefix }));
const crawlable = (path) => {
  const match = rules
    .filter((r) => path.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return !match || match.kind === 'Allow';
};

const ldBlocks = (file) =>
  [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, json]) => [JSON.parse(json)].flat());

describe('crawler front door', () => {
  it('keeps the front doors indexable', () => {
    for (const path of ['/', '/about/', '/llms.txt', '/robots.txt', '/sitemap.xml']) {
      expect(noindexed(path), path).toBe(false);
    }
  });

  it('keeps app screens, shared links and unknown paths out of search', () => {
    for (const path of [
      '/rooms', '/focus', '/profile', '/profile/about', '/room/C011', '/t/abc', '/g/abc', '/f/x', '/i/x',
      '/o/thd-ai', '/nope', '/About/', '/aboutus', '/about/en', '/llms.txt.bak', '/llmsxtxt',
    ]) {
      expect(noindexed(path), path).toBe(true);
    }
  });

  it('lists only the app in the sitemap while the landing site is canonical on GitHub Pages', () => {
    expect(sitemapPaths).toEqual(['/']);
    expect(read('website/index.html')).toContain('<link rel="canonical" href="https://arudaev.github.io/THD-Room-Finder/">');
  });

  it('sends /about to /about/, where the landing page and its relative assets resolve', () => {
    expect(vercel.redirects).toContainEqual({ source: '/about', destination: '/about/', permanent: true });
    expect(vercel.buildCommand).toBe('npm run build:web');
    expect(JSON.parse(read('package.json')).scripts['build:web']).toContain('scripts/build/about.mjs');
  });

  it('copies the landing site into the build without Windows clutter', () => {
    const out = mkdtempSync(join(tmpdir(), 'about-'));
    try {
      copyLanding(join(root, 'website'), out);
      expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe(read('website/index.html'));
      for (const [, src] of read('website/index.html').matchAll(/(?:src|srcset|href)="((?:assets|icons)\/[^"]+)"/g)) {
        expect(existsSync(join(out, src)), src).toBe(true);
      }
      expect(existsSync(join(out, 'desktop.ini'))).toBe(false);
      expect(existsSync(join(out, 'sitemap.xml'))).toBe(false);
    } finally {
      rmSync(out, { recursive: true, force: true });
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

  it('describes the app the same way on the app and the landing page', () => {
    const app = (file) => ldBlocks(file).find((block) => block['@type'] === 'WebApplication');
    expect(app('website/index.html')).toEqual(app('index.html'));
  });

  it('marks up exactly the FAQ the landing page shows', () => {
    const page = read('website/index.html');
    const text = (html) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    const shown = [...page.matchAll(/<details><summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p><\/details>/g)].map(
      ([, q, a]) => [text(q), text(a)],
    );
    const faq = ldBlocks('website/index.html').find((block) => block['@type'] === 'FAQPage');
    expect(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(shown);
  });
});
