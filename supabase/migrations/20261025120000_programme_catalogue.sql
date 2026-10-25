-- The real THD programme list (#40) replaces the five placeholders the
-- service started with. Rows come from shared/programmes.json through
-- scripts/dev/programme-catalogue.mjs; ids are programme page slugs
-- (th-deg.de/ain-b), so they stay stable across later refreshes.
--
-- Codes repeat across levels and campuses (MT bachelor and master, MCS in
-- Deggendorf and Cham), so setup also needs the level and campus to tell
-- them apart. Matching batches always uses the id, never the code.

alter table focus.programme
  add column level text check (level in ('bachelor', 'master')),
  add column campus text[] not null default '{Deggendorf}' check (cardinality(campus) > 0);

-- programme catalogue: shared/programmes.json as of 2026-10-14
insert into focus.programme (id, code, name_en, name_de, intake_terms, level, campus, active) values
  ('ai-m', 'AI', 'Applied Computer Science', 'Angewandte Informatik - Infotronik', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('aid-m', 'AID', 'Artificial Intelligence and Data Science', 'Artificial Intelligence and Data Science', '{summer}', 'master', '{Deggendorf,České Budějovice}', true),
  ('aif-b', 'AIF', 'Applied Computer Science', 'Angewandte Informatik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('ain-b', 'AIN', 'Artificial Intelligence', 'Artificial Intelligence', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('anv-b', 'ANV', 'Emergency Paramedic', 'Außerklinische Akut- und Notfallversorgung', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('ar-m', 'AR', 'Applied Research in Engineering Sciences', 'Applied Research in Engineering Sciences', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('ase-m', 'ASE', 'Automotive Software Engineering', 'Automotive Software Engineering', '{summer}', 'master', '{Deggendorf}', true),
  ('asw-b', 'ASW', 'Applied Sports Science', 'Angewandte Sportwissenschaften mit Schwerpunkt Training und Gesundheit', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('asw-m', 'ASW', 'Applied Sports Science with Focus on Interprofessional Care in Sports', 'Angewandte Sportwissenschaften', '{winter}', 'master', '{Deggendorf}', true),
  ('avw-b', 'AVW', 'Traffic Sciences', 'Verkehrswissenschaften', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('biw-b', 'BIW', 'Civil and Construction Engineering', 'Bauingenieurwesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('bpp-b', 'BPP', 'Building Products and Processes', 'Building Products and Processes', '{winter}', 'bachelor', '{Pfarrkirchen}', true),
  ('bs-b', 'BS', 'Business Administration and Service Management', 'Business Administration and Service Management', '{summer}', 'bachelor', '{Deggendorf,Pfarrkirchen,Cham}', true),
  ('bu-m', 'BU', 'Civil and Environmental Engineering', 'Bau- und Umweltingenieurwesen', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('bwl-b', 'BWL', 'Business Administration', 'Betriebswirtschaft', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('ce-b', 'CE', 'Circular Engineering', 'Ressourceneffiziente Produktentwicklung - Circular Engineering', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('cy-b', 'CY', 'Cyber Security', 'Cyber Security', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('db-m', 'DB', 'Digital Business', 'Digital Business', '{winter}', 'master', '{Deggendorf}', true),
  ('dbm-b', 'DBM', 'Digital Biomedicine', 'Digitale Biomedizin', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('dbp-m', 'DBP', 'Digital Business Psychology', 'Digital Business Psychology', '{winter}', 'master', '{Deggendorf}', true),
  ('dh-m', 'DH', 'Digital Health', 'Digital Health', '{winter}', 'master', '{Pfarrkirchen}', true),
  ('dm-m', 'DM', 'Applied AI for Digital Production Management', 'Applied Artificial Intelligence for Digital Production Management', '{winter,summer}', 'master', '{Cham}', true),
  ('eai-b', 'EAI', 'Electronics Engineering for Artificial Intelligence - International', 'Electronics Engineering for Artificial Intelligence - International', '{summer}', 'bachelor', '{Deggendorf}', true),
  ('eki-b', 'EKI', 'Electronics for Artificial Intelligence', 'Elektronik für Künstliche Intelligenz - International', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('em-b', 'EM', 'Electromobility, Autonomous Driving and Mobile Robotics', 'Elektromobilität, autonomes Fahren und mobile Robotik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('em-m', 'EM', 'Electromobility', 'Elektromobilität', '{summer}', 'master', '{Deggendorf}', true),
  ('emi-b', 'EMI', 'Electromobility, Autonomous Driving and Mobile Robotics - International', 'Elektromobilität, autonomes Fahren und mobile Robotik - International', '{summer}', 'bachelor', '{Deggendorf}', true),
  ('en-b', 'EN', 'Sustainable Systems Engineering', 'Engineering Nachhaltiger Systeme', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('erg-b', 'ERG', 'Ergotherapy', 'Ergotherapie', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('ese-b', 'ESE', 'Energy Systems Engineering', 'Energy Systems Engineering', '{winter}', 'bachelor', '{Pfarrkirchen}', true),
  ('et-b', 'ET', 'Electrical Engineering and Information Technology', 'Elektro- und Informationstechnik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('et-m', 'ET', 'Electrical Engineering and Information Technology', 'Elektro- und Informationstechnik', '{summer}', 'master', '{Deggendorf}', true),
  ('eti-b', 'ETI', 'Electrical Engineering and Information Technology - International', 'Elektro- und Informationstechnik - International', '{summer}', 'bachelor', '{Deggendorf}', true),
  ('ga-m', 'GA', 'Entrepreneurial Game Development', 'Gründungsorientierte Spiele Entwicklung', '{winter}', 'master', '{Deggendorf}', true),
  ('gph-m', 'GPH', 'Global Public Health', 'Global Public Health', '{winter}', 'master', '{Pfarrkirchen}', true),
  ('hi-b', 'HI', 'Health Informatics', 'Health Informatics', '{winter}', 'bachelor', '{Pfarrkirchen}', true),
  ('hsb-m', 'HSB', 'Healthy and Sustainable Buildings', 'Healthy and Sustainable Buildings', '{winter}', 'master', '{Pfarrkirchen}', true),
  ('ie-b', 'IE', 'Industrial Engineering', 'Industrial Engineering', '{winter}', 'bachelor', '{Pfarrkirchen}', true),
  ('im-b', 'IM', 'International Management', 'International Management', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('itd-m', 'ITD', 'International Tourism Development', 'International Tourism Development', '{summer}', 'master', '{Pfarrkirchen}', true),
  ('itm-b', 'ITM', 'International Tourism Management / Health & Medical Tourism', 'International Tourism Management', '{winter}', 'bachelor', '{Pfarrkirchen}', true),
  ('ki-b', 'KI', 'Artificial Intelligence', 'Künstliche Intelligenz', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('ki-m', 'KI', 'Artificial Intelligence for Smart Sensors and Actuators', 'Artificial Intelligence for smart sensors and actuators', '{winter,summer}', 'master', '{Cham}', true),
  ('lsi-m', 'LSI', 'Life Science Informatics', 'Life Science Informatics', '{winter}', 'master', '{Deggendorf}', true),
  ('mb-b', 'MB', 'Mechanical Engineering', 'Maschinenbau', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('mb-m', 'MB', 'Mechanical Engineering', 'Maschinenbau', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('mcs-cham-m', 'MCS', 'Mechatronic and Cyber-Physical Systems', 'Mechatronische und cyber-physische Systeme', '{summer}', 'master', '{Cham}', true),
  ('mcs-m', 'MCS', 'Mechatronic and Cyber-Physical Systems', 'Mechatronische und cyber-physische Systeme', '{winter}', 'master', '{Deggendorf}', true),
  ('mdp-b', 'MDP', 'Mechatronics and Project Management for Digital Production', 'Mechatronik und Projektmanagement für Digitale Produktion', '{winter}', 'bachelor', '{Cham}', true),
  ('mgsr-b', 'MGSR', 'Management in Health, Social and Rescue Services', 'Management im Gesundheits-, Sozial- und Rettungswesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('mk-b', 'MK', 'Mechatronics', 'Mechatronik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('mro-m', 'MRO', 'Robotics', 'Robotik', '{winter,summer}', 'master', '{Cham}', true),
  ('mrw-b', 'MRW', 'Management in Rescue Services', 'Management im Rettungswesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('mt-b', 'MT', 'Media Technology', 'Medientechnik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('mt-m', 'MT', 'Media Technology', 'Medientechnik', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('mth-b', 'MTH', 'Management of Inclusion and Participation', 'Management von Inklusion und Teilhabe', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('pamv-b', 'PAMV', 'Physician Assistant / Medical Care', 'Physician Assistant', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('pf-b', 'PF', 'Nursing', 'Pflege', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('pfi-b', 'PFI', 'Nursing', 'Nursing', '{summer}', 'bachelor', '{Deggendorf}', true),
  ('pg-m', 'PG', 'Mental Health', 'Psychische Gesundheit', '{winter}', 'master', '{Deggendorf}', true),
  ('pmb-b', 'PMB', 'Project Management in Civil and Construction Engineering', 'Projektmanagement in Bauingenieurwesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('psb-b', 'PSB', 'Physiotherapy Dual Majoring in Kinesiology', 'Physiotherapie dual mit Schwerpunkt Bewegungswissenschaft', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('qc-m', 'QC', 'High-Performance Computing / Quantum Computing', 'High-Performance Computing / Quantum Computing', '{summer}', 'master', '{Deggendorf}', true),
  ('sa-b', 'SA', 'Social Work', 'Soziale Arbeit', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('sd-b', 'SD', 'Software Design', 'Software-Design', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('sim-m', 'SIM', 'Strategic and International Management', 'Strategisches und Internationales Management', '{summer}', 'master', '{Deggendorf}', true),
  ('td-b', 'TD', 'Technical Design', 'Technisches Design', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('tem-m', 'TEM', 'Technology Management', 'Technologiemanagement', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('tm-b', 'TM', 'Tourism Management', 'Tourismusmanagement', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('tp-b', 'TP', 'Engineering Physics', 'Technische Physik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('uiw-b', 'UIW', 'Environmental Engineering', 'Umweltingenieurwesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('vwl-b', 'VWL', 'Economics', 'Volkswirtschaftslehre', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('wi-b', 'WI', 'Business Informatics', 'Wirtschaftsinformatik', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('wi-m', 'WI', 'Business Informatics', 'Wirtschaftsinformatik', '{winter,summer}', 'master', '{Deggendorf}', true),
  ('wiw-b', 'WIW', 'Industrial Engineering', 'Wirtschaftsingenieurwesen', '{winter}', 'bachelor', '{Deggendorf}', true),
  ('wp-b', 'WP', 'Organisational and Economic Psychology', 'Angewandte Wirtschaftspsychologie', '{winter}', 'bachelor', '{Deggendorf}', true)
on conflict (id) do update set
  code = excluded.code, name_en = excluded.name_en, name_de = excluded.name_de,
  intake_terms = excluded.intake_terms, level = excluded.level, campus = excluded.campus,
  active = excluded.active;

-- Programmes the taxonomy no longer lists stay for existing profiles,
-- but are not offered in setup.
update focus.programme set active = false
 where id not in ('aif-b', 'ain-b', 'anv-b', 'asw-b', 'avw-b', 'biw-b', 'bpp-b', 'bs-b', 'bwl-b', 'ce-b', 'cy-b', 'dbm-b', 'eai-b', 'eki-b', 'em-b', 'emi-b', 'en-b', 'erg-b', 'ese-b', 'et-b', 'eti-b', 'hi-b', 'ie-b', 'im-b', 'itm-b', 'ki-b', 'mb-b', 'mdp-b', 'mgsr-b', 'mk-b', 'mrw-b', 'mt-b', 'mth-b', 'pamv-b', 'pf-b', 'pfi-b', 'pmb-b', 'psb-b', 'sa-b', 'sd-b', 'td-b', 'tm-b', 'tp-b', 'uiw-b', 'vwl-b', 'wi-b', 'wiw-b', 'wp-b', 'ai-m', 'aid-m', 'ar-m', 'ase-m', 'asw-m', 'bu-m', 'db-m', 'dbp-m', 'dh-m', 'dm-m', 'em-m', 'et-m', 'ga-m', 'gph-m', 'hsb-m', 'itd-m', 'ki-m', 'lsi-m', 'mb-m', 'mcs-cham-m', 'mcs-m', 'mro-m', 'mt-m', 'pg-m', 'qc-m', 'sim-m', 'tem-m', 'wi-m');
-- end programme catalogue

-- Profiles and sessions on a placeholder move to the same programme's real
-- id, so nobody loses their batch. Sessions keep the programme as text.
update focus.identity i set programme_id = m.new_id
  from (values
    ('bachelor-ain-deggendorf-ft', 'ain-b'),
    ('bachelor-ki-deggendorf-ft', 'ki-b'),
    ('bachelor-aif-b-deggendorf-ft', 'aif-b'),
    ('bachelor-wi-deggendorf-ft', 'wi-b'),
    ('master-mte-m-deggendorf-ft', 'mt-m')) as m (old_id, new_id)
 where i.programme_id = m.old_id;
update focus.session s set programme_id = m.new_id
  from (values
    ('bachelor-ain-deggendorf-ft', 'ain-b'),
    ('bachelor-ki-deggendorf-ft', 'ki-b'),
    ('bachelor-aif-b-deggendorf-ft', 'aif-b'),
    ('bachelor-wi-deggendorf-ft', 'wi-b'),
    ('master-mte-m-deggendorf-ft', 'mt-m')) as m (old_id, new_id)
 where s.programme_id = m.old_id;
delete from focus.programme
 where id in ('bachelor-ain-deggendorf-ft', 'bachelor-ki-deggendorf-ft', 'bachelor-aif-b-deggendorf-ft',
              'bachelor-wi-deggendorf-ft', 'master-mte-m-deggendorf-ft');

alter table focus.programme alter column level set not null;

-- Setup shows the level and campus beside the name.
drop function public.list_programmes();
create function public.list_programmes()
returns table (id text, code text, name_en text, name_de text, intake_terms text[], level text, campus text[])
language sql stable security definer set search_path = '' as $$
  select p.id, p.code, p.name_en, p.name_de, p.intake_terms, p.level, p.campus
    from focus.programme p
   where p.active
   order by p.code, p.level, p.id
$$;

revoke all on function public.list_programmes() from public, anon, authenticated;
grant execute on function public.list_programmes() to anon, authenticated;
