import type { HallKind } from '../../../shared/hall.js';
import type { Gathering, RequestStatus } from '../../data/gatheringsApi';
import type { Translate } from '../../i18n';
import { connectionText } from '../shared/connectionCopy';

/** Words for gatherings (docs/product/organizations.md → Words). */
export const kindLabels = (t: Translate): Record<HallKind, string> => ({
  focus: t('Group focus', 'Gemeinsam lernen'),
  games: t('Game night', 'Spieleabend'),
  talk: t('Talk', 'Vortrag'),
  meeting: t('Meeting', 'Treffen'),
});

/** "21 going · 7 maybe": a quiet line, never the headline. */
export function countLine(g: Pick<Gathering, 'going' | 'maybe' | 'waiting'>, t: Translate): string {
  const parts = [t(`${g.going} going`, `${g.going} dabei`)];
  if (g.maybe) parts.push(t(`${g.maybe} maybe`, `${g.maybe} vielleicht`));
  if (g.waiting) parts.push(t(`${g.waiting} waiting`, `${g.waiting} auf der Warteliste`));
  return parts.join(' · ');
}

export const hallTitle = (g: Pick<Gathering, 'roomCode' | 'going' | 'maybe'>, t: Translate) =>
  t(`${g.roomCode ?? ''}: ${g.going} going, ${g.maybe} maybe`, `${g.roomCode ?? ''}: ${g.going} dabei, ${g.maybe} vielleicht`);

export function requestStatusText(status: RequestStatus, t: Translate): string {
  switch (status) {
    case 'waiting_proof':
      return t('Waiting for proof', 'Wartet auf Nachweis');
    case 'in_review':
      return t('In review', 'Wird geprüft');
    case 'needs_info':
      return t('Needs info', 'Braucht Angaben');
    case 'approved':
      return t('Verified', 'Verifiziert');
    case 'declined':
      return t('Declined', 'Abgelehnt');
    case 'revoked':
      return t('No longer verified', 'Nicht mehr verifiziert');
  }
}

export function gatheringErrorText(code: string, t: Translate): string {
  switch (code) {
    case 'needs_approval':
      return t("Add THD's room approval reference.", 'Gib die Raumfreigabe der THD an.');
    case 'room_taken':
      return t('Another gathering is in this room then.', 'Zu der Zeit ist schon ein Treffen in diesem Raum.');
    case 'capacity_taken':
      return t('More people are already going.', 'Es sind schon mehr Leute dabei.');
    case 'invalid_capacity':
      return t('A gathering is for 13 to 300 people. Fewer is a study table.', 'Ein Treffen ist für 13 bis 300 Leute. Weniger ist ein Lerntisch.');
    case 'not_verified':
      return t('This group is not verified.', 'Diese Gruppe ist nicht verifiziert.');
    case 'gathering_closed':
      return t('This gathering is over or cancelled.', 'Dieses Treffen ist vorbei oder abgesagt.');
    case 'slug_taken':
      return t('That short name is taken. Pick another.', 'Dieser Kurzname ist vergeben. Wähle einen anderen.');
    case 'invalid_slug':
      return t('Use lower case letters, digits and dashes.', 'Nutze Kleinbuchstaben, Ziffern und Bindestriche.');
    case 'request_limit':
      return t('You already have two open requests.', 'Du hast schon zwei offene Anfragen.');
    case 'invalid_time':
      return t('Pick a time from now up to 90 days ahead.', 'Wähle eine Zeit ab jetzt bis in 90 Tagen.');
    case 'stale_version':
      return t('It changed in the meantime. Close this and try again.', 'Es wurde inzwischen geändert. Schließe das hier und versuche es erneut.');
    default:
      return connectionText(code, t) ?? t('Something went wrong. Try again.', 'Etwas ist schiefgelaufen. Versuche es erneut.');
  }
}
