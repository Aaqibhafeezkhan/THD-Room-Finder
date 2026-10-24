import { Button, ListNotice } from '../../components';
import { formatTime } from '../../domain/format';
import { useI18n } from '../../i18n';
import type { Translate } from '../../i18n';
import type { Locale } from '../../components/core/LanguageToggle';
import { useRoomData } from '../rooms/RoomDataContext';

/** "12 Oct" / "12. Okt." for the Monday of an eligibility week. */
function weekLabel(week: string, locale: Locale): string {
  const [y, m, d] = week.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

/** Which rooms the list shows while their availability is unknown. */
export function knownRoomsLine(t: Translate, locale: Locale, eligibility: { week: string; current: boolean }): string {
  return eligibility.current
    ? t("These rooms have teaching this week. Check the door before you settle in.", 'Diese Räume haben diese Woche Lehrbetrieb. Prüfe vor Ort, ob frei ist.')
    : t(
        `These rooms had teaching in the week of ${weekLabel(eligibility.week, locale)}. Check the door before you settle in.`,
        `Diese Räume hatten in der Woche ab ${weekLabel(eligibility.week, locale)} Lehrbetrieb. Prüfe vor Ort, ob frei ist.`,
      );
}

/**
 * What the room list can't vouch for (#154). Unavailable: availability is
 * unknown, rooms are listed without a status, focus still starts. Stale: an
 * earlier copy of today's timetable, with its time. Nothing otherwise.
 */
export function ScheduleNotice() {
  const { t, locale } = useI18n();
  const { schedule, scheduleAt, eligibility, refresh } = useRoomData();
  if (schedule === 'stale' && scheduleAt) {
    return (
      <ListNotice kind="unknown">
        {t(
          `Timetable from ${formatTime(scheduleAt)}. THabella isn't answering right now.`,
          `Stundenplan von ${formatTime(scheduleAt)}. THabella antwortet gerade nicht.`,
        )}
      </ListNotice>
    );
  }
  if (schedule !== 'unavailable') return null;
  return (
    <div
      role="status"
      style={{
        background: 'var(--md-surface)',
        borderRadius: 'var(--radius-l)',
        boxShadow: 'var(--md-shadow-1)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>
        {t("Can't check which rooms are free", 'Freie Räume gerade nicht prüfbar')}
      </div>
      <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
        {t("The THD timetable isn't answering. ", 'Der THD-Stundenplan antwortet nicht. ')}
        {knownRoomsLine(t, locale, eligibility)}{' '}
        {t('You can still start focus.', 'Fokus kannst du trotzdem starten.')}
      </div>
      <Button variant="text" size="small" onClick={refresh} style={{ alignSelf: 'flex-start', marginLeft: '-0.5rem' }}>
        {t('Try again', 'Erneut versuchen')}
      </Button>
    </div>
  );
}
