-- Organizations and gatherings contract tests (pgTAP, ADR 0008). Run: npx supabase test db
-- Uses the synthetic people from supabase/seed.sql plus twelve extra test
-- people made here, so a 13-person gathering can fill up. Sam has no profile.
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
  if p_email = 'service' then
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    set local role service_role;
    return;
  end if;
  select id into uid from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
grant execute on function pg_temp.act_as(text) to anon, authenticated, service_role;

create temp table t (k text primary key, v jsonb);
grant all on t to anon, authenticated, service_role;
create function pg_temp.v(p_key text, p_field text) returns text language sql as $$ select v->>p_field from t where k = p_key $$;
grant execute on function pg_temp.v(text, text) to anon, authenticated, service_role;

-- Twelve extra people with a study profile.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'p' || n || '@example.test', '',
       now(), '{}', '{}', now(), now(), '', '', '', ''
  from generate_series(1, 12) n;
insert into focus.identity (user_id, display_name, programme_id, intake_year, intake_term)
select u.id, 'P' || substr(u.email, 2, strpos(u.email, '@') - 2), 'bachelor-ain-deggendorf-ft', 2024, 'winter'
  from auth.users u where u.email ~ '^p[0-9]+@example\.test$';

-- ── Registry ──────────────────────────────────────────────────────────
select pg_temp.act_as(null);
select throws_ok($$select public.request_organization('Campus Connect', 'campus-connect')$$,
  '42501', null, 'signed out: cannot request an organization');

select pg_temp.act_as('sam@example.test');
select throws_ok($$select public.request_organization('Campus Connect', 'campus-connect')$$,
  '22023', null, 'no study profile: cannot request an organization');

select pg_temp.act_as('lena@example.test');
select throws_ok($$select * from focus.org_request$$, '42501', null, 'requests are not reachable');
select throws_ok($$select public.request_organization('Campus Connect', 'Campus Connect!')$$,
  '22023', null, 'a slug is lower case letters, digits and dashes');
insert into t values ('req', public.request_organization('Campus Connect', 'campus-connect', 'Game nights and socials', 'https://example.test'));
select is(pg_temp.v('req', 'status'), 'waiting_proof', 'a new request waits for proof');
select throws_ok($$select public.request_organization('Other', 'campus-connect')$$,
  '23505', null, 'a slug with an open request is taken');
select throws_ok($$select public.registry_set_status((select (v->>'no')::int from t where k = 'req'), 'approved')$$,
  '42501', null, 'a student cannot approve their own request');
select throws_ok($$select public.set_gathering('campus-connect', 'games', 'Game night', null, 'thd:r000000001',
  now() + interval '2 days', 180, 40, 'THD-2026-117')$$, '22023', null, 'no gathering before the group is verified');

select pg_temp.act_as('service');
select is((public.registry_set_status((select (v->>'no')::int from t where k = 'req'), 'in_review', 41))->>'status',
  'in_review', 'the registry moves the request to review');
select is((public.registry_set_status((select (v->>'no')::int from t where k = 'req'), 'approved', 41))->>'status',
  'approved', 'the registry approves it');

select pg_temp.act_as(null);
select ok((public.get_organization('campus-connect')->>'verified')::boolean, 'the group page shows it verified');

select pg_temp.act_as('lena@example.test');
select is((public.my_organizations()->'groups'->0->>'role'), 'lead', 'the applicant leads the group');
insert into t values ('invite', public.create_organizer_invite('campus-connect'));
select ok(pg_temp.v('invite', 'token') ~ '^[A-Za-z0-9]{16}$', 'the lead gets an organizer link');

select pg_temp.act_as('max@example.test');
select throws_ok($$select public.create_organizer_invite('campus-connect')$$, '42501', null, 'only a lead makes organizer links');
select is((public.join_organization((select v->>'token' from t where k = 'invite')))->>'slug', 'campus-connect',
  'Max joins as an organizer with the link');

-- ── Gatherings ────────────────────────────────────────────────────────
select pg_temp.act_as('jonas@example.test');
select throws_ok($$select public.set_gathering('campus-connect', 'games', 'Game night', null, 'thd:r000000001',
  now() + interval '2 days', 180, 40, 'THD-2026-117')$$, '42501', null, 'a student outside the group cannot host');

select pg_temp.act_as('max@example.test');
select throws_ok($$select public.set_gathering('campus-connect', 'games', 'Game night', null, 'thd:r000000001',
  now() + interval '2 days', 180, 12, 'THD-2026-117')$$, '22023', null, '12 and below is a study table');
