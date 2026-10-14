-- Local development seed: synthetic people only (never real students).
-- Runs on `npx supabase db reset`. Sign in through Inbucket
-- (http://127.0.0.1:54324) with any address below; the code arrives there.
--
--   Person  Email                Study profile        Sees Lena as
--   Lena    lena@example.test    AIN, winter 2023     (owner)
--   Max     max@example.test     AIN, winter 2023     same batch: "AIN 7 · studying"
--   Jonas   jonas@example.test   AIN, winter 2024     other intake: anonymous claim
--   Mia     mia@example.test     KI, winter 2023      other programme: anonymous claim
--   Sam     sam@example.test     no study profile     anonymous claim, Private only
--   (signed out, anon key)                           anonymous claim

-- Programmes: synthetic placeholders until the #40 taxonomy exists.
insert into focus.programme (id, code, name_en, name_de, intake_terms) values
  ('bachelor-ain-deggendorf-ft', 'AIN', 'Artificial Intelligence', 'Artificial Intelligence', '{winter}'),
  ('bachelor-ki-deggendorf-ft', 'KI', 'Artificial Intelligence', 'Künstliche Intelligenz', '{winter}'),
  ('bachelor-aif-b-deggendorf-ft', 'AIF-B', 'Applied Computer Science', 'Angewandte Informatik', '{winter}'),
  ('bachelor-wi-deggendorf-ft', 'WI', 'Business Informatics', 'Wirtschaftsinformatik', '{winter}'),
  ('master-mte-m-deggendorf-ft', 'MT', 'Media Technology', 'Medientechnik', '{winter,summer}');

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
  ('00000000-0000-4000-a000-000000000001', 'Lena', 'bachelor-ain-deggendorf-ft', 2023, 'winter', 'private', false),
  ('00000000-0000-4000-a000-000000000002', 'Max', 'bachelor-ain-deggendorf-ft', 2023, 'winter', 'public', true),
  ('00000000-0000-4000-a000-000000000003', 'Jonas', 'bachelor-ain-deggendorf-ft', 2024, 'winter', 'public', false),
  ('00000000-0000-4000-a000-000000000004', 'Mia', 'bachelor-ki-deggendorf-ft', 2023, 'winter', 'public', true);

-- A little live activity so the map and list have something to show:
-- Max studies publicly in A008 (name shown), Mia privately in ITC 2: sem(1).
insert into focus.session (user_id, room_key, visibility, show_name, programme_id, intake_year, intake_term,
                           start_request_id, started_at, planned_end, lease_until)
values
  ('00000000-0000-4000-a000-000000000002', 'thd:r000000001', 'public', true,
   'bachelor-ain-deggendorf-ft', 2023, 'winter', gen_random_uuid(),
   now() - interval '20 minutes', now() + interval '100 minutes', now() + interval '40 minutes'),
  ('00000000-0000-4000-a000-000000000004', 'thd:r000000131', 'private', false,
   'bachelor-ki-deggendorf-ft', 2023, 'winter', gen_random_uuid(),
   now() - interval '40 minutes', now() + interval '80 minutes', now() + interval '20 minutes');
