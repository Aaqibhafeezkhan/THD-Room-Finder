import type { BeforeSendEvent } from '@vercel/analytics/react';

/** Invite paths whose last segment is the invitation itself (#165). */
const PRIVATE = /^\/(t|g)\/[^/?#]+/;

/**
 * What Vercel Web Analytics may see of a URL: the path only, with study
 * table and gathering links replaced by a placeholder. Room, organization and
 * screen paths are public and stay as they are.
 */
export function publicPath(url: string): string {
  const u = new URL(url);
  const path = u.pathname.replace(PRIVATE, (_, kind: string) => `/${kind}/[link]`);
  return `${u.origin}${path}`;
}

export function beforeSend(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: publicPath(event.url) };
}
