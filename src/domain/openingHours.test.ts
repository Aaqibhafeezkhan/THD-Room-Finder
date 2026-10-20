import { isCampusClosedDay } from './openingHours';
import { describe, expect, it } from 'vitest';
import {
  getCafeteriaHours,
  getCampusHours,
  getCopyShopHours,
  getLibraryHours,
  getMensaCanteenHours,
  isCafeteria,
  periodFor,
} from './openingHours';

// Local Date constructor (year, monthIndex, day, hours, minutes).
const dt = (y: number, m: number, d: number, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm);

describe('periodFor', () => {
  it('classifies the 2026 exam-prep window', () => {
    expect(periodFor(dt(2026, 6, 22))).toBe('exam');
    expect(periodFor(dt(2026, 7, 5))).toBe('exam');
    expect(periodFor(dt(2026, 7, 31))).toBe('exam');
  });

  it('classifies the semester breaks', () => {
    expect(periodFor(dt(2026, 2, 20))).toBe('break');
    expect(periodFor(dt(2026, 3, 14))).toBe('break');
    expect(periodFor(dt(2026, 8, 15))).toBe('break');
    expect(periodFor(dt(2026, 9, 30))).toBe('break');
  });

  it('falls back to regular semester hours otherwise', () => {
    expect(periodFor(dt(2026, 5, 12))).toBe('regular');
    expect(periodFor(dt(2026, 11, 3))).toBe('regular');
  });
});

describe('getCampusHours', () => {
  it('uses the house-rule 06:30–21:00 classroom default on a normal weekday', () => {
    const h = getCampusHours(dt(2026, 5, 13, 7, 15)); // Wed, just after open
    expect(h.open).toBe(true);
    expect(h.todayOpen).toEqual(dt(2026, 5, 13, 6, 30));
    expect(h.todayClose).toEqual(dt(2026, 5, 13, 21, 0));
  });

  it('stays open on a regular Friday evening until 20:00', () => {
    const h = getCampusHours(dt(2026, 5, 15, 19, 0)); // Fri
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 5, 15, 21, 0));
  });

  it('withholds unconfirmed Saturday access and gives the next scheduled weekday', () => {
    const h = getCampusHours(dt(2026, 5, 16, 12, 0)); // Sat
    expect(h.open).toBe(false);
    expect(h.access).toBe('unconfirmed');
    expect(h.nextOpen).toEqual(dt(2026, 5, 18, 6, 30)); // Mon
  });

  it('reports next opening later the same day when before opening time', () => {
    const h = getCampusHours(dt(2026, 5, 13, 6, 0)); // Wed pre-open
    expect(h.open).toBe(false);
    expect(h.nextOpen).toEqual(dt(2026, 5, 13, 6, 30));
  });

  it('keeps normal weekday hours during the exam window (Library stays late)', () => {
    const h = getCampusHours(dt(2026, 7, 1, 19, 0)); // Wed in exam window
    expect(h.period).toBe('exam');
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 7, 1, 21, 0));
  });

  it('does not infer classroom exam-weekend access from the library announcement', () => {
    const h = getCampusHours(dt(2026, 7, 4, 19, 0)); // Sat in exam window
    expect(h.period).toBe('exam');
    expect(h.open).toBe(false);
    expect(h.access).toBe('unconfirmed');
  });

  it('does not copy library break hours into the classroom schedule', () => {
    const h = getCampusHours(dt(2026, 8, 12, 15, 0)); // Wed in Aug break
    expect(h.period).toBe('break');
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 8, 12, 21, 0));
  });
});

describe('getLibraryHours', () => {
  it('opens at 08:30 on a regular weekday, not 07:00', () => {
    const early = getLibraryHours(dt(2026, 5, 13, 7, 30)); // Wed before library open
    expect(early.open).toBe(false);
    expect(early.nextOpen).toEqual(dt(2026, 5, 13, 8, 30));
    const later = getLibraryHours(dt(2026, 5, 13, 9, 0));
    expect(later.open).toBe(true);
    expect(later.todayClose).toEqual(dt(2026, 5, 13, 20, 0));
  });

  it('closes at 18:00 on a regular Friday', () => {
    const h = getLibraryHours(dt(2026, 5, 15, 19, 0)); // Fri after library close
    expect(h.open).toBe(false);
    expect(getLibraryHours(dt(2026, 5, 15, 17, 0)).todayClose).toEqual(dt(2026, 5, 15, 18, 0));
  });

  it('is open on an exam-period Saturday evening until 23:45', () => {
    const h = getLibraryHours(dt(2026, 7, 4, 19, 37)); // Sat in exam window
    expect(h.period).toBe('exam');
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 7, 4, 23, 45));
  });
});

