import type { CampusHours } from '../../domain/openingHours';
import { formatDayTime } from '../../domain/format';
import { useI18n } from '../../i18n';
import { CAMPUS_HOURS_SOURCE } from '../../../shared/campusCalendar.js';
import { accessReason } from './accessCopy';

/**
 * Answer-first "campus is closed" banner — shown instead of a free-room count
 * whenever the buildings are shut at the query time. Leads with when it reopens.
 */
export function ClosedNotice({ hours, compact = false }: { hours: CampusHours; compact?: boolean }) {
  const { t, locale } = useI18n();
  const unconfirmed = hours.access === 'unconfirmed';
  const reason = accessReason(hours.reason, t);
  const opensLabel = hours.nextOpen ? formatDayTime(hours.nextOpen, locale) : null;

  return (
    <div
      style={{
        background: 'var(--md-surface)',
        borderRadius: 'var(--radius-l)',
        boxShadow: 'var(--md-shadow-1)',
        padding: 'var(--space-5) var(--space-4)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          fontSize: compact ? 'var(--title-large-size)' : 'var(--display-small-size)',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--md-on-surface)',
        }}
      >
        {unconfirmed ? t('Classroom access unconfirmed', 'Zugang zu Lehrräumen unbestätigt') : t('Classroom buildings closed', 'Lehrgebäude geschlossen')}
      </div>
      {opensLabel && (
        <div style={{ fontSize: 'var(--title-medium-size)', color: 'var(--md-primary)' }}>
          {t('Next scheduled opening', 'Nächste reguläre Öffnung')} {opensLabel}
        </div>
      )}
      {reason && <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>{reason}</div>}
      <div style={{ fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)', marginTop: 'var(--space-2)' }}>
        {unconfirmed
          ? t('Weekend, holiday and special-opening notices can change access. Check THD notices before travelling.', 'Wochenenden, Feiertage und Sonderöffnungen können den Zugang ändern. Prüfe vor der Anfahrt die THD-Aushänge.')
          : t('Default building hours: 06:30–21:00, unless THD announces an exception. Library hours are separate.', 'Reguläre Gebäudeöffnungszeit: 06:30–21:00, sofern die THD nichts anderes bekanntgibt. Die Bibliothek hat eigene Zeiten.')}
        {' '}<a href={CAMPUS_HOURS_SOURCE} target="_blank" rel="noopener noreferrer">{t('THD house rules', 'THD-Hausordnung')}</a>
      </div>
    </div>
  );
}
