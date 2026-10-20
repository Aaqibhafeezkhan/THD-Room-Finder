import type { Translate } from '../../i18n';

/**
 * One wording for the ways a request to the study service can fail, so
 * every screen says the same thing: offline, can't get through (an ad
 * blocker, or the service is down), or not answering. Null for anything
 * else; callers then use their own words.
 */
export function connectionText(code: string, t: Translate): string | null {
  switch (code) {
    case 'network':
      return t("You're offline. Try again when you're back online.", 'Du bist offline. Versuche es wieder, wenn du online bist.');
    case 'blocked':
      return t(
        "Couldn't reach the server. It may be down for a moment, or an ad blocker or Brave Shields is stopping it.",
        'Server nicht erreichbar. Vielleicht ist er kurz weg, oder ein Werbeblocker oder Brave Shields blockiert ihn.',
      );
    case 'unavailable':
      return t("The server isn't answering right now. Try again in a moment.", 'Der Server antwortet gerade nicht. Versuche es gleich noch einmal.');
    default:
      return null;
  }
}
