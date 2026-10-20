import type { CampusHours } from '../../domain/openingHours';
import type { Translate } from '../../i18n';

export function accessReason(reason: CampusHours['reason'], t: Translate): string | null {
  switch (reason) {
    case 'christmas': return t('Christmas shutdown', 'Weihnachtsschließung');
    case 'easter': return t('Easter lecture break', 'Vorlesungsfreie Osterzeit');
    case 'pentecost': return t('Whitsun lecture break', 'Vorlesungsfreie Pfingstzeit');
    case 'lecture-free': return t('Lecture-free day', 'Vorlesungsfreier Tag');
    case 'holiday': return t('Public holiday', 'Gesetzlicher Feiertag');
    case 'weekend': return t('Weekend', 'Wochenende');
    default: return null;
  }
}

/** Short profile copy; the room finder carries the full access notice. */
export function profileAccessStatus(hours: CampusHours, t: Translate): string {
  if (hours.reason === 'weekend') return t('Weekend · Streak paused', 'Wochenende · Lernserie pausiert');
  if (hours.access === 'closed') return t('Campus closed today · Streak paused', 'Campus heute geschlossen · Lernserie pausiert');
  if (hours.access === 'unconfirmed') {
    return [accessReason(hours.reason, t), t('Check campus access', 'Campuszugang prüfen')].filter(Boolean).join(' · ');
  }
  return hours.open
    ? t('Classroom buildings are open today', 'Lehrgebäude sind heute geöffnet')
    : t('Outside classroom opening hours', 'Außerhalb der Gebäudeöffnungszeit');
}
