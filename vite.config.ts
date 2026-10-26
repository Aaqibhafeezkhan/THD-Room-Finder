import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { nativeFingerprint } from './scripts/release/nativeFingerprint.mjs';
// Same upstream call, deadline and checks as the production functions.
import { thabella } from './api/_thabella.js';

const APP_VERSION: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

/**
 * Dev-only middleware that mirrors the production Vercel functions
 * (`api/rooms.js`, `api/periods.js`). It lets `npm run dev` hit THabella
 * server-side — no CORS, no `vercel dev` needed. Production still uses the
 * real serverless functions under `/api`.
 */
function devThabellaApi(): Plugin {
  return {
    name: 'dev-thabella-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const send = ({ status, body }: { status: number; body: unknown }) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(body));
        };
        // Outage drill (docs/development/outage-drills.md): answer like the
        // 22 Oct 2026 outage without touching THabella.
        if (process.env.THABELLA_OFFLINE === '1' && (url.pathname === '/api/rooms' || url.pathname === '/api/periods')) {
          await new Promise((r) => setTimeout(r, 1500));
          send({ status: 504, body: { error: 'upstream timeout' } });
          return;
        }
        if (url.pathname === '/api/rooms') {
          send(await thabella('/room/findRooms', {}));
          return;
        }
        if (url.pathname === '/api/periods') {
          const date = url.searchParams.get('date');
          if (!date) {
            send({ status: 400, body: { error: 'date query parameter required' } });
            return;
          }
          send(await thabella(`/period/findByDate/${encodeURIComponent(date)}`, { sqlDate: date }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // Vercel sets VERCEL_ENV at build time. Previews (never production) route
  // the /dev/focus component gallery so designs can be reviewed on a phone.
  define: {
    __DEV_GALLERY__: JSON.stringify(process.env.VERCEL_ENV === 'preview'),
    // The Android app compares both with a release's update.json (#113).
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __NATIVE_FINGERPRINT__: JSON.stringify(nativeFingerprint(fileURLToPath(new URL('.', import.meta.url)))),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    devThabellaApi(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered in main.tsx on the web only; the Android app updates
      // through its own channel (#113).
      injectRegister: null,
      includeAssets: ['icons/app-icon.svg', 'icons/app-icon-180.png'],
      manifest: {
        name: 'THD Room Finder',
        short_name: 'Room Finder',
        description:
          'Find a free study room at THD Deggendorf and focus in it, in Pomodoro blocks, alone or with your batch.',
        lang: 'en',
        theme_color: '#1565C0',
        background_color: '#F4F6FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/app-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell is precached; THabella data is network-first with a
        // short cache so the app still opens (with last data) offline.
        // Session sounds (ADR 0012) too, so focus at home sounds offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'],
        // Opens the room when the focus-session notification is tapped.
        importScripts: ['focus-sw.js'],
        // Share and invite links and the API are served by Vercel functions,
        // never the cached app shell (a link must reach its preview page).
        navigateFallbackDenylist: [/^\/f\//, /^\/i\//, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'thabella-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // Agent worktrees under .claude/ hold other checkouts of this repo.
    exclude: [...configDefaults.exclude, '.claude/**', 'android/**'],
  },
});
