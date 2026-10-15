# ADR 0006: the Android app keeps itself up to date

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 15 October 2026 |
| **Decided by** | Maintainer |
| **Tracks** | [#113](https://github.com/arudaev/THD-Room-Finder/issues/113) |

## Context

The Android app is installed from an APK on the GitHub release. Until v2.3.0,
every release meant downloading and installing another APK by hand, so most
installs stay on whatever version they started with. The web app already
updates itself through its service worker.

Android does not let a sideloaded app install an update silently; only a store
can. Most releases change only the web code, which the app loads from its own
files and could replace without a new APK.

## Decision

### 1. Each release says what it needs

The release workflow publishes `web-X.Y.Z.zip` (the web build inside the APK)
and `update.json` next to the APK. `update.json` carries the version,
`versionCode`, both assets with SHA-256 and size, and a fingerprint of the
native shell: the `android/` sources and resources, `capacitor.config.ts` and
the Capacitor plugin versions. The app is built with the same fingerprint, so
nobody decides by hand whether a release needs a new APK.

### 2. Same native shell: silent live update

On start and on return to the foreground (at most every six hours) the app
reads `releases/latest/download/update.json`. A newer release with the same
fingerprint is downloaded in the background, checked against its SHA-256,
unpacked and served from the next cold start through Capacitor's own
`serverBasePath` setting. The new bundle must report ready within 15 seconds
of starting; otherwise, or if its launch never got that far, the app goes
back to the last good bundle and never tries that version again. Installing
a new APK drops all downloaded bundles.

### 3. Different native shell: send the student to the install page

A newer release with a different fingerprint and a higher `versionCode`
shows an "Update available" prompt. **Update** opens the install page
(<https://arudaev.github.io/THD-Room-Finder/#get>), where the student got the
app in the first place and which always links the latest APK; installing it
over the old app keeps their data. The app itself never installs anything,
so it needs no install permission. The prompt waits while a focus session is
running, and **Later** hides it for three days.

### 4. Nothing else is trusted or contacted

Only assets under this repository's release downloads are accepted, on both
the JS and the native side. There is no update server, account or analytics;
GitHub serves everything. The service worker is web-only; the Android app no
longer registers it, and removes one left from an earlier version.

## Consequences

- Web-only releases reach installed apps within a day without the student
  doing anything; native releases need a visit to the install page.
- v2.3.0 and earlier have none of this, so the first release with it is the
  last APK installed by hand.
- `package.json`, `versionCode` and `versionName` must agree with the tag;
  the release fails otherwise.
- A broken bundle costs one bad start at most, then rolls back.

## Alternatives rejected

- **Capgo's updater plugin (manual mode).** Mature, with rollback, but its
  Capacitor 6 line pulls in Play Core and AndroidX versions that need a newer
  compile SDK, and sends stats unless turned off. About 250 lines of our own
  Java on Capacitor's built-in `serverBasePath` do what we need.
- **Loading the app from the Vercel URL.** Always current, but no offline
  start and no bundled fallback; the native plugins would also face a remote
  origin.
- **Installing the APK from inside the app.** One tap fewer, but it needs
  the `REQUEST_INSTALL_PACKAGES` permission and a native download path; the
  maintainer preferred sending students back to the install page they know.
- **A store (Play Store, F-Droid).** Out of scope for now; Obtainium is
  mentioned in the install guide for people who want store-like updates.
