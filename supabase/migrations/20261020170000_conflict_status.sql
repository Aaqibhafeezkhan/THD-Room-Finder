-- Version conflicts answered 40001 (serialization_failure). PostgREST
-- retries that code, so a stale write hung until the gateway gave up
-- (504 after 60 s) and the app never saw the stale_version hint. PT409
-- makes PostgREST answer 409 Conflict at once with the same hint.
--
-- The three functions are rewritten from their live definitions, so only
-- the error code changes; grants and ownership stay as they are.
do $$
declare
  f oid;
begin
  for f in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('save_identity', 'renew_focus', 'update_focus')
  loop
    execute replace(pg_get_functiondef(f), 'errcode = ''40001''', 'errcode = ''PT409''');
  end loop;
end $$;