describe('getCafeteriaHours', () => {
  it('recognises the cafeteria map keys', () => {
    expect(isCafeteria('GH')).toBe(true);
    expect(isCafeteria('F')).toBe(true);
    expect(isCafeteria('K')).toBe(true);
    expect(isCafeteria('A')).toBe(false);
    expect(getCafeteriaHours(dt(2026, 5, 13, 10, 0), 'A')).toBeNull();
  });

  it('opens the Glashaus Mon–Fri 07:30–14:00 in term/exam', () => {
    const h = getCafeteriaHours(dt(2026, 5, 13, 10, 0), 'GH')!; // Wed regular
    expect(h.open).toBe(true);
    expect(h.todayOpen).toEqual(dt(2026, 5, 13, 7, 30));
    expect(h.todayClose).toEqual(dt(2026, 5, 13, 14, 0));
    expect(getCafeteriaHours(dt(2026, 5, 13, 14, 30), 'GH')!.open).toBe(false);
  });

  it('shortens the Glashaus to 07:30–12:00 during the break', () => {
    const h = getCafeteriaHours(dt(2026, 8, 12, 11, 0), 'GH')!; // Wed break
    expect(h.period).toBe('break');
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 8, 12, 12, 0));
  });

  it('closes the Mensa cafeteria earlier on Fridays (15:30)', () => {
    expect(getCafeteriaHours(dt(2026, 5, 13, 16, 30), 'F')!.open).toBe(true); // Wed 17:00
    const fri = getCafeteriaHours(dt(2026, 5, 15, 16, 0), 'F')!; // Fri after 15:30
    expect(fri.open).toBe(false);
    expect(getCafeteriaHours(dt(2026, 5, 15, 15, 0), 'F')!.todayClose).toEqual(
      dt(2026, 5, 15, 15, 30),
    );
  });

  it('opens the Kaffeebar 09:30–13:30 in term but is closed over the break', () => {
    const term = getCafeteriaHours(dt(2026, 5, 13, 10, 0), 'K')!; // Wed regular
    expect(term.open).toBe(true);
    expect(term.todayClose).toEqual(dt(2026, 5, 13, 13, 30));
    expect(getCafeteriaHours(dt(2026, 8, 12, 11, 0), 'K')!.open).toBe(false); // Aug break
  });
});

describe('getMensaCanteenHours', () => {
  it('serves lunch 11:00–14:15 in term/exam, distinct from the ground-floor café', () => {
    const h = getMensaCanteenHours(dt(2026, 5, 13, 12, 0)); // Wed regular, mid-lunch
    expect(h.open).toBe(true);
    expect(h.todayOpen).toEqual(dt(2026, 5, 13, 11, 0));
    expect(h.todayClose).toEqual(dt(2026, 5, 13, 14, 15));
  });

  it('is closed before 11:00 and after 14:15, even though the café is still open', () => {
    const before = getMensaCanteenHours(dt(2026, 5, 13, 8, 0)); // café is open 07:30–17:00
    expect(before.open).toBe(false);
    expect(before.nextOpen).toEqual(dt(2026, 5, 13, 11, 0));

    const after = getMensaCanteenHours(dt(2026, 5, 13, 15, 0)); // café still open until 17:00
    expect(after.open).toBe(false);
  });

  it('shortens to 11:00–14:00 during the break', () => {
    const h = getMensaCanteenHours(dt(2026, 8, 12, 13, 30)); // Wed break
    expect(h.period).toBe('break');
    expect(h.open).toBe(true);
    expect(h.todayClose).toEqual(dt(2026, 8, 12, 14, 0));
  });
});

describe('getCopyShopHours', () => {
  it('opens Mon–Thu 09:00–14:00 in term/exam', () => {
    const h = getCopyShopHours(dt(2026, 5, 13, 10, 0)); // Wed regular
    expect(h.open).toBe(true);
    expect(h.todayOpen).toEqual(dt(2026, 5, 13, 9, 0));
    expect(h.todayClose).toEqual(dt(2026, 5, 13, 14, 0));
  });

  it('is closed on Fridays and weekends', () => {
    const fri = getCopyShopHours(dt(2026, 5, 15, 10, 0)); // Fri
    expect(fri.open).toBe(false);
    expect(fri.nextOpen).toEqual(dt(2026, 5, 18, 9, 0)); // next Mon

    const sat = getCopyShopHours(dt(2026, 5, 16, 10, 0)); // Sat
    expect(sat.open).toBe(false);
  });

  it('is closed during the semester break (no published break hours)', () => {
    const h = getCopyShopHours(dt(2026, 8, 12, 11, 0)); // Wed break
    expect(h.period).toBe('break');
    expect(h.open).toBe(false);
  });
});


describe('whole-day campus closures for focus', () => {
  it('marks Christmas closure at every hour, across New Year', () => {
    for (const hour of [0, 10, 23]) {
      expect(isCampusClosedDay(dt(2026, 12, 25, hour))).toBe(true);
      expect(isCampusClosedDay(dt(2027, 1, 4, hour))).toBe(true);
    }
    expect(getCampusHours(dt(2026, 12, 24, 10)).nextOpen).toEqual(dt(2027, 1, 7, 6, 30));
  });

  it('does not mistake semester breaks or unconfirmed Easter/weekend access for closure', () => {
    expect(isCampusClosedDay(new Date(2026, 8, 1))).toBe(false);
    expect(isCampusClosedDay(dt(2026, 4, 2))).toBe(false);
    expect(getCampusHours(dt(2026, 4, 2, 10)).access).toBe('unconfirmed');
    expect(isCampusClosedDay(dt(2026, 10, 11))).toBe(false);
  });

  it('honours both dated 2026 library exam windows and the festival exception', () => {
    expect(getLibraryHours(dt(2026, 1, 17, 20)).open).toBe(true);
    expect(getLibraryHours(dt(2026, 7, 3, 19)).todayClose).toEqual(dt(2026, 7, 3, 18));
    expect(getLibraryHours(dt(2027, 1, 17, 20)).open).toBe(false);
    expect(getLibraryHours(dt(2025, 12, 23, 14)).todayClose).toEqual(dt(2025, 12, 23, 13));
  });
});
