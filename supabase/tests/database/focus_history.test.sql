-- Focus history sync contract tests (pgTAP, ADR 0005). Run: npx supabase test db
-- Uses the synthetic people from supabase/seed.sql, each acting with their
-- own JWT as a direct API call would.
begin;
select plan(17);

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

create temp table t (k text primary key, v jsonb);
grant all on t to anon, authenticated;

-- ── Only the owner, only through the functions ────────────────────────
select pg_temp.act_as(null);
select throws_ok($$select public.put_focus_history('[]')$$, '42501', null, 'signed out: cannot upload history');
select throws_ok($$select public.get_focus_history()$$, '42501', null, 'signed out: cannot read history');

select pg_temp.act_as('lena@example.test');
select throws_ok($$select * from focus.history$$, '42501', null, 'signed in: history table is not reachable');

select is(public.put_focus_history($$[
  {"id": "a1", "started_at": "2026-10-13T08:00:00Z", "ended_at": "2026-10-13T08:55:00Z", "minutes": 50, "room": "E 212"},
  {"id": "a2", "started_at": "2026-10-14T13:00:00Z", "ended_at": "2026-10-14T13:25:00Z", "minutes": 25}
]$$), 2, 'owner: two new entries are stored');
select is(public.put_focus_history($$[
  {"id": "a1", "started_at": "2026-10-13T08:00:00Z", "ended_at": "2026-10-13T08:55:00Z", "minutes": 50}
]$$), 0, 'uploading the same entry again adds nothing');
select is(public.put_focus_history($$[
  {"id": "bad1", "started_at": "2026-10-13T08:00:00Z", "ended_at": "2026-10-13T08:55:00Z", "minutes": 0},
  {"id": "bad2", "started_at": "2026-10-13T09:00:00Z", "ended_at": "2026-10-13T08:00:00Z", "minutes": 20},
  {"id": "bad3", "started_at": "2030-01-01T09:00:00Z", "ended_at": "2030-01-01T10:00:00Z", "minutes": 20},
  "not an object"
]$$), 0, 'malformed, backwards and future entries are skipped');
select throws_ok($$select public.put_focus_history((select jsonb_agg(jsonb_build_object('id', 'x' || g,
  'started_at', '2026-10-13T08:00:00Z', 'ended_at', '2026-10-13T08:30:00Z', 'minutes', 25)) from generate_series(1, 501) g))$$,
  '22023', null, 'more than 500 entries per call are refused');

insert into t values ('lena', public.get_focus_history());
select is(jsonb_array_length((select v->'entries' from t where k = 'lena')), 2, 'owner: reads back both entries');
select is((select v->'entries'->0->>'minutes' from t where k = 'lena'), '50', 'owner: minutes come back as stored');
select ok(not (select v->'entries'->0 ? 'room' from t where k = 'lena'), 'room codes are never stored');
select is(jsonb_array_length(public.get_focus_history((select (v->>'server_now')::timestamptz from t where k = 'lena'))->'entries'), 0,
  'since the last read: nothing new');

select pg_temp.act_as('max@example.test');
select is(jsonb_array_length(public.get_focus_history()->'entries'), 0, 'another student sees none of it');
select is(public.clear_focus_history(), 0, 'another student cannot clear it');

-- ── Without a study profile, history still syncs (it is the account's) ─
select pg_temp.act_as('sam@example.test');
select is(public.put_focus_history($$[
  {"id": "s1", "started_at": "2026-10-14T10:00:00Z", "ended_at": "2026-10-14T10:25:00Z", "minutes": 25}
]$$), 1, 'signed in without a study profile: history syncs');

-- ── Clearing and deleting the account ──────────────────────────────────
select pg_temp.act_as('lena@example.test');
select is(public.clear_focus_history(), 2, 'owner: clearing removes every entry');
select is(jsonb_array_length(public.get_focus_history()->'entries'), 0, 'owner: nothing left after clearing');

select pg_temp.act_as('sam@example.test');
select public.delete_identity();
reset role;
select is((select count(*)::int from focus.history h join auth.users u on u.id = h.user_id where u.email = 'sam@example.test'), 0,
  'deleting the account deletes its history');

select * from finish();
rollback;
