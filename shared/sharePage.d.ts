import type { ShareSnapshot } from './shareLink';

/** The HTML behind /f/<payload>; a null snapshot gives the plain app preview. */
export function sharePage(snapshot: ShareSnapshot | null, payload: string, origin: string): string;

export interface Invite {
  dark: boolean;
  lang: 'en' | 'de';
}
/** "dark", "light", "dark-de" or "light-de"; anything else is null. */
export function parseInvite(variant: string | null | undefined): Invite | null;
/** The HTML behind /i/<variant>; null gives the light English banner. */
export function invitePage(invite: Invite | null, origin: string): string;
