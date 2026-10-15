# Installing on a device

## Web app (any phone or computer)

Open <https://thd-room-finder.vercel.app>.

| Platform | Install as an app |
|---|---|
| Android, Chrome | Menu ⋮ → *Install app* (or *Add to Home screen*) |
| iPhone / iPad, Safari | Share → *Add to Home Screen* |
| Desktop Chrome / Edge | Install icon in the address bar |

The installed PWA opens full screen, caches the app shell and keeps the last
loaded data for offline viewing. Cached data is not live; reconnect to refresh.

## Android APK

1. Download `thd-room-finder-X.Y.Z.apk` from the
   [latest release](https://github.com/arudaev/THD-Room-Finder/releases/latest).
2. Open it and allow installation from your browser or file manager when
   Android asks.
3. Updates: from the first release after v2.3.0 the app updates itself
   ([ADR 0006](../architecture/adr/0006-android-self-update.md)). Most
   releases arrive silently and are used from the next start; a release that
   changes the native app shows **Update available**, which opens the
   [install page](https://arudaev.github.io/THD-Room-Finder/#get) to download
   the new APK and install it over the old one.
   Older versions: install the newer APK over the old one once.
4. Prefer store-style updates? [Obtainium](https://github.com/ImranR98/Obtainium)
   can track the GitHub releases of `arudaev/THD-Room-Finder` and install
   new APKs for you.

If Android says the package conflicts with an existing app, the installed copy
was signed with a different key (for example a debug build). Uninstall it
first; saved rooms stored on the device are lost.

## Developers: debug build over USB

```bash
adb devices                       # phone listed? (USB debugging on)
cd android && ./gradlew installDebug
```

## Testers: PR previews

Every pull request has a Vercel preview link in its checks. Open it on your
phone to test a change before it reaches production. Preview links may
require signing in to Vercel when preview protection is on.
