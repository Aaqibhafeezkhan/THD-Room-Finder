/**
 * Keeping the Android app current (#113). Each release publishes update.json
 * (scripts/release/updateManifest.mjs); the app compares it with what it runs:
 *
 *   newer, same native fingerprint      → 'bundle': live web update, silent
 *   newer, different native fingerprint → 'apk': ask to install the new APK
 *   otherwise                           → 'none'
 *
 * Only assets of this repository's releases are accepted, and every asset
 * carries a SHA-256 that the native side checks before using it.
 */
export const RELEASE_DOWNLOADS = 'https://github.com/arudaev/THD-Room-Finder/releases/download/';

export interface UpdateAsset {
  url: string;
  sha256: string;
  size: number;
}

export interface UpdateManifest {
  version: string;
  versionCode: number;
  native: string;
  notes: string | null;
  bundle: UpdateAsset;
  apk: UpdateAsset;
}

export interface RunningApp {
  /** Version of the running web bundle, e.g. "2.4.0". */
  version: string;
  /** Native fingerprint the running bundle was built for. */
  native: string;
  /** versionCode of the installed APK. */
  versionCode: number;
}

export type UpdatePlan =
  | { kind: 'none' }
  | { kind: 'bundle'; manifest: UpdateManifest }
  | { kind: 'apk'; manifest: UpdateManifest };

const VERSION = /^\d+\.\d+\.\d+$/;
const SHA256 = /^[0-9a-f]{64}$/;

function asset(raw: unknown): UpdateAsset | null {
  if (!raw || typeof raw !== 'object') return null;
  const { url, sha256, size } = raw as Record<string, unknown>;
  if (typeof url !== 'string' || !url.startsWith(RELEASE_DOWNLOADS) || url.includes('..')) return null;
  if (typeof sha256 !== 'string' || !SHA256.test(sha256)) return null;
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null;
  return { url, sha256, size };
}

/** update.json, or null when anything is missing, foreign or malformed. */
export function parseManifest(raw: unknown): UpdateManifest | null {
  if (typeof raw === 'string') {
    try {
      return parseManifest(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (m.schema !== 1) return null;
  if (typeof m.version !== 'string' || !VERSION.test(m.version)) return null;
  if (typeof m.versionCode !== 'number' || !Number.isInteger(m.versionCode)) return null;
  if (typeof m.native !== 'string' || !m.native) return null;
  const bundle = asset(m.bundle);
  const apk = asset(m.apk);
  if (!bundle || !apk) return null;
  return {
    version: m.version,
    versionCode: m.versionCode,
    native: m.native,
    notes: typeof m.notes === 'string' ? m.notes : null,
    bundle,
    apk,
  };
}

/** Compares "X.Y.Z" versions: negative, zero or positive. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function planUpdate(manifest: UpdateManifest | null, app: RunningApp): UpdatePlan {
  if (!manifest || compareVersions(manifest.version, app.version) <= 0) return { kind: 'none' };
  if (manifest.native === app.native) return { kind: 'bundle', manifest };
  if (manifest.versionCode > app.versionCode) return { kind: 'apk', manifest };
  return { kind: 'none' };
}
