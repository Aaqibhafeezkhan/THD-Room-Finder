import type { FocusGraphText } from '../../components';
import type { Locale } from '../../components/core/LanguageToggle';
import type { Translate } from '../../i18n';

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

/** Mon … Sun. */
export function dayNames(locale: Locale): string[] {
  return locale === 'de'
    ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
  const day = dayNames(locale)[(d.getDay() + 6) % 7];
  return `${day} ${d.getDate()}${locale === 'de' ? '.' : ''} ${monthNames(locale)[d.getMonth()]}`;
}

export function graphText(t: Translate, locale: Locale): FocusGraphText {
  const months = monthNames(locale);
  return {
    days: dayNames(locale),
    months,
    cellLabel: (d, m) =>
      `${shortDate(d, locale)} · ${m ? formatMinutes(m, locale) : t('No focus', 'Kein Fokus')}`,
    less: t('Less', 'Weniger'),
    more: t('More', 'Mehr'),
    share: t('Share focus graph', 'Fokus-Verlauf teilen'),
    tableCaption: t('Focus minutes per day, newest week first', 'Fokus-Minuten pro Tag, neueste Woche zuerst'),
    weekOf: t('Week of', 'Woche ab'),
    weekLabel: (d) => `${d.getDate()}${locale === 'de' ? '.' : ''} ${months[d.getMonth()]}`,
  };
}
