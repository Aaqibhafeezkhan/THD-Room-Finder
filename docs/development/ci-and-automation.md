# CI and automation

## Workflows

| Workflow | File | Trigger | What it does | Required for merge |
|---|---|---|---|---|
| CI · Web | `ci.yml` | PR (any base), push to `main`, merge queue | `npm ci`, typecheck, Vitest, workflow-script tests, build | Yes |
| CI · Android | `ci.yml` | same | Web build, `cap sync`, `assembleDebug` | Yes |
| Database | `database.yml` | PR or push to `main` touching `supabase/` | Postgres with migrations and seed, pgTAP contract tests, generated types up to date | No |
| Docs | `docs.yml` | PR or push touching Markdown | Offline relative-link check with lychee | No |
| PR conventions | `pr-conventions.yml` | PR opened / edited / synced / labelled | Conventional title, linked issue, assign author, assign closed issues, path labels | Yes |
| Issue commands | `issue-commands.yml` | Issue comment | `/take`, `/drop` self-assignment | — |
| Sub-issue roll-up | `sub-issue-rollup.yml` | Issue closed / reopened | `ready-for-acceptance` on the parent when all sub-issues close | — |
| Project sync | `project-sync.yml` | Issues, PRs, manual | Draft/ready → board status, start/completion dates. Inactive until `PROJECTS_TOKEN` exists ([#26](https://github.com/arudaev/THD-Room-Finder/issues/26)) | — |
| Release | `release.yml` | Tag `v*`, manual | Signed APK and GitHub release | — |
| Pages | `pages.yml` | Push to `main` | Deploys `website/` | — |

Vercel builds previews and production through its GitHub integration, outside
Actions.

### Security notes

- Workflows that write to issues or PRs (`pr-conventions`, `issue-commands`,
  `sub-issue-rollup`, `project-sync`) check out the **default branch** with
  `persist-credentials: false` and never execute code from a pull request.
  That is what makes `pull_request_target` safe for fork PRs here.
- Permissions are declared per workflow and kept to the minimum.
- Fork PRs: the default `GITHUB_TOKEN` is read-only, Actions cannot approve
  PRs, and runs from first-time contributors wait for the maintainer's
  approval (*Approve and run workflows*). Approve only after reading the diff;
  changes to `.github/`, `package.json` or build scripts execute in CI.
- Vercel previews of fork PRs need authorization by a Vercel team member. The
  Vercel check is informational, not required for merge.
- Script logic lives in `.github/scripts/*.cjs` with tests in
  `*.checks.cjs`, run by CI.
- Dependency updates are manual. Dependabot version updates and security
  update PRs are both off, because automatic bumps have broken builds
  before. Dependabot *alerts* stay on: check the Security tab, then upgrade
  deliberately in a normal PR and test it on web and Android.

## Repository rules

| Setting | Value | Why |
|---|---|---|
| `main` ruleset | PR required (no approval count: only the maintainer can merge); required checks: Web, Android, PR conventions; no force-push; no deletion | `main` is production |
| Bypass | Repository admins, **through a pull request only** | The maintainer can merge their own PR without a second reviewer, but cannot push directly |
| When collaborators join | Set required approvals to **1** (no code-owner requirement) | Collaborators then need the maintainer's approval; the admin bypass still lets the maintainer merge their own PRs |
| Merge methods | Merge commit only; merge commit = PR title + body | Contributors keep every commit on their profile; `git log --first-parent` reads PR by PR |
| Head branches | Deleted automatically after merge | No branch litter |
| Update branch | Enabled | Keep a PR current with one click |
| Feature branches | Unprotected | Owners may force-push their own branch when restacking |
| Release tags `v*` | Ruleset present, disabled | Enabling it would block re-running a release for an existing tag |

## Secrets and variables

| Name | Used by | Scope |
|---|---|---|
| `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` | `release.yml` | Android signing |
| `PROJECTS_TOKEN` | `project-sync.yml` | Fine-grained PAT: Projects read/write on the account; Issues, Pull requests and Metadata read on this repository only. See [#26](https://github.com/arudaev/THD-Room-Finder/issues/26) |
| Vercel env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) | Vercel builds | Preview and Production scoped separately; publishable keys only (Phase 1) |

## Local checks before pushing

```bash
npm run typecheck && npm test && npm run build
node --test .github/scripts/*.checks.cjs   # only if you changed workflow scripts
```
