/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** True in Vercel preview builds; routes the /dev/focus gallery. */
declare const __DEV_GALLERY__: boolean;

/** package.json version this bundle was built from, e.g. "2.4.0". */
declare const __APP_VERSION__: string;
/** Fingerprint of the native shell this bundle was built for (#113). */
declare const __NATIVE_FINGERPRINT__: string;
