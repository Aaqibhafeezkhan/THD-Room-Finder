import type { StudyTable } from '../../data/tablesApi';
import type { Translate } from '../../i18n';
import { connectionText } from '../shared/connectionCopy';

/** Words for study tables (docs/product/study-tables.md → Words). */
export function tableErrorText(code: string, t: Translate): string {
  switch (code) {
    case 'invalid_time':
      return t('Pick a time from now up to 14 days ahead.', 'Wähle eine Zeit ab jetzt bis in 14 Tagen.');
    case 'table_limit':
      return t('You already host 5 upcoming study tables. Cancel one first.', 'Du hast schon 5 kommende Lerntische. Sage zuerst einen ab.');
    case 'table_full':
      return t('The last seat just went. You can still say maybe.', 'Der letzte Platz ist gerade weg. Vielleicht geht noch.');
    case 'table_closed':
      return t('This study table is over or cancelled.', 'Dieser Lerntisch ist vorbei oder abgesagt.');
    case 'seats_taken':
      return t('More seats are taken than that.', 'Es sind schon mehr Plätze belegt.');
    case 'stale_version':
      return t('The study table changed in the meantime. Close this and try again.', 'Der Lerntisch wurde inzwischen geändert. Schließe das hier und versuche es erneut.');
    case 'too_short':
      return t('Less than 25 minutes left, too short for others to come.', 'Weniger als 25 Minuten übrig, zu kurz zum Dazukommen.');
    case 'not_active':
      return t('Your focus session has ended.', 'Deine Fokus-Session ist vorbei.');
    case 'unknown_room':
      return t("That room can't take a study table. Pick another.", 'In diesem Raum geht kein Lerntisch. Wähle einen anderen.');
    default:
      return connectionText(code, t) ?? t('Something went wrong. Try again.', 'Etwas ist schiefgelaufen. Versuche es erneut.');
  }
}

export const topicOf = (table: Pick<StudyTable, 'topic' | 'seats'>, t: Translate) =>
  table.topic ?? (table.seats === 1 ? t('Just me', 'Nur ich') : t('Study table', 'Lerntisch'));

/** "3 of 6 seats taken" */
export const seatsTitle = (table: Pick<StudyTable, 'taken' | 'seats'>, t: Translate) =>
  t(`${table.taken} of ${table.seats} seats taken`, `${table.taken} von ${table.seats} Plätzen belegt`);

/**
 * Who sits there: "You, Max, Lena and 1 more · 1 maybe". The host's name
 * shows when they share it; others who don't are counted.
 */
export function whoLine(table: StudyTable, t: Translate): string {
  if (table.seats === 1) return t('A planned solo session', 'Eine geplante Solo-Session');
  const names = [
    ...(table.isHost ? [t('You', 'Du')] : table.hostName ? [table.hostName] : []),
    ...(table.myAnswer === 'seat' && !table.isHost ? [t('You', 'Du')] : []),
    ...table.seatNames,
  ];
  const unique = [...new Set(names)];
  const others = Math.max(0, table.taken - unique.length);
  let line: string;
  if (!unique.length) line = table.taken === 1 ? t('1 student', '1 Studi') : t(`${table.taken} students`, `${table.taken} Studis`);
  else if (others) line = t(`${unique.join(', ')} and ${others} more`, `${unique.join(', ')} und ${others} weitere`);
  else line = unique.length > 1 ? t(`${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`, `${unique.slice(0, -1).join(', ')} und ${unique[unique.length - 1]}`) : unique[0];
  return table.maybe ? `${line} · ${t(`${table.maybe} maybe`, `${table.maybe} vielleicht`)}` : line;
}
