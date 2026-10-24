-- A running session becomes a study table (#153, ADR 0010). pgTAP.
-- Uses the synthetic people from supabase/seed.sql. Sam has no study profile.
begin;
select plan(14);

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
create function pg_temp.v(p_key text, p_field text) returns text language sql as $$ select v->>p_field from t where k = p_key $$;
grant execute on function pg_temp.v(text, text) to anon, authenticated;

select pg_temp.act_as(null);
select throws_ok($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now(), now() + interval '1 hour', 4, 25, 5)$$,
  '42501', null, 'signed out: cannot convert');

select pg_temp.act_as('sam@example.test');
select throws_ok($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now(), now() + interval '1 hour', 4, 25, 5)$$,
  '22023', null, 'no study profile: cannot convert');

-- Lena focuses in A008, privately, since 40 minutes ago by the rhythm.
select pg_temp.act_as('lena@example.test');
insert into t values ('session', public.start_focus('thd:r000000001', 120, 'private', false, gen_random_uuid(), true, 25, 5, 15, 4));
reset role;
update focus.session set anchor_at = now() - interval '40 minutes', started_at = now() - interval '40 minutes'
 where id = (pg_temp.v('session', 'id'))::uuid;
select pg_temp.act_as('lena@example.test');

select throws_ok(format($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000002', now() - interval '40 minutes', now() + interval '1 hour', 4, 25, 5, 15, 4, %L)$$, pg_temp.v('session', 'id')),
  '22023', null, 'the table is in the session''s room');
select throws_ok(format($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now() - interval '2 hours', now() + interval '1 hour', 4, 25, 5, 15, 4, %L)$$, pg_temp.v('session', 'id')),
  '22023', null, 'the table cannot start before the session');
select throws_ok(format($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now() - interval '40 minutes', now() + interval '1 hour', 1, 25, 5, 15, 4, %L)$$, pg_temp.v('session', 'id')),
  '22023', null, 'inviting needs at least 2 seats');
select throws_ok(format($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now() - interval '40 minutes', now() + interval '20 minutes', 4, 25, 5, 15, 4, %L)$$, pg_temp.v('session', 'id')),
  '22023', 'too little time left', 'under 25 minutes left is refused');

insert into t values ('req', to_jsonb(gen_random_uuid()::text));
insert into t select 'table', public.table_from_session((select v #>> '{}' from t where k = 'req')::uuid, 'Algorithms', 'thd:r000000001',
  now() - interval '40 minutes', now() + interval '1 hour', 4, 25, 5, 15, 4, (pg_temp.v('session', 'id'))::uuid);
select ok(pg_temp.v('table', 'link') ~ '^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$', 'the converted table has a link');
select is((pg_temp.v('table', 'starts_at'))::timestamptz, now() - interval '40 minutes', 'it starts at the session''s anchor, already in progress');
select ok((pg_temp.v('table', 'is_host'))::boolean, 'the student is the host');
select ok((pg_temp.v('table', 'host_show_name'))::boolean, 'people at a table see the host''s first name');

select is((public.table_from_session((select v #>> '{}' from t where k = 'req')::uuid, 'Algorithms', 'thd:r000000001',
  now() - interval '40 minutes', now() + interval '1 hour', 4, 25, 5, 15, 4, (pg_temp.v('session', 'id'))::uuid))->>'link',
  pg_temp.v('table', 'link'), 'a retry returns the same table');
select is((public.table_from_session(gen_random_uuid(), 'Other', 'thd:r000000001',
  now() - interval '40 minutes', now() + interval '1 hour', 6, 25, 5, 15, 4, (pg_temp.v('session', 'id'))::uuid))->>'link',
  pg_temp.v('table', 'link'), 'converting the same session again opens its table');
reset role;
select is((select visibility from focus.session where id = (pg_temp.v('session', 'id'))::uuid), 'private',
  'the session keeps its visibility');

-- Max can't attach a table to Lena's session.
select pg_temp.act_as('max@example.test');
select throws_ok(format($$select public.table_from_session(gen_random_uuid(), null, 'thd:r000000001', now() - interval '40 minutes', now() + interval '1 hour', 4, 25, 5, 15, 4, %L)$$, pg_temp.v('session', 'id')),
  '22023', 'session is not running', 'someone else''s session cannot be converted');

select * from finish();
rollback;
