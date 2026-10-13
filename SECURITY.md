# Security policy

## Reporting a vulnerability

Please report privately through
[GitHub security advisories](https://github.com/arudaev/THD-Room-Finder/security/advisories/new).
Do not open a public issue. You can expect a first reply within a week.

Especially relevant from Phase 1 on:

- Ways to read another student's profile, batch or display name without permission.
- Ways to start, extend or end someone else's focus session.
- Leaked keys: a Supabase service-role key, signing material or tokens in the repo, a build or a preview.
- Ways to make the app hammer THD's THabella service.

## Scope

The web app at thd-room-finder.vercel.app, the Android APK from GitHub
Releases, the `api/` proxy and, once it exists, the focus service. THabella
itself belongs to THD; report issues there to the university.

## Supported versions

Only the latest release and `main` receive fixes.
