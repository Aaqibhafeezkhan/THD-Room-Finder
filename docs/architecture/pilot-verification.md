# M1 operating and preview acceptance

> Request volumes below assume ADR 0001's 60-second renewal. [ADR 0002](adr/0002-focus-session-lifecycle.md) and [ADR 0004](adr/0004-focus-rhythm.md) renew only while the app is visible or a block is confirmed, so real volumes are lower: see [measured in M1-S6](#measured-in-m1-s6-15-october-2026).

Contract: [ADR 0001](adr/0001-study-presence.md). These are proposed pilot limits and required measurements, not measured capacity or a provider billing guarantee. Initial extra provisioned spend remains **zero until a hosted budget is selected**.

## Workload and request ceiling

Pilot target: 100 daily sharing users, up to 50 simultaneous sessions; one 50-minute session per sharing user/day, 60-second renewal and 60-second aggregate reads. Model each session conservatively as 50 renewals + one start + one end, and each active viewer as 51 reads including the initial read. Identity/auth/recovery and schedule traffic are accounted separately.

| Daily sharing/viewing users | Focus operations/day | Summary reads/day | Operations + reads/month, 30 days |
|---:|---:|---:|---:|
| 100 | 5,200 | 5,100 | 309,000 |
| 1,000 | 52,000 | 51,000 | 3,090,000 |
| 5,000 | 260,000 | 255,000 | 15,450,000 |

The larger rows are scale scenarios, not approved pilot exposure. A 60-second cadence plus jitter may perform fewer renewals; budgets deliberately use the larger estimate. Reads are batched for the visible set, not multiplied by every room/person. At the 8 KiB response ceiling, 5,100 daily reads imply at most approximately 40 MiB/day of decoded response bodies before protocol overhead/auth/other traffic. Actual billed transfer must be measured separately.

| Control | Initial pilot policy | Failure behavior |
|---|---|---|
| Active sessions | One per identity, 50 globally | New shared starts rejected; private local focus available |
| Duration/TTL | 180-minute maximum; 300-second lease; 60–65-second target renewal | Absolute end or expiry removes signal |
| Payload | Write ≤2 KiB; summary request ≤30 room keys in one campus; response ≤8 KiB | Reject oversized writes/requests; return bounded summaries without extra per-person pagination |
| Start/update admission | 10 starts and 30 setting updates per identity/hour | Explain cooldown, no retry loop |
| Renew admission | Owned token, at least 45 seconds since accepted renewal | Return next allowed time; never extend on rejected call |
| Summary admission | 2/minute per authenticated identity; anonymous coarse reads need separately verified ingress/NAT-safe limits | 429 with retry-after; retain only still-fresh permitted data |
| Global admitted work | 10,000 focus operations + 10,000 summary reads per UTC day initially | Stop optional shared work when exhausted; do not disable timetable/local timer |
| Retries | At most two transient retries with jitter; obey retry-after; never past expiry | Reconnecting → unknown/expired, no automatic restart |

Auth/mail needs separate provider-side signup, OTP-send and verification limits plus bot protection; the focus-operation ceiling does not cover them. Select and test those controls against the actual hosted provider before allowing public sign-up. Do not rely on a client countdown or disclose whether an email already exists.

An admission ceiling limits **accepted application work**. Rejected requests, Auth, provider ingress, compute and attacks can still consume resources. Enforce authenticated limits transactionally in RPCs so direct API callers cannot bypass them. Public coarse reads need provider/ingress controls before being enabled; otherwise keep them disabled and fall back to schedule ranking for signed-out viewers. Do not impose a tiny per-IP limit on a university NAT. Validate this policy on synthetic shared-NAT traffic before exposing public reads.

The global gate and counters must be tested for concurrent transactions, window rollover and fail-closed behavior. A maintainer-owned server configuration can stop new starts and/or renewals without redeploying the UI; expired markers disappear within the lease. Limits are tunable only after measurement and budget review. A client feature flag alone is not an abuse control.

## Hosted activation checklist

- [ ] Record THD-specific project reference privately, owner, EU region, actual plan and verified branching entitlement. No borrowing another app's project.
- [ ] Record a monthly incremental allowance and provider fixed/variable rates; include compute, Auth/mail, egress, logs and branch hours. Identify costs excluded from provider caps.
- [ ] Confirm budget alerts and a documented operator stop procedure. Automatic pausing, if chosen, is explicitly configured and tested; no claim of zero overshoot.
- [x] Set preview-only URL/publishable key; keep service/admin keys out of all browser bundles. Check built artifacts for forbidden secrets. *(15 Oct: Vercel has the staging URL and publishable key on Preview only; `dist/` contains only `sb_publishable_…`, no `sb_secret_`, service-role JWT or admin key.)*
- [ ] Bind only an isolated synthetic-data instance to previews; verify a preview cannot write to production. Use an explicit project-ref allowlist in deployment checks.
- [ ] Test email OTP, resend/attempt limits, mail delivery/recovery, session persistence and allowed web/native redirects. Do not send test mail to real students.
- [ ] Apply reviewed migrations to local/preview first, rehearse rollback/restore and catalogue refresh. Production migration execution is maintainer-controlled. *(Applied to local and staging first, through `20261015120000_focus_rhythm.sql`; rollback/restore rehearsal still open.)*
- [x] Verify owner/peer/outsider/signed-out/expired-session access by direct table and RPC calls. Test every audience and consent narrowing. *(pgTAP `focus_service.test.sql` as each role, plus direct REST calls; see the privacy matrix below.)*
- [ ] Verify one-session concurrency, idempotent starts/ends, stale versions, early renewals, changed degree/cohort, lost end and device-clock manipulation. *(All but device-clock manipulation are covered by pgTAP and the session tests; a lost end expires with the rhythm lease. Clock manipulation is open.)*
- [ ] Verify 50 visible clients for 50 minutes in isolated staging, with bounded test traffic and synthetic upstream schedules. Never load-test THabella.
- [ ] Record p50/p95 latency, errors, admitted/rejected counts, response bytes and actual provider use. Candidate p95: start/renew ≤1 second, summary ≤1.5 seconds on the chosen regional test setup; failure blocks expansion, not ordinary browsing.
- [ ] Verify hidden/reconnecting/expired behavior, two tabs, two devices, time travel, sign-out/deletion, EN/DE and Android/iOS/desktop browser capabilities.
- [x] Verify presence off: zero presence/Auth calls, existing room search/favorites unchanged. Verify private timer: zero heartbeat/read calls. *(Without the Supabase variables no focus client is created; without a study profile no session call is made: `focusSession.test.tsx`.)*
- [ ] Measure clean transferred app-shell bytes (<1 MB compressed target), incremental shared-feature bundle, memory, storage and 50-minute phone energy with wake lock off/on at fixed brightness/network.
- [ ] Verify immediate authorization/expiry filtering, cleanup within 24 hours and documented log/backup retention. Name the operational owner.

