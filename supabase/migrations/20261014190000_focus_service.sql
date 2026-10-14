-- Focus service (M1, issue #17): study identity, focus sessions and room
-- summaries for Private claims and Public batch sessions.
-- Contract: docs/architecture/focus-service.md, ADR 0001 and ADR 0002.
--
-- Shape of the boundary:
--   * Tables live in the private schema `focus`, which the Data API does not
--     expose. Clients never read or write them directly.
--   * Every client operation is a function in `public`, SECURITY DEFINER with
--     an empty search_path and schema-qualified names. Identity always comes
--     from auth.uid(); no function trusts a caller-supplied user, batch or
--     viewer.
--   * RLS is enabled on every table with no policies, so a grant mistake
--     still exposes nothing.
--   * The server keeps no completed history: ended sessions are deleted
--     within 24 hours. The focus graph lives on the device (ADR 0002).

create schema if not exists focus;
revoke all on schema focus from public, anon, authenticated;

-- ── Catalogue ───────────────────────────────────────────────────────────
-- Programmes come from the THD taxonomy (#40, shared/programmes.json); ids
-- match its `id` field. Only listed, active programmes can share Public.
create table focus.programme (
  id text primary key check (id ~ '^[a-z0-9-]{3,80}$'),
  code text not null check (char_length(code) between 1 and 16),
  name_en text not null,
  name_de text not null,
  intake_terms text[] not null default '{winter}' check (intake_terms <@ array['winter', 'summer']),
  active boolean not null default true
);

-- Rooms a session may name: campus + canonical THabella room ident. Filled
-- by a maintainer import of teaching-eligible rooms; never by students.
create table focus.room (
  room_key text primary key check (room_key ~ '^[a-z]+:[A-Za-z0-9 ._:/-]{1,64}$'),
  campus text not null check (campus ~ '^[a-z]+$'),
  code text not null,
  active boolean not null default true
);
create index room_campus_idx on focus.room (campus) where active;

-- ── Identity ────────────────────────────────────────────────────────────
-- Self-declared: matching is a discovery aid, not proof of enrolment.
-- Batch = programme + intake year + intake term. No email is stored here.
create table focus.identity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 32),
  programme_id text references focus.programme (id),
  intake_year smallint check (intake_year between 2000 and 2100),
  intake_term text check (intake_term in ('winter', 'summer')),
  default_visibility text not null default 'private' check (default_visibility in ('private', 'public')),
  show_name boolean not null default false,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint identity_batch_complete check (
    (programme_id is null and intake_year is null and intake_term is null)
    or (programme_id is not null and intake_year is not null and intake_term is not null)
  )
);

-- ── Sessions ────────────────────────────────────────────────────────────
-- A session is live while ended_at is null, now() < lease_until and
-- now() < planned_end. Visibility and the batch snapshot decide who sees it.
create table focus.session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  room_key text not null references focus.room (room_key),
  visibility text not null check (visibility in ('private', 'public')),
  show_name boolean not null default false,
  -- Batch snapshot at start; a batch change ends the session first.
  programme_id text,
  intake_year smallint,
  intake_term text,
  start_request_id uuid not null,
  started_at timestamptz not null default now(),
  planned_end timestamptz not null,
  lease_until timestamptz not null,
  renewed_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('ended', 'expired', 'replaced', 'identity_changed', 'deleted')),
  version integer not null default 1,
  constraint session_planned_within_cap check (planned_end <= started_at + interval '3 hours'),
  constraint session_lease_within_plan check (lease_until <= planned_end),
  constraint session_public_has_batch check (visibility = 'private' or programme_id is not null),
  unique (user_id, start_request_id)
);
-- One open session per person. Stale open rows are closed before a start.
create unique index session_one_open_idx on focus.session (user_id) where ended_at is null;
create index session_live_room_idx on focus.session (room_key, lease_until) where ended_at is null;
create index session_cleanup_idx on focus.session (ended_at) where ended_at is not null;

alter table focus.programme enable row level security;
alter table focus.room enable row level security;
alter table focus.identity enable row level security;
alter table focus.session enable row level security;

-- ── Internal helpers (not callable by clients) ──────────────────────────
create function focus.lease() returns interval
language sql immutable as $$ select interval '60 minutes' $$;

create function focus.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sign in required' using errcode = '28000', hint = 'not_signed_in';
  end if;
  return uid;
end $$;

