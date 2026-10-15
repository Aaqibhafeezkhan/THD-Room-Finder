import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { appUpdater } from '../../data/appUpdater';
import type { AppUpdater } from '../../data/appUpdater';

/**
 * Keeps the Android app current (#113): on start and when it comes back to
 * the foreground (at most every six hours), a newer release with the same
 * native shell is downloaded in the background and used from the next start.
 * Renders nothing; does nothing on the web.
 */
const INTERVAL_MS = 6 * 60 * 60 * 1000;

let lastCheck = 0;
let checking = false;

export async function checkForUpdate(updater: AppUpdater, now = Date.now()): Promise<void> {
  if (checking || now - lastCheck < INTERVAL_MS) return;
  checking = true;
  lastCheck = now;
  try {
    const plan = await updater.check();
    if (plan.kind === 'bundle') await updater.downloadBundle(plan.manifest);
  } catch {
    // Offline, or no release with update.json yet: try again next time.
    lastCheck = 0;
  } finally {
    checking = false;
  }
}

export function AppUpdates() {
  useEffect(() => {
    const updater = appUpdater();
    if (!updater) return;
    void updater
      .ready()
      .catch(() => undefined)
      .then(() => checkForUpdate(updater));
    const handle = App.addListener('resume', () => void checkForUpdate(updater));
    return () => void handle.then((h) => h.remove());
  }, []);
  return null;
}
