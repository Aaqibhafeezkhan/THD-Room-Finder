import type { CampusHours } from '../../domain/openingHours';
import { formatDayTime } from '../../domain/format';
import { useI18n } from '../../i18n';
import { CAMPUS_HOURS_SOURCE, ACADEMIC_CALENDAR_SOURCE } from '../../../shared/campusCalendar.js';
import { accessReason } from './accessCopy';

/** A calm access notice, with the evidence one disclosure away. */
export function ClosedNotice({ hours, compact: _compact = false }: { hours: CampusHours; compact?: boolean }) {
  const { t, locale } = useI18n();
  const unconfirmed = hours.access === 'unconfirmed';
  const reason = accessReason(hours.reason, t);
  const next = hours.nextOpen ? formatDayTime(hours.nextOpen, locale) : null;
  const title = unconfirmed ? t('Classroom access unconfirmed', 'Zugang zu Lehrräumen unbestätigt') : t('Classroom buildings closed', 'Lehrgebäude geschlossen');
  return (
    <aside className="thd-access-notice" aria-label={title}>
      <span className="thd-access-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          {unconfirmed ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 3h.01" /></> : <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />}
        </svg>
      </span>
      <div className="thd-access-content">
        <h2 className="thd-access-title">{title}</h2>
        {reason && <p className="thd-access-reason">{reason}</p>}
        {next && <p className="thd-access-next">{t('Next scheduled opening', 'Nächste reguläre Öffnung')}: {next}</p>}
        <details className="thd-access-details">
          <summary>{t('Opening hours and sources', 'Öffnungszeiten und Quellen')}</summary>
          <p>{unconfirmed
            ? t('Special notices may allow access. Check THD notices before travelling; an empty timetable does not confirm an unlocked room.', 'Sonderöffnungen sind möglich. Prüfe vor der Anfahrt die THD-Hinweise; ein leerer Stundenplan bestätigt keinen offenen Raum.')
            : t('Published building hours are 06:30–21:00 unless THD announces an exception. Library hours are separate.', 'Veröffentlichte Gebäudeöffnungszeit: 06:30–21:00, sofern die THD keine Ausnahme bekanntgibt. Die Bibliothek hat eigene Zeiten.')}</p>
          <p><a href={CAMPUS_HOURS_SOURCE} target="_blank" rel="noopener noreferrer">{t('THD house rules', 'THD-Hausordnung')}</a>
          {' · '}<a href={ACADEMIC_CALENDAR_SOURCE} target="_blank" rel="noopener noreferrer">{t('Academic calendar rules', 'Regeln zu Vorlesungszeiten')}</a></p>
        </details>
      </div>
    </aside>
  );
}
