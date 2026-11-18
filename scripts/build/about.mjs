// Serves the landing site (website/, also on GitHub Pages) at /about/ on the
// app host, so people and crawlers who land there see the same page (#252).
// Runs only in the Vercel build (`npm run build:web`): the Android app is
// built with `npm run build` and never carries these files.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub Pages' own sitemap lists the github.io URL; the app host has its own.
const SKIP = new Set(['desktop.ini', 'sitemap.xml']);

/** Copies the landing site from `website` into `out`. */
export function copyLanding(website, out) {
  mkdirSync(out, { recursive: true });
  cpSync(website, out, {
    recursive: true,
    filter: (src) => !SKIP.has(src.split(/[\\/]/).pop()),
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(fileURLToPath(import.meta.url), '../../..');
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('about: dist/ is missing; run the app build first');
    process.exit(1);
  }
  copyLanding(join(root, 'website'), join(dist, 'about'));
  console.log('about: landing site copied to dist/about/');
}
