-- A running focus session becomes a study table (#153, ADR 0010).
-- The table is already in progress: it starts at the session's rhythm anchor,
-- so guests who start together line up with the host's blocks and breaks,
-- and ends at the session's planned end. The host's session is not touched.
-- Retries with the same request id, and a second conversion of the same
-- shared session, return the table that already exists.

alter table focus.study_table
  add column request_id uuid,
  add column session_id uuid references focus.session (id) on delete set null;
create unique index study_table_request_idx on focus.study_table (host, request_id) where request_id is not null;
create unique index study_table_session_idx on focus.study_table (session_id) where session_id is not null;

create function public.table_from_session(
  p_request_id uuid,
  p_topic text,
  p_room_key text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_seats integer,
  p_focus_minutes integer,
  p_break_minutes integer,
  p_long_break_minutes integer default 0,
  p_long_every integer default 0,
  p_session_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  saved focus.study_table;
  sess focus.session;
  remaining integer;
begin
  perform focus.require_identity(uid);
  if p_request_id is null then
    raise exception 'a request id is required' using errcode = '22023', hint = 'invalid_request';
  end if;
  select * into saved from focus.study_table t where t.host = uid and t.request_id = p_request_id;
  if saved.id is not null then
    return focus.table_json(saved, uid);
  end if;

  if p_session_id is not null then
    select * into sess from focus.session s where s.id = p_session_id and s.user_id = uid;
    if sess.id is null or sess.ended_at is not null then
      raise exception 'session is not running' using errcode = '22023', hint = 'not_active';
    end if;
    if sess.room_key <> p_room_key then
      raise exception 'session is in another room' using errcode = '22023', hint = 'unknown_room';
    end if;
    select * into saved from focus.study_table t where t.session_id = p_session_id;
    if saved.id is not null then
      return focus.table_json(saved, uid);
    end if;
    -- The table can't outlast or predate the session (a minute for clocks).
    if p_starts_at < sess.anchor_at - interval '1 minute' or p_ends_at > sess.planned_end + interval '1 minute' then
      raise exception 'table is outside the session' using errcode = '22023', hint = 'invalid_time';
    end if;
  end if;

  if p_seats is null or p_seats < 2 then
    raise exception 'inviting needs at least 2 seats' using errcode = '22023', hint = 'invalid_seats';
  end if;
  if p_starts_at is null or p_starts_at > now() + interval '1 minute' or p_starts_at < now() - interval '3 hours' then
    raise exception 'a converted table starts with the session' using errcode = '22023', hint = 'invalid_time';
  end if;
  -- Others need time to come: 25 minutes left, one minute for clocks.
  if p_ends_at is null or p_ends_at < now() + interval '24 minutes' then
    raise exception 'too little time left' using errcode = '22023', hint = 'too_short';
  end if;
  if p_ends_at > p_starts_at + interval '3 hours' then
    raise exception 'table length out of range' using errcode = '22023', hint = 'invalid_length';
  end if;
  remaining := greatest(25, ceil(extract(epoch from p_ends_at - now()) / 60))::integer;
  perform focus.check_table_input(p_topic, p_room_key, now(), remaining, p_seats, p_focus_minutes, p_break_minutes);
  if (select count(*) from focus.study_table t
       where t.host = uid and t.ends_at > now() and t.cancelled_at is null) >= 5 then
    raise exception 'too many upcoming tables' using errcode = '22023', hint = 'table_limit';
  end if;

  insert into focus.study_table (link, host, topic, room_key, starts_at, ends_at, seats,
                                 focus_minutes, break_minutes, long_break_minutes, long_every,
                                 host_show_name, request_id, session_id)
  values (focus.new_table_link(), uid, nullif(btrim(p_topic), ''), p_room_key, p_starts_at, p_ends_at, p_seats,
          p_focus_minutes, p_break_minutes, coalesce(p_long_break_minutes, 0), coalesce(p_long_every, 0),
          true, p_request_id, p_session_id)
  returning * into saved;
  return focus.table_json(saved, uid);
end $$;

revoke all on function
  public.table_from_session(uuid, text, text, timestamptz, timestamptz, integer, integer, integer, integer, integer, uuid)
from public, anon, authenticated;
grant execute on function
  public.table_from_session(uuid, text, text, timestamptz, timestamptz, integer, integer, integer, integer, integer, uuid)
to authenticated;
