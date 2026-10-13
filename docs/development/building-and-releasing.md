# Building and releasing

## Web

Vercel builds every push: `npm run build` → `dist/` plus the functions in
`api/` (region `fra1`). Each PR gets its own preview URL in the PR checks.
`main` is production at <https://thd-room-finder.vercel.app>. Configuration:
`vercel.json` (SPA rewrites, cache headers for the service worker, assets and
API).

The marketing page in `website/` deploys to GitHub Pages from `main`
(`pages.yml`).

## Android (Capacitor)

Requires JDK 21 and the Android SDK (compile/target SDK 34, minimum SDK 22).
Android Studio bundles a suitable JDK under `jbr/`.

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug        # → app/build/outputs/apk/debug/app-debug.apk
```

Open the native project in Android Studio with `npm run cap:open`.

On Android the app calls THabella directly through Capacitor's native HTTP,
so it does not need the `api/` proxy.

### Signed release APK locally

```bash
cp android/keystore.properties.example android/keystore.properties
# fill in storePassword, keyAlias, keyPassword
# keep release.keystore at the repository root (gitignored)
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease
```

Signing material is never committed.

## Releasing

Releases are cut by the maintainer only.

```mermaid
flowchart LR
  A[Bump version in package.json<br/>PR → main] --> B[Tag vX.Y.Z on main]
  B --> C[release.yml]
  C --> D[typecheck · test · build]
  D --> E[Restore keystore from secrets]
  E --> F[assembleRelease]
  F --> G[GitHub release with<br/>thd-room-finder-X.Y.Z.apk<br/>+ generated notes]
```

1. Merge a `chore(release): vX.Y.Z` PR that bumps `package.json`.
2. Tag the merge commit: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. `release.yml` builds and publishes. It fails rather than publishing an
   unsigned APK. A tag can be rebuilt with *Run workflow* and the tag name.

| Secret | Content |
|---|---|
| `KEYSTORE_BASE64` | Base64 of `release.keystore` |
| `KEYSTORE_PASSWORD` | Store password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

## iOS

Not scaffolded. The data layer already abstracts native and web HTTP, so
`npx cap add ios` is an isolated step once an Apple developer account is
funded. Meanwhile iPhone users install the PWA from Safari.
