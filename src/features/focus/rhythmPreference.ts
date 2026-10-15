import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_RHYTHM_ID, RHYTHMS, customRhythm, rhythmId } from '../../domain/focusRhythm';
import type { Rhythm } from '../../domain/focusRhythm';

/**
 * The rhythm new sessions start with (Settings → Focus, ADR 0004). Kept on
 * the device; Deep 50/10 until the student picks another one.
 */
const KEY = 'thd_focus_rhythm';
const EVENT = 'thd-focus-rhythm';

export function loadRhythm(): Rhythm {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const r = JSON.parse(raw) as Partial<Rhythm>;
      const preset = rhythmId(r as Rhythm);
      if (preset !== 'custom') return RHYTHMS[preset];
      if (typeof r.focus === 'number' && typeof r.break === 'number') return customRhythm(r.focus, r.break);
    }
  } catch {
    /* ignore */
  }
  return RHYTHMS[DEFAULT_RHYTHM_ID];
}

export function useRhythmPreference(): [Rhythm, (r: Rhythm) => void] {
  const [rhythm, setState] = useState(loadRhythm);
  useEffect(() => {
    const sync = () => setState(loadRhythm());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const set = useCallback((r: Rhythm) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(r));
    } catch {
      /* ignore */
    }
    setState(r);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [rhythm, set];
}