-- Close sessions whose lease or plan has run out, for one user or everyone.
create function focus.close_stale(p_user uuid default null) returns integer
language sql set search_path = '' as $$
  with closed as (
    update focus.session s
       set ended_at = least(s.lease_until, s.planned_end),
           end_reason = 'expired',
           version = s.version + 1
     where s.ended_at is null
       and (p_user is null or s.user_id = p_user)
       and (now() >= s.lease_until or now() >= s.planned_end)
    returning 1
  )
  select count(*)::integer from closed
$$;

create function focus.session_json(s focus.session) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id,
    'room_key', s.room_key,
    'visibility', s.visibility,
    'show_name', s.show_name,
    'started_at', s.started_at,
    'planned_end', s.planned_end,
    'lease_until', s.lease_until,
    'ended_at', s.ended_at,
    'end_reason', s.end_reason,
    'version', s.version,
    'server_now', now()
  )
$$;

create function focus.identity_json(i focus.identity) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'display_name', i.display_name,
    'programme_id', i.programme_id,
    'intake_year', i.intake_year,
    'intake_term', i.intake_term,
    'default_visibility', i.default_visibility,
    'show_name', i.show_name,
    'version', i.version
  )
$$;

revoke all on all functions in schema focus from public, anon, authenticated;

-- ── Client API ──────────────────────────────────────────────────────────

-- Programmes offered in setup. Readable without signing in.
create function public.list_programmes()
returns table (id text, code text, name_en text, name_de text, intake_terms text[])
language sql stable security definer set search_path = '' as $$
  select p.id, p.code, p.name_en, p.name_de, p.intake_terms
    from focus.programme p
   where p.active
   order by p.code
$$;

-- The caller's own study identity, or null.
create function public.get_identity() returns jsonb
language sql stable security definer set search_path = '' as $$
  select focus.identity_json(i) from focus.identity i where i.user_id = focus.require_user()
$$;

-- Create or update the caller's identity. p_expected_version is null when
-- creating. Changing programme or intake ends an open session first, so a
-- session never changes audience silently.
create function public.save_identity(
  p_display_name text,
  p_programme_id text,
  p_intake_year integer,
  p_intake_term text,
  p_default_visibility text,
  p_show_name boolean,
  p_expected_version integer default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.identity;
  saved focus.identity;
  name text := nullif(btrim(p_display_name), '');
begin
  if p_programme_id is not null and not exists (
    select 1 from focus.programme p
     where p.id = p_programme_id and p.active and p_intake_term = any (p.intake_terms)
  ) then
    raise exception 'unknown programme or intake' using errcode = '22023', hint = 'invalid_programme';
  end if;
  if p_default_visibility = 'public' and p_programme_id is null then
    raise exception 'public needs a listed programme' using errcode = '22023', hint = 'public_needs_batch';
  end if;

  select * into cur from focus.identity i where i.user_id = uid for update;
  if found then
    if p_expected_version is distinct from cur.version then
      raise exception 'identity changed elsewhere' using errcode = '40001', hint = 'stale_version';
    end if;
    if (cur.programme_id, cur.intake_year, cur.intake_term)
       is distinct from (p_programme_id, p_intake_year::smallint, p_intake_term) then
      update focus.session s
         set ended_at = now(), end_reason = 'identity_changed', version = s.version + 1
       where s.user_id = uid and s.ended_at is null;
    end if;
    update focus.identity i
       set display_name = name,
           programme_id = p_programme_id,
           intake_year = p_intake_year,
           intake_term = p_intake_term,
           default_visibility = p_default_visibility,
           show_name = p_show_name,
           version = i.version + 1,
           updated_at = now()
     where i.user_id = uid
    returning * into saved;
  else
    if p_expected_version is not null then
      raise exception 'identity changed elsewhere' using errcode = '40001', hint = 'stale_version';
    end if;
    insert into focus.identity (user_id, display_name, programme_id, intake_year, intake_term, default_visibility, show_name)
    values (uid, name, p_programme_id, p_intake_year, p_intake_term, p_default_visibility, p_show_name)
    returning * into saved;
  end if;
  return focus.identity_json(saved);
end $$;

-- The caller's open session, or null.
create function public.get_focus() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  s focus.session;
begin
  perform focus.close_stale(uid);
  select * into s from focus.session x where x.user_id = uid and x.ended_at is null;
  if not found then return null; end if;
  return focus.session_json(s);
end $$;

-- Start a session. The client works out the planned length from the
-- schedule (until the next lecture); the server caps it at 3 hours and sets
-- the first lease. Retrying with the same request id returns the same
-- session. An open session elsewhere is a conflict unless p_replace is true,
-- which ends it ("starting elsewhere ends the old one").
create function public.start_focus(
  p_room_key text,
  p_planned_minutes integer,
  p_visibility text,
  p_show_name boolean,
  p_request_id uuid,
  p_replace boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  me focus.identity;
  s focus.session;
  starts_last_hour integer;
begin
  if p_request_id is null then
    raise exception 'request id required' using errcode = '22023', hint = 'invalid_request';
  end if;
  if p_planned_minutes is null or p_planned_minutes < 1 or p_planned_minutes > 180 then
    raise exception 'planned length must be 1 to 180 minutes' using errcode = '22023', hint = 'invalid_duration';
  end if;
  if p_visibility not in ('private', 'public') then
    raise exception 'unknown visibility' using errcode = '22023', hint = 'invalid_visibility';
  end if;
  if not exists (select 1 from focus.room r where r.room_key = p_room_key and r.active) then
    raise exception 'unknown room' using errcode = '22023', hint = 'unknown_room';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text, 17));

  select * into s from focus.session x where x.user_id = uid and x.start_request_id = p_request_id;
  if found then
    return focus.session_json(s);
  end if;

  select * into me from focus.identity i where i.user_id = uid;
  if p_visibility = 'public' and (me.user_id is null or me.programme_id is null) then
    raise exception 'public needs a study profile with a listed programme' using errcode = '22023', hint = 'public_needs_batch';
  end if;

  select count(*) into starts_last_hour
    from focus.session x where x.user_id = uid and x.started_at > now() - interval '1 hour';
  if starts_last_hour >= 20 then
    raise exception 'too many sessions started' using errcode = '53400', hint = 'rate_limited';
  end if;

  perform focus.close_stale(uid);
  if exists (select 1 from focus.session x where x.user_id = uid and x.ended_at is null) then
    if not p_replace then
      raise exception 'a session is already running' using errcode = '23505', hint = 'already_active';
    end if;
    update focus.session x
       set ended_at = now(), end_reason = 'replaced', version = x.version + 1
     where x.user_id = uid and x.ended_at is null;
  end if;

  insert into focus.session (
    user_id, room_key, visibility, show_name, programme_id, intake_year, intake_term,
    start_request_id, started_at, planned_end, lease_until, renewed_at
  ) values (
    uid, p_room_key, p_visibility, coalesce(p_show_name, false) and p_visibility = 'public',
    me.programme_id, me.intake_year, me.intake_term,
    p_request_id, now(), now() + make_interval(mins => p_planned_minutes),
    least(now() + make_interval(mins => p_planned_minutes), now() + focus.lease()), now()
  ) returning * into s;
  return focus.session_json(s);
