# Lightweight PWA, scale and abuse-cost planning

> **Research snapshot, 10 October 2026.** Kept for its evidence and reasoning. Where it conflicts with the [charter](../../../PROJECT-CHARTER.md) or the [focus sessions spec](../focus-sessions.md), those win.

Assessment, **10 October 2026**. Existing code and a few ordinary production reads were inspected. No load test, paid-plan audit, billing export or firewall change was performed. Figures below are workload models or proposed budgets, not a certified daily-user limit or price quotation.

## Current baseline

The app already is a PWA: standalone manifest, app-shell precaching, hashed assets and network-first API cache. The map is SVG/data-driven with no runtime map-tile vendor or WebGL scene. Room search and availability computation happen on-device; Android uses native HTTP to THabella rather than the Vercel proxy.

Source: `vite.config.ts`, `vercel.json`, `src/data/thabellaClient.ts`, `cache.ts`, `RoomDataContext.tsx`, `api/rooms.js`, `api/periods.js`.

| Item | Observed in source/local artifacts | Implication |
|---|---|---|
| Local schedule caches | Rooms 24h, events 5min per day, teaching set 24h per week | Warm visits avoid requests; measure actual cold and warm journeys separately |
| Proxy caches | Rooms `s-maxage=86400`, events `s-maxage=300` | Shared responses can avoid function/upstream work, but client/edge requests and transfer still matter |
| Refresh | Five-minute interval when pinned to now; no explicit visibility guard in that effect | Review hidden-page behavior; do not refresh schedules every timer tick or heartbeat |
| Date cache keys | Local event cache is daily; network URL contains minute-level date/time | Verify upstream day semantics, then consider canonical daily URLs; arbitrary variants fragment caching |
| Proxy validation | Periods checks only that date exists; handlers do not reject unsupported methods except special OPTIONS handling | Add strict input/method validation, bounded dates and request work in a later implementation slice |
| Existing `dist` snapshot | Main JS 343,701 bytes, CSS 7,338 bytes; all 12 files total 413,690 bytes, uncompressed | A useful starting baseline, not wire transfer, installed footprint or memory usage |
| Cache storage | Service-worker API cache has 32 entries/24h; localStorage entries have no explicit count pruning | Define localStorage retention/pruning; expired data can otherwise remain until quota/storage eviction |

Two consecutive ordinary GETs to `/api/rooms` returned MISS then HIT; the decoded response length was 133,912 bytes. A preceding HEAD returned MISS. This confirms one cacheable endpoint in one observation, not all dates/regions, a global hit ratio or upstream request count. No traffic burst or cache-busting probe was run.

## Proposed device and network budgets

Keep ordinary room finding and local focus independent of the social service. No presence polling while browsing unrelated screens, no per-person full-campus feed and no automatic download of every campus dataset. Load optional place/event data and campus geometry only when selected. Use timestamp-derived timer displays and animate only small active elements; avoid rerendering the whole map each second.

Use screen wake lock only after an explicit focus choice, with status and an off control. A lit screen can dominate battery cost even when the JavaScript timer is cheap. Hidden-page behavior follows the chosen session model; do not add background keepalive loops to evade browser limits. Cache shell/assets and show stale data honestly, without making offline presence look current.

Candidate acceptance budgets for the first design/implementation milestone:

- Keep the compressed first-view app shell under **1 MB**, excluding first schedule payloads; measure actual transferred bytes on a clean install. The existing uncompressed artifact is not that measurement.
- A local timer generates **zero heartbeat requests**. Shared presence uses at most one renewal per participant per chosen interval, not per room or second.
- Schedule refresh no faster than its existing five-minute cadence without demonstrated need; reuse in-flight requests and pause unnecessary hidden-page work.
- Put an explicit size/entry limit on application-managed schedule/place caches; measure clean and used installation storage rather than promise a browser-controlled disk limit.
- Compare a 50-minute focus session on the same real phone, brightness and network with timer/wake-lock off/on. Record energy/network differences; no battery percentage is promised before testing.

These are proposed budgets, not platform restrictions or measured performance results.

## Daily users are not the capacity unit

Daily users alone cannot establish capacity. Request count, concurrent visible users, session duration, cache-key reuse, payload size and service design determine workload. A 1,000-person map audience and 1,000 continuously renewing focus sessions are very different.

Illustrative model: **one 50-minute shared session per participating user per day**, 30-second renewal interval, plus joins/ends separately. A viewer polls an aggregate every 60 seconds for the same duration. These are candidate intervals, not selected production settings.

The selected M1 proposal now starts at a 60-second renewal: for the same session, this halves modeled renewal writes to 50 per person (5,000/day for 100 participants; 50,000/day for 1,000), before start/end/retries. Preserve the table below as the 30-second comparison; neither scenario is a measured capacity guarantee.

