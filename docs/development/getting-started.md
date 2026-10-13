# Getting started

## Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Node.js | 20 or newer | Everything |
| Git | any recent | Everything |
| Docker Desktop | recent | Local Supabase (Phase 1 work only) |
| JDK | 21 | Android builds only |
| Android SDK | API 34 | Android builds only |

## Run the web app

```bash
git clone https://github.com/arudaev/THD-Room-Finder.git
cd THD-Room-Finder
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server includes a middleware that
proxies THabella, so you see **live** room data with no CORS setup. There are
no fixtures; if THabella is down, the app shows cached data or an error state.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload and the THabella proxy |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, once (`npm run test:watch` to watch) |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run cap:sync` | Copy the web build into the Android project |
| `npm run assets:android` | Regenerate launcher and splash assets from `assets/logo.svg` |

All three of `typecheck`, `test` and `build` must pass before you push. CI
runs the same commands.

## Find your way around

| You want to change… | Look in |
|---|---|
| How free / closing soon / occupied and durations are decided | `src/domain/availability.ts`, `format.ts` |
| Which rooms count as study rooms | `src/domain/teachingRooms.ts`, `priority.ts` |
| THabella requests and caching | `src/data/thabellaClient.ts`, `cache.ts`, `mappers.ts` |
| A screen | `src/features/<campus|home|detail|favorites>/` |
| Shared data, time travel, refresh | `src/features/rooms/RoomDataContext.tsx` |
| A design-system component | `src/components/<core|app>/` (mirror [the design system](../../design/README.md)) |
| Colours, type, spacing | `src/styles/tokens/` |
| Navigation and routes | `src/app/AppShell.tsx`, `src/components/app/AdaptiveNav.tsx` |
| Strings | `t(en, de)` from `useI18n()` in `src/i18n/` |

More context: [architecture overview](../architecture/overview.md).

## Writing code here

- **Domain first.** New business rules go into `src/domain/` as pure functions
  with a Vitest test named after the behaviour ("ranks claimed rooms below
  closing-soon rooms").
- **Fakes over mocks.** Build small in-memory fakes rather than mocking
  modules.
- **Tokens, not literals.** Use `var(--md-*)` and the semantic aliases; no
  hex colours in components. Shadows separate surfaces, not borders.
- **Bilingual by construction.** One `t('Free', 'Frei')` per string; never
  translate room or building codes.
- **Check against live data.** For UI changes, verify the free-room count,
  ranking, EN/DE, dark mode and a room's schedule in the dev server, and
  again in the PR's Vercel preview.

## Next steps

- Pick an issue: [contributor workflow](../contributing/workflow.md)
- Phase 1 backend work: [environments](environments.md)
- Android: [building and releasing](building-and-releasing.md)
