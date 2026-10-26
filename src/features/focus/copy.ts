import type { FocusGraphText } from '../../components';
import type { Locale } from '../../components/core/LanguageToggle';
import type { Translate } from '../../i18n';
import { localDay } from '../../domain/focusHistory';
import { restReason } from '../../domain/openingHours';

/**
 * Shared EN/DE copy for the focus layer (D1–D4 handbacks). Components take
 * their text as props; screens build it here so the wording stays in one
 * place.
 */

export function monthNames(locale: Locale): string[] {
  return locale === 'de'
    ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

/** Sun … Sat. */
export function dayNames(locale: Locale): string[] {
  return locale === 'de'
    ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/** 85 → "1 h 25 min" / "1 Std. 25 Min."; whole hours drop the minutes. */
export function formatMinutes(minutes: number, locale: Locale): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (locale === 'de') {
    if (!h) return `${m} Min.`;
    return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
  }
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "Tue 13 Oct" / "Di 13. Okt". */
export function shortDate(d: Date, locale: Locale): string {
  const day = dayNames(locale)[d.getDay()];
  return `${day} ${d.getDate()}${locale === 'de' ? '.' : ''} ${monthNames(locale)[d.getMonth()]}`;
}

/** Why the campus is shut that day, in the day line under the graph. */
function breakName(why: NonNullable<ReturnType<typeof restReason>>, t: Translate): string {
  return why === 'christmas' ? t('Christmas break', 'Weihnachtspause') : t('Public holiday', 'Feiertag');
}

/** `live` is the running session's day, labelled as still counting (#155);
 *  `home` adds how much of a day was at home (ADR 0011). */
export function graphText(t: Translate, locale: Locale, live?: { date: string } | null, home?: Map<string, number>): FocusGraphText {
  const months = monthNames(locale);
  return {
    days: [...dayNames(locale).slice(1), dayNames(locale)[0]],
    months,
    cellLabel: (d, m) => {
      const why = restReason(d);
      const running = live && m && localDay(d) === live.date ? ` ${t('including current session', 'inklusive laufender Session')}` : '';
      const h = m ? (home?.get(localDay(d)) ?? 0) : 0;
      const atHome = h <= 0 ? '' : h >= m ? ` · ${t('at home', 'zu Hause')}` : ` · ${formatMinutes(h, locale)} ${t('at home', 'zu Hause')}`;
      return `${shortDate(d, locale)} ${d.getFullYear()} · ${m ? formatMinutes(m, locale) : t('No focus', 'Kein Fokus')}${running}${atHome}${why ? ` · ${breakName(why, t)}` : ''}`;
    },
    less: t('Less', 'Weniger'),
    more: t('More', 'Mehr'),
    closed: t('Campus closed', 'Campus geschlossen'),
    rest: t('Rest day', 'Ruhetag'),
    loading: t('Loading study history', 'Lernverlauf wird geladen'),
    keyboardHint: t('Use arrow keys to explore days. Home and End move across a row; Control with Home or End jumps to the first or last day.', 'Mit den Pfeiltasten Tage erkunden. Pos1 und Ende bewegen innerhalb einer Zeile; mit Strg zum ersten oder letzten Tag springen.'),
    share: t('Share focus graph', 'Fokus-Verlauf teilen'),
    shareLabel: t('Share', 'Teilen'),
    tableCaption: t('Daily focus history', 'Täglicher Fokus-Verlauf'),
    weekOf: t('Week of', 'Woche ab'),
    weekLabel: (d) => `${d.getDate()}${locale === 'de' ? '.' : ''} ${months[d.getMonth()]} ${d.getFullYear()}`,
  };
}

/** Whole hours from an hour up ("21 h" / "21 Std."), minutes below. */
export function formatHours(minutes: number, locale: Locale): string {
  if (minutes < 60) return formatMinutes(minutes, locale);
  const h = Math.round(minutes / 60);
  return locale === 'de' ? `${h} Std.` : `${h} h`;
}

/** "21 h this semester · 12-day streak" (D2), or the new-user line. */
/** The streak under the semester total; no "1 days", no bare zero. */
export function streakLine(t: Translate, days: number): string {
  if (days <= 0) return t('No streak yet · one session starts it', 'Noch keine Serie · eine Session startet sie');
  if (days === 1) return t('1 study day in a row', '1 Lerntag in Folge');
  return t(`${days} study days in a row`, `${days} Lerntage in Folge`);
}

export function statsLine(t: Translate, locale: Locale, semesterMinutes: number, streakDays: number): string {
  if (semesterMinutes <= 0 && streakDays <= 0) {
    return t('No focus yet. Start a session in any free room.', 'Noch kein Fokus. Starte eine Session in einem freien Raum.');
  }
  const h = formatMinutes(semesterMinutes, locale);
  return t(`${h} this semester · ${streakDays}-day streak`, `${h} in diesem Semester · ${streakDays} Tage in Folge`);
}
