import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '../../components';
import { useI18n } from '../../i18n';

/**
 * After the first seat at a table (T20), once: a hint to add the app to the
 * home screen. Uses the browser's install prompt where there is one (Chrome,
 * Edge, Android); iOS gets the Share-sheet steps. Never shown inside the
 * installed app or the Android build.
 */
const SEEN = 'thd_install_hint_seen';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferred: InstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
  });
}

function installed(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone) || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN) === '1';
  } catch {
    return true;
  }
}

export function InstallHint() {
  const { t } = useI18n();
  const [show, setShow] = useState(() => !installed() && !seen());
  if (!show) return null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* private mode */
    }
  };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    deferred = null;
    close();
  };

  return (
    <section
      aria-label={t('Add to home screen', 'Zum Home-Bildschirm')}
      style={{
        background: 'var(--md-surface)',
        borderRadius: 'var(--radius-l)',
        boxShadow: 'var(--md-shadow-1)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <b style={{ fontWeight: 500 }}>{t('Add THD Room Finder to your home screen', 'THD Room Finder zum Home-Bildschirm hinzufügen')}</b>
      <p style={{ margin: 0, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
        {ios
          ? t('Tap Share, then "Add to Home Screen". Your tables and the reminder are one tap away.', 'Tippe auf Teilen, dann „Zum Home-Bildschirm". Deine Tische und die Erinnerung sind dann einen Tipp entfernt.')
          : t('Your tables and the reminder are then one tap away.', 'Deine Tische und die Erinnerung sind dann einen Tipp entfernt.')}
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {!ios && deferred && <Button variant="tonal" onClick={() => void install()}>{t('Install', 'Installieren')}</Button>}
        <Button variant="text" onClick={close}>{t('Not now', 'Nicht jetzt')}</Button>
      </div>
    </section>
  );
}