## Measured in M1-S6, 15 October 2026

Local Supabase (Docker) and the dev or production build on a desktop
browser; staging was not load-tested. Device runs follow the
[focus walkthrough](../development/focus-walkthrough.md).

### Requests per client

| Situation | Calls | Notes |
|---|---|---|
| App open and visible, no session | 4 `room_summaries` / min | One per campus. ~50 ms each locally |
| App open, own shared session | + 1 `renew_focus` / min | Writes at most once a minute |
| Phone locked or app in the background | 0 | The lease covers one block, the break and 10 min |
| Start, confirm a block, end | 1 each | Confirming renews the lease |
| Device-only session (no profile, offline) | 0 | |
| Picked time (time travel) | 4 summaries / min still polled | Results are ignored; a candidate to skip |

A two-block Deep session with the phone locked while studying costs about
8 session calls (start, one confirmation, end and a few renewals while
the app is open), against 52 in ADR 0001's model. Summary reads dominate:
4 per visible minute per client. Folding them into one call for all
campuses would cut that to 1; it needs a new `room_summaries` signature.

### Payload sizes

| Response | Size |
|---|---|
| `room_summaries`, campus without activity | 2 B |
| `room_summaries`, per room with activity | ~290 B (JSON, before compression) |
| 50 simultaneous sessions in 50 different rooms | ≤ ~14.5 KB per campus read |
| Session (`start_focus`, `renew_focus`) | ~0.55 KB (552 B with the rhythm) |

The proposed 8 KiB summary ceiling holds up to about 28 active rooms per
campus; above that, responses grow linearly to the 500-row cap. Compressed
transfer is a fraction of that.

### App size

| Part | gzip |
|---|---|
| Main bundle (`index-*.js`, app + React) | 135 KB |
| Supabase client, loaded on first use | 59 KB |
| CSS | 3 KB |

All precached by the service worker, including the Supabase chunk, so focus
works offline; well under the 1 MB app-shell target.

### Privacy matrix

Checked by pgTAP (each caller's JWT) and by direct REST calls with the
publishable key.

| Caller | Tables | Private session in a room | Public session of AIN 7 |
|---|---|---|---|
| Owner | none | own | own |
| Same batch (AIN, winter 2023) | none | anonymous claim | batch count, names only if shared, rhythm |
| Same programme, other intake | none | anonymous claim | anonymous claim |
| Other programme | none | anonymous claim | anonymous claim |
| Signed out | none (`focus` schema not exposed, `public.session` absent) | anonymous claim | anonymous claim, no name, no rhythm |
| Signed out, writes | `start_focus`, `get_identity`: permission denied | | |
| Signed in, no study profile | none | cannot claim (`needs_profile`) | |

### Regressions

Desktop, 15 Oct: free-room count, search (free rows keep their badges, busy
rows get none), filters, time travel ("Schedule only", no signals), EN/DE,
light/dark, campus map tint and the offline shell (service worker precache)
unchanged.

## Preview strategy and seeds

Begin locally; schema, RLS/RPC tests and deterministic seeds are version-controlled when implementation lands. Use fixed synthetic users representing owner, matching degree/cohort, same degree/different cohort, unrelated degree and signed-out access. Seed quiet/open/private/campus-detail sessions plus expired, revoked and concurrent-start fixtures. Do not seed real emails, names, attendance, passwords or production data. Auth test identities and public profile fixtures remain separate.

A PR preview contains all ancestor stack code but receives its own approved preview configuration. A Vercel preview by itself does not isolate data. Use one isolated staging instance first if appropriate; coordinate destructive schema tests. A per-PR Supabase branch is optional, requires a lifecycle/cost owner and must be deleted when no longer needed. Do not automatically deploy migrations to production on an intermediate stack merge.

## Evidence log for this pass

Confirmed: planning PR web/Android CI and Vercel preview passed; linked hosting project resolves; authenticated Supabase project inventory is available; no THD-specific Supabase instance/link was found. No hosted database, branch, auth provider, mail sender, migration, firewall rule, billing setting or production credential was changed. Plan/branch entitlement and billing limits remain unverified; leave #17's corresponding acceptance item unchecked.
