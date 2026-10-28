/**
 * Room priority policy — a faithful TS port of the native app's
 * `RoomPriorityPolicy.kt`. In v2 the primary display filter is "has a lecture
 * this week" (see teachingRooms.ts); `isPriority` now only informs a secondary
 * sort tiebreak so main-campus teaching rooms rank ahead of remote venues.
 */
import type { Room } from './models';

export const MAIN_CAMPUS_BUILDINGS = new Set([
  'A', 'B', 'C', 'D', 'E', 'I', 'ITC', 'J',
]);

const EXCLUDED_MARKERS = [
  'besprechungsraum',
  'vorplatz',
  'turnhalle',
  'stadthalle',
  'fernsehstudio',
  'glashaus',
  'coworking',
  'co-working',
];

/** Lowercase + German umlaut/ß folding, matching `normalizeForMatching`. */
export function normalizeForMatching(str: string | null | undefined): string {
  return (str ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function searchableText(room: Room): string {
  return normalizeForMatching(
    [
      room.name,
      room.displayName,
      room.building,
      room.untisLongname ?? '',
      room.facilities.join(' '),
    ].join(' '),
  );
}

/**
 * THD's campuses outside Deggendorf. They reuse Deggendorf building letters —
 * Cham has its own "A"/"B" — so a parsed building alone can't place a room.
 */
export type RemoteCampus = 'cham' | 'pfarrkirchen';

/**
 * Room-name markers for the remote campuses, matched against the umlaut-folded
 * room text, so "Badstraße" → "badstrasse" matches "badstra".
 */
const REMOTE_CAMPUS_MARKERS: [RemoteCampus, string[]][] = [
  ['cham', ['badstra', 'cham']],
  ['pfarrkirchen', ['pfarrkirchen', 'ecri', 'rottal']],
];

/**
 * Cham numbers its rooms "<Letter> <floor>.<room>" ("B 1.07 Labor 5"), while
 * the Deggendorf core uses "<Letter><number>" ("B004", "C211"). Two Cham
 * meeting rooms come without the "(Badstraße)" suffix ("B 1.06", "B 1.13"),
 * so the code shape is the only thing that tells them apart.
 */
const CHAM_ROOM_CODE = /^[A-L] \d+\.\d+/;

/** ECRI in Pfarrkirchen prefixes its rooms "EC" or "EC.B" ("EC 1.07", "EC.B 0.13"). */
const ECRI_ROOM_CODE = /^EC(\.B)? \d/;

/** The remote campus a room belongs to, or null for Deggendorf. */
export function remoteCampus(room: Room): RemoteCampus | null {
  const text = normalizeForMatching(
    [room.name, room.displayName, room.untisLongname ?? ''].join(' '),
  );
  for (const [campus, markers] of REMOTE_CAMPUS_MARKERS) {
    if (markers.some((m) => text.includes(m))) return campus;
  }
  if (CHAM_ROOM_CODE.test(room.name)) return 'cham';
  return ECRI_ROOM_CODE.test(room.name) ? 'pfarrkirchen' : null;
}

function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\W)${escaped}($|\\W)`).test(text);
}

/**
 * Non-study venues that should never appear in a "free study room" list even if
 * THabella schedules an event in them (sports courses, outdoor/forecourt spaces,
 * meeting rooms). Extends the native app's `excludedMarkers` with the sports and
 * outdoor venues surfaced once the display filter moved to "has an event this
 * week". Matched as substrings against the umlaut-folded room text.
 */
const EXCLUDED_VENUE_MARKERS = [
  ...EXCLUDED_MARKERS,
  'stadion',
  'schwimmbad',
  'sportplatz',
  'freiflaeche',
  'freifl',
  'beachvolleyball',
  'tennisplatz',
  'begegnungsst',
  'foyer',
  'kulturraum',
];

/**
 * THabella entries that stand for no room at all ("--" is tagged
 * "Platzhalter"). Matched against the whole name, so "Extern" can't catch a
 * real room that merely mentions it.
 */
const PLACEHOLDER_NAMES = new Set(['--', 'extern', 'greg']);

export function isExcludedVenue(room: Room): boolean {
  if (PLACEHOLDER_NAMES.has(room.name.trim().toLowerCase())) return true;
  const text = normalizeForMatching(
    [room.name, room.displayName, room.untisLongname ?? ''].join(' '),
  );
  return EXCLUDED_VENUE_MARKERS.some((m) => text.includes(m));
}

export function isPriority(room: Room): boolean {
  if (!MAIN_CAMPUS_BUILDINGS.has(room.building) || remoteCampus(room)) return false;

  const text = searchableText(room);
  if (EXCLUDED_MARKERS.some((m) => text.includes(m))) return false;

  const isLab = text.includes('labor') || text.includes('lab');
  const isLectureHall =
    room.building === 'I' || containsWord(text, 'hs') || text.includes('hoersaal');
  const prefix = room.name.split(' - ')[0].trim();
  const isClassroomLike =
    prefix.toLowerCase().startsWith(room.building.toLowerCase()) && /\d/.test(prefix);

  return isLab || isLectureHall || isClassroomLike;
}
