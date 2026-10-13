# Market research and evidence register

> **Research snapshot, 10 October 2026.** Kept for its evidence and reasoning. Where it conflicts with the [charter](../../../PROJECT-CHARTER.md) or the [focus sessions spec](../focus-sessions.md), those win.

Checked **10 October 2026**, Europe/Berlin. Method: local code/documentation inspection, public web research, and browser interaction with both room finders, Gründercafé, and the THD events page. No private competitor source, authenticated myTHD account, private social groups, analytics, or organizer interviews were accessed. Screenshots supplied by the maintainer are context, not independent verification; personal names, phone numbers, and private chat contents are deliberately omitted.

## Product comparison

| Product/channel | Evidence and status | Implication for this project |
|---|---|---|
| [THD Room Finder](https://thd-room-finder.vercel.app/) | Observed: map, Campus/Rooms/Saved, campus-closed state, Monday preview, room schedule. Source confirms EN/DE, themes, filters, local favorites, PWA and Android. | Existing foundation is substantially broader than a binary room list. Prioritize trust and coordination. |
| [Other room finder](https://my-uni-room-finder.vercel.app/) | Landing page advertises social check-ins as in progress, hardware filters and schedule integration as planned. `/app` initially stayed loading, then displayed photographic building cards with counts; A Building opened a list with capacities and remaining-day labels. Clicking A012 produced no visible detail change in this session. | Building-first discovery is shared. Different presentation is observable; implementation lineage is unknown. Advertised plans are not evidence of shipped behavior. |
| [myTHD](https://play.google.com/store/apps/details?id=com.uninow.thdeg) | Official listing and THD overview describe academic and campus services. Authenticated app behavior was not tested. | Treat it as an established companion, not an empty space to replace. |
| [THD events](https://www.th-deg.de/en/students/campus-life/event-calender) | Browser showed date/language/audience/facility filters, dated venue listings, login-required event submission, and a separate room/outdoor reservation link. | Existing official publishing and reservation workflows must remain visible. Public calendar does not establish an API or reuse permission. |
| [Gründercafé THD](https://thd.gruendercafe.com/) | Public landing page advertises founder profiles, AI matching, introductions, chat/video, and events. THD links it from its entrepreneurship site. No account created; matching quality and advertised integrations unverified. | Link founder networking outward. Explore casual coworking and meeting logistics without rebuilding founder matching. |
| [Doodle](https://help.doodle.com/en/articles/9457353-how-do-i-create-a-group-poll) | External pattern reference: slot voting and organizer finalization; no local adoption evidence. | Voting alone is not differentiation; campus-place selection could be. |
| [Meetup](https://www.meetup.com/start/meet-new-people/) | External category reference for groups, events and RSVPs; maintainer does not report common local use. | Compare practical tasks against existing chat groups rather than presuming local competition from Meetup. |
| WhatsApp/Instagram | Maintainer reports fragmented discovery. Public club pages link social channels; no private feed was inspected. | Share links into existing channels. “Most events are only on Instagram” remains unproven. |

Counts are transient, not a comparable accuracy benchmark: one app showed current Saturday data while our preview queried Monday. Different eligibility and access policies can also produce different totals.

## Existing university and community ecosystem

[THD Campus life](https://www.th-deg.de/en/students/campus-life) lists ESN Deggendorf, United AI, Burning Cinema, CoME, consult-it!, WI-Project, RESP in Pfarrkirchen, and other associations. It also describes student representation, club networking, and event newsletters. The German page describes myTHD's timetable, exams, grades, email, iLearn, canteen, jobs, calendar, to-dos, news, and campus-specific channels. These are published descriptions; some sections contain older semester references, so current organizer activity requires confirmation.

| Potential pilot | Verified public entry point | Proposed interview/pilot, not an agreed partnership |
|---|---|---|
| Fast Forest | THD's [2026 first-semester campus tour](https://www.th-deg.de/Studierende/Antraege-und-Organisatorisches/infos-fuer-erstsemester/Lageplan_Erstsemestertag_SoSe_2026.pdf) lists the Formula Student team; [team website](https://www.fast-forest.de/) could not be loaded | Maintainer reports 80+ members, an off-site workshop/garage and occasional recruitment/full-team campus meetings, probably in B; test directions to an organizer-selected venue, not an assumption they need free classrooms daily |
| ESN Deggendorf | [Official section website](https://deggendorf.esn-germany.de/) linked by THD; fetched content was minimal | Maintainer recalls Instagram/WhatsApp distribution, small evening campus events and off-campus parties; test language, arrival/source links and venue privacy |
| United AI | [Club website](https://www.united-ai.net/) linked by THD; direct fetch failed | Maintainer describes a social club with recruitment/social events, not project work; recalls a top-floor library-building office. Confirm organizer-approved event venues instead of publishing an inferred office location |
| CAMPUS CONNECT Deggendorf | [Local group page](https://www.campus-connect.de/deggendorf/) describes a Christian student community and links Instagram/WhatsApp; meeting information is labeled summer semester 2026 | Maintainer recalls weekly gatherings, semester game nights and possibly Bible Thursdays, with uncertainty; confirm current recurrence before showing any occurrence |
| Student convention | THD Campus life directory | Distribution, event duplication, space permissions, and moderation ownership |
| Burning Cinema / CoME / WI-Project | THD directory | Test cinema arrival instructions and degree-related project meetups |
| RESP / ECRI students | THD directory and [ECRI](https://www.th-deg.de/en/ecri-campus) | Find a campus-local maintainer before expanding maps |
| Startup Campus / entrepreneurship support | [THD's official description](https://www.th-deg.de/landing-pages/sa-study-at-dit/dit-26.pdf) names Startup Campus and describes ITC1 coworking/events | Link founder support and organizer-selected networking/brunch events; Startup Campus is not a synonym for the Pfarrkirchen campus or an assumed student club |

The screenshot's “Only AI” label does not establish that it is United AI. Do not conflate the names without asking the organizer. Gründercafé and CAMPUS CONNECT are separate services.

The maintainer's spoken “Fast Forward” likely refers to **Fast Forest**; preserve that identification as an interpretation until confirmed. The 2026 official freshers tour additionally lists **First Contact, Market Mavens, VWI, VDBau, KHG/ESG, Hochschulsport**, student convention and Startup Campus. This expands the candidate directory, not an assertion that every group currently needs our product. Avoid a “largest club” ranking without comparable membership figures.

The maintainer reports United AI using WhatsApp Community and Discord and Fast Forest using Teams. These are useful interview leads, not verified private-channel observations. A directory should link to organizer-approved channels and retain a last-checked date rather than import private conversations.

Additional maintainer context: Burning Cinema is perceived as large, organized and active; campus/off-campus festivals, university parties and networking brunches may matter alongside club events. These are leads for organizer interviews, not an exhaustive verified calendar. Exams belong to academic context and should not be scraped into a social-event feed or replace myTHD.

**Terminology:** ECRI means European Campus Rottal-Inn, THD's study location in **Pfarrkirchen**. RESP is an association named in THD's directory, not another campus. Expand unfamiliar abbreviations in student-facing copy. The spoken “ESB” was not resolved and is not treated as a newly identified organization. Startup Campus is university entrepreneurship support; Gründercafé is a separate founder-networking service.

Do not publish remembered private-party addresses, the uncertain ESN residence near the station, a workshop address or an office as public event destinations. Only the organizer's explicit public venue for a specific event should become a marker.

## Where information travels

Observed channels include the official event calendar, university app/news channels, organizer websites, public social links, and student-representation newsletters. These have different owners and audiences; fragmentation is a reasonable hypothesis, but missing universal coverage is not proven.

The calendar currently lists examples such as a cinema event in J007, an overseas-study information session in I009, and a founders meetup in Pfarrkirchen. It also includes online and external events. A future campus overlay therefore needs venue resolution, campus identity, online/hybrid labels, duplicate handling, and filtering; not every listing belongs on the Deggendorf map. [Source: THD events](https://www.th-deg.de/en/students/campus-life/event-calender).

An event listing is not a room booking. The university exposes separate submission and reservation routes. Do not submit test events or reserve rooms during research.

## Geographic and city expansion

[ECRI in Pfarrkirchen](https://www.th-deg.de/en/ecri-campus) and [Campus Cham](https://www.th-deg.de/campus-cham-en) are verified THD locations. Current source restricts the map to Deggendorf's core while the Rooms list can include remote rooms. Building letters alone are therefore insufficient identifiers. A future campus switcher must scope schedules, geometry, amenities, and access hours independently.

[Deggendorf's city calendar](https://www.deggendorf.de/veranstaltungen) accepts submitted events following review. The [museum events page](https://stadtmuseum.deggendorf.de/veranstaltungen) provides another authoritative discovery destination. Start with links or organizer-approved summaries; no city feed license, API, or partnership was established. Town discovery should remain optional so finding a study room stays immediate.

The maintainer emphasizes printed exhibition/event brochures in museums and public places and has not used the city calendar. Website availability is not evidence of local website adoption. The museum publishes dated program booklets, including a [2025 edition](https://stadtmuseum.deggendorf.de/media/Programmheft_2025-II_K_neu.pdf); treat a booklet as an edition with expiry, not a live feed.

Prefer a small cultural-place layer: library, Stadtmuseum, Handwerksmuseum and relevant gallery/venue entrances, with sourced opening status and exhibition links. The city describes Stadtgalerie within Stadtmuseum, so the spoken four-building model needs verification. [Venue description](https://stadtmuseum.deggendorf.de/veranstaltungen/event/kunst-duenger-grosse-ostbayerische-kunstausstellung). Bavaria's museum advisory service lists Stadtmuseum Deggendorf among [fabulAPP participants](https://museumsberatung-bayern.de/fabulapp); link to the existing museum experience rather than rebuild a museum guide. Its installed app was not tested.

Festival/Christmas-market pins are another candidate, provided each occurrence has a verified source, dates and automatic expiry. See [map expansion](map-expansion.md) for the actual technical reuse assessment and [interaction research](interaction-research.md) for focus/event products.

## Unverified session observations

On Saturday 10 October, our live app showed campus closed and offered Monday 12 October at 07:00. The resulting room list initially showed 122 rooms and A012 as free for 13h. Opening A012 then showed one hour free until 08:00, with lectures in its Monday schedule. The preview heading said “free right now.” No controlled same-snapshot reproduction or root-cause analysis established an application defect. Upstream data, refresh timing and researcher interpretation remain possible explanations. The maintainer reports the app is reliable and disputes making this a priority. Keep the observation as a follow-up if reproduced; it is **not a mandatory blocker or a confirmed reliability problem** in the revised roadmap.

The other application's B/C building images appeared broken in the browser screenshot. Its room list showed remaining-day availability on Saturday. These are session observations, not conclusions about general reliability, access permissions, or data freshness.

## Research gaps and next evidence

- Ask 8–12 students across study stages, languages, and campuses to describe their last attempted group meeting. Include people who do not use either app.
- Ask 3–5 organizers where they publish, who updates cancellations, how rooms are booked, and whether extra tooling saves time.
- Observe 5 students completing room search, a shared-plan task, and source verification. Record time, wrong turns, and whether they need myTHD to interpret our result.
- Confirm room reuse rules, holiday hours, accessibility information, event reuse rights, and whether supported feeds exist with their owners.
- Ask the other developer for a voluntary source/dependency review. Do not infer provenance from use of the same public API.
- No total addressable market, adoption rate, retention baseline, willingness to pay, or “unique in all universities” claim is supported yet.

## Technical reference sources

- [WebKit: Web Push on iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/): Home Screen web apps gained push support in 16.4, with permission requested through user interaction. This is a platform baseline, not a current device test.
- [web.dev: installation prompt](https://web.dev/learn/pwa/installation-prompt/): install UX differs by platform; an install banner is not universal.
- [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html): distinguishes distribution of browser JavaScript from server-side execution. See the collaboration note for limits.
- Repository evidence: `src/app/AppShell.tsx`, `src/features/campus/CampusScreen.tsx`, `src/features/rooms/RoomDataContext.tsx`, `src/features/detail/RoomDetailScreen.tsx`, `vite.config.ts`, and `LICENSE`, inspected at parent HEAD `777347e`.

External claims above were checked on the research date. Refresh source claims before treating them as implementation requirements. Landing-page claims about AI quality, rankings, verified users, funding, or compliance were not independently audited and are not adopted as facts.
