import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Button, Sheet } from '../../components';
import { appUpdater } from '../../data/appUpdater';
import type { AppUpdater } from '../../data/appUpdater';
import type { UpdateManifest, UpdatePlan } from '../../domain/appUpdate';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { useFocusSession } from '../focus/FocusSessionContext';

/**
 * Keeps the Android app current (ADR 0006): on start and when it comes back to
 * the foreground (at most every six hours) it reads the latest release.
 * A release with the same native shell is downloaded in the background and
 * used from the next start. One that needs a new APK shows "Update available",
 * which opens the install page; it waits while a focus session runs, and
 * Later hides it for three days. Does nothing on the web.
 */
export const INSTALL_PAGE = 'https://arudaev.github.io/THD-Room-Finder/#get';
const INTERVAL_MS = 6 * 60 * 60 * 1000;
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = 'thd-update-snoozed';

let lastCheck = 0;
let checking = false;

/** Checks the latest release; null when skipped or failed. */
export async function checkForUpdate(updater: AppUpdater, now = Date.now()): Promise<UpdatePlan | null> {
  if (checking || now - lastCheck < INTERVAL_MS) return null;
  checking = true;
  lastCheck = now;
  try {
    const plan = await updater.check();
    if (plan.kind === 'bundle') await updater.downloadBundle(plan.manifest);
    return plan;
  } catch {
    // Offline, or no release with update.json yet: try again next time.
    lastCheck = 0;
    return null;
  } finally {
    checking = false;
  }
}

/** Whether to ask about `version`, given what Later stored ("2.5.0@<ms>"). */
export function shouldAsk(version: string, snoozed: string | null, now: number): boolean {
  if (!snoozed) return true;
  const [v, at] = snoozed.split('@');
  return v !== version || !(now - Number(at) < SNOOZE_MS);
}

function readSnooze(): string | null {
  try {
    return localStorage.getItem(SNOOZE_KEY);
  } catch {
    return null;
  }
}

function writeSnooze(value: string) {
  try {
    localStorage.setItem(SNOOZE_KEY, value);
  } catch {
    /* private mode: ask again next time */
  }
}

export function AppUpdates() {
  const { t } = useI18n();
  const wide = useWideLayout();
  const focus = useFocusSession();
  const [offer, setOffer] = useState<UpdateManifest | null>(null);

  useEffect(() => {
    const updater = appUpdater();
    if (!updater) return;
    const run = async () => {
      const plan = await checkForUpdate(updater);
      if (plan?.kind === 'apk' && shouldAsk(plan.manifest.version, readSnooze(), Date.now())) setOffer(plan.manifest);
    };
    void updater
      .ready()
      .catch(() => undefined)
      .then(run);
    const handle = App.addListener('resume', () => void run());
    return () => void handle.then((h) => h.remove());
  }, []);

  if (!offer) return null;
  const later = () => {
    writeSnooze(`${offer.version}@${Date.now()}`);
    setOffer(null);
  };
  const update = () => {
    window.open(INSTALL_PAGE, '_blank');
    setOffer(null);
  };
  const title = t('Update available', 'Update verfügbar');
  return (
    <Sheet open={!focus.active} onClose={later} label={title} variant={wide ? 'dialog' : 'sheet'} width={400}>
      <div>
        <div style={{ fontSize: 20, lineHeight: 1.25 }}>{title}</div>
        <div style={{ font: '400 13px var(--font-mono)', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
          {t(`Version ${offer.version}`, `Version ${offer.version}`)}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
        {t(
          'This version needs a new install. Download it from the install page and install it over this app; your saved rooms and focus history stay.',
          'Diese Version muss neu installiert werden. Lade sie auf der Installationsseite herunter und installiere sie über diese App; gespeicherte Räume und dein Fokus-Verlauf bleiben erhalten.',
        )}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <Button variant="text" onClick={later}>
          {t('Later', 'Später')}
        </Button>
        <Button variant="filled" onClick={update} data-autofocus="">
          {t('Update', 'Aktualisieren')}
        </Button>
      </div>
    </Sheet>
  );
}
