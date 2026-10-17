import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RoomCardFocus, RoomCardStatus } from '../../components';
import { roomKey } from '../../data/focusApi';
import { focusSignal } from '../../domain/focusSignals';
import type { FocusSignal } from '../../domain/focusSignals';
import type { RoomStatus } from '../../domain/models';
import type { Locale } from '../../components/core/LanguageToggle';
import type { Translate } from '../../i18n';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { useRoomData } from '../rooms/RoomDataContext';
import { formatMinutes } from './copy';
import { useFocusSession } from './FocusSessionContext';

/**
 * Quiet (Settings → Focus): treat your batch's sessions as claims too, for
 * when you'd rather study alone. Kept on the device.
 */
const QUIET_KEY = 'thd_focus_quiet';
const QUIET_EVENT = 'thd-focus-quiet';

function loadQuiet(): boolean {
  try {
    return localStorage.getItem(QUIET_KEY) === '1';
  } catch {
    return false;
  }
}

export function useQuietPreference(): [boolean, (on: boolean) => void] {
  const [quiet, setState] = useState(loadQuiet);
  useEffect(() => {
    const sync = () => setState(loadQuiet());
    window.addEventListener(QUIET_EVENT, sync);
    return () => window.removeEventListener(QUIET_EVENT, sync);
  }, []);
  const set = useCallback((on: boolean) => {
    try {
      if (on) localStorage.setItem(QUIET_KEY, '1');
      else localStorage.removeItem(QUIET_KEY);
    } catch {
      /* ignore */
    }
    setState(on);
    window.dispatchEvent(new Event(QUIET_EVENT));
  }, []);
  return [quiet, set];
}

export type FocusNotice = 'time' | 'unknown' | 'quiet' | null;

/**
 * Focus signals for the room list and map (#20). Only for now: a picked time
 * shows the schedule alone. When activity can't be loaded the list keeps its
 * schedule order and says "activity unknown", never "empty". Without the
 * focus service, only your own device-only session shows.
 */
export function useFocusSignals() {
  const focus = useFocusSession();
  const { isCustomTime } = useRoomData();
  const [quiet] = useQuietPreference();
  const { summaries, active } = focus;
  const ownIdent = active?.roomIdent ?? null;

  const signalOf = useCallback(
    (ident: string): FocusSignal | null => {
      if (isCustomTime) return null;
      const a = summaries instanceof Map ? summaries.get(roomKey(ident)) : undefined;
      return focusSignal(a, { quiet, ownHere: ownIdent === ident });
    },
    [isCustomTime, summaries, quiet, ownIdent],
  );

  const notice: FocusNotice = useMemo(() => {
    if (summaries === undefined) return null;
    if (isCustomTime) return 'time';
    if (summaries === null) return 'unknown';
    return quiet ? 'quiet' : null;
  }, [summaries, isCustomTime, quiet]);

  return { signalOf, notice, quiet, live: summaries instanceof Map && !isCustomTime };
}

/** The room card's status and badge for a signal (D3). */
export function cardFocus(
  signal: FocusSignal | null,
  status: RoomStatus,
  now: Date,
  t: Translate,
  locale: Locale,
  batch: string | null,
): { status: RoomCardStatus; focus?: RoomCardFocus } {
  if (!signal) return { status };
  if (signal.kind === 'own') return { status, focus: { kind: 'own', label: t('Your session', 'Deine Session') } };
  if (signal.kind === 'batch') {
    const who = signal.names.length ? ` · ${signal.names.join(', ')}` : '';
    return {
      status,
      focus: {
        kind: 'batch',
        label: t(
          `${batch ?? 'Your batch'} · ${signal.count} studying${who}`,
          `${batch ?? 'Dein Jahrgang'} · ${signal.count} ${signal.count === 1 ? 'lernt' : 'lernen'}${who}`,
        ),
      },
    };
  }
  const mins = signal.since ? Math.max(1, Math.round((now.getTime() - signal.since.getTime()) / 60000)) : null;
  const what =
    signal.count > 1
      ? t(`${signal.count} focus sessions`, `${signal.count} Fokus-Sessions`)
      : t('Focus session', 'Fokus-Session');
  return {
    // A claimed room closing soon keeps its amber duration (D3).
    status: status === 'soon' ? 'soon' : 'claimed',
    focus: {
      kind: 'claimed',
      label: mins ? `${what} · ${formatMinutes(mins, locale)}` : what,
    },
  };
}

/** "AIN 7" for the signed-in student's batch, or null. */
export function useBatchLabel(): string | null {
  return useStudyProfile().batch;
}
