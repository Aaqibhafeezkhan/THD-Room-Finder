import type { HallKind } from '../../shared/hall.js';
import { ServiceError, errorCode } from './identityApi';
import type { FocusClient } from './supabaseClient';

/**
 * Organizations and gatherings (ADR 0008, docs/architecture/focus-service.md).
 * Reading a gathering or a group needs no account; replying needs a study
 * profile and consent to share name, programme and batch with organizers.
 */
export type GatheringAnswer = 'going' | 'maybe' | 'waiting';

export interface Gathering {
  link: string;
  kind: HallKind;
  title: string;
  description: string | null;
  roomKey: string;
  roomCode: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  org: { slug: string; name: string; verified: boolean };
  cancelled: boolean;
  changed: boolean;
  version: number;
  isOrganizer: boolean;
  myAnswer: GatheringAnswer | null;
  waitingPlace: number | null;
  /** Going 'g' and maybe 'm' in reply order. */
  replies: string;
  going: number;
  maybe: number;
  waiting: number;
}

export interface GatheringInput {
  kind: HallKind;
  title: string;
  description: string | null;
  roomKey: string;
  startsAt: Date;
  minutes: number;
  capacity: number;
  approvalRef: string;
}

export interface Person {
  name: string | null;
  programme: string | null;
  intakeYear: number | null;
  intakeTerm: 'winter' | 'summer' | null;
  answer: GatheringAnswer;
  repliedAt: Date;
}

export type RequestStatus = 'waiting_proof' | 'in_review' | 'needs_info' | 'approved' | 'declined' | 'revoked';

export interface MyOrganizations {
  requests: { no: number; slug: string; name: string; status: RequestStatus; issueNumber: number | null }[];
  groups: { slug: string; name: string; role: 'lead' | 'organizer'; verified: boolean }[];
}

export interface Organization {
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  supportUrl: string | null;
  verified: boolean;
  isOrganizer: boolean;
  gatherings: Gathering[];
}

export interface RoomGathering {
  link: string;
  kind: HallKind;
  title: string;
  orgName: string;
  startsAt: Date;
  endsAt: Date;
}

export interface GatheringsApi {
  set(slug: string, input: GatheringInput): Promise<Gathering>;
  change(link: string, expectedVersion: number, input: GatheringInput): Promise<Gathering>;
  cancel(link: string): Promise<Gathering>;
  get(link: string): Promise<Gathering | null>;
  reply(link: string, answer: 'going' | 'maybe' | 'no', consent: boolean): Promise<Gathering>;
  people(link: string): Promise<Person[]>;
  mine(): Promise<Gathering[]>;
  inRoom(roomKey: string, from: Date, to: Date): Promise<RoomGathering[]>;
  request(input: { name: string; slug: string; description: string | null; website: string | null; supportUrl: string | null }): Promise<{ no: number; slug: string }>;
  myOrganizations(): Promise<MyOrganizations>;
  organization(slug: string): Promise<Organization | null>;
  invite(slug: string): Promise<{ token: string; expiresAt: Date }>;
  join(token: string): Promise<{ slug: string; name: string }>;
}

const KINDS: readonly HallKind[] = ['focus', 'games', 'talk', 'meeting'];
const ANSWERS: readonly GatheringAnswer[] = ['going', 'maybe', 'waiting'];

export function toGathering(j: Record<string, unknown> | null): Gathering | null {
  if (!j || typeof j.link !== 'string') return null;
  const org = (j.org ?? {}) as Record<string, unknown>;
  return {
    link: j.link,
    kind: KINDS.includes(j.kind as HallKind) ? (j.kind as HallKind) : 'meeting',
    title: String(j.title ?? ''),
    description: (j.description as string | null) ?? null,
    roomKey: String(j.room_key ?? ''),
    roomCode: (j.room_code as string | null) ?? null,
    startsAt: new Date(j.starts_at as string),
    endsAt: new Date(j.ends_at as string),
    capacity: Number(j.capacity ?? 13),
    org: { slug: String(org.slug ?? ''), name: String(org.name ?? ''), verified: Boolean(org.verified) },
    cancelled: Boolean(j.cancelled),
    changed: Boolean(j.changed),
    version: Number(j.version ?? 1),
    isOrganizer: Boolean(j.is_organizer),
    myAnswer: ANSWERS.includes(j.my_answer as GatheringAnswer) ? (j.my_answer as GatheringAnswer) : null,
    waitingPlace: j.waiting_place == null ? null : Number(j.waiting_place),
    replies: typeof j.replies === 'string' ? j.replies.replace(/[^gm]/g, '') : '',
    going: Number(j.going ?? 0),
    maybe: Number(j.maybe ?? 0),
    waiting: Number(j.waiting ?? 0),
  };
}

function args(input: GatheringInput) {
  return {
    p_kind: input.kind,
    p_title: input.title.trim(),
    p_description: input.description?.trim() || '',
    p_room_key: input.roomKey,
    p_starts_at: input.startsAt.toISOString(),
    p_minutes: input.minutes,
    p_capacity: input.capacity,
    p_approval_ref: input.approvalRef.trim(),
  };
}

