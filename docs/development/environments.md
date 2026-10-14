# Environments

Three environments, each with its own data. Nothing flows from production
into the others.

```mermaid
flowchart LR
  subgraph Local[Local · your machine]
    VD[npm run dev<br/>:5173]
    SL[(supabase start<br/>Docker: Postgres, Auth,<br/>Studio, Inbucket mail)]
    VD --> SL
  end
  subgraph Preview[Preview · every PR]
    VP[Vercel preview deployment]
    SP[(Isolated Supabase<br/>staging project<br/>synthetic users only)]
    VP --> SP
  end
  subgraph Production[Production · main]
    VM[thd-room-finder.vercel.app]
    SM[(Supabase production)]
    VM --> SM
  end
  Local -->|PR| Preview -->|merge| Production
```

| | Local | Preview | Production |
|---|---|---|---|
| Web app | `npm run dev` | Vercel deployment per PR (includes all stack ancestors) | Vercel, from `main` |
| THabella | Dev middleware proxy | `api/` proxy | `api/` proxy |
| Supabase | `npx supabase start` (Docker) | One isolated staging project (planned) | Production project (planned, gated) |
| Users | Seeded synthetic users | Seeded synthetic users | Real students |
| Credentials | Local defaults printed by the CLI | Preview-scoped env vars in Vercel | Production env vars in Vercel |
| Migrations | `supabase db reset` freely | Applied by the maintainer | Applied by the maintainer after review |

**Status today:** the local stack runs the focus service: schema, functions,
seed and contract tests ([#17](https://github.com/arudaev/THD-Room-Finder/issues/17),
[contract](../architecture/focus-service.md)). No hosted Supabase project
exists for THD Room Finder yet; hosted activation follows the
[pilot checklist](../architecture/pilot-verification.md).

## Run Supabase locally

Needs Docker Desktop running.

```bash
npx supabase start      # first run downloads the images (a few minutes)
npx supabase status     # URLs and local keys
```

| Service | URL |
|---|---|
| API (REST, Auth, RPC) | <http://127.0.0.1:54321> |
| Studio (database UI) | <http://127.0.0.1:54323> |
| Inbucket (catches sign-in emails) | <http://127.0.0.1:54324> |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Copy `.env.example` to `.env.local` and fill in the URL and the **publishable
(anon)** key from `supabase status`. `.env.local` is gitignored.

```bash
npx supabase db reset   # re-create the database from migrations and seeds
npx supabase stop       # stop the containers (data persists)
```

Sign-in emails never leave your machine locally: open Inbucket to read the
6-digit code (valid for 10 minutes).

### Seeded people

`supabase/seed.sql` creates synthetic people, five placeholder programmes
(until the #40 taxonomy exists), a few sample rooms and two live sessions
(Max, Public with his name in A 008; Mia, Private in ITC 2.01). Sign in as any of them with the code from
Inbucket.

| Person | Email | Study profile | Sees a Public session of Lena's as |
|---|---|---|---|
| Lena | `lena@example.test` | AIN, winter 2023 | (her own) |
| Max | `max@example.test` | AIN, winter 2023 | Same batch: "AIN 7 · studying" |
| Jonas | `jonas@example.test` | AIN, winter 2024 | Anonymous claim |
| Mia | `mia@example.test` | KI, winter 2023 | Anonymous claim |
| Sam | `sam@example.test` | none (Private only) | Anonymous claim |
| signed out | (publishable key) | none | Anonymous claim |

### Contract tests

```bash
npx supabase test db    # pgTAP: access, audience, lease and lifecycle rules
```

After changing a migration, regenerate the app's types and commit them with
the migration (the Database workflow checks this):

```bash
npx supabase gen types typescript --local --schema public
```

The output goes into `src/data/supabase.types.ts` below its two header lines.

## Rules

- **Only publishable keys in the browser.** A service-role key never goes into
  `VITE_*` variables, code, screenshots, logs or issues.
- **Synthetic data only** outside production: owner, same batch, same
  programme with another intake, other programme, signed out. No real names
  or emails.
- **Preview ≠ isolation.** A Vercel preview is only isolated if its env vars
  point at the staging project. Production keys are scoped to the Production
  environment in Vercel.
- **Migrations are reviewed code.** They land in a PR, run locally and in
  staging first, and the maintainer applies them to production.
- **Costs are bounded before going live.** See the
  [pilot verification](../architecture/pilot-verification.md) checklist.