end $$;

-- Keep a session alive: the app was opened or "Still focusing" was tapped.
-- Never extends past the planned end and never revives an expired session.
create function public.renew_focus(p_session_id uuid, p_expected_version integer)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  s focus.session;
begin
  perform focus.close_stale(uid);
  select * into s from focus.session x where x.id = p_session_id and x.user_id = uid for update;
  if not found or s.ended_at is not null then
    raise exception 'session is not running' using errcode = 'P0002', hint = 'not_active';
  end if;
  if s.version <> p_expected_version then
    raise exception 'session changed elsewhere' using errcode = '40001', hint = 'stale_version';
  end if;
  -- Renewals closer than a minute apart are accepted without a write.
  if s.renewed_at > now() - interval '1 minute' then
    return focus.session_json(s);
  end if;
  update focus.session x
     set lease_until = least(x.planned_end, now() + focus.lease()),
         renewed_at = now(),
         version = x.version + 1
   where x.id = s.id
  returning * into s;
  return focus.session_json(s);
end $$;

-- Switch Private <-> Public or the name consent. Narrowing applies to the
-- next summary read.
create function public.update_focus(
  p_session_id uuid,
  p_visibility text,
  p_show_name boolean,
  p_expected_version integer
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  s focus.session;
begin
  if p_visibility not in ('private', 'public') then
    raise exception 'unknown visibility' using errcode = '22023', hint = 'invalid_visibility';
  end if;
  perform focus.close_stale(uid);
  select * into s from focus.session x where x.id = p_session_id and x.user_id = uid for update;
  if not found or s.ended_at is not null then
    raise exception 'session is not running' using errcode = 'P0002', hint = 'not_active';
  end if;
  if s.version <> p_expected_version then
    raise exception 'session changed elsewhere' using errcode = '40001', hint = 'stale_version';
  end if;
  if p_visibility = 'public' and s.programme_id is null then
    raise exception 'public needs a study profile with a listed programme' using errcode = '22023', hint = 'public_needs_batch';
  end if;
  update focus.session x
     set visibility = p_visibility,
         show_name = coalesce(p_show_name, false) and p_visibility = 'public',
         version = x.version + 1
   where x.id = s.id
  returning * into s;
  return focus.session_json(s);
end $$;

-- End the caller's session. Idempotent: ending twice returns the ended row.
create function public.end_focus(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  s focus.session;
begin
  perform focus.close_stale(uid);
  update focus.session x
     set ended_at = now(), end_reason = 'ended', version = x.version + 1
   where x.id = p_session_id and x.user_id = uid and x.ended_at is null
  returning * into s;
  if not found then
    select * into s from focus.session x where x.id = p_session_id and x.user_id = uid;
    if not found then
      return null;
    end if;
  end if;
  return focus.session_json(s);
end $$;

-- What a viewer may see per room on one campus: only rooms with live
-- activity, at most 500 rows. Everyone sees anonymous claims. A signed-in
-- viewer also sees Public sessions of their own batch (count, and names of
-- those who chose to show them) and their own session. No user ids leave.
create function public.room_summaries(p_campus text)
returns table (
  room_key text,
  claims integer,
  claim_since timestamptz,
  batch_count integer,
  batch_since timestamptz,
  batch_names text[],
  own boolean,
  expires_at timestamptz,
  server_now timestamptz
)
language sql stable security definer set search_path = '' as $$
  with viewer as (
    select i.programme_id, i.intake_year, i.intake_term, auth.uid() as uid
      from (select 1) one
      left join focus.identity i on i.user_id = auth.uid()
  ),
  live as (
    select s.*,
           coalesce(s.user_id = v.uid, false) as is_own,
           coalesce(s.visibility = 'public'
             and v.programme_id is not null
             and s.user_id <> v.uid
             and (s.programme_id, s.intake_year, s.intake_term) = (v.programme_id, v.intake_year, v.intake_term), false) as is_batch
      from focus.session s
      join focus.room r on r.room_key = s.room_key and r.campus = p_campus
      cross join viewer v
     where s.ended_at is null and now() < s.lease_until and now() < s.planned_end
  )
  select l.room_key,
         (count(*) filter (where not l.is_own and not l.is_batch))::integer,
         min(l.started_at) filter (where not l.is_own and not l.is_batch),
         (count(*) filter (where l.is_batch))::integer,
         min(l.started_at) filter (where l.is_batch),
         coalesce(array_agg(i.display_name order by l.started_at)
                  filter (where l.is_batch and l.show_name and i.display_name is not null), '{}'),
         bool_or(l.is_own),
         min(least(l.lease_until, l.planned_end)),
         now()
    from live l
    left join focus.identity i on i.user_id = l.user_id
   group by l.room_key
   order by l.room_key
   limit 500
$$;

-- Delete the caller's study identity and account. Ends sessions first. The
-- focus graph on the device is untouched.
create function public.delete_identity() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
begin
  update focus.session s
     set ended_at = now(), end_reason = 'deleted', version = s.version + 1
   where s.user_id = uid and s.ended_at is null;
  delete from auth.users u where u.id = uid;
end $$;

-- ── Retention ───────────────────────────────────────────────────────────
-- Close stale sessions and delete ended ones after 24 hours.
create function focus.cleanup() returns void
language plpgsql set search_path = '' as $$
begin
  perform focus.close_stale(null);
  delete from focus.session s where s.ended_at < now() - interval '24 hours';
end $$;
revoke all on function focus.cleanup() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('focus-cleanup', '17 * * * *', $$select focus.cleanup()$$);

-- ── Grants ──────────────────────────────────────────────────────────────
revoke all on function
  public.list_programmes(), public.get_identity(),
  public.save_identity(text, text, integer, text, text, boolean, integer),
  public.get_focus(),
  public.start_focus(text, integer, text, boolean, uuid, boolean),
  public.renew_focus(uuid, integer),
  public.update_focus(uuid, text, boolean, integer),
  public.end_focus(uuid),
  public.room_summaries(text),
  public.delete_identity()
from public, anon, authenticated;

-- Without signing in: the programme list and anonymous room summaries.
grant execute on function public.list_programmes(), public.room_summaries(text) to anon, authenticated;
grant execute on function
  public.get_identity(),
  public.save_identity(text, text, integer, text, text, boolean, integer),
  public.get_focus(),
  public.start_focus(text, integer, text, boolean, uuid, boolean),
  public.renew_focus(uuid, integer),
  public.update_focus(uuid, text, boolean, integer),
  public.end_focus(uuid),
  public.delete_identity()
to authenticated;
