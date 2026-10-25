/**
 * THD Deggendorf opening hours — the physical building hours that gate whether a
 * "free" room is actually reachable. THabella only knows about scheduled classes,
 * not the front door, so a room with no events still isn't usable at 03:00. This
 * caps free-room durations at closing time and drives the "Campus closed" state.
 *
 * Two schedules share one resolver:
 *   • `getCampusHours`  — classroom defaults (06:30–21:00), with explicit
 *     unconfirmed weekend/holiday access rather than a false opening promise.
 *   • `getLibraryHours` — the Joachim C. Römer Bibliothek (building G), which
 *     keeps its own, later hours and stays open on exam-period weekends. The
 *     Library hosts no THabella teaching, so it is surfaced separately as a
 *     study space rather than via free-room availability.
 *
 * Framework-free (domain layer). Source: THD published library/building hours.
 */
import type { ClassroomDay } from './campusCalendar.jsx';
/** Which hours table applies on a given date. */
export type CampusPeriod = 'regular' | 'exam' | 'break';
export interface CampusHours {
    /** Missing special-opening notices must not be presented as confirmed closure. */
    access?: ClassroomDay['access'];
    reason?: ClassroomDay['reason'];
    /** Active hours table at the reference time. */
    period: CampusPeriod;
    /** Whether the venue is open at the reference time. */
    open: boolean;
    /** Today's opening moment (even if the reference time is before/after it). */
    todayOpen: Date | null;
    /** Today's closing moment. */
    todayClose: Date | null;
    /** When the venue next opens, if currently closed (else null). */
    nextOpen: Date | null;
}
/** The active hours table for `date`. */
export declare function periodFor(date: Date): CampusPeriod;
/** Opening state of the general classroom buildings at `now`. */
export declare function getCampusHours(now: Date): CampusHours;
/** Confirmed whole-day closure; unknown access is not a closed-day fact. */
export declare function isCampusClosedDay(date: Date): boolean;
/** Rest days pause the streak; a product rule, distinct from building access. */
export declare function isFocusRestDay(date: Date): boolean;
/** Why the campus is shut for study that day (Christmas or a public holiday), or null. */
export declare function restReason(date: Date): 'christmas' | 'holiday' | null;
/** Opening state of the Library (building G) at `now` — its own schedule. */
export declare function getLibraryHours(now: Date): CampusHours;
/** Opening state of the Mensa canteen (building F, 1st floor lunch service) at `now`. */
export declare function getMensaCanteenHours(now: Date): CampusHours;
/** True when `key` is a cafeteria with published STWNO hours. */
export declare function isCafeteria(key: string): boolean;
/** Opening state of a cafeteria (map key GH / F / K) at `now`, or null if `key`
 *  is not a known cafeteria. */
export declare function getCafeteriaHours(now: Date, key: string): CampusHours | null;
/** Opening state of the copy shop (building C, room C 012) at `now`. */
export declare function getCopyShopHours(now: Date): CampusHours;
