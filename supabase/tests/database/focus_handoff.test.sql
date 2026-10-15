-- Session handoff between a student's devices (pgTAP, ADR 0005 §2).
-- Run: npx supabase test db
begin;
select plan(5);

create function pg_temp.act_as(p_email text) returns void language plpgsql as $$
declare uid uuid;
begin
  reset role;
  select id into uid from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
grant execute on function pg_temp.act_as(text) to authenticated;

create temp table t (k text primary key, v jsonb);
grant all on t to authenticated;
insert into t values ('code', to_jsonb((select code from focus.room where room_key = 'thd:r000000144')));

-- Lena starts on her phone ...
select pg_temp.act_as('lena@example.test');
insert into t values ('phone', public.start_focus('thd:r000000144', 120, 'private', false, gen_random_uuid(), true, 25, 5, 15, 4));
-- ... and opens the app on her laptop: the same account reads the session.
insert into t values ('laptop', public.get_focus());
select is((select v->>'id' from t where k = 'laptop'), (select v->>'id' from t where k = 'phone'), 'the second device reads the running session');
select is((select v->>'room_code' from t where k = 'laptop'), (select v #>> '{}' from t where k = 'code'),
  'it names the room');
select ok((select (v->>'renewed_at')::timestamptz <= (v->>'server_now')::timestamptz from t where k = 'laptop'),
  'it says when the session was last renewed');
select is((select v->'rhythm'->>'focus_minutes' from t where k = 'laptop'), '25', 'it carries the rhythm');

-- Starting in another room without replace is a conflict, not a silent replace.
select throws_ok($$select public.start_focus('thd:r000000001', 60, 'private', false, gen_random_uuid(), false, 25, 5, 15, 4)$$,
  '23505', null, 'starting elsewhere without replace asks first');

select * from finish();
rollback;
