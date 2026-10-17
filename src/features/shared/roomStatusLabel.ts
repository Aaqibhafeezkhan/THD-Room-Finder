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
    case 'occupied':
      return t('busy', 'belegt');
  }
}
