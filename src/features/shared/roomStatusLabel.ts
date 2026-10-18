import type { RoomCardStatus } from '../../components';
import type { Translate } from '../../i18n';

/**
 * The small uppercase status word on a room row, in the active language.
 * RoomCard falls back to English, so every list passes this as `statusLabel`.
 */
export function roomStatusLabel(status: RoomCardStatus, t: Translate): string {
  switch (status) {
    case 'free':
      return t('free', 'frei');
    case 'soon':
      return t('closing', 'bald belegt');
    case 'claimed':
      return t('claimed', 'Fokus');
    case 'unavailable':
      return t('unavailable', 'nicht verfügbar');
    case 'occupied':
      return t('busy', 'belegt');
  }
}

/** A planned opening is not a live availability claim. */
export function freeRoomsLabel(t: Translate, { preview, customTime, building }: {
  preview: boolean; customTime: boolean; building?: string | null;
}): string {
  const place = building ? ` in ${building}` : '';
  if (preview) return t(`rooms free${place} when it opens`, `Räume frei${place} bei Öffnung`);
  if (customTime) return t(`rooms free${place} at this time`, `Räume frei${place} zur gewählten Zeit`);
  return t(`rooms free${place} right now`, `Räume${place} jetzt frei`);
}