| Participating users/day | Lease renewals/day | Aggregate reads/day if each also views for 50 minutes | Renewals/month at 30 days |
|---:|---:|---:|---:|
| 100 | 10,000 | 5,000 | 300,000 |
| 1,000 | 100,000 | 50,000 | 3,000,000 |
| 5,000 | 500,000 | 250,000 | 15,000,000 |

At 100 simultaneously active participants, 30-second renewal averages 3.33 writes/second; at 1,000 it averages 33.33. Synchronized bursts can be larger: use bounded jitter/backoff while preserving TTL. If each of 1,000 viewers separately downloaded 1,000 people's 100 updates, naive fan-out would approach 100 million delivered updates for that session. Return audience-filtered room aggregates or subscribe only to the relevant session/campus; do not broadcast each individual heartbeat.

Current room browsing has no such lease writes. A cold load can request rooms, five teaching-week days and the selected day: approximately seven requests before retries, with possible duplicate selected-day requests because concurrent calls are not explicitly coalesced. Warm cache changes this substantially. A 50-minute pinned-now view can attempt about ten five-minute refreshes; event TTL and cache reuse determine actual network calls. Calendar navigation, retries and multiple tabs add work.

Cost model: **served edge requests + transferred bytes + function CPU/memory duration + database reads/writes/storage + any realtime/push services + fixed charges**. CDN HIT reduces origin work; it does not mean every cost is zero. [Vercel CDN cache](https://vercel.com/docs/caching/cdn-cache).

No current plan/credits, traffic distribution, period-payload distribution, billed usage or future database configuration was audited, so a euro estimate or maximum daily-user claim would be invented. Treat 100, 1,000 and 5,000 users/day as validation scenarios, not guaranteed supported capacity.

## Abuse controls and spending limits

Separate two concerns: public source can be read/reused under its license; service abuse can consume resources. Hiding browser code, CORS restrictions or a key embedded in JavaScript do not secure a public API. A source license and attribution address reuse rights, not billing exposure. Keep administrative credentials server-side and out of logs/client bundles.

Before a shared-service pilot, design these controls:

1. Reject invalid methods, malformed/oversized/repeated date parameters and out-of-policy dates before upstream work. Verify daily-query equivalence before canonicalization, preserving legitimate plan-ahead use.
2. Bound upstream duration, concurrent requests, retry count and permitted response/work sizes. Coalesce identical in-flight requests and handle upstream failure without a retry storm.
3. Apply edge request controls to expensive paths and separate read/write limits. Avoid tight IP-only limits that block a whole campus behind shared Wi-Fi/NAT; combine per-session/account limits, generous IP bursts and global workload ceilings.
4. For shared features, enforce audience/ownership on every operation; cap active sessions and joins, count/size of payloads and write frequency. Short join codes need expiry, attempt limits and host admission options; never expose a searchable namespace of private groups.
5. Keep a service-side degradation switch: disable new shared sessions or presence renewal when a chosen workload budget is exceeded; preserve room browsing/local timer where infrastructure permits. Do not let retries amplify the outage.
6. Monitor requests, cache misses, upstream latency/errors, lease writes and database/transfer use. Define a named operator and an incident response before rollout.

Vercel documents WAF rate limiting for API traffic. Its protection does not prove every expensive request is identified or stopped; availability/pricing needs checking against the actual account. Stage/tune rules against legitimate campus bursts before enforcement. No rule was staged or published here. [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

Vercel's documented Pro Spend Management can alert, invoke a webhook or pause production projects; a budget value alone does not enable automatic pausing. Checks occur every few minutes, the setting is team-scoped, and separate charges such as integrations/add-ons are excluded. It is **not a precise zero-overshoot hard cap**. Audit the actual account and effects on other projects before configuration; put separate limits on any database/realtime provider. [Spend Management](https://vercel.com/docs/spend-management).

## What to verify next

First perform a read-only baseline of the actual hosting plan, billed usage, request/cache metrics and current protection settings. Record these without credentials. Choose a monthly extra-spend budget with the maintainer before activating any paid shared capability; no budget amount is assumed here.

Then test cold/warm browsing, multiple tabs, hidden pages and focus on representative phones. For a later service prototype, use an isolated staging environment and synthetic data for gradual concurrency tests, bounded by a test request/cost budget. Test joins, expiries, reconnects and audience-filtered reads together. Never load-test live THabella or production users to establish a capacity claim.

Before release, publish measured results for the chosen scenario: concurrent users, durations, request/payload rates, cache ratio, latency/error rate, storage and projected monthly use at the actual provider rates. Increase scope only after the budget and failure behavior are understandable.
