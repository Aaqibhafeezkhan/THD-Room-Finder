# THabella API reference

THabella is THD's public scheduling system. It has **no official public API
documentation**; these endpoints were reverse-engineered from its web
front end. They can change without notice, so the app parses every field
defensively.

| | |
|---|---|
| Base URL | `https://thabella.th-deg.de/thabella/opn/` |
| Auth | None |
| Method | `POST` with a JSON body |
| Client | `src/data/thabellaClient.ts` (web through `api/`, Android direct) |
| Be kind | Cache aggressively; never load-test THabella |

## Endpoints

| Endpoint | Body | Returns | App cache | Proxy CDN cache |
|---|---|---|---|---|
| `POST room/findRooms` | `{}` | `RoomDto[]` (about 290 rooms) | 24 h | `s-maxage=86400` |
| `POST period/findByDate/{yyyy-MM-dd HH:mm}` | `{"sqlDate":"yyyy-MM-dd HH:mm"}` | `PeriodDto[]` for that day | 5 min | `s-maxage=300` |

The date in the path is URL-encoded (`2026-10-13%2008:00`) and repeated in
`sqlDate`. The teaching-room set (rooms with at least one event Monday to
Friday) is derived from a week of `findByDate` calls and cached for 24 h.

## When THabella doesn't answer

[ADR 0009](adr/0009-timetable-outages.md) has the reasoning. In short:

- The proxies (`api/_thabella.js`, shared with the Vite dev proxy) give up
  after 8 s and answer 504, or 502 for anything that isn't a JSON array.
  Failures are sent with `Cache-Control: no-store`.
- Rooms fall back to the last good copy, then to the bundled
  `src/data/fallbackRooms.json`. A day's events fall back only to an earlier
  copy of the same day. The teaching set falls back to an earlier week, dated.
- A day nobody could load is **unknown**, never empty: rooms are listed
  without a status and focus still starts.

### Refreshing the bundled catalogue

```bash
node scripts/dev/fallback-rooms.mjs            # the week before this one
node scripts/dev/fallback-rooms.mjs 2026-10-14  # any day of a lecture week
```

It refuses a week with fewer than 80 teaching rooms (a break), and keeps only
what the app shows: no staff names or emails. The *Refresh room catalogue*
workflow runs it monthly and opens a PR when the list changed.

## `RoomDto`

| Field | Type | Notes |
|---|---|---|
| `id` | number | Primary key; the key in `PeriodDto.room_ident` |
| `ident` | string | Code without spaces, e.g. `I112`; used in routes (`/room/:ident`) |
| `name` | string | Display name with spaces, e.g. `I 112` |
| `seatsRegular`, `seatsExam` | number? | Capacity |
| `facilities` | string? | Comma-separated, German (`Beamer, Whiteboard`) |
| `bookable` | boolean? | |
| `inCharge` | object? | Responsible person; shown as contact in room detail |
| `collisions`, `reservations`, `state`, `accessNames` | — | Always `null` in the public API |

## `PeriodDto`

| Field | Type | Notes |
|---|---|---|
| `id` | number | Period ID |
| `startDateTime` | string | `yyyy-MM-dd HH:mm`, Europe/Berlin |
| `duration` | number | Minutes |
| `room_ident` | `Record<string, string>` | **A map, not an array**: room ID → display name. One period can occupy several rooms. |
| `eventTypeDescription` | string? | e.g. `Vorlesung`, `Prüfung` |
| `titleText`, `eventId`, `description`, `organiser`, `participants` | — | Always `null` in the public API |

Example:

```json
{
  "id": 12345,
  "startDateTime": "2026-10-13 08:00",
  "duration": 90,
  "room_ident": { "42": "I 112", "57": "I 113" },
  "eventTypeDescription": "Vorlesung"
}
```

`src/data/mappers.ts` turns one `PeriodDto` into one `ScheduledEvent` per entry
in `room_ident`.

## Parsing rules

- Every DTO field is optional; mappers supply defaults and skip malformed
  items instead of failing the whole response.
- Unknown keys are ignored.
- Times are interpreted in Europe/Berlin (`domain/time.ts`), whatever the
  device time zone.
- Room and building codes are never translated or reformatted for display.

## Local snapshot for development

`scripts/dev/export-thabella-snapshot.py` saves a dated snapshot of both
endpoints for offline analysis; `scripts/dev/thd_room_normalization.py`
maintains `shared/thd-room-taxonomy.json`. Treat snapshots as local working
data. The only THabella data the app ships is the generated fallback catalogue
above.
