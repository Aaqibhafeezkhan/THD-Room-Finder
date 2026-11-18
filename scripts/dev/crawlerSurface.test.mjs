import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABOUT, APP, buildAbout, missingGerman } from '../build/about.mjs';

// Crawlers and AI agents get a front door (#252): the landing site served at
// /about/ and /about/de/, plus robots.txt, sitemap.xml and llms.txt, are indexable; every
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
    for (const path of ['/', '/about/', '/about/de/', '/llms.txt', '/robots.txt', '/sitemap.xml']) {
      expect(noindexed(path), path).toBe(false);
    }
  });

  it('keeps app screens, shared links and unknown paths out of search', () => {
    for (const path of [
      '/rooms', '/focus', '/profile', '/profile/about', '/room/C011', '/t/abc', '/g/abc', '/f/x', '/i/x',
      '/o/thd-ai', '/nope', '/About/', '/aboutus', '/about/en/', '/about/de/x', '/llms.txt.bak', '/llmsxtxt',
    ]) {
      expect(noindexed(path), path).toBe(true);
    }
  });

  it('lists the app and both about pages, with the landing source pointing its canonical here', () => {
    expect(sitemapPaths).toEqual(['/', '/about/', '/about/de/']);
    const source = read('website/index.html');
    expect(source).toContain(`<link rel="canonical" href="${ABOUT}">`);
    expect(source).toContain(`<link rel="alternate" hreflang="de" href="${ABOUT}de/">`);
  });

  it('sends /about and /about/de to their folders, where relative assets resolve', () => {
    expect(vercel.redirects).toContainEqual({ source: '/about', destination: '/about/', permanent: true });
    expect(vercel.redirects).toContainEqual({ source: '/about/de', destination: '/about/de/', permanent: true });
    expect(vercel.buildCommand).toBe('npm run build:web');
    expect(JSON.parse(read('package.json')).scripts['build:web']).toContain('scripts/build/about.mjs');
  });

  it('has German for every piece of English on the landing page', () => {
    expect(missingGerman(read('website/index.html'))).toEqual([]);
  });

  it('builds an English and a German page whose assets resolve and which link each other', () => {
    const out = mkdtempSync(join(tmpdir(), 'about-'));
    try {
      buildAbout(join(root, 'website'), out);
      const pages = { en: join(out, 'index.html'), de: join(out, 'de', 'index.html') };
      for (const [lang, file] of Object.entries(pages)) {
        const html = readFileSync(file, 'utf8');
        expect(html, lang).toContain(`<html lang="${lang}">`);
        expect(html, lang).toContain(`<link rel="canonical" href="${ABOUT}${lang === 'de' ? 'de/' : ''}">`);
        expect(html, lang).toContain(`id="lang" class="icon-btn lang" href="${lang === 'de' ? '/about/' : '/about/de/'}"`);
        // The logo and "Open app" open the app in the page's language.
        expect(html, lang).toContain(`<a class="brand" href="/?lang=${lang}">`);
        expect(html, lang).not.toContain(`href="${APP}"`);
        expect(html.split(`href="/?lang=${lang}"`).length - 1, lang).toBeGreaterThanOrEqual(4);
        for (const [, ref] of html.matchAll(/(?:src|srcset|href)="((?:\.\.\/)?(?:assets|icons)\/[^"]+)"/g)) {
          expect(existsSync(join(dirname(file), ref)), `${lang} ${ref}`).toBe(true);
        }
      }
      expect(readFileSync(pages.de, 'utf8')).toContain('"name": "Ist das eine offizielle App der THD?"');
      expect(existsSync(join(out, 'desktop.ini'))).toBe(false);
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
