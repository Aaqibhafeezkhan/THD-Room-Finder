-- Focus service contract tests (pgTAP). Run: npx supabase test db
-- Uses the synthetic people from supabase/seed.sql. Each request is made
-- as that person's JWT, exactly as a direct API call would be.
begin;
select plan(39);

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

-- ── Nothing is reachable except through the functions ────────────────
select pg_temp.act_as(null);
select throws_ok($$select * from focus.session$$, '42501', null, 'signed out: session table is not reachable');
select throws_ok($$select public.start_focus('deggendorf:E 212', 60, 'private', false, gen_random_uuid())$$,
  '42501', null, 'signed out: cannot start a shared session');
select is((select count(*)::int from public.list_programmes()), 5, 'signed out: programme list is readable');

select pg_temp.act_as('lena@example.test');
select throws_ok($$select * from focus.identity$$, '42501', null, 'signed in: identity table is not reachable');
select throws_ok($$select focus.cleanup()$$, '42501', null, 'signed in: maintenance functions are not callable');

-- ── Who sees what (seed: Max public with name in A 008, Mia private in ITC 2.01)
select pg_temp.act_as(null);
select is((select claims from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), 1,
  'signed out: a public batch session is an anonymous claim');
select is((select batch_count from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), 0,
  'signed out: no batch signal');
select is((select batch_names from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), '{}'::text[],
  'signed out: no names');

select pg_temp.act_as('lena@example.test');
select is((select batch_count from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), 1,
  'same batch: sees the public session as a batch signal');
select is((select batch_names from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), '{Max}'::text[],
  'same batch: sees the name the student chose to show');
select is((select claims from public.room_summaries('deggendorf') where room_key = 'deggendorf:ITC 2.01'), 1,
  'same batch: another programme''s private session is a claim');

select pg_temp.act_as('jonas@example.test');
select is((select (claims, batch_count) from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008')::text, '(1,0)',
  'same programme, other intake: anonymous claim only');

select pg_temp.act_as('mia@example.test');
select is((select (claims, batch_count) from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008')::text, '(1,0)',
  'other programme: anonymous claim only');
select is((select own from public.room_summaries('deggendorf') where room_key = 'deggendorf:ITC 2.01'), true,
  'owner: sees their own session as own');
select is((select claims from public.room_summaries('deggendorf') where room_key = 'deggendorf:ITC 2.01'), 0,
  'owner: their own session is not counted as a claim');
select is((select count(*)::int from public.room_summaries('pfarrkirchen')), 0, 'summaries are per campus');

-- ── Starting ───────────────────────────────────────────────────────────
select pg_temp.act_as('lena@example.test');
select throws_ok($$select public.start_focus('deggendorf:E 212', 181, 'private', false, gen_random_uuid())$$,
  '22023', null, 'sessions are capped at 3 hours');
select throws_ok($$select public.start_focus('deggendorf:Z 999', 60, 'private', false, gen_random_uuid())$$,
  '22023', null, 'unknown rooms are rejected');

create temp table t (k text primary key, v jsonb);
grant all on t to authenticated, anon;
insert into t values ('start', public.start_focus('deggendorf:E 212', 240 / 2, 'private', true, '00000000-0000-4000-b000-000000000001'));
select is((select v->>'visibility' from t where k = 'start'), 'private', 'Private by default');
select is((select v->>'show_name' from t where k = 'start'), 'false', 'a name is never shown on a private session');
select is((select ((v->>'lease_until')::timestamptz - (v->>'started_at')::timestamptz) from t where k = 'start'),
  interval '60 minutes', 'the first lease is 60 minutes');
select is((public.start_focus('deggendorf:E 212', 120, 'private', false, '00000000-0000-4000-b000-000000000001'))->>'id',
  (select v->>'id' from t where k = 'start'), 'retrying the same request returns the same session');
select throws_ok($$select public.start_focus('deggendorf:J 213', 60, 'private', false, gen_random_uuid())$$,
  '23505', null, 'a second session needs an explicit replace');

select pg_temp.act_as('max@example.test');
select is((select claims from public.room_summaries('deggendorf') where room_key = 'deggendorf:E 212'), 1,
  'same batch: a private session is still only a claim');

-- ── Switching to Public ────────────────────────────────────────────────
select pg_temp.act_as('lena@example.test');
select throws_ok(format($$select public.update_focus(%L, 'public', false, 99)$$, (select v->>'id' from t where k = 'start')),
  '40001', null, 'a stale version is rejected');
insert into t values ('public', public.update_focus((select (v->>'id')::uuid from t where k = 'start'), 'public', false, 1));

select pg_temp.act_as('max@example.test');
select is((select (batch_count, batch_names) from public.room_summaries('deggendorf') where room_key = 'deggendorf:E 212')::text,
  '(1,{})', 'same batch: sees Lena public, without her name');
select pg_temp.act_as('mia@example.test');
select is((select (claims, batch_count) from public.room_summaries('deggendorf') where room_key = 'deggendorf:E 212')::text,
  '(1,0)', 'other programme: still an anonymous claim');

-- ── Renewing and ending ────────────────────────────────────────────────
select pg_temp.act_as('lena@example.test');
select lives_ok(format($$select public.renew_focus(%L, 2)$$, (select v->>'id' from t where k = 'start')),
  'renewing a running session works');
insert into t values ('end', public.end_focus((select (v->>'id')::uuid from t where k = 'start')));
select is((select v->>'end_reason' from t where k = 'end'), 'ended', 'End ends the session');
select is((public.end_focus((select (v->>'id')::uuid from t where k = 'start')))->>'end_reason', 'ended',
  'ending twice is harmless');
select throws_ok(format($$select public.renew_focus(%L, 3)$$, (select v->>'id' from t where k = 'start')),
  'P0002', null, 'an ended session cannot be renewed');

-- ── A forgotten session expires and stays expired ──────────────────────
select pg_temp.act_as('max@example.test');
reset role;
update focus.session set lease_until = now() - interval '1 minute', started_at = now() - interval '90 minutes',
                         planned_end = now() + interval '30 minutes'
 where room_key = 'deggendorf:A 008';
select pg_temp.act_as('lena@example.test');
select is((select count(*)::int from public.room_summaries('deggendorf') where room_key = 'deggendorf:A 008'), 0,
  'an expired session disappears from summaries');
select pg_temp.act_as('max@example.test');
select is(public.get_focus(), null, 'the owner sees no running session after expiry');

-- ── Public needs a listed programme ────────────────────────────────────
select pg_temp.act_as('sam@example.test');
select throws_ok($$select public.start_focus('deggendorf:J 213', 60, 'public', false, gen_random_uuid())$$,
  '22023', null, 'no study profile: Public is refused');
select lives_ok($$select public.start_focus('deggendorf:J 213', 60, 'private', false, gen_random_uuid())$$,
  'no study profile: Private still works');

-- ── Changing batch ends the session; deleting removes the account ─────
select pg_temp.act_as('mia@example.test');
select lives_ok($$select public.save_identity('Mia', 'bachelor-ki-deggendorf-ft', 2024, 'winter', 'public', true, 1)$$,
  'saving a new intake works');
select is(public.get_focus(), null, 'changing the batch ended the running session');
select lives_ok($$select public.delete_identity()$$, 'deleting the profile works');
reset role;
select is((select count(*)::int from auth.users where email = 'mia@example.test'), 0, 'the account is gone');

select * from finish();
rollback;
