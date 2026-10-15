import { ListNotice } from '../../components';
import { useI18n } from '../../i18n';
import type { FocusNotice } from './useFocusSignals';

/** The one line over the room list explaining why it looks different (D3). */
export function FocusListNotice({ notice }: { notice: FocusNotice }) {
  const { t } = useI18n();
  if (notice === 'time') {
    return (
      <ListNotice kind="time">
        {t('Schedule only. Focus activity shows for now.', 'Nur Stundenplan. Fokus-Aktivität gibt es nur für jetzt.')}
      </ListNotice>
    );
  }
  if (notice === 'unknown') {
    return <ListNotice kind="unknown">{t('Focus activity unknown', 'Fokus-Aktivität unbekannt')}</ListNotice>;
  }
  if (notice === 'quiet') {
    return (
      <ListNotice kind="quiet">
        {t("Your batch's sessions show as claimed (Settings).", 'Sessions deines Jahrgangs erscheinen als belegt (Einstellungen).')}
      </ListNotice>
    );
  }
  return null;
}
