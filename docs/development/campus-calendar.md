# Campus access calendar

Reviewed **18 October 2026**. Scope: ordinary student access to Deggendorf
classroom buildings; library and cafeteria schedules are separate.

## Sources and interpretation

- [THD house rules, 14 May 2024, §2, page 1](https://www.th-deg.de/Studierende/Antraege-und-Organisatorisches/Hochschulrecht/hausordnung_2024_de.pdf): default building hours **06:30–21:00**, subject to separate notices. The PDF is scanned; this was read from the original page. It does **not** establish a weekly Saturday/Sunday closure schedule. The old app's 07:00–20:00 classroom default was not supported by this document.
- [THD sustainability statement](https://www.th-deg.de/nachhaltigkeit): the university shuts during Christmas. Together with the [academic calendar](https://www.th-deg.de/de/studierende/antraege-und-organisatorisches) and [lecture-time statute, §1(4)](https://www.th-deg.de/Studierende/Antraege-und-Organisatorisches/Hochschulrecht/satzung_vorlesungzeiten.pdf), the app models the **24 December–6 January** shutdown across New Year. Earlier/later *lecture-free* days are not automatically physical closures.
- The lecture-time statute §2(4) specifies **Maundy Thursday–Easter Tuesday** and **Friday before Pentecost–Tuesday after Pentecost** as lecture-free. These move with Easter each year. They are annotated as **access unconfirmed**, not confirmed locked buildings. The same distinction applies to [statewide public holidays](https://www.gesetze-bayern.de/Content/Document/BayFTG-1). Assumption is included specifically for Deggendorf, where the city confirms its observance (source below).
- The published calendar names extra lecture-free days: 5 June / 2 November 2026; 28 May / 2 November 2027; 7 January 2028. These are dated entries, not rules copied into every year.
- [Library hours](https://www.th-deg.de/bib): regular Mon–Thu 08:30–20:00, Fri 08:30–18:00; semester-break Mon–Thu 09:30–16:30, Fri 09:30–13:00. The **library's** break hours must not be assigned to classroom buildings. ITC2 library study spaces have their own booking/access conditions and are not ordinary classroom access.
- [9 December 2025 library notice](https://www.th-deg.de/de/Presseartikel?id=42685201): main library 23 December 08:30–13:00; all library sites closed 24 December–6 January; exam extension **12 January–14 February 2026**.
- [16 June 2026 library notice](https://www.th-deg.de/de/Presseartikel?id=25029614): exam extension **22 June–31 July 2026**, Mon–Fri 08:30–23:45 / Sat–Sun 08:00–23:45. **3 July closes at 18:00.** Late/weekend entry uses the book-return entrance. These dated windows are not extrapolated into 2027.

## What the app can say

`shared/campusCalendar.js` is the common ISO-calendar policy used by the browser,
canvas cards and server link previews. `src/domain/openingHours.ts` resolves the
hour windows on the campus wall clock.

- **Scheduled:** a normal weekday uses the house-rule default. It is a published
  schedule, not a live lock sensor.
- **Closed:** the modeled Christmas shutdown. The next scheduled opening search
  crosses the full shutdown rather than stopping after seven days.
- **Unconfirmed:** weekends, Easter/Pentecost lecture breaks, public holidays and
  dated lecture-free days without a classroom access notice. The app withholds
  a free-room promise and explains the uncertainty before a student travels.
  An empty timetable does not establish that a building is accessible.

Library access remains independent: users can select its map card even when
classroom access is unconfirmed. No classroom exam-weekend opening or closure
has been inferred from the library notice. Current special notices should be
confirmed with THD before travelling.

## Study history and maintenance

Weekend streak pauses are a **product rest-day rule**, not evidence that every
building is locked. Weekends and confirmed shutdown dates pause the streak;
unverified lecture-free weekdays do not silently forgive a missing study day.
All recorded minutes remain in history and totals, including rest-day study.

The graph marks only empty confirmed-closure cells with a quiet slash; recorded
study stays on the violet/accent ramp. Unknown access never receives a confirmed
closure marker. Future cells remain empty. Phone cells remain readable and the
full rolling year can be reached by native scrolling, month selection, and
previous/newer/latest controls.

When a building-specific opening notice becomes available, add a dated,
source-linked override to the shared classroom policy and test its exact start,
end and next opening. Do not convert a lecture holiday or a library announcement
into a building-access fact. Re-review the official notices before adding a new
  exam-year window.

Local holiday source: [City of Deggendorf, Mariä Himmelfahrt remains a public holiday](https://www.deggendorf.de/rathaus/presse/mariae-himmelfahrt-bleibt-feiertag-in-deggendorf-41829). The policy therefore treats 15 August as a holiday requiring access confirmation for Deggendorf, without generalizing that municipality-specific rule to other campuses.
