import { useCallback, useEffect, useState } from 'react';
import type { Translate } from '../../i18n';

/**
 * Which sounds a session makes, per place (ADR 0012): a set made for this
 * app, the phone's own notification sound, or none. At home the default is
 * Coffee break; on campus the phone's own sound, so nothing new rings in a
 * quiet room. Kept on the device.
 */
export type SoundSet = 'coffee' | 'jingle' | 'chimes' | 'phone' | 'silent';
export type SoundPlace = 'home' | 'campus';
export type SoundPreference = Record<SoundPlace, SoundSet>;

/** Sets with their own files; the other two are left to the phone. */
export const PLAYABLE: SoundSet[] = ['coffee', 'jingle', 'chimes'];
export const SOUND_ORDER: SoundSet[] = ['coffee', 'jingle', 'chimes', 'phone', 'silent'];
export const DEFAULT_SOUNDS: SoundPreference = { home: 'coffee', campus: 'phone' };

export function isPlayable(set: SoundSet): boolean {
  return PLAYABLE.includes(set);
}

const KEY = 'thd_focus_sounds';
const EVENT = 'thd-focus-sounds';

function valid(v: unknown): v is SoundSet {
  return typeof v === 'string' && (SOUND_ORDER as string[]).includes(v);
}

export function loadSounds(): SoundPreference {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Record<SoundPlace, unknown>>;
      return { home: valid(p.home) ? p.home : DEFAULT_SOUNDS.home, campus: valid(p.campus) ? p.campus : DEFAULT_SOUNDS.campus };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SOUNDS;
}

export function useSoundPreference(): [SoundPreference, (place: SoundPlace, set: SoundSet) => void] {
  const [prefs, setState] = useState(loadSounds);
  useEffect(() => {
    const sync = () => setState(loadSounds());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const set = useCallback((place: SoundPlace, s: SoundSet) => {
    const next = { ...loadSounds(), [place]: s };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setState(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [prefs, set];
}

export function soundName(s: SoundSet, t: Translate): string {
  switch (s) {
    case 'coffee': return t('Coffee break', 'Kaffeepause');
    case 'jingle': return 'Jingle';
    case 'chimes': return t('Chimes', 'Glöckchen');
    case 'phone': return t('Phone default', 'Handy-Standard');
    default: return t('Silent', 'Lautlos');
  }
}

export function soundLine(s: SoundSet, t: Translate): string {
  switch (s) {
    case 'coffee': return t('Coffee pours for a break; three bright dings call you back', 'Kaffee fließt zur Pause; drei helle Töne rufen dich zurück');
    case 'jingle': return t('Marimba falls for a break and climbs to start again', 'Marimba fällt zur Pause und steigt zum Weitermachen');
    case 'chimes': return t('Soft bells falling, then rising', 'Sanfte Glöckchen, fallend, dann steigend');
    case 'phone': return t("Your phone's notification sound", 'Der Benachrichtigungston deines Handys');
    default: return t('Vibration only', 'Nur Vibration');
  }
}
