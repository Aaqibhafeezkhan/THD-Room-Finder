-- A running session follows the student to their other devices (ADR 0005 §2,
-- issue #90). The owner's session JSON gains the room code, so a device that
-- adopts the session can name the room without its own room list, and the
-- last renewal, so it can tell which blocks were already confirmed.
-- Only owner functions (get/start/renew/update/end_focus) return this JSON.

create or replace function focus.session_json(s focus.session) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id,
    'room_key', s.room_key,
    'room_code', (select r.code from focus.room r where r.room_key = s.room_key),
    'visibility', s.visibility,
    'show_name', s.show_name,
    'started_at', s.started_at,
    'planned_end', s.planned_end,
    'lease_until', s.lease_until,
    'renewed_at', s.renewed_at,
    'ended_at', s.ended_at,
    'end_reason', s.end_reason,
    'version', s.version,
    'rhythm', focus.rhythm_json(s),
    'server_now', now()
  )
$$;
revoke all on function focus.session_json(focus.session) from public, anon, authenticated;
