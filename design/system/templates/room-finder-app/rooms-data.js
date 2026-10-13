/* THD Room Finder template — sample room data + scenario availability.
   Rooms are generated deterministically from each building's {free,total}
   so the map tints, the building free-counts, and the room lists always
   agree. Swap this for a real THabella export in a consuming project. */
window.RF_ROOMS = (function () {
  // Scenario overrides: {buildingKey: [free, total]}. "now" uses the
  // campus-data defaults. Keep in sync with the CampusMap card.
  const SCEN = {
    now: {},
    plus2: { B: [6, 10], E: [12, 20], K: [5, 8], I: [9, 16], G: [11, 16], C: [18, 22], H: [10, 12], ITC2: [15, 20], HS: [8, 10], DEGG: [6, 8] },
    thu14: { A: [3, 14], C: [5, 22], D: [4, 18], H: [2, 12], J: [3, 12], L: [6, 20], ITC2: [4, 20], G: [2, 16], DEGG: [1, 8], V2: [2, 12], HS: [2, 10] },
  };

  const SCEN_LABEL = { now: 'right now', plus2: 'in 2 hours', thu14: 'Thu 14:00' };

  // Per-building flavour: floor span, seat pool, facility pool, contact.
  const FAC = ['Projector', 'Whiteboard', 'Dual monitors', 'Lecture hall', 'Group room', 'Mic', 'Linux lab', 'Auditorium'];
  const COURSES = ['Databases', 'Web Eng.', 'HCI', 'AI', 'Machine Learning', 'Maths I', 'Statics', 'Control Systems', 'Marketing', 'Signals'];
  const KINDS = ['Lecture', 'Seminar', 'Lab', 'Tutorial', 'Exam'];

  // tiny deterministic hash → 0..1
  function h(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return ((x >>> 0) % 1000) / 1000; }
  const pick = (arr, s) => arr[Math.floor(h(s) * arr.length) % arr.length];
  const SEATS = [16, 20, 24, 30, 36, 45, 60, 80, 120];

  // "HH:MM" from minutes-since-midnight; compact "Xh Ym" duration label.
  const NOW = 11 * 60 + 30; // reference "now" = 11:30
  const SOON_MINS = 40;     // free but closing within 40 min → "soon"
  function fmtClock(m) { const hh = Math.floor(m / 60) % 24, mm = m % 60; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }
  function fmtDur(m) { const hh = Math.floor(m / 60), mm = m % 60; if (hh && mm) return hh + 'h ' + mm + 'm'; if (hh) return hh + 'h'; return mm + 'm'; }

  function availFor(scenario, campus) {
    const a = {};
    campus.features.forEach(f => {
      const p = f.properties, o = SCEN[scenario] && SCEN[scenario][p.key];
      a[p.key] = { free: o ? o[0] : p.free, total: o ? o[1] : p.total };
    });
    return a;
  }

  function totalFree(scenario, campus) {
    const a = availFor(scenario, campus);
    return Object.values(a).reduce((s, x) => s + x.free, 0);
  }

  // Generate the room list for one building + scenario.
  function roomsFor(key, label, scenario, campus) {
    const a = availFor(scenario, campus)[key] || { free: 0, total: 0 };
    const { free, total } = a;
    const floors = 1 + Math.floor(h(key) * 3); // 1..3 floors above ground
    const rooms = [];
    for (let i = 0; i < total; i++) {
      const floor = i % (floors + 1); // 0..floors
      const n = 1 + Math.floor(i / (floors + 1));
      // ident prefix uses the unique building KEY (labels like "ITC²" and
      // "ITC²+" would otherwise collide after stripping superscripts).
      const ident = key + '.' + floor + String(n).padStart(2, '0');
      // even spread of exactly `free` free rooms across the list
      const isFree = Math.floor(((i + 1) * free) / total) > Math.floor((i * free) / total);
      const seats = SEATS[Math.floor(h(ident) * SEATS.length)];
      const facCount = 1 + Math.floor(h(ident + 'f') * 2);
      const facilities = [];
      for (let k = 0; k < facCount; k++) { const fac = pick(FAC, ident + 'f' + k); if (!facilities.includes(fac)) facilities.push(fac); }
      const allDay = isFree && h(ident + 'a') > 0.55;
      // Minutes this room stays free from "now" (deterministic 25..324).
      const freeMins = allDay ? null : (25 + Math.floor(h(ident + 'u') * 300));
      const freeUntil = allDay ? null : fmtClock(NOW + freeMins);
      const occUntilH = 11 + Math.floor(h(ident + 'o') * 3); // 11..13
      const occUntil = String(occUntilH).padStart(2, '0') + (h(ident + 'm') > 0.5 ? ':30' : ':00');

      // Answer-first status + duration hero.
      const status = !isFree ? 'occupied'
        : allDay ? 'free'
        : (freeMins <= SOON_MINS ? 'soon' : 'free');
      const duration = !isFree ? ('until ' + occUntil)
        : allDay ? 'all day'
        : fmtDur(freeMins);
      // longest-free first; all-day sorts to the very top.
      const rank = !isFree ? -1 : (allDay ? 100000 : freeMins);

      // schedule
      const schedule = [];
      const slots = ['08:00', '09:45', '11:30', '13:15', '15:00', '16:45'];
      for (let s = 0; s < slots.length - 1; s++) {
        const busy = h(ident + 's' + s) > (isFree ? 0.74 : 0.45);
        const active = !isFree && s === 2; // the 11:30 slot is "now"
        if (busy || active) {
          const kind = pick(KINDS, ident + 'k' + s), course = pick(COURSES, ident + 'c' + s);
          schedule.push({ time: slots[s] + '–' + slots[s + 1], type: kind + ' · ' + course, dur: 90, active });
        }
      }

      rooms.push({
        ident, name: ident, building: label, floor, seats, isFree,
        allDay, freeUntil, occUntil, freeMins, status, duration, rank, facilities,
        email: (key === 'ITC2' || key === 'ITC2P') ? 'itc@th-deg.de' : 'fm@th-deg.de',
        schedule: schedule.sort((x, y) => x.time.localeCompare(y.time)),
      });
    }
    // free rooms first, then longest-free first (duration-ranked), then code.
    return rooms.sort((x, y) => (y.isFree - x.isFree) || (y.rank - x.rank) || x.ident.localeCompare(y.ident));
  }

  return { SCEN, SCEN_LABEL, availFor, totalFree, roomsFor };
})();
