// Serves the landing site (website/, also on GitHub Pages) at /about/ and
// /about/de/ on the app host, from one source, so people and crawlers who land
// there see the same page in either language (#252). GitHub Pages swaps the
// language in the browser from data-de attributes; here each language is its
// own static page that search engines can read.
// Runs only in the Vercel build (`npm run build:web`): the Android app is
// built with `npm run build` and never carries these files.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

export const ABOUT = 'https://thd-room-finder.vercel.app/about/';

// GitHub Pages' own sitemap lists the github.io URL; the app host has its own.
const SKIP = new Set(['desktop.ini', 'sitemap.xml', 'index.html']);

// Text that reads the same in both languages and needs no data-de.
const SAME_IN_BOTH = new Set(['THD Room Finder', 'GitHub', 'Android', 'iPhone', 'FAQ', 'EN', 'DE', 'THD AI', 'Pomodoro']);

const parse = (html) => new JSDOM(html).window.document;
const serialize = (doc) => `<!DOCTYPE html>\n${doc.documentElement.outerHTML}\n`;

/** The language switch becomes a plain link to the other page. */
function linkLanguage(doc, to) {
  const button = doc.getElementById('lang');
  if (!button) throw new Error('about: the language switch (#lang) is missing');
  const link = doc.createElement('a');
  link.id = 'lang';
  link.className = button.className;
  link.href = to === 'de' ? '/about/de/' : '/about/';
  link.hreflang = to;
  link.lang = to;
  link.setAttribute('aria-label', to === 'de' ? 'Auf Deutsch lesen' : 'Read in English');
  link.textContent = to.toUpperCase();
  button.replaceWith(link);
}

/** Every piece of English text on the page needs its German twin. */
export function missingGerman(html) {
  const doc = parse(html);
  const missing = [];
  for (const el of doc.querySelectorAll('[data-de], [data-de-label], [data-de-alt], [data-de-content]')) {
    for (const attr of ['data-de', 'data-de-label', 'data-de-alt', 'data-de-content']) {
      if (el.hasAttribute(attr) && !el.getAttribute(attr).trim()) missing.push(`empty ${attr} on <${el.localName}>`);
    }
  }
  const walker = doc.createTreeWalker(doc.body, 4 /* SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (!/[A-Za-z]{2}/.test(text) || SAME_IN_BOTH.has(text)) continue;
    const parent = node.parentElement;
    if (parent.closest('script, style, code, [data-de], [translate="no"]')) continue;
    missing.push(`"${text.slice(0, 60)}" in <${parent.localName}>`);
  }
  for (const img of doc.querySelectorAll('img[alt]:not([data-de-alt])')) {
    if (/[A-Za-z]{2}/.test(img.alt)) missing.push(`alt "${img.alt.slice(0, 60)}"`);
  }
  return missing;
}

/** The English page at /about/: the source with a link to the German page. */
export function englishPage(html) {
  const doc = parse(html);
  linkLanguage(doc, 'de');
  return serialize(doc);
}

/** The German page at /about/de/, built from the source's data-de text. */
export function germanPage(html) {
  const missing = missingGerman(html);
  if (missing.length) throw new Error(`about: German text missing:\n  ${missing.join('\n  ')}`);
  const doc = parse(html);
  doc.documentElement.lang = 'de';
  for (const el of doc.querySelectorAll('[data-de]')) el.innerHTML = el.getAttribute('data-de');
  for (const el of doc.querySelectorAll('[data-de-label]')) el.setAttribute('aria-label', el.getAttribute('data-de-label'));
  for (const el of doc.querySelectorAll('[data-de-alt]')) el.alt = el.getAttribute('data-de-alt');
  for (const el of doc.querySelectorAll('[data-de-content]')) el.setAttribute('content', el.getAttribute('data-de-content'));
  doc.querySelector('link[rel="canonical"]').href = `${ABOUT}de/`;
  doc.querySelector('meta[property="og:url"]').setAttribute('content', `${ABOUT}de/`);
  const locale = doc.createElement('meta');
  locale.setAttribute('property', 'og:locale');
  locale.setAttribute('content', 'de_DE');
  doc.querySelector('meta[property="og:url"]').after(locale);
  linkLanguage(doc, 'en');

  // The FAQ markup follows the German FAQ.
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    const blocks = [JSON.parse(script.textContent)].flat();
    const faq = blocks.find((b) => b['@type'] === 'FAQPage');
    if (!faq) continue;
    faq.mainEntity = [...doc.querySelectorAll('details')].map((d) => ({
      '@type': 'Question',
      name: d.querySelector('summary').textContent.trim(),
      acceptedAnswer: { '@type': 'Answer', text: d.querySelector('p').textContent.trim() },
    }));
    script.textContent = `\n${JSON.stringify(blocks.length === 1 ? blocks[0] : blocks, null, 2)}\n  `;
  }

  // One folder deeper: assets and icons live in /about/.
  for (const el of doc.querySelectorAll('[src], [srcset], [href]')) {
    for (const attr of ['src', 'srcset', 'href']) {
      const value = el.getAttribute(attr);
      if (value && /^(assets|icons)\//.test(value)) el.setAttribute(attr, `../${value}`);
    }
  }
  return serialize(doc);
}

/** Builds /about/ and /about/de/ from `website` into `out`. */
export function buildAbout(website, out) {
  const html = readFileSync(join(website, 'index.html'), 'utf8');
  const de = germanPage(html);
  mkdirSync(join(out, 'de'), { recursive: true });
  cpSync(website, out, {
    recursive: true,
    filter: (src) => !SKIP.has(src.split(/[\\/]/).pop()),
  });
  writeFileSync(join(out, 'index.html'), englishPage(html));
  writeFileSync(join(out, 'de', 'index.html'), de);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(fileURLToPath(import.meta.url), '../../..');
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('about: dist/ is missing; run the app build first');
    process.exit(1);
  }
  buildAbout(join(root, 'website'), join(dist, 'about'));
  console.log('about: landing site built into dist/about/ and dist/about/de/');
}
