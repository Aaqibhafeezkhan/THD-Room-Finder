-- Saved rooms on the signed-in student's account (ADR 0013). Amends the
-- "favorites remain local" line of ADR 0001 for signed-in students; signed
-- out, saved rooms stay on the device. One row per saved room and nothing
-- else: no timestamps, no record of removals. Same boundary as the rest of
-- the service: a private table with RLS and no policies, reached only through
-- a SECURITY DEFINER function that takes the user from auth.uid().

create table focus.saved_room (
  user_id uuid not null references auth.users (id) on delete cascade,
  room_ident text not null check (char_length(room_ident) between 1 and 64),
  primary key (user_id, room_ident)
);
alter table focus.saved_room enable row level security;

-- Applies this device's changes and returns the caller's saved rooms, all in
-- one call: with nothing to change it is a plain read. Removing a room that
-- isn't saved and adding one that is are no-ops, so a retry is safe. Malformed
-- identifiers are skipped. Going over the limit changes nothing.
create function public.sync_saved_rooms(p_add text[] default '{}', p_remove text[] default '{}')
returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
begin
  if coalesce(cardinality(p_add), 0) > 1000 or coalesce(cardinality(p_remove), 0) > 1000 then
    raise exception 'at most 1000 rooms per call' using errcode = '22023', hint = 'too_many_rooms';
  end if;

  delete from focus.saved_room s
   where s.user_id = uid and s.room_ident = any (coalesce(p_remove, '{}'));

  insert into focus.saved_room (user_id, room_ident)
  select distinct uid, r
    from unnest(coalesce(p_add, '{}')) r
   where char_length(r) between 1 and 64
  on conflict (user_id, room_ident) do nothing;

  if (select count(*) from focus.saved_room s where s.user_id = uid) > 1000 then
    raise exception 'too many saved rooms' using errcode = '53400', hint = 'saved_rooms_full';
  end if;

  return coalesce((
    select array_agg(s.room_ident order by s.room_ident)
      from focus.saved_room s
     where s.user_id = uid
  ), '{}');
end $$;

revoke all on function public.sync_saved_rooms(text[], text[]) from public, anon, authenticated;
grant execute on function public.sync_saved_rooms(text[], text[]) to authenticated;