export function supabaseGatheringsApi(load: () => Promise<FocusClient>): GatheringsApi {
  const call = async (fn: () => PromiseLike<{ data: unknown; error: unknown }>) => {
    const { data, error } = await fn();
    if (error) throw new ServiceError(errorCode(error as Parameters<typeof errorCode>[0]));
    return data;
  };
  const one = (data: unknown) => {
    const g = toGathering(data as Record<string, unknown> | null);
    if (!g) throw new ServiceError('not_found');
    return g;
  };
  const list = (data: unknown) =>
    (Array.isArray(data) ? data : []).map((j) => toGathering(j as Record<string, unknown>)).filter((g): g is Gathering => g !== null);
  return {
    async set(slug, input) {
      const sb = await load();
      return one(await call(() => sb.rpc('set_gathering', { p_slug: slug, ...args(input) })));
    },
    async change(link, expectedVersion, input) {
      const sb = await load();
      return one(await call(() => sb.rpc('change_gathering', { p_link: link, p_expected_version: expectedVersion, ...args(input) })));
    },
    async cancel(link) {
      const sb = await load();
      return one(await call(() => sb.rpc('cancel_gathering', { p_link: link })));
    },
    async get(link) {
      const sb = await load();
      return toGathering((await call(() => sb.rpc('get_gathering', { p_link: link }))) as Record<string, unknown> | null);
    },
    async reply(link, answer, consent) {
      const sb = await load();
      return one(await call(() => sb.rpc('reply_gathering', { p_link: link, p_answer: answer, p_consent: consent })));
    },
    async people(link) {
      const sb = await load();
      const data = await call(() => sb.rpc('gathering_people', { p_link: link }));
      return (Array.isArray(data) ? data : []).map((j) => {
        const r = j as Record<string, unknown>;
        return {
          name: (r.name as string | null) ?? null,
          programme: (r.programme as string | null) ?? null,
          intakeYear: r.intake_year == null ? null : Number(r.intake_year),
          intakeTerm: r.intake_term === 'winter' || r.intake_term === 'summer' ? r.intake_term : null,
          answer: ANSWERS.includes(r.answer as GatheringAnswer) ? (r.answer as GatheringAnswer) : 'going',
          repliedAt: new Date(r.replied_at as string),
        };
      });
    },
    async mine() {
      const sb = await load();
      return list(await call(() => sb.rpc('my_gatherings')));
    },
    async inRoom(roomKey, from, to) {
      const sb = await load();
      const data = await call(() => sb.rpc('room_gatherings', { p_room_key: roomKey, p_from: from.toISOString(), p_to: to.toISOString() }));
      return (Array.isArray(data) ? data : []).map((j) => {
        const r = j as Record<string, unknown>;
        return {
          link: String(r.link),
          kind: KINDS.includes(r.kind as HallKind) ? (r.kind as HallKind) : 'meeting',
          title: String(r.title ?? ''),
          orgName: String(r.org_name ?? ''),
          startsAt: new Date(r.starts_at as string),
          endsAt: new Date(r.ends_at as string),
        };
      });
    },
    async request(input) {
      const sb = await load();
      const data = (await call(() =>
        sb.rpc('request_organization', {
          p_name: input.name.trim(),
          p_slug: input.slug.trim(),
          p_description: input.description?.trim() || '',
          p_website: input.website?.trim() || '',
          p_support_url: input.supportUrl?.trim() || '',
        }),
      )) as Record<string, unknown>;
      return { no: Number(data.no), slug: String(data.slug) };
    },
    async myOrganizations() {
      const sb = await load();
      const data = ((await call(() => sb.rpc('my_organizations'))) ?? {}) as Record<string, unknown>;
      const requests = (Array.isArray(data.requests) ? data.requests : []) as Record<string, unknown>[];
      const groups = (Array.isArray(data.groups) ? data.groups : []) as Record<string, unknown>[];
      return {
        requests: requests.map((r) => ({
          no: Number(r.no),
          slug: String(r.slug),
          name: String(r.name),
          status: r.status as RequestStatus,
          issueNumber: r.issue_number == null ? null : Number(r.issue_number),
        })),
        groups: groups.map((g) => ({ slug: String(g.slug), name: String(g.name), role: g.role === 'lead' ? 'lead' : 'organizer', verified: Boolean(g.verified) })),
      };
    },
    async organization(slug) {
      const sb = await load();
      const j = (await call(() => sb.rpc('get_organization', { p_slug: slug }))) as Record<string, unknown> | null;
      if (!j || typeof j.slug !== 'string') return null;
      return {
        slug: j.slug,
        name: String(j.name ?? ''),
        description: (j.description as string | null) ?? null,
        website: (j.website as string | null) ?? null,
        supportUrl: (j.support_url as string | null) ?? null,
        verified: Boolean(j.verified),
        isOrganizer: Boolean(j.is_organizer),
        gatherings: list(j.gatherings),
      };
    },
    async invite(slug) {
      const sb = await load();
      const j = (await call(() => sb.rpc('create_organizer_invite', { p_slug: slug }))) as Record<string, unknown>;
      return { token: String(j.token), expiresAt: new Date(j.expires_at as string) };
    },
    async join(token) {
      const sb = await load();
      const j = (await call(() => sb.rpc('join_organization', { p_token: token }))) as Record<string, unknown>;
      return { slug: String(j.slug), name: String(j.name) };
    },
  };
}
