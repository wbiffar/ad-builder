# DES-2191 — Multi-User Collaboration Research
**Ad Builder · Discovery & Research**
_Author: Wes Biffar · May 2026_

---

## 1. Current Architecture & Constraints

The Ad Builder is a **Next.js app with no backend persistence**. All ad data lives exclusively in the user's browser:

- **IndexedDB** (`legacy-ad-creator` / `saved-ads`) stores `SavedAdSet` objects — the name, timestamps, and the full `configMap` (ad configs for all 5 sizes including base64-encoded logos and photos).
- **localStorage** holds legacy brand data (largely superseded).
- **React state** (`page.tsx`) holds the in-session working copy.
- The only server-side code is a single API route (`/api/analyze-inspiration`) that proxies image data to the Claude API for design analysis.

There is no user authentication, no user identity, no database, and no shared state. Everything is local to a single browser on a single machine.

### Constraints this creates for sharing

| Constraint | Impact |
|---|---|
| Data lives in IndexedDB (browser-only) | Inaccessible to any other device or user |
| No user identity | No way to model ownership or access control |
| Images stored as base64 data URLs inline in the config | Ad configs are large blobs; not structured for efficient transfer |
| No API layer for reads/writes | Any sharing solution requires new backend infrastructure |
| No concept of a "project URL" | Nothing to share — there's no persistent address for a piece of work |

---

## 2. Collaboration Approaches

Three models were evaluated, in order of complexity.

---

### Approach A — Export / Import JSON (Lowest effort)

**How it works:** A user can export their current ad set as a structured JSON file. Another user imports that file to pick up exactly where the first user left off. No backend required.

**What needs to be built:**
- An "Export" button that serializes the current `SavedAdSet` (including the base64 image data) to a downloadable `.json` file.
- An "Import" button that reads the file, validates the schema, runs the existing `migrateAdConfig()` function for compatibility, and loads it into the current session's IndexedDB.

**Pros:**
- No backend infrastructure at all — works today with the existing local-first model.
- Extremely low implementation risk.
- Works even for users outside the organization (contractors, external reviewers).
- The file can be versioned and stored anywhere (email, Slack, Dropbox).

**Cons:**
- Manual handoff — someone has to remember to export, then share the file, then the recipient imports it.
- No history or audit trail — once a file is shared and modified, there's no record of changes.
- File sizes can be large due to embedded base64 images (a full ad set with logo + photo could easily be 1–3 MB).
- Doesn't scale to a workflow where multiple people need access to many in-progress ad sets.

**Effort:**

| | Human engineer | With Claude Code |
|---|---|---|
| Total | ~1–2 days | ~2–4 hours |

Almost entirely a frontend change — well-scoped and self-contained, which is where Claude Code performs best. It can read the existing codebase, identify the right insertion points in `page.tsx` and `ad-storage.ts`, and produce working code in a single session with light human review.

---

### Approach B — Cloud-Backed Shared Projects with Shareable Links (Recommended)

**How it works:** Ad sets are saved to a backend database instead of (or in addition to) IndexedDB. Each ad set gets a persistent ID that can be shared as a URL. Any user with the link can open and continue the work. Access can be scoped to "view only" or "can edit."

**What needs to be built:**

_Backend:_
- A database (e.g., Postgres via Supabase, or a managed option like PlanetScale) to store ad sets server-side. The schema maps closely to the existing `SavedAdSet` type plus a `owner_id` and optional `shared_with` array.
- Image assets need to be extracted from the config and stored in object storage (e.g., S3 or Supabase Storage) with their URLs replacing base64 strings in the config. This is important both for performance and to avoid storing multi-MB blobs in a relational DB.
- REST or tRPC API routes: `POST /ad-sets`, `GET /ad-sets/:id`, `PUT /ad-sets/:id`, `DELETE /ad-sets/:id`, `GET /ad-sets` (list for a user).
- Authentication — the simplest path is **Clerk** or **Supabase Auth**, both of which integrate naturally with Next.js and provide social login (Google/Microsoft) with minimal custom code. Given this is an internal tool at Legacy, SSO via the company identity provider (e.g., Okta/Google Workspace) is worth considering.

