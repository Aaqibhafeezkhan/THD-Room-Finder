import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { parseManifest, planUpdate } from '../domain/appUpdate';
import type { UpdateManifest, UpdatePlan } from '../domain/appUpdate';

/**
 * The Android app's side of #113: reads the latest release's update.json and
 * hands web bundles to the native AppUpdate plugin (AppUpdatePlugin.java),
 * which verifies, unpacks and serves them from the next start. On the web the
 * service worker keeps the app current, so this is null there.
 */
export const MANIFEST_URL = 'https://github.com/arudaev/THD-Room-Finder/releases/latest/download/update.json';

interface Status {
  failed: string[];
  pending: string | null;
}

interface NativePlugin {
  ready(): Promise<Status>;
  status(): Promise<Status>;
  downloadBundle(o: { url: string; sha256: string; version: string }): Promise<Status>;
}

export interface AppUpdater {
  /** Tells the native side this bundle started fine (keeps it). */
  ready(): Promise<void>;
  /** What the latest release means for this install. */
  check(): Promise<UpdatePlan>;
  /** Downloads a live update; it is used from the next start. */
  downloadBundle(manifest: UpdateManifest): Promise<void>;
}

async function fetchManifest(): Promise<UpdateManifest | null> {
  // Native HTTP: release downloads redirect to a CDN without CORS headers.
  const res = await CapacitorHttp.get({ url: MANIFEST_URL, responseType: 'text' });
  return res.status === 200 ? parseManifest(res.data) : null;
}

function androidUpdater(): AppUpdater {
  const plugin = registerPlugin<NativePlugin>('AppUpdate');
  return {
    ready: async () => {
      await plugin.ready();
    },
    check: async () => {
      const [manifest, info, status] = await Promise.all([fetchManifest(), App.getInfo(), plugin.status()]);
      const plan = planUpdate(manifest, {
        version: __APP_VERSION__,
        native: __NATIVE_FINGERPRINT__,
        versionCode: Number(info.build) || 0,
      });
      // A bundle that failed to start, or one already waiting, isn't fetched again.
      if (plan.kind === 'bundle' && (status.failed.includes(plan.manifest.version) || status.pending === plan.manifest.version)) {
        return { kind: 'none' };
      }
      return plan;
    },
    downloadBundle: async (m) => {
      await plugin.downloadBundle({ url: m.bundle.url, sha256: m.bundle.sha256, version: m.version });
    },
  };
}

let updater: AppUpdater | null | undefined;

export function appUpdater(): AppUpdater | null {
  if (updater === undefined) {
    updater = Capacitor.getPlatform() === 'android' ? androidUpdater() : null;
  }
  return updater;
}
