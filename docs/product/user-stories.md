# User stories

Phase 1 stories map to GitHub issues under epic
[#16](https://github.com/arudaev/THD-Room-Finder/issues/16). IDs are stable
references for design and tests; the issue is the source of truth for
acceptance criteria.

## Phase 1 — Focus sessions

| ID | As a student, I want… | So that… | Issue |
|---|---|---|---|
| RF-01 | rooms ordered by how long they stay free, with claimed and lecture rooms lower | I find a room I can stay in | [#20](https://github.com/arudaev/THD-Room-Finder/issues/20) |
| RF-02 | my saved rooms in my Profile with live status | my usual spot is one tap away | [#37](https://github.com/arudaev/THD-Room-Finder/issues/37) |
| ID-01 | to set my programme and intake once and be shown as "AIN 7" | I never re-enter it each semester | [#18](https://github.com/arudaev/THD-Room-Finder/issues/18) |
| ID-02 | to keep using the app without an account | trying it costs nothing | [#18](https://github.com/arudaev/THD-Room-Finder/issues/18) |
| FS-01 | to start a focus session from room detail in one tap | starting is easier than not starting | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19) |
| FS-02 | my session to be private by default but still claim the room | others know the room is in use without knowing it is me | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19) |
| FS-03 | to switch my session to public for my batch | classmates can come and study with me | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19), [#20](https://github.com/arudaev/THD-Room-Finder/issues/20) |
| FS-04 | my session to keep running while my phone is locked | I can actually put the phone away | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19) |
| FS-05 | forgotten sessions to end on their own | rooms are not falsely claimed for hours | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19) |
| BS-01 | to see on the map where my batch is studying | I can join them | [#20](https://github.com/arudaev/THD-Room-Finder/issues/20) |
| BS-02 | a quiet preference that treats all activity as claimed | I find rooms where I can be alone | [#20](https://github.com/arudaev/THD-Room-Finder/issues/20) |
| FG-01 | a graph of my focus days with streak and totals | I see my consistency | [#38](https://github.com/arudaev/THD-Room-Finder/issues/38) |
| FG-02 | to share my graph as an image without my profile | I can show my progress anywhere | [#38](https://github.com/arudaev/THD-Room-Finder/issues/38) |
| AP-01 | to choose my personal focus accent | the app feels like mine | [#37](https://github.com/arudaev/THD-Room-Finder/issues/37) |
| AX-01 | every map signal also in the list, labelled, keyboard and screen-reader friendly | I am not excluded by colour or touch | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21), [#22](https://github.com/arudaev/THD-Room-Finder/issues/22) |
| PV-01 | outsiders never to learn who is in a private session | sharing feels safe | [#17](https://github.com/arudaev/THD-Room-Finder/issues/17), [#22](https://github.com/arudaev/THD-Room-Finder/issues/22) |
| OP-01 | (maintainer) bounded requests and a cost ceiling | the project stays affordable | [#17](https://github.com/arudaev/THD-Room-Finder/issues/17), [#22](https://github.com/arudaev/THD-Room-Finder/issues/22) |

## v2.6 — Focus at home

Spec: [focus at home and session sounds](focus-at-home.md). Epic [#187](https://github.com/arudaev/THD-Room-Finder/issues/187).

| ID | As a student, I want… | So that… | Issue |
|---|---|---|---|
| HF-01 | to start a focus session at home in one tap | I use the same rhythm at home | [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |
| HF-02 | to find my running session from anywhere | I never hunt for the timer | [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |
| HF-03 | a home session without campus rules | lectures and closing times don't cut my evening | [#189](https://github.com/arudaev/THD-Room-Finder/issues/189) |
| HF-04 | nobody to see my home sessions | studying at home stays private | [#189](https://github.com/arudaev/THD-Room-Finder/issues/189) |
| HF-05 | a way to focus when the campus is closed | the app isn't a dead end at night | [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |
| HF-06 | to know what happens to my other session | I don't lose a campus claim by accident | [#189](https://github.com/arudaev/THD-Room-Finder/issues/189), [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |
| HF-07 | weekend study to count for my streak | the streak rewards what I actually did | [#189](https://github.com/arudaev/THD-Room-Finder/issues/189) |
| HF-08 | notifications that say where I am | the lock screen makes sense | [#189](https://github.com/arudaev/THD-Room-Finder/issues/189) |
| HF-09 | the same on tablet and desktop | I can focus at my laptop | [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |
| SN-01–05, SN-07 | sounds for break, break's over and done, per place, with a preview and a mute | I notice breaks and come back on time | [#191](https://github.com/arudaev/THD-Room-Finder/issues/191) |
| SN-06 | to hear them with the phone locked | I can put the phone away | [#192](https://github.com/arudaev/THD-Room-Finder/issues/192) |
| BT-01 | a nudge for what to do in a break | the break actually rests me | [#190](https://github.com/arudaev/THD-Room-Finder/issues/190) |

## Later phases

Shipped: study tables (ST stories in [study-tables.md](study-tables.md)) and
student groups (O stories in [organizations.md](organizations.md)). The rest
are issues still to be specified before building.

| ID | As a student, I want… | So that… | Issue |
|---|---|---|---|
| PF-01 | a unique handle next to my display name | classmates can tell two "Lena"s apart | [#207](https://github.com/arudaev/THD-Room-Finder/issues/207) |
| GF-02 | to follow a few classmates and see their public sessions first | I find my friends, not just my batch | [#208](https://github.com/arudaev/THD-Room-Finder/issues/208) |
| GF-03 | a study table without a room | my group can focus together from home | [#209](https://github.com/arudaev/THD-Room-Finder/issues/209) |
| GF-04 | a study table that repeats every week | my group keeps one link | [#210](https://github.com/arudaev/THD-Room-Finder/issues/210) |
| GF-05 | to see a table's shared focus | the group sees its effort add up | [#211](https://github.com/arudaev/THD-Room-Finder/issues/211) |
| GF-06 | to report that a claimed room is empty | stale claims don't push rooms down | [#212](https://github.com/arudaev/THD-Room-Finder/issues/212) |
| OR-02 | (maintainer) a decision on the paid tier | M3 can close or continue | [#213](https://github.com/arudaev/THD-Room-Finder/issues/213) |
| OR-03 | (organizer) a gathering that repeats every week | I don't recreate it | [#214](https://github.com/arudaev/THD-Room-Finder/issues/214) |
| OR-04 | (reviewer) to hide a reported gathering, on record | misuse stops without revoking a group | [#215](https://github.com/arudaev/THD-Room-Finder/issues/215) |
| CT-00 | (maintainer) to know which city sources may be reused | the layer stays legal | [#216](https://github.com/arudaev/THD-Room-Finder/issues/216) |
| CT-01 | the town centre on the map | events have a place | [#217](https://github.com/arudaev/THD-Room-Finder/issues/217) |
| CT-02 | what is happening this weekend, as yellow zones | I find something to do | [#218](https://github.com/arudaev/THD-Room-Finder/issues/218) |
| CT-03 | museums and venues with their current exhibitions | I see what is on | [#219](https://github.com/arudaev/THD-Room-Finder/issues/219) |
| CT-04 | (maintainer) events that refresh themselves | the layer doesn't go stale | [#220](https://github.com/arudaev/THD-Room-Finder/issues/220) |