_Frontend:_
- Replace `ad-storage.ts` IndexedDB calls with API calls (or keep IndexedDB as a local cache with sync).
- Add a "Share" button that generates a link: `ad-builder.legacy.com/ads/[id]`.
- Add a simple permission model in the UI: the creator owns the ad set; they can share a link that grants edit or view access.
- Update the saved ads sidebar to load from the API rather than IndexedDB.
- Handle conflict resolution for the simple case: last-write-wins is acceptable if real-time co-editing is out of scope.

**Pros:**
- Directly addresses the primary use case (hand off between two team members) with a natural workflow.
- Shareable links are intuitive and require no user education.
- Sets the foundation for future enhancements (version history, comments, role-based access).
- Doesn't require real-time infrastructure — no WebSockets or CRDTs.

**Cons:**
- Requires meaningful backend work (auth, database, storage, API).
- Image asset migration from base64 to object storage is the trickiest part — the current data model will need to change.
- Adds operational overhead (hosting, DB cost, auth provider).
- Internal users will need accounts — even if it's SSO, there's a setup step.
- A shareable link alone still requires a manual "send this URL to someone" step — which is lower friction than Approach A but not zero friction. To fully eliminate manual handoff, Approach B should include a **shared team workspace**: a view where all ad sets created by anyone on the team are visible by default. With that, no explicit sharing is required — User B simply opens the tool and sees User A's in-progress work alongside their own.

**Effort — with existing data migration:**

| Task | Human engineer | With Claude Code | Notes |
|---|---|---|---|
| Auth setup + user model | ~3 days | ~half a day | Clerk/Supabase Auth scaffolding in Next.js is well-trodden; Claude Code handles it quickly |
| Database schema + API routes | ~1 week | ~1–2 days | Schema maps closely to the existing `SavedAdSet` type; straightforward to generate |
| Image asset storage refactor | ~3–4 days | ~1 day | Riskiest task — migration logic needs careful human review regardless of who writes it |
| Frontend integration (replace IndexedDB calls, sharing UI) | ~1 week | ~2–3 days | Requires a local→cloud sync layer and backward compat with existing IndexedDB records |
| Testing, deployment, migration | ~3–4 days | ~1–2 days | Code parts compress; infra setup (accounts, DNS, secrets) still requires human access |
| **Total** | **~3–5 weeks** | **~1–2 weeks calendar time** | Bottleneck shifts from writing code to making decisions and reviewing output |

**Effort — clean slate (no migration):**

| Task | Human engineer | With Claude Code | Notes |
|---|---|---|---|
| Auth setup + user model | ~3 days | ~half a day | Unchanged |
| Database schema + API routes | ~1 week | ~1–2 days | Unchanged |
| ~~Image asset storage refactor~~ | ~~dropped~~ | ~~dropped~~ | New projects write directly to object storage from day one; no migration logic needed |
| Frontend integration (replace IndexedDB calls, sharing UI) | ~1 week | ~2–3 days | Simpler — `ad-storage.ts` can be replaced outright rather than bridged |
| Testing, deployment | ~2–3 days | ~1 day | Reduced scope without migration verification |
| **Total** | **~2–3 weeks** | **~1 week** | |

The clean-slate approach drops the image asset migration entirely — the trickiest and riskiest task — and simplifies the frontend integration since there's no need to bridge old IndexedDB records with the new cloud storage. The tradeoff is that any locally-saved work is lost. Before committing to this, it's worth checking how much is actually saved across users. If the volume is small, a one-time "export before we flip the switch" prompt on the current version may be enough to let users self-migrate without any automated tooling.

With Claude Code, the human role changes from writing code to steering the work: providing context, reviewing PRs (especially auth and data access logic), and handling infra setup. Security-sensitive code should always get careful human review regardless of who wrote it.

---

### Approach C — Real-Time Co-Editing (Highest effort, out of scope for now)

