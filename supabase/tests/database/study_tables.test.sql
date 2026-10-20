-- Study tables contract tests (pgTAP, ADR 0007). Run: npx supabase test db
-- Uses the synthetic people from supabase/seed.sql. Sam has no study profile.
begin;
select plan(41);

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
create function pg_temp.link(p_key text) returns text language sql as $$ select v->>'link' from t where k = p_key $$;
grant execute on function pg_temp.link(text) to anon, authenticated;

-- ── Word list ─────────────────────────────────────────────────────────
select is((select count(*)::int from focus.link_word where list = 1), 512, '512 describing words');
select is((select count(*)::int from focus.link_word where list = 2), 512, '512 things');

-- ── Setting a table ───────────────────────────────────────────────────
select pg_temp.act_as(null);
select throws_ok($$select public.set_table('x', 'thd:r000000001', now() + interval '1 day', 60, 4, 25, 5)$$,
  '42501', null, 'signed out: cannot set a table');

select pg_temp.act_as('sam@example.test');
select throws_ok($$select public.set_table('x', 'thd:r000000001', now() + interval '1 day', 60, 4, 25, 5)$$,
  '22023', null, 'no study profile: cannot set a table');

select pg_temp.act_as('max@example.test');
select throws_ok($$select * from focus.study_table$$, '42501', null, 'the table store is not reachable');
select throws_ok($$select * from focus.link_word$$, '42501', null, 'the word list is not reachable');
select throws_ok($$select public.set_table(null, 'thd:r000000001', now() - interval '1 hour', 60, 4, 25, 5)$$,
  '22023', null, 'a table cannot start in the past');
select throws_ok($$select public.set_table(null, 'thd:r000000001', now() + interval '15 days', 60, 4, 25, 5)$$,
  '22023', null, 'a table is at most 14 days ahead');
select throws_ok($$select public.set_table(null, 'thd:r000000001', now() + interval '1 day', 181, 4, 25, 5)$$,
  '22023', null, 'a table is at most 3 hours');
select throws_ok($$select public.set_table(null, 'thd:r000000001', now() + interval '1 day', 60, 10, 25, 5)$$,
  '22023', null, 'seats are 1, 2, 4, 6, 8 or 12');
select throws_ok($$select public.set_table(null, 'thd:r000000001', now() + interval '1 day', 60, 16, 25, 5)$$,
  '22023', null, 'more than 12 seats is a gathering, not a table');
select throws_ok($$select public.set_table(null, null, now() + interval '1 day', 60, 4, 25, 5)$$,
  '22023', null, 'a table needs a room');
select throws_ok($$select public.set_table(null, 'thd:nope', now() + interval '1 day', 60, 4, 25, 5)$$,
  '22023', null, 'an unknown room is refused');
select throws_ok($$select public.set_table(repeat('a', 41), 'thd:r000000001', now() + interval '1 day', 60, 4, 25, 5)$$,
  '22023', null, 'a topic is at most 40 characters');

insert into t values ('table', public.set_table('  Algorithms ', 'thd:r000000001', now() + interval '1 day', 90, 2, 25, 5, 15, 4, true));
select ok(pg_temp.link('table') ~ '^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$', 'the link is two words and two digits');
select is((select v->>'topic' from t where k = 'table'), 'Algorithms', 'the topic is trimmed');
select is((select v->>'room_code' from t where k = 'table'), 'A008', 'the room code comes with the table');
select ok((select (v->>'is_host')::boolean from t where k = 'table'), 'the creator is the host');
select is((select (v->>'taken')::int from t where k = 'table'), 1, 'the host holds a seat');

insert into t values ('solo', public.set_table(null, 'thd:r000000002', now() + interval '2 days', 60, 1, 50, 10));
select is((select (v->>'seats')::int from t where k = 'solo'), 1, 'Just me is a table with one seat');

-- ── Opening the link ──────────────────────────────────────────────────
select pg_temp.act_as(null);
select is((public.get_table(pg_temp.link('table')))->>'host_name', 'Max',
  'signed out: the table is readable by link, with the host name he chose to show');
select is((public.get_table(upper(' ' || pg_temp.link('table') || ' ')))->>'link', pg_temp.link('table'),
  'a link typed in capitals or with spaces still opens');
select is(public.get_table('mossy-lagoon-00'), null, 'an unknown link returns nothing');
select ok(not (public.table_preview(pg_temp.link('table')) ? 'host_name'), 'the link preview carries no names');
select is((public.table_preview(pg_temp.link('table')))->>'seats', '2', 'the preview says how many seats');
select throws_ok($$select public.reply_table(pg_temp.link('table'), 'seat')$$,
  '42501', null, 'signed out: cannot take a seat');

-- ── Seats and replies ─────────────────────────────────────────────────
select pg_temp.act_as('sam@example.test');
select throws_ok($$select public.reply_table(pg_temp.link('table'), 'seat')$$,
  '22023', null, 'no study profile: cannot take a seat yet');

select pg_temp.act_as('lena@example.test');
select is((public.reply_table(pg_temp.link('table'), 'seat', true))->>'taken', '2', 'Lena takes the last seat');
select throws_ok($$select public.reply_table(pg_temp.link('solo'), 'seat')$$,
  '22023', null, 'nobody can join a Just me table');

select pg_temp.act_as('jonas@example.test');
select throws_ok($$select public.reply_table(pg_temp.link('table'), 'seat')$$,
  '22023', null, 'a full table refuses another seat');
select is((public.reply_table(pg_temp.link('table'), 'maybe'))->>'my_answer', 'maybe', 'Maybe is still possible at a full table');
select throws_ok($$select public.reply_table(pg_temp.link('table'), 'perhaps')$$,
  '22023', null, 'only a seat, Maybe or Can''t');

select pg_temp.act_as('mia@example.test');
insert into t values ('mia', public.get_table(pg_temp.link('table')));
select is((select v->'seat_names' from t where k = 'mia'), '["Lena"]'::jsonb, 'Lena chose to show her name');
select is((select v->'maybe_names' from t where k = 'mia'), '[]'::jsonb, 'Jonas keeps his name hidden');

select pg_temp.act_as('lena@example.test');
select is((public.reply_table(pg_temp.link('table'), 'no'))->>'my_answer', null, 'Can''t removes Lena from the table');
select is(jsonb_array_length(public.my_tables()), 0, 'and the table leaves her list');

select pg_temp.act_as('max@example.test');
select throws_ok($$select public.reply_table(pg_temp.link('table'), 'no')$$,
  '22023', null, 'the host cannot leave his own table');

-- ── Your tables, changes and cancelling ───────────────────────────────
select pg_temp.act_as('jonas@example.test');
select is(jsonb_array_length(public.my_tables()), 1, 'a maybe keeps the table in Jonas''s list');
select throws_ok($$select public.cancel_table(pg_temp.link('table'))$$,
  'P0002', null, 'a guest cannot cancel the table');

select pg_temp.act_as('max@example.test');
select is((public.change_table(pg_temp.link('table'), 1, 'Algorithms', 'thd:r000000002',
  now() + interval '2 days', 50, 4, 25, 5))->>'changed', 'true', 'the host moves the table; it shows as changed');
select is((public.cancel_table(pg_temp.link('table')))->>'cancelled', 'true', 'the host cancels it');

select * from finish();
rollback;
