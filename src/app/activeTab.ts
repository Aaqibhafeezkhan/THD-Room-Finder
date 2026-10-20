/**
 * Maps the current path to the active nav destination. A room's detail page
 * belongs to whichever tab opened it, so it keeps that tab highlighted; so
 * does a table page.
 */
export function activeId(pathname: string, previous = 'campus'): string {
  if (pathname.startsWith('/room/') || pathname.startsWith('/t/')) return previous;
  if (pathname.startsWith('/rooms')) return 'rooms';
  if (pathname.startsWith('/profile') || pathname.startsWith('/saved')) return 'profile';
  return 'campus';
}
