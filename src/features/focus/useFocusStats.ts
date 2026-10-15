import { useMemo } from 'react';
import { localDay, minutesBetween, minutesOn, semesterOf, streak } from '../../domain/focusHistory';
import { useFocusHistory } from './FocusHistoryContext';

/** Graph inputs and figures for "now", recomputed when the history changes. */
export function useFocusStats(now: Date = new Date()) {
  const { days, entries, ready } = useFocusHistory();
  const today = localDay(now);
  return useMemo(() => {
    const semester = semesterOf(now);
    return {
      ready,
      days,
      today,
      semester,
      hasHistory: entries.length > 0,
      semesterMinutes: minutesBetween(days, semester.start, semester.end),
      todayMinutes: minutesOn(days, today),
      streak: streak(days, now),
    };
    // `now` is a fresh Date on every render; the day is what matters.
  }, [days, entries.length, ready, today]);
}
