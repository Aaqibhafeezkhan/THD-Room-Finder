-- Saved rooms contract tests (pgTAP, ADR 0013). Run: npx supabase test db
-- Uses the synthetic people from supabase/seed.sql, each acting with their
-- own JWT as a direct API call would.
begin;
select plan(18);

create function pg_temp.act_as(p_email text) returns void language plpgsql as $$
declare uid uuid;
begin
  reset role;
  if p_email is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    return;
  end if;
  select id into uid from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
grant execute on function pg_temp.act_as(text) to anon, authenticated;

-- ── Only the owner, only through the function ─────────────────────────
select pg_temp.act_as(null);
select throws_ok($$select public.sync_saved_rooms()$$, '42501', null, 'signed out: cannot read or write saved rooms');

select pg_temp.act_as('lena@example.test');
select throws_ok($$select * from focus.saved_room$$, '42501', null, 'signed in: the table is not reachable');
select throws_ok($$insert into focus.saved_room values (auth.uid(), 'r1')$$, '42501', null, 'signed in: the table is not writable');

reset role;
select ok((select relrowsecurity from pg_class where oid = 'focus.saved_room'::regclass), 'row level security is on');
select is((select count(*)::int from pg_policies where schemaname = 'focus' and tablename = 'saved_room'), 0,
  'no policy opens the table');
select is((select array_agg(column_name::text order by column_name) from information_schema.columns
            where table_schema = 'focus' and table_name = 'saved_room'),
  array['room_ident', 'user_id'], 'only the owner and the room are stored');

-- ── Adding, removing, reading ─────────────────────────────────────────
select pg_temp.act_as('lena@example.test');
select is(public.sync_saved_rooms(), '{}'::text[], 'a new account has no saved rooms');
select is(public.sync_saved_rooms(array['r2', 'r1', 'r1']), array['r1', 'r2'], 'adds rooms once and returns the list');
select is(public.sync_saved_rooms(array['r1']), array['r1', 'r2'], 'adding a saved room again changes nothing');
select is(public.sync_saved_rooms(), array['r1', 'r2'], 'with no changes it just reads');
select is(public.sync_saved_rooms('{}', array['r1', 'never-saved']), array['r2'], 'removes a room; an unknown one is ignored');
select is(public.sync_saved_rooms(array['', repeat('x', 65), null]), array['r2'], 'malformed identifiers are skipped');

select throws_ok($$select public.sync_saved_rooms((select array_agg('x' || g) from generate_series(1, 1001) g))$$,
  '22023', null, 'more than 1000 rooms per call are refused');
select public.sync_saved_rooms((select array_agg('y' || g) from generate_series(1, 999) g));
select throws_ok($$select public.sync_saved_rooms(array['z1', 'z2'])$$, '53400', null, 'an account holds at most 1000 rooms');
select is(cardinality(public.sync_saved_rooms()), 1000, 'going over the limit changes nothing');

-- ── Other students ────────────────────────────────────────────────────
select pg_temp.act_as('max@example.test');
select is(public.sync_saved_rooms('{}', array['r2']), '{}'::text[], 'another student neither sees nor removes them');
select pg_temp.act_as('lena@example.test');
select ok('r2' = any (public.sync_saved_rooms()), 'the owner still has the room');

-- ── Without a study profile, and deleting the account ─────────────────
select pg_temp.act_as('sam@example.test');
select public.sync_saved_rooms(array['s1']);
select public.delete_identity();
reset role;
select is((select count(*)::int from focus.saved_room r join auth.users u on u.id = r.user_id where u.email = 'sam@example.test'), 0,
  'deleting the account deletes its saved rooms');

select * from finish();
rollback;
