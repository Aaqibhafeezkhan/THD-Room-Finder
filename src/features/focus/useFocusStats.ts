import { useMemo } from 'react';
import { dailyMinutes, homeMinutes, liveEntry, localDay, minutesBetween, minutesOn, semesterOf, streak, withLive } from '../../domain/focusHistory';
import { useFocusHistory } from './FocusHistoryContext';
import { useOptionalFocusSession } from './FocusSessionContext';

/**
 * Graph inputs and figures for "now", recomputed when the history changes.
 * By default a running session's focus so far is counted in (#155), so the
 * graph moves before it ends; `live: false` keeps to saved history, as a
 * shared image must.
 */
export function useFocusStats(now: Date = new Date(), { live = true }: { live?: boolean } = {}) {
  const { days: savedDays, entries, ready } = useFocusHistory();
  const session = useOptionalFocusSession();
  const today = localDay(now);
  const atHome = session?.active?.place === 'home';
  const live0 = live && session?.active && session.plan
    ? liveEntry(
        {
          id: session.active.shared?.id ?? `live-${session.active.startedAt}`,
          startedAt: new Date(session.active.startedAt),
          plannedEnd: new Date(session.active.plannedEnd),
          confirmed: session.active.confirmed,
          away: session.active.away,
        },
        session.plan,
        session.now,
      )
    : null;
  const running = live0 && atHome ? { ...live0, home: true as const } : live0;
  // The saved entry wins once it is there; until then the running one counts.
  const current = running && !entries.some((e) => e.id === running.id) ? running : null;
  const liveKey = current ? `${current.startedAt}/${current.minutes}` : '';
  return useMemo(() => {
    const all = current ? withLive(entries, current) : entries;
    const days = current ? dailyMinutes(all) : savedDays;
    const semester = semesterOf(now);
    return {
      ready,
      days,
      today,
      semester,
      hasHistory: entries.length > 0 || Boolean(current),
      /** Finished sessions exist: what a share card can show. */
      hasSaved: entries.length > 0,
      semesterMinutes: minutesBetween(days, semester.start, semester.end),
      todayMinutes: minutesOn(days, today),
      streak: streak(days, now),
      /** Minutes at home per day, for the day detail (ADR 0011). */
      home: homeMinutes(all),
      /** The running session's day and minutes so far, or null. */
      live: current ? { date: localDay(new Date(current.startedAt)), minutes: current.minutes } : null,
    };
    // `now` is a fresh Date on every render; the day is what matters, and the
    // running session only matters per whole minute.
  }, [savedDays, entries, ready, today, liveKey]);
}
