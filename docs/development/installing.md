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
3. Updates: install the newer APK over the old one.

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
