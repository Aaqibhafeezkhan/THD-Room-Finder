-- Local development seed: synthetic people only (never real students).
-- Runs on `npx supabase db reset`. Sign in through Inbucket
-- (http://127.0.0.1:54324) with any address below; the code arrives there.
--
--   Person  Email                Study profile        Sees Lena as
--   Lena    lena@example.test    AIN, winter 2023     (owner)
--   Max     max@example.test     AIN, winter 2023     same batch: "AIN 7 · studying"
--   Jonas   jonas@example.test   AIN, winter 2024     other intake: anonymous claim
--   Mia     mia@example.test     KI, winter 2023      other programme: anonymous claim
--   Sam     sam@example.test     no study profile     signed in, focus stays on the device
--   (signed out, anon key)                           anonymous claim

-- Programmes come from the 20261025120000_programme_catalogue migration (#40).

-- Rooms come from the 20261015090000_focus_rooms migration (THabella keys).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '',
       now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  from (values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'lena@example.test'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'max@example.test'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'jonas@example.test'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'mia@example.test'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'sam@example.test')
  ) as u (id, email);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
  from auth.users u
 where u.email like '%@example.test';

insert into focus.identity (user_id, display_name, programme_id, intake_year, intake_term, default_visibility, show_name) values
  ('00000000-0000-4000-a000-000000000001', 'Lena', 'ain-b', 2023, 'winter', 'private', false),
  ('00000000-0000-4000-a000-000000000002', 'Max', 'ain-b', 2023, 'winter', 'public', true),
  ('00000000-0000-4000-a000-000000000003', 'Jonas', 'ain-b', 2024, 'winter', 'public', false),
  ('00000000-0000-4000-a000-000000000004', 'Mia', 'ki-b', 2023, 'winter', 'public', true);

-- A little live activity so the map and list have something to show:
-- Max studies publicly in A008 (name shown, Deep 50/10), Mia privately in
-- ITC 2: sem(1) (Pomodoro).
insert into focus.session (user_id, room_key, visibility, show_name, programme_id, intake_year, intake_term,
                           start_request_id, started_at, planned_end, lease_until,
                           focus_minutes, break_minutes, long_break_minutes, long_every, anchor_at)
values
  ('00000000-0000-4000-a000-000000000002', 'thd:r000000001', 'public', true,
   'ain-b', 2023, 'winter', gen_random_uuid(),
   now() - interval '20 minutes', now() + interval '100 minutes', now() + interval '40 minutes',
   50, 10, 0, 0, now() - interval '20 minutes'),
  ('00000000-0000-4000-a000-000000000004', 'thd:r000000131', 'private', false,
   'ki-b', 2023, 'winter', gen_random_uuid(),
   now() - interval '40 minutes', now() + interval '80 minutes', now() + interval '20 minutes',
   25, 5, 15, 4, now() - interval '40 minutes');
