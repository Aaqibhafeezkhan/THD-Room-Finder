export const CAMPUS_HOURS_SOURCE: string;
export const ACADEMIC_CALENDAR_SOURCE: string;
export type AcademicBreak = 'christmas' | 'easter' | 'pentecost' | 'lecture-free' | 'holiday';
export type ClassroomDay = {
  access: 'scheduled' | 'unconfirmed' | 'closed';
  reason: AcademicBreak | 'weekend' | null;
};
export function easterSunday(year: number): Date;
export function academicBreak(iso: string): AcademicBreak | null;
export function classroomDay(iso: string): ClassroomDay;
export function isClassroomClosedDate(iso: string): boolean;
export function isPublicHoliday(iso: string): boolean;
export function restDayReason(iso: string): 'christmas' | 'holiday' | null;
export function isStudyRestDate(iso: string): boolean;
