/**
 * Gatherings and the registry (ADR 0008, docs/product/organizations.md):
 * rules the screens share. Framework-free.
 */
import { batchLabel } from './batch';
import type { Room } from './models';

export const REGISTRY = 'THD-AI/organizations';
export const GATHERING_MIN = 13;
export const GATHERING_MAX = 300;
export const GATHERING_MAX_MINUTES = 360;

/** The registry's issue form, prefilled with the request (O1). */
export function registryIssueUrl(req: { no: number; name: string; slug: string; website?: string | null }): string {
  const q = new URLSearchParams({
    template: 'register.yml',
    title: `Register: ${req.name}`,
    request: String(req.no),
    name: req.name,
    slug: req.slug,
  });
  if (req.website) q.set('website', req.website);
  return `https://github.com/${REGISTRY}/issues/new?${q.toString()}`;
}

export const registryIssueLink = (issue: number) => `https://github.com/${REGISTRY}/issues/${issue}`;

/** "Campus Connect e.V." → "campus-connect-e-v" (the group's short name). */
export function slugFrom(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export const isSlug = (s: string) => /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s);

/** The room's seats as the capacity, or null when THabella doesn't know them. */
export function roomCapacity(room: Pick<Room, 'seatsRegular'>): number | null {
  const seats = Math.round(room.seatsRegular || 0);
  return seats >= GATHERING_MIN ? Math.min(GATHERING_MAX, seats) : null;
}

/** "Plan for about 25": everyone going and half the maybes. */
export const planFor = (going: number, maybe: number) => going + Math.round(maybe / 2);

export interface PersonLike {
  name: string | null;
  programme: string | null;
  intakeYear: number | null;
  intakeTerm: 'winter' | 'summer' | null;
  answer: string;
  repliedAt: Date;
}

export const personBatch = (p: PersonLike, now: Date) =>
  p.programme && p.intakeYear && p.intakeTerm ? batchLabel(p.programme, { year: p.intakeYear, term: p.intakeTerm }, now) : p.programme ?? '';

/** Going and maybe counted per programme, most first, then the rest; '' is no programme given. */
export function programmeCounts(people: PersonLike[], top = 3): { shown: [string, number][]; others: number; otherProgrammes: number } {
  const counts = new Map<string, number>();
  for (const p of people) {
    if (p.answer !== 'going' && p.answer !== 'maybe') continue;
    const key = p.programme ?? '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const rest = sorted.slice(top);
  return { shown: sorted.slice(0, top), others: rest.reduce((n, [, c]) => n + c, 0), otherProgrammes: rest.length };
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** The people list as CSV for organizers: no email addresses. */
export function peopleCsv(people: PersonLike[], now: Date): string {
  const rows = [['Name', 'Batch', 'Reply', 'Replied at']];
  for (const p of people) rows.push([p.name ?? '', personBatch(p, now), p.answer, p.repliedAt.toISOString()]);
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

export function normalizeGatheringLink(raw: string | undefined): string | null {
  const link = (raw ?? '').trim().toLowerCase();
  return /^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$/.test(link) ? link : null;
}
