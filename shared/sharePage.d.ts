import type { ShareSnapshot } from './shareLink';

/** The HTML behind /f/<payload>; a null snapshot gives the plain app preview. */
export function sharePage(snapshot: ShareSnapshot | null, payload: string, origin: string): string;
