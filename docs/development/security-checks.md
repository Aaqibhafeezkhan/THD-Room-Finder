# Security checks

Two places tell you when something in the stack needs attention: Dependabot
for the npm packages, and the Supabase advisors for the database. Check both
before a release.

## Dependabot

[Security → Dependabot](https://github.com/arudaev/THD-Room-Finder/security/dependabot)
lists advisories for packages in `package-lock.json`. The same list locally:

```bash
npm audit
```

Triage in this order:

1. **What ships.** `dependencies` end up in the web app; `@capacitor/android`
   and the plugins end up in the APK even though some are `devDependencies`.
   These go first, whatever the severity says.
2. **In-range fixes.** `npm audit fix` (never `--force`) plus bumping the
   direct dependency within its major. One PR.
3. **Majors.** Each major upgrade is its own stacked layer, so a broken one
   can wait without holding back the rest.
4. **What can't move yet** gets an issue that says why it is safe to wait.

A change to `@capacitor/*` or `android/` changes the native fingerprint, so
the next release ships a new APK and installed apps prompt for it
([ADR 0006](../architecture/adr/0006-android-self-update.md)). Run
`node scripts/release/nativeFingerprint.mjs` to see it.

Every layer needs typecheck, `TZ=UTC npx vitest run`, build, and a look at the
dev server; the PR's CI builds a test APK.

### Open on purpose

| Alert | Why it waits |
|---|---|
| tar (through `@capacitor/cli` 6) | The CLI only unpacks its own templates with it, never during `cap sync` or in the app. No 6.x release takes a fixed tar; [#224](https://github.com/arudaev/THD-Room-Finder/issues/224) moves to Capacitor 8. |

## Supabase advisors

The dashboard's *Advisors → Security / Performance* run
[splinter](https://github.com/supabase/splinter) lints. The CLI runs the same:

```bash
# hosted project (read-only)
npx supabase db advisors --linked --type all --level info

# local database
SUPABASE_DB_PASSWORD=postgres npx supabase db advisors --local --type all --level info
```

The Database workflow fails a PR that adds an ERROR-level security finding,
such as a public table without RLS or a SECURITY DEFINER view.

### By design

| Finding | Why it stays |
|---|---|
| `authenticated_security_definer_function_executable`, `anon_security_definer_function_executable` | The `public` functions are the API ([focus service](../architecture/focus-service.md)). They run as owner so they can read the private `focus` schema, and take the caller from `auth.uid()` (`focus.require_user()`), never from an argument. Only the read-only previews (`get_table`, `get_gathering`, `room_summaries`, …) are granted to `anon`. |
| `rls_enabled_no_policy` on `focus.*` | RLS on with no policies means nobody reads the tables directly; only those functions do. |
| `auth_leaked_password_protection` | The app signs in with emailed codes and never sets a password. |
| `unused_index` | The indexes back queries the pilot hasn't produced much of yet. Look again once there is real traffic. |

Fixed on 26 Oct 2026
([#223](https://github.com/arudaev/THD-Room-Finder/issues/223)): covering
indexes for six foreign keys, and EXECUTE revoked on Supabase's
`public.rls_auto_enable()` event-trigger function.
