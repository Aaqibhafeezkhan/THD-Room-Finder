# ADR 0008: organizations are verified in a public registry

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 20 October 2026 |
| **Decided by** | Maintainer |
| **Spec** | [Student organizations](../../product/organizations.md) |

## Context

Organizations reach more people than a single student, so their tag has to
be trustworthy. A hidden admin screen would make verification invisible and
put all of it on one person. The THD AI GitHub organization already runs
open, student-facing projects.

## Decision

1. **Registry repository.** `THD-AI/organizations` holds an issue form for
   requests, one `orgs/<slug>.json` per verified group, and the workflow.
2. **Request from the app.** A signed-in student fills in public fields. The
   app stores a pending request and opens a prefilled issue with the request
   number. No email or account data goes into the issue.
3. **Approval by label.** A maintainer checks public proof and adds
   `approved`. The workflow validates the request, commits the org file and
   calls a service-only function that activates the org and makes the
   applicant its owner. `revoked` reverses it. Every step comments on the
   issue.
4. **Members by link.** The owner shares a member link; members can then host
   planned sessions as the org. Org sessions are open to everyone.
5. **No payments.** An org may list its own support link. Verification is
   never sold.

## Consequences

- Verification is public and auditable, and other THD AI members can help.
- The workflow needs a scoped database secret in the registry repository.
- Until the registry exists, organizations stay off; nothing in the app
  depends on it.
