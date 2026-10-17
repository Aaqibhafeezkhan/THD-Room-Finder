-- Focus rhythm (ADR 0004): a session is a rhythm of focus blocks and breaks
-- laid out from an anchor time. The server stores the rhythm so that
--   * the lease follows it: focus + break + 10 minutes from each renewal,
--     so a forgotten session drops its claim at the same point the device
--     ends it (after a break nobody confirmed), and
--   * Join can adopt the batch's rhythm and anchor, so breaks line up.
-- A claim also needs a study profile now: without one, focus stays on the
-- device and nothing reaches this service.
-- The new start_focus arguments have defaults matching the old behaviour
-- (one 60-minute block, no breaks), so older clients keep working.

alter table focus.session
  add column focus_minutes smallint not null default 60 check (focus_minutes between 5 and 120),
  add column break_minutes smallint not null default 0 check (break_minutes between 0 and 30),
  add column long_break_minutes smallint not null default 0 check (long_break_minutes between 0 and 30),
  add column long_every smallint not null default 0 check (long_every between 0 and 8),
  add column anchor_at timestamptz;
update focus.session set anchor_at = started_at where anchor_at is null;
alter table focus.session
  alter column anchor_at set not null,
  add constraint session_anchor_recent check (anchor_at <= started_at and anchor_at >= started_at - interval '3 hours');

-- How long a claim lasts without a renewal: one block, the longest break and
-- 10 minutes to confirm the next block.
create function focus.lease_for(s focus.session) returns interval
language sql immutable set search_path = '' as $$
  select make_interval(mins => s.focus_minutes + greatest(s.break_minutes, s.long_break_minutes) + 10)
$$;
revoke all on function focus.lease_for(focus.session) from public, anon, authenticated;
drop function focus.lease();

create or replace function focus.rhythm_json(s focus.session) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'focus_minutes', s.focus_minutes,
    'break_minutes', s.break_minutes,
    'long_break_minutes', s.long_break_minutes,
    'long_every', s.long_every,
    'anchor_at', s.anchor_at
  )
$$;
revoke all on function focus.rhythm_json(focus.session) from public, anon, authenticated;

create or replace function focus.session_json(s focus.session) returns jsonb
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
    'rhythm', focus.rhythm_json(s),
    'server_now', now()
  )
$$;

drop function public.start_focus(text, integer, text, boolean, uuid, boolean);

-- Start a session. The client lays out the plan (until the next lecture,
-- never ending on a break) and sends its length and rhythm; the server caps
-- it at 3 hours and sets the first lease from the rhythm. p_anchor_at is
-- when the rhythm started: now, or a batch session's anchor when joining.
create function public.start_focus(
  p_room_key text,
  p_planned_minutes integer,
  p_visibility text,
  p_show_name boolean,
  p_request_id uuid,
  p_replace boolean default false,
  p_focus_minutes integer default 60,
  p_break_minutes integer default 0,
  p_long_break_minutes integer default 0,
  p_long_every integer default 0,
  p_anchor_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  me focus.identity;
  s focus.session;
  starts_last_hour integer;
  anchor timestamptz := coalesce(p_anchor_at, now());
begin
  if p_request_id is null then
    raise exception 'request id required' using errcode = '22023', hint = 'invalid_request';
  end if;
  if p_planned_minutes is null or p_planned_minutes < 1 or p_planned_minutes > 180 then
    raise exception 'planned length must be 1 to 180 minutes' using errcode = '22023', hint = 'invalid_duration';
  end if;
  if p_focus_minutes is null or p_focus_minutes not between 5 and 120
     or p_break_minutes is null or p_break_minutes not between 0 and 30
     or p_long_break_minutes is null or p_long_break_minutes not between 0 and 30
     or p_long_every is null or p_long_every not between 0 and 8 then
    raise exception 'unknown rhythm' using errcode = '22023', hint = 'invalid_rhythm';
  end if;
  if anchor > now() or anchor < now() - interval '3 hours' then
    raise exception 'anchor must be within the last 3 hours' using errcode = '22023', hint = 'invalid_rhythm';
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
  if me.user_id is null then
    raise exception 'a claim needs a study profile' using errcode = '22023', hint = 'needs_profile';
  end if;
  if p_visibility = 'public' and me.programme_id is null then
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
    start_request_id, started_at, planned_end, lease_until, renewed_at,
    focus_minutes, break_minutes, long_break_minutes, long_every, anchor_at
  ) values (
    uid, p_room_key, p_visibility, coalesce(p_show_name, false) and p_visibility = 'public',
    me.programme_id, me.intake_year, me.intake_term,
    p_request_id, now(), now() + make_interval(mins => p_planned_minutes),
    least(now() + make_interval(mins => p_planned_minutes),
          now() + make_interval(mins => p_focus_minutes + greatest(p_break_minutes, p_long_break_minutes) + 10)),
    now(),
    p_focus_minutes, p_break_minutes, p_long_break_minutes, p_long_every, anchor
  ) returning * into s;
  return focus.session_json(s);
end $$;

-- Keep a session alive: the app is open or the next block was confirmed.
-- Never extends past the planned end and never revives an expired session.
create or replace function public.renew_focus(p_session_id uuid, p_expected_version integer)
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
     set lease_until = least(x.planned_end, now() + focus.lease_for(x)),
         renewed_at = now(),
         version = x.version + 1
   where x.id = s.id
  returning * into s;
  return focus.session_json(s);
end $$;

-- Room summaries gain the rhythm of the earliest Public session of the
-- viewer's batch, so Join can line up with it. Only batchmates get it.
drop function public.room_summaries(text);
create function public.room_summaries(p_campus text)
returns table (
  room_key text,
  claims integer,
  claim_since timestamptz,
  batch_count integer,
  batch_since timestamptz,
  batch_names text[],
  batch_rhythm jsonb,
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
         (array_agg(jsonb_build_object(
            'focus_minutes', l.focus_minutes,
            'break_minutes', l.break_minutes,
            'long_break_minutes', l.long_break_minutes,
            'long_every', l.long_every,
            'anchor_at', l.anchor_at) order by l.started_at) filter (where l.is_batch))[1],
         bool_or(l.is_own),
         min(least(l.lease_until, l.planned_end)),
         now()
    from live l
    left join focus.identity i on i.user_id = l.user_id
   group by l.room_key
   order by l.room_key
   limit 500
$$;

-- ── Grants ──────────────────────────────────────────────────────────────
revoke all on function
  public.start_focus(text, integer, text, boolean, uuid, boolean, integer, integer, integer, integer, timestamptz),
  public.room_summaries(text)
from public, anon, authenticated;
grant execute on function public.room_summaries(text) to anon, authenticated;
grant execute on function
  public.start_focus(text, integer, text, boolean, uuid, boolean, integer, integer, integer, integer, timestamptz)
to authenticated;