select throws_ok($$select public.set_gathering('campus-connect', 'circle', 'Debate', null, 'thd:r000000001',
  now() + interval '2 days', 180, 40, 'THD-2026-117')$$, '22023', null, 'only the four types');
select throws_ok($$select public.set_gathering('campus-connect', 'games', 'Game night', null, 'thd:r000000001',
  now() + interval '2 days', 180, 40, '')$$, '22023', null, 'a gathering needs the room approval reference');
insert into t values ('g', public.set_gathering('campus-connect', 'games', ' Game night ', null, 'thd:r000000001',
  now() + interval '2 days', 180, 13, 'THD-2026-117'));
select ok(pg_temp.v('g', 'link') ~ '^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$', 'a gathering gets a word link');
select is(pg_temp.v('g', 'title'), 'Game night', 'the title is trimmed');
select throws_ok($$select public.set_gathering('campus-connect', 'talk', 'Talk', null, 'thd:r000000001',
  now() + interval '2 days' + interval '1 hour', 60, 40, 'THD-2026-118')$$, '22023', null, 'two gatherings cannot share a room and time');

-- ── Replies ───────────────────────────────────────────────────────────
select pg_temp.act_as(null);
select is(pg_temp.v('g', 'link') is not null and public.get_gathering(pg_temp.v('g', 'link')) is not null, true,
  'signed out: the gathering is readable by link');
select ok(not (public.gathering_preview(pg_temp.v('g', 'link'))::text ~ 'Lena|Max'), 'the preview carries no names');
select throws_ok($$select public.reply_gathering(pg_temp.v('g', 'link'), 'going', true)$$, '42501', null, 'signed out: cannot reply');

select pg_temp.act_as('jonas@example.test');
select throws_ok($$select public.reply_gathering(pg_temp.v('g', 'link'), 'going', false)$$,
  '22023', null, 'replying needs consent to share name, programme and batch');
select is((public.reply_gathering(pg_temp.v('g', 'link'), 'maybe', true))->>'replies', 'm', 'Jonas says maybe: a half dot');

select pg_temp.act_as('mia@example.test');
select is((public.reply_gathering(pg_temp.v('g', 'link'), 'going', true))->>'replies', 'mg', 'Mia goes: dots in reply order');

select pg_temp.act_as('jonas@example.test');
select is((public.reply_gathering(pg_temp.v('g', 'link'), 'going', true))->>'replies', 'gg', 'Maybe → Going keeps its place');

-- Eleven more people fill the 13 places; the twelfth waits.
do $$
declare e text;
begin
  for n in 1..12 loop
    e := 'p' || n || '@example.test';
    perform pg_temp.act_as(e);
    perform public.reply_gathering((select v->>'link' from t where k = 'g'), 'going', true);
  end loop;
  reset role;
end $$;
select pg_temp.act_as('p12@example.test');
insert into t values ('p12', public.get_gathering(pg_temp.v('g', 'link')));
select is(pg_temp.v('p12', 'my_answer'), 'waiting', 'a full gathering puts the next reply on the waiting list');
select is(pg_temp.v('p12', 'waiting_place'), '1', 'first in line');
select is(pg_temp.v('p12', 'going'), '13', '13 going, the room''s size');

select pg_temp.act_as('mia@example.test');
select is((public.reply_gathering(pg_temp.v('g', 'link'), 'no'))->>'my_answer', null, 'Can''t removes Mia');
select pg_temp.act_as('p12@example.test');
select is((public.get_gathering(pg_temp.v('g', 'link')))->>'my_answer', 'going', 'the first in line moves up');

-- ── Organizers ────────────────────────────────────────────────────────
select pg_temp.act_as('jonas@example.test');
select throws_ok($$select public.gathering_people(pg_temp.v('g', 'link'))$$, 'P0002', null, 'a guest cannot see the people list');
select pg_temp.act_as('lena@example.test');
select is(jsonb_array_length(public.gathering_people(pg_temp.v('g', 'link'))), 13, 'organizers see everyone who replied');
select ok(not (public.gathering_people(pg_temp.v('g', 'link'))::text ~ '@'), 'the people list has no email addresses');

select pg_temp.act_as('service');
select is((public.registry_set_status((select (v->>'no')::int from t where k = 'req'), 'revoked'))->>'status', 'revoked',
  'the registry can revoke a group');
select pg_temp.act_as('p1@example.test');
select throws_ok($$select public.reply_gathering(pg_temp.v('g', 'link'), 'maybe', true)$$,
  '22023', null, 'a revoked group''s gatherings take no replies');

select * from finish();
rollback;
