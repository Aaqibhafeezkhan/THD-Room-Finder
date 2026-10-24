import { useEffect } from 'react';
import { lectureLimit } from '../../domain/focusSession';
import { useRoomData } from '../rooms/RoomDataContext';
import { useFocusSession } from './FocusSessionContext';

/**
 * Keeps a running session out of lectures it didn't know about (#154): one
 * started while the timetable was down, or a lecture THabella added later.
 * When today's timetable is known again, a lecture on now ends the session
 * (focus so far is kept) and a later one shortens the plan. Renders nothing.
 */
export function LectureGuard() {
  const { events, schedule, isCustomTime } = useRoomData();
  const { active, limitTo } = useFocusSession();
  const known = !isCustomTime && (schedule === 'fresh' || schedule === 'stale');

  useEffect(() => {
    if (!active || !known) return;
    const limit = lectureLimit(events, active.roomIdent, new Date(), new Date(active.plannedEnd));
    if (limit) void limitTo(limit);
  }, [active, known, events, limitTo]);

  return null;
}
