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
