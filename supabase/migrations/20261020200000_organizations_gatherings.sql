-- Student organizations and gatherings (M3, issue #134, ADR 0008).
-- Groups register themselves through the public registry (THD-AI/organizations):
-- the app stores a request, the registry workflow sets its status with the
-- service role. Verified groups host gatherings in rooms THD approved; people
-- reply Going, Maybe or Can't, in reply order, and a full gathering keeps a
-- waiting list. Same boundary as the focus service: private tables with RLS
-- and no policies; every client call is a SECURITY DEFINER function.

create table focus.organization (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  description text check (description is null or char_length(description) <= 280),
  website text check (website is null or website ~ '^https://'),
  support_url text check (support_url is null or support_url ~ '^https://'),
  verified_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table focus.org_request (
  no integer generated always as identity primary key,
  applicant uuid not null references auth.users (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  description text check (description is null or char_length(description) <= 280),
  website text check (website is null or website ~ '^https://'),
  support_url text check (support_url is null or support_url ~ '^https://'),
  status text not null default 'waiting_proof'
    check (status in ('waiting_proof', 'in_review', 'needs_info', 'approved', 'declined', 'revoked')),
  issue_number integer,
  org_id uuid references focus.organization (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index org_request_applicant_idx on focus.org_request (applicant);

create table focus.org_member (
  org_id uuid not null references focus.organization (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('lead', 'organizer')),
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index org_member_user_idx on focus.org_member (user_id);

create table focus.org_invite (
  token text primary key check (token ~ '^[A-Za-z0-9]{16}$'),
  org_id uuid not null references focus.organization (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null
);

create table focus.gathering (
  id uuid primary key default gen_random_uuid(),
  link text not null unique check (link ~ '^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$'),
  org_id uuid not null references focus.organization (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('focus', 'games', 'talk', 'meeting')),
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text check (description is null or char_length(description) <= 280),
  room_key text not null references focus.room (room_key),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity smallint not null check (capacity between 13 and 300),
  approval_ref text not null check (char_length(btrim(approval_ref)) between 2 and 60),
  cancelled_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gathering_length check (ends_at >= starts_at + interval '25 minutes' and ends_at <= starts_at + interval '6 hours')
);
create index gathering_org_idx on focus.gathering (org_id, starts_at);
create index gathering_room_idx on focus.gathering (room_key, starts_at);
create index gathering_cleanup_idx on focus.gathering (ends_at);

-- replied_at keeps the reply order the picture uses; Maybe → Going keeps it.
create table focus.gathering_reply (
  gathering_id uuid not null references focus.gathering (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answer text not null check (answer in ('going', 'maybe', 'waiting')),
  replied_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default now(),
  primary key (gathering_id, user_id)
);
create index gathering_reply_order_idx on focus.gathering_reply (gathering_id, replied_at);
create index gathering_reply_user_idx on focus.gathering_reply (user_id);

alter table focus.organization enable row level security;
alter table focus.org_request enable row level security;
alter table focus.org_member enable row level security;
alter table focus.org_invite enable row level security;
alter table focus.gathering enable row level security;
alter table focus.gathering_reply enable row level security;

-- ── Internal helpers ────────────────────────────────────────────────────

-- A verified, not revoked organization by slug.
create function focus.active_org(p_slug text) returns focus.organization
language sql stable set search_path = '' as $$
  select o.* from focus.organization o
   where o.slug = lower(btrim(p_slug)) and o.verified_at is not null and o.revoked_at is null
$$;

create function focus.is_organizer(p_org uuid, p_user uuid) returns boolean
language sql stable set search_path = '' as $$
  select p_user is not null and exists (select 1 from focus.org_member m where m.org_id = p_org and m.user_id = p_user)
$$;

create function focus.new_gathering_link() returns text
language plpgsql volatile set search_path = '' as $$
declare
  bytes bytea;
  candidate text;
begin
  for attempt in 1..20 loop
    bytes := uuid_send(gen_random_uuid());
    candidate :=
      (select w.word from focus.link_word w where w.list = 1
         and w.idx = ((get_byte(bytes, 0) << 8) | get_byte(bytes, 1)) % 512)
      || '-' ||
      (select w.word from focus.link_word w where w.list = 2
         and w.idx = ((get_byte(bytes, 2) << 8) | get_byte(bytes, 3)) % 512)
      || '-' || (10 + get_byte(bytes, 4) % 90)::text;
    if not exists (select 1 from focus.gathering g where g.link = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'no free gathering link' using errcode = '55000', hint = 'link_exhausted';
end $$;

-- A gathering the caller may see: exists, and ended less than 30 days ago.
create function focus.find_gathering(p_link text) returns focus.gathering
language sql stable set search_path = '' as $$
  select g.* from focus.gathering g
   where g.link = lower(btrim(p_link)) and g.ends_at > now() - interval '30 days'
$$;

-- Going and maybe in reply order, as 'g' and 'm': the picture's dots.
create function focus.reply_sequence(p_gathering uuid) returns text
language sql stable set search_path = '' as $$
  select coalesce(string_agg(case r.answer when 'going' then 'g' else 'm' end, '' order by r.replied_at, r.user_id), '')
    from focus.gathering_reply r
   where r.gathering_id = p_gathering and r.answer in ('going', 'maybe')
$$;

create function focus.gathering_count(p_gathering uuid, p_answer text) returns integer
language sql stable set search_path = '' as $$
  select count(*)::integer from focus.gathering_reply r where r.gathering_id = p_gathering and r.answer = p_answer
$$;

create function focus.gathering_json(g focus.gathering, p_viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'link', g.link,
    'kind', g.kind,
    'title', g.title,
    'description', g.description,
    'room_key', g.room_key,
    'room_code', (select r.code from focus.room r where r.room_key = g.room_key),
    'starts_at', g.starts_at,
    'ends_at', g.ends_at,
    'capacity', g.capacity,
    'org', (select jsonb_build_object('slug', o.slug, 'name', o.name,
              'verified', o.verified_at is not null and o.revoked_at is null)
              from focus.organization o where o.id = g.org_id),
    'cancelled', g.cancelled_at is not null,
    'changed', g.version > 1,
    'version', g.version,
    'is_organizer', focus.is_organizer(g.org_id, p_viewer),
    'my_answer', (select r.answer from focus.gathering_reply r where r.gathering_id = g.id and r.user_id = p_viewer),
    -- 1 for the first in line; null unless the viewer is waiting.
    'waiting_place', (select 1 + (select count(*) from focus.gathering_reply w
                                   where w.gathering_id = g.id and w.answer = 'waiting' and w.replied_at < me.replied_at)
                        from focus.gathering_reply me
                       where me.gathering_id = g.id and me.user_id = p_viewer and me.answer = 'waiting'),
    'replies', focus.reply_sequence(g.id),
    'going', focus.gathering_count(g.id, 'going'),
    'maybe', focus.gathering_count(g.id, 'maybe'),
    'waiting', focus.gathering_count(g.id, 'waiting'),
    'server_now', now()
  )
$$;

create function focus.check_gathering_input(
  p_kind text, p_title text, p_description text, p_room_key text, p_starts_at timestamptz,
  p_minutes integer, p_capacity integer, p_approval_ref text
) returns void
language plpgsql stable set search_path = '' as $$
begin
  if p_kind is null or p_kind not in ('focus', 'games', 'talk', 'meeting') then
    raise exception 'invalid kind' using errcode = '22023', hint = 'invalid_kind';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 60 then
    raise exception 'invalid title' using errcode = '22023', hint = 'invalid_title';
  end if;
  if p_description is not null and char_length(p_description) > 280 then
    raise exception 'description too long' using errcode = '22023', hint = 'invalid_description';
  end if;
  if p_starts_at is null or p_starts_at < now() - interval '5 minutes' or p_starts_at > now() + interval '90 days' then
    raise exception 'start out of range' using errcode = '22023', hint = 'invalid_time';
  end if;
  if p_minutes is null or p_minutes not between 25 and 360 then
    raise exception 'length out of range' using errcode = '22023', hint = 'invalid_length';
  end if;
  if p_capacity is null or p_capacity not between 13 and 300 then
    raise exception 'capacity is 13 to 300' using errcode = '22023', hint = 'invalid_capacity';
  end if;
  if p_approval_ref is null or char_length(btrim(p_approval_ref)) not between 2 and 60 then
    raise exception 'room approval needed' using errcode = '22023', hint = 'needs_approval';
  end if;
  if p_room_key is null or not exists (select 1 from focus.room r where r.room_key = p_room_key and r.active) then
    raise exception 'unknown room' using errcode = '22023', hint = 'unknown_room';
  end if;
end $$;

-- After a going reply leaves, the first on the waiting list moves up.
create function focus.promote_waiting(p_gathering uuid) returns void
language plpgsql set search_path = '' as $$
declare
  cap integer := (select g.capacity from focus.gathering g where g.id = p_gathering);
  next_user uuid;
begin
  while focus.gathering_count(p_gathering, 'going') < cap loop
    select r.user_id into next_user from focus.gathering_reply r
     where r.gathering_id = p_gathering and r.answer = 'waiting'
     order by r.replied_at limit 1;
    exit when next_user is null;
    update focus.gathering_reply r set answer = 'going', replied_at = clock_timestamp(), updated_at = now()
     where r.gathering_id = p_gathering and r.user_id = next_user;
    next_user := null;
  end loop;
end $$;

revoke all on function
  focus.active_org(text), focus.is_organizer(uuid, uuid), focus.new_gathering_link(),
  focus.find_gathering(text), focus.reply_sequence(uuid), focus.gathering_count(uuid, text),
  focus.gathering_json(focus.gathering, uuid),
  focus.check_gathering_input(text, text, text, text, timestamptz, integer, integer, text),
  focus.promote_waiting(uuid)
from public, anon, authenticated;

-- ── Registry ────────────────────────────────────────────────────────────

-- A signed-in student starts a request; the app then opens the registry
-- issue form with its number. Nothing personal goes into the issue.
create function public.request_organization(
  p_name text, p_slug text, p_description text default null, p_website text default null, p_support_url text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  v_slug text := lower(btrim(p_slug));
  saved focus.org_request;
begin
  perform focus.require_identity(uid);
  if v_slug is null or v_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$' then
    raise exception 'invalid slug' using errcode = '22023', hint = 'invalid_slug';
  end if;
  if exists (select 1 from focus.organization o where o.slug = v_slug)
     or exists (select 1 from focus.org_request r where r.slug = v_slug and r.status in ('waiting_proof', 'in_review', 'needs_info')) then
    raise exception 'slug taken' using errcode = '23505', hint = 'slug_taken';
  end if;
  if (select count(*) from focus.org_request r
       where r.applicant = uid and r.status in ('waiting_proof', 'in_review', 'needs_info')) >= 2 then
    raise exception 'too many open requests' using errcode = '22023', hint = 'request_limit';
  end if;
  insert into focus.org_request (applicant, slug, name, description, website, support_url)
  values (uid, v_slug, btrim(p_name), nullif(btrim(p_description), ''), nullif(btrim(p_website), ''), nullif(btrim(p_support_url), ''))
  returning * into saved;
  return jsonb_build_object('no', saved.no, 'slug', saved.slug, 'name', saved.name, 'status', saved.status);
end $$;

-- The registry workflow only (service role): set a request's status from its
-- issue labels. Approved creates the verified organization with the applicant
-- as lead; revoked takes the verification away.
create function public.registry_set_status(p_no integer, p_status text, p_issue integer default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  req focus.org_request;
  org focus.organization;
begin
  select * into req from focus.org_request r where r.no = p_no for update;
  if req.no is null then
    raise exception 'request not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if p_status not in ('waiting_proof', 'in_review', 'needs_info', 'approved', 'declined', 'revoked') then
    raise exception 'invalid status' using errcode = '22023', hint = 'invalid_status';
  end if;
  if p_status = 'approved' and req.org_id is null then
    insert into focus.organization (slug, name, description, website, support_url, verified_at)
    values (req.slug, req.name, req.description, req.website, req.support_url, now())
    on conflict (slug) do update set verified_at = coalesce(focus.organization.verified_at, now()), revoked_at = null
    returning * into org;
    insert into focus.org_member (org_id, user_id, role) values (org.id, req.applicant, 'lead')
    on conflict (org_id, user_id) do update set role = 'lead';
    req.org_id := org.id;
  elsif p_status = 'approved' then
    update focus.organization o set revoked_at = null, verified_at = coalesce(o.verified_at, now()) where o.id = req.org_id;
  elsif p_status = 'revoked' and req.org_id is not null then
    update focus.organization o set revoked_at = now() where o.id = req.org_id;
  end if;
  update focus.org_request r
     set status = p_status, issue_number = coalesce(p_issue, r.issue_number), org_id = req.org_id, updated_at = now()
   where r.no = p_no
  returning * into req;
  return jsonb_build_object('no', req.no, 'slug', req.slug, 'status', req.status, 'org_id', req.org_id);
end $$;

-- The caller's requests and the groups they organize for.
create function public.my_organizations() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'requests', coalesce((select jsonb_agg(jsonb_build_object('no', r.no, 'slug', r.slug, 'name', r.name,
                  'status', r.status, 'issue_number', r.issue_number) order by r.no desc)
                from focus.org_request r where r.applicant = focus.require_user()), '[]'::jsonb),
    'groups', coalesce((select jsonb_agg(jsonb_build_object('slug', o.slug, 'name', o.name, 'role', m.role,
                  'verified', o.verified_at is not null and o.revoked_at is null) order by o.name)
                from focus.org_member m join focus.organization o on o.id = m.org_id
               where m.user_id = focus.require_user()), '[]'::jsonb)
  )
$$;

-- Anyone: a group's public page with its upcoming gatherings.
create function public.get_organization(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', o.slug, 'name', o.name, 'description', o.description, 'website', o.website,
    'support_url', o.support_url, 'verified', o.verified_at is not null and o.revoked_at is null,
    'is_organizer', focus.is_organizer(o.id, auth.uid()),
    'gatherings', coalesce((select jsonb_agg(focus.gathering_json(g, auth.uid()) order by g.starts_at)
                    from focus.gathering g
                   where g.org_id = o.id and g.ends_at > now() and g.cancelled_at is null), '[]'::jsonb)
  )
  from focus.organization o where o.slug = lower(btrim(p_slug))
$$;

-- Leads share an organizer link, valid 7 days.
create function public.create_organizer_invite(p_slug text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  org focus.organization := focus.active_org(p_slug);
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  bytes bytea := uuid_send(gen_random_uuid());
  token text := '';
begin
  if org.id is null or not exists (select 1 from focus.org_member m where m.org_id = org.id and m.user_id = uid and m.role = 'lead') then
    raise exception 'not a lead of this group' using errcode = '42501', hint = 'not_lead';
  end if;
  for i in 0..15 loop
    token := token || substr(alphabet, (get_byte(bytes, i) % 56) + 1, 1);
  end loop;
  insert into focus.org_invite (token, org_id, created_by, expires_at) values (token, org.id, uid, now() + interval '7 days');
  return jsonb_build_object('token', token, 'expires_at', now() + interval '7 days');
end $$;

create function public.join_organization(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  inv focus.org_invite;
  org focus.organization;
begin
  perform focus.require_identity(uid);
  select * into inv from focus.org_invite i where i.token = p_token and i.expires_at > now();
  if inv.token is null then
    raise exception 'invite not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  select * into org from focus.organization o where o.id = inv.org_id and o.verified_at is not null and o.revoked_at is null;
  if org.id is null then
    raise exception 'group not verified' using errcode = '22023', hint = 'not_verified';
  end if;
  insert into focus.org_member (org_id, user_id, role) values (org.id, uid, 'organizer') on conflict do nothing;
  return jsonb_build_object('slug', org.slug, 'name', org.name);
end $$;

-- ── Gatherings ──────────────────────────────────────────────────────────

create function public.set_gathering(
  p_slug text, p_kind text, p_title text, p_description text, p_room_key text,
  p_starts_at timestamptz, p_minutes integer, p_capacity integer, p_approval_ref text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  org focus.organization := focus.active_org(p_slug);
  saved focus.gathering;
begin
  if org.id is null then
    raise exception 'group not verified' using errcode = '22023', hint = 'not_verified';
  end if;
  if not focus.is_organizer(org.id, uid) then
    raise exception 'not an organizer' using errcode = '42501', hint = 'not_organizer';
  end if;
  perform focus.check_gathering_input(p_kind, p_title, p_description, p_room_key, p_starts_at, p_minutes, p_capacity, p_approval_ref);
  if exists (select 1 from focus.gathering g
              where g.room_key = p_room_key and g.cancelled_at is null
                and g.starts_at < p_starts_at + make_interval(mins => p_minutes) and g.ends_at > p_starts_at) then
    raise exception 'another gathering is in this room then' using errcode = '22023', hint = 'room_taken';
  end if;
  insert into focus.gathering (link, org_id, created_by, kind, title, description, room_key, starts_at, ends_at, capacity, approval_ref)
  values (focus.new_gathering_link(), org.id, uid, p_kind, btrim(p_title), nullif(btrim(p_description), ''), p_room_key,
          p_starts_at, p_starts_at + make_interval(mins => p_minutes), p_capacity, btrim(p_approval_ref))
  returning * into saved;
  return focus.gathering_json(saved, uid);
end $$;

create function public.change_gathering(
  p_link text, p_expected_version integer, p_kind text, p_title text, p_description text, p_room_key text,
  p_starts_at timestamptz, p_minutes integer, p_capacity integer, p_approval_ref text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.gathering := focus.find_gathering(p_link);
  saved focus.gathering;
begin
  if cur.id is null or not focus.is_organizer(cur.org_id, uid) then
    raise exception 'gathering not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if cur.cancelled_at is not null or cur.ends_at <= now() then
    raise exception 'gathering is closed' using errcode = '22023', hint = 'gathering_closed';
  end if;
  if cur.version <> p_expected_version then
    raise exception 'changed elsewhere' using errcode = '40001', hint = 'stale_version';
  end if;
  perform focus.check_gathering_input(p_kind, p_title, p_description, p_room_key, p_starts_at, p_minutes, p_capacity, p_approval_ref);
  if p_capacity < focus.gathering_count(cur.id, 'going') then
    raise exception 'more people are going' using errcode = '22023', hint = 'capacity_taken';
  end if;
  update focus.gathering g
     set kind = p_kind, title = btrim(p_title), description = nullif(btrim(p_description), ''), room_key = p_room_key,
         starts_at = p_starts_at, ends_at = p_starts_at + make_interval(mins => p_minutes), capacity = p_capacity,
         approval_ref = btrim(p_approval_ref), version = g.version + 1, updated_at = now()
   where g.id = cur.id
  returning * into saved;
  perform focus.promote_waiting(saved.id);
  return focus.gathering_json(saved, uid);
end $$;

create function public.cancel_gathering(p_link text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.gathering := focus.find_gathering(p_link);
  saved focus.gathering;
begin
  if cur.id is null or not focus.is_organizer(cur.org_id, uid) then
    raise exception 'gathering not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  update focus.gathering g set cancelled_at = coalesce(g.cancelled_at, now()), version = g.version + 1, updated_at = now()
   where g.id = cur.id
  returning * into saved;
  return focus.gathering_json(saved, uid);
end $$;

create function public.get_gathering(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  cur focus.gathering := focus.find_gathering(p_link);
begin
  if cur.id is null then return null; end if;
  return focus.gathering_json(cur, auth.uid());
end $$;

-- Link previews: the picture's data and public fields, no names.
create function public.gathering_preview(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  cur focus.gathering := focus.find_gathering(p_link);
begin
  if cur.id is null then return null; end if;
  return jsonb_build_object(
    'kind', cur.kind, 'title', cur.title,
    'org_name', (select o.name from focus.organization o where o.id = cur.org_id),
    'room_code', (select r.code from focus.room r where r.room_key = cur.room_key),
    'starts_at', cur.starts_at, 'ends_at', cur.ends_at, 'capacity', cur.capacity,
    'replies', focus.reply_sequence(cur.id), 'cancelled', cur.cancelled_at is not null
  );
end $$;

-- p_answer: 'going', 'maybe' or 'no'. Replying shares name, programme and
-- batch with the group's organizers, so it needs p_consent. A full gathering
-- puts new Going replies on the waiting list; 'no' removes the reply.
create function public.reply_gathering(p_link text, p_answer text, p_consent boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.gathering := focus.find_gathering(p_link);
  had text;
  target text := p_answer;
begin
  if cur.id is null then
    raise exception 'gathering not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if cur.cancelled_at is not null or cur.ends_at <= now()
     or not exists (select 1 from focus.organization o where o.id = cur.org_id and o.verified_at is not null and o.revoked_at is null) then
    raise exception 'gathering is closed' using errcode = '22023', hint = 'gathering_closed';
  end if;
  if p_answer is null or p_answer not in ('going', 'maybe', 'no') then
    raise exception 'invalid answer' using errcode = '22023', hint = 'invalid_answer';
  end if;
  perform focus.require_identity(uid);
  perform 1 from focus.gathering g where g.id = cur.id for update;
  select r.answer into had from focus.gathering_reply r where r.gathering_id = cur.id and r.user_id = uid;
  if p_answer = 'no' then
    delete from focus.gathering_reply r where r.gathering_id = cur.id and r.user_id = uid;
    if had = 'going' then perform focus.promote_waiting(cur.id); end if;
    return focus.gathering_json(cur, uid);
  end if;
  if not coalesce(p_consent, false) then
    raise exception 'consent needed' using errcode = '22023', hint = 'needs_consent';
  end if;
  if p_answer = 'going' and coalesce(had, '') <> 'going' and focus.gathering_count(cur.id, 'going') >= cur.capacity then
    target := 'waiting';
  end if;
  insert into focus.gathering_reply (gathering_id, user_id, answer)
  values (cur.id, uid, target)
  on conflict (gathering_id, user_id) do update
     set answer = excluded.answer,
         -- Joining or leaving the waiting list starts a new place in line.
         replied_at = case when focus.gathering_reply.answer = 'waiting' or excluded.answer = 'waiting'
                           then clock_timestamp() else focus.gathering_reply.replied_at end,
         updated_at = now();
  if had = 'going' and target <> 'going' then perform focus.promote_waiting(cur.id); end if;
  return focus.gathering_json(cur, uid);
end $$;

-- Organizers only: who replied, with the name, programme and batch they
-- agreed to share, in reply order. No email addresses.
create function public.gathering_people(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.gathering := focus.find_gathering(p_link);
begin
  if cur.id is null or not focus.is_organizer(cur.org_id, uid) then
    raise exception 'gathering not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'name', i.display_name, 'programme', p.code, 'intake_year', i.intake_year, 'intake_term', i.intake_term,
             'answer', r.answer, 'replied_at', r.replied_at) order by r.replied_at)
      from focus.gathering_reply r
      join focus.identity i on i.user_id = r.user_id
      left join focus.programme p on p.id = i.programme_id
     where r.gathering_id = cur.id), '[]'::jsonb);
end $$;

-- The caller's gatherings: ones they replied to and ones their groups host.
create function public.my_gatherings() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(focus.gathering_json(g, focus.require_user()) order by g.starts_at), '[]'::jsonb)
    from focus.gathering g
   where g.ends_at > now()
     and (focus.is_organizer(g.org_id, focus.require_user())
          or exists (select 1 from focus.gathering_reply r where r.gathering_id = g.id and r.user_id = focus.require_user()))
$$;

-- Anyone: gatherings in a room on a day, so the room shows as taken.
create function public.room_gatherings(p_room_key text, p_from timestamptz, p_to timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'link', g.link, 'kind', g.kind, 'title', g.title, 'starts_at', g.starts_at, 'ends_at', g.ends_at,
           'org_name', (select o.name from focus.organization o where o.id = g.org_id)) order by g.starts_at), '[]'::jsonb)
    from focus.gathering g
   where g.room_key = p_room_key and g.cancelled_at is null
     and g.starts_at < p_to and g.ends_at > p_from
     and p_to - p_from <= interval '15 days'
$$;

-- ── Retention ───────────────────────────────────────────────────────────
create or replace function focus.cleanup() returns void
language plpgsql set search_path = '' as $$
begin
  perform focus.close_stale(null);
  delete from focus.session s where s.ended_at < now() - interval '24 hours';
  delete from focus.study_table t where t.ends_at < now() - interval '24 hours';
  delete from focus.gathering g where g.ends_at < now() - interval '30 days';
  delete from focus.org_invite i where i.expires_at < now();
end $$;
revoke all on function focus.cleanup() from public, anon, authenticated;

-- ── Grants ──────────────────────────────────────────────────────────────
revoke all on function
  public.request_organization(text, text, text, text, text),
  public.registry_set_status(integer, text, integer),
  public.my_organizations(),
  public.get_organization(text),
  public.create_organizer_invite(text),
  public.join_organization(text),
  public.set_gathering(text, text, text, text, text, timestamptz, integer, integer, text),
  public.change_gathering(text, integer, text, text, text, text, timestamptz, integer, integer, text),
  public.cancel_gathering(text),
  public.get_gathering(text),
  public.gathering_preview(text),
  public.reply_gathering(text, text, boolean),
  public.gathering_people(text),
  public.my_gatherings(),
  public.room_gatherings(text, timestamptz, timestamptz)
from public, anon, authenticated;

grant execute on function
  public.get_organization(text), public.get_gathering(text), public.gathering_preview(text),
  public.room_gatherings(text, timestamptz, timestamptz)
to anon, authenticated;
grant execute on function
  public.request_organization(text, text, text, text, text),
  public.my_organizations(),
  public.create_organizer_invite(text),
  public.join_organization(text),
  public.set_gathering(text, text, text, text, text, timestamptz, integer, integer, text),
  public.change_gathering(text, integer, text, text, text, text, timestamptz, integer, integer, text),
  public.cancel_gathering(text),
  public.reply_gathering(text, text, boolean),
  public.gathering_people(text),
  public.my_gatherings()
to authenticated;
grant execute on function public.registry_set_status(integer, text, integer) to service_role;