**How it works:** Multiple users edit the same ad set simultaneously, with changes reflected live for all viewers — similar to Figma or Google Docs.

**What needs to be built:**
- Everything in Approach B, plus:
- A real-time sync layer: either WebSockets with a server-side state manager, or a CRDT-based library (e.g., Yjs, Automerge) with a persistence provider.
- Presence indicators (cursors, "User B is editing the leaderboard ad").
- Conflict resolution at a granular field level.

**Pros:**
- The most collaborative experience.
- Eliminates the risk of two people unknowingly working on the same thing simultaneously.

**Cons:**
- Significant engineering complexity — real-time sync over a complex nested state object (`configMap` with 5 ad configs, each with ~20+ fields) is non-trivial.
- The primary use case described in the ticket is **handoff**, not simultaneous editing. This is overkill for the stated need.
- Much higher testing surface and operational risk.

**Effort:**

| | Human engineer | With Claude Code |
|---|---|---|
| Total | ~10–14 weeks | ~4–6 weeks |

Real-time sync logic (CRDTs, WebSocket state management) is complex enough that even with Claude Code the calendar time stays high — the challenge is architectural decisions and testing correctness under concurrent edits, not raw code volume. Still not recommended for this use case.

---

## 3. Recommendation

**Start with Approach B (Cloud-Backed Shared Projects).**

The primary use case — person A starts, person B finishes — is a classic async handoff scenario. Real-time co-editing is not required. A shareable link model solves the problem cleanly, mirrors patterns users already know from tools like Figma and Notion, and sets the codebase up for future collaboration features without the complexity of real-time sync.

Approach A (Export/Import) is worth shipping _first_ as a fast interim solution (1–2 days of work) while Approach B is being planned and built. It unblocks the use case immediately at near-zero cost.

### Recommended phased plan

**Phase 1 (interim):** Ship JSON export/import. Immediately unblocks the handoff use case with no infrastructure changes.
- Human: ~1–2 days · With Claude Code: ~2–4 hours

**Phase 2:** Build cloud-backed shared projects with shareable links. Migrate data storage to a backend database, add auth (SSO preferred for an internal tool), and ship a "Share" button that generates an editable link.
- Human: ~3–5 weeks · With Claude Code: ~1–2 weeks _(with migration)_
- Human: ~2–3 weeks · With Claude Code: ~1 week _(clean slate — no migration)_

**Phase 3 (future, unscoped):** Consider version history, comments/annotations, and role-based access control once Phase 2 usage patterns are understood.

---

## 4. UX Considerations

- **Sharing UI:** A "Share" button in the top nav, similar to Figma, that copies a link to clipboard and shows a simple access setting ("Anyone with link can edit / view only").
- **Handoff indicator:** When a user opens a shared ad set they didn't create, the UI should make it clear who created it and when it was last edited ("Started by Sarah, last edited 2h ago").
- **Offline/local fallback:** Consider keeping IndexedDB as a local draft cache so the app still works if the network is unavailable. Sync to the server on reconnect.
- **Account creation friction:** For an internal tool, the lowest-friction auth is SSO via the company identity provider. Avoid requiring users to create a new password.

---

## 5. Open Questions

1. Is this internal-only (Legacy employees) or does it need to support external collaborators (e.g., external design contractors)?
2. Does Legacy have an existing SSO/identity provider we should integrate with (Okta, Google Workspace)?
3. Is there an existing backend/infrastructure platform preference (AWS, GCP, Supabase, etc.)?
4. What's the expected number of concurrent users and total ad sets? This affects database and storage sizing.
5. Should existing locally-saved ad sets be migrated to the cloud, or is a clean start acceptable for Phase 2?

---

## 6. References

- Jira ticket: [DES-2191](https://legacycom.atlassian.net/browse/DES-2191)
- Epic: [DES-2159 — Ad Builder Feature Requests & Enhancements](https://legacycom.atlassian.net/browse/DES-2159)
- Relevant codebase files: `src/lib/ad-storage.ts`, `src/lib/types.ts`, `src/app/page.tsx`
