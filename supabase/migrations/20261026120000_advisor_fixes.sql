-- Findings from the Supabase advisors (`supabase db advisors`) on
-- 26 Oct 2026. The rest of what they list is by design: the focus
-- tables have RLS on and no policies because only the SECURITY DEFINER
-- functions in public read them, and those functions are the API.

-- Foreign keys without a covering index. Deleting an account cascades
-- through the created_by keys, and removing a group or a programme
-- checks the others, so each would scan the whole table.
create index gathering_created_by_idx on focus.gathering (created_by);
create index org_invite_created_by_idx on focus.org_invite (created_by);
create index org_invite_org_idx on focus.org_invite (org_id);
create index org_request_org_idx on focus.org_request (org_id);
create index identity_programme_idx on focus.identity (programme_id);
create index study_table_room_idx on focus.study_table (room_key);

-- The hosted project has Supabase's automatic-RLS event trigger, whose
-- function keeps the default EXECUTE for everyone and so shows up as
-- callable through /rest/v1/rpc. It only runs as a trigger, which needs
-- no EXECUTE grant. Local and CI databases don't have it.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
