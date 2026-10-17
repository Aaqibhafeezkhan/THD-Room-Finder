-- Focus history across a student's devices (ADR 0005, issue #89).
-- Supersedes the "server keeps no completed history" note in
-- 20261014190000_focus_service.sql for signed-in students: finished
-- sessions are kept as id, start, end and focus minutes. Room codes, breaks,
-- away time and batch never reach the server. Same boundary as the rest of
-- the service: a private table with RLS and no policies, reached only
-- through SECURITY DEFINER functions that take the user from auth.uid().

create table focus.history (
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id text not null check (char_length(entry_id) between 1 and 64),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  minutes smallint not null check (minutes between 1 and 180),
  synced_at timestamptz not null default now(),
  primary key (user_id, entry_id),
  constraint history_ends_after_start check (ended_at >= started_at)
);
create index history_user_synced_idx on focus.history (user_id, synced_at);
alter table focus.history enable row level security;

-- Adds the caller's entries; ones already stored (same id) are left as they
-- are, so uploads and imports never double count. Malformed entries are
-- skipped. Returns how many were new.
create function public.put_focus_history(p_entries jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  stored integer;
  added integer;
begin
  if jsonb_typeof(p_entries) is distinct from 'array' then
    raise exception 'entries must be an array' using errcode = '22023', hint = 'invalid_history';
  end if;
  if jsonb_array_length(p_entries) > 500 then
    raise exception 'at most 500 entries per call' using errcode = '22023', hint = 'too_many_entries';
  end if;
  select count(*) into stored from focus.history h where h.user_id = uid;
  if stored >= 5000 then
    raise exception 'history is full' using errcode = '53400', hint = 'history_full';
  end if;

  with incoming as (
    select e->>'id' as entry_id,
           (e->>'started_at')::timestamptz as started_at,
           (e->>'ended_at')::timestamptz as ended_at,
           (e->>'minutes')::smallint as minutes
      from jsonb_array_elements(p_entries) e
     where jsonb_typeof(e) = 'object'
       and e->>'id' is not null and char_length(e->>'id') between 1 and 64
       and e->>'started_at' ~ '^\d{4}-\d{2}-\d{2}T'
       and e->>'ended_at' ~ '^\d{4}-\d{2}-\d{2}T'
       and e->>'minutes' ~ '^\d{1,3}$'
  )
  insert into focus.history (user_id, entry_id, started_at, ended_at, minutes)
  select uid, i.entry_id, i.started_at, i.ended_at, i.minutes
    from incoming i
   where i.minutes between 1 and 180
     and i.ended_at >= i.started_at
     and i.started_at > timestamptz '2020-01-01'
     and i.started_at < now() + interval '1 day'
   limit greatest(0, 5000 - stored)
  on conflict (user_id, entry_id) do nothing;
  get diagnostics added = row_count;
  return added;
end $$;

-- The caller's entries stored after p_since (all when null), oldest first,
-- with the server time to pass as p_since next time.
create function public.get_focus_history(p_since timestamptz default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'server_now', now(),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', h.entry_id, 'started_at', h.started_at, 'ended_at', h.ended_at, 'minutes', h.minutes)
             order by h.synced_at, h.entry_id)
        from focus.history h
       where h.user_id = focus.require_user()
         and (p_since is null or h.synced_at > p_since)
    ), '[]'::jsonb))
$$;

-- Removes the caller's whole history; returns how many entries went.
create function public.clear_focus_history() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  removed integer;
begin
  delete from focus.history h where h.user_id = uid;
  get diagnostics removed = row_count;
  return removed;
end $$;

revoke all on function
  public.put_focus_history(jsonb),
  public.get_focus_history(timestamptz),
  public.clear_focus_history()
from public, anon, authenticated;
grant execute on function
  public.put_focus_history(jsonb),
  public.get_focus_history(timestamptz),
  public.clear_focus_history()
to authenticated;
