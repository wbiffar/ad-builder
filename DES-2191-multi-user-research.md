# DES-2191 — Multi-User Collaboration Research
**Ad Builder · Discovery & Research**
_Author: Wes Biffar · May 2026_

---

## TL;DR

The Ad Builder currently stores all data in the browser — nothing is shared, nothing persists beyond a single machine. Four approaches were evaluated to enable multi-user handoff:

- **Approach A (Export/Import JSON):** Lowest effort (1–2 days / ~2–4 hours with Claude Code), but requires manually emailing or sharing a file. Good interim fix.
- **Approach A1 (Shared Drive Folder):** Slightly more work (2–3 days / ~half a day with Claude Code), but eliminates the manual handoff entirely by writing to a shared Google Drive folder the whole team can browse. Stays within Legacy's Google Workspace infrastructure with no custom backend.
- **Approach B (Cloud-Backed Shared Projects):** The most complete solution — shareable links, a team workspace, proper auth, and a foundation for future features. 2–3 weeks (clean slate) to 3–5 weeks (with migration) for a human engineer; roughly 1 week to 1–2 weeks with Claude Code.
- **Approach C (Real-Time Co-Editing):** Overkill for the stated use case. Not recommended.

**Recommendation:** Start with A1 — it directly solves the handoff problem, uses infrastructure already in place, and requires no backend work. If A1 proves insufficient over time, Approach B is the natural upgrade path. See Section 3 for what would drive that decision.

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

**Security:**
- No new attack surface — files are shared manually and only accessible to whoever receives them.
- No authentication, no server, no credentials to protect.
- Files contain base64-encoded images (logos, photos) — if emailed or shared carelessly, that content travels with them. Low risk for ad creative, but worth noting.
- No audit trail within the app once a file is handed off and modified.

---

### Approach A1 — Shared Drive Folder (Google Drive) — Recommended

**How it works:** Instead of saving ad sets only to IndexedDB, the app writes the JSON file to a configurable local folder path. If that folder is a shared Google Drive folder, the sync client (already running on company laptops) handles distributing it to everyone with access — no email, no manual import step. Any team member opens the app, browses the shared folder, and loads any in-progress project.

**What needs to be built:**
- A configurable "save location" setting in the app (a folder path the user sets once, e.g., `~/Google Drive/Ad Builder Projects/`).
- On save, write the JSON file to that path in addition to (or instead of) IndexedDB.
- A "Browse shared projects" view in the app that reads JSON files from the configured folder and lists them alongside locally saved work.

**Pros:**
- No custom backend or API — the app just reads and writes files.
- Shared folder acts as a lightweight shared workspace; no explicit handoff required.
- Google Drive provides version history (30 days by default, up to 180 days with Workspace) and access control for free.
- Works offline — sync handles it in the background.
- Much lower operational overhead than Approach B.

**Cons:**
- Requires every user to have the Google Drive for Desktop sync client installed and the shared folder configured — not zero setup, but manageable via IT.
- No web URL — users must open the app and load the project manually.
- Conflict resolution is basic: if two people save simultaneously, the sync client may create a conflicted copy. No merge logic.
- File sizes can still be large due to base64-encoded images.

**Effort:**

| | Human engineer | With Claude Code |
|---|---|---|
| Total | ~2–3 days | ~half a day |

Slightly more than basic export/import (Approach A) due to the configurable path setting and the folder-browsing view, but still entirely a frontend change with no infrastructure work.

**Security:**
- Access control is all-or-nothing at the folder level — anyone with folder access can see and edit every project. No per-project permissions within the app.
- No authentication in the app itself; the only security layer is Google Drive folder membership.
- Misconfiguration risk: if the shared folder is accidentally set to "anyone with the link," files become broadly accessible outside the team.
- Files are accessible outside the app — can be opened, copied, or deleted directly from the file system without any app-level audit trail.
- **One genuine positive:** Data stays within Legacy's Google Workspace environment, under existing IT governance, DLP policies, and compliance controls — better than standing up a new custom backend IT has to vet separately.
- Overall risk is low given the data is ad creative (logos, taglines, colors) rather than sensitive PII or financial data.

---

### Approach B — Cloud-Backed Shared Projects with Shareable Links — Future Upgrade Path

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

**Security:**
- Authentication means user identity is enforced — only authenticated users can access projects.
- Per-project permission model (owner, editor, viewer) enables fine-grained access control not possible in A or A1.
- Images stored in object storage (S3/Supabase) can have signed URLs with expiry, preventing unauthorized direct access.
- API layer means all data access is logged and auditable.
- New attack surface compared to A/A1: API endpoints, auth tokens, and the backend must be kept secure. Auth and data access logic warrants careful review regardless of who writes it.
- Requires security review of the new infrastructure before going to production — standard for any new backend, but adds a step.

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

**Security:**
- All the considerations of Approach B apply here.
- Real-time sync adds additional attack surface: WebSocket connections must be authenticated and authorized, and live state updates must be validated server-side to prevent a malicious client from corrupting shared state.
- Highest security complexity of all approaches — warrants the most thorough review.

---

## 3. Recommendation

**Start with Approach A1 (Shared Google Drive Folder).**

A1 directly solves the primary use case — person A starts, person B finishes — without any backend infrastructure. It uses Google Workspace tooling the team already has, requires half a day of engineering work with Claude Code, and keeps operational overhead at zero.

Approach B remains the natural upgrade path if A1 proves insufficient, but it shouldn't be planned speculatively. Ship A1, use it, and let real usage patterns drive the decision to invest in a full backend.

### When to consider moving to Approach B

- The team needs to share work with external collaborators (contractors, vendors) who don't have access to the Google Drive.
- Users need to access or share projects via a web URL without the Drive for Desktop client installed.
- The folder-based access model becomes too coarse — e.g., needing per-project permissions or view-only access for stakeholders.
- The team grows to a point where a shared folder becomes difficult to manage or search.

### Plan

**Now:** Ship A1. Unblocks the handoff use case immediately.
- Human: ~2–3 days · With Claude Code: ~half a day

**If/when A1 proves insufficient:** Build Approach B — cloud-backed shared projects with shareable links, proper auth, and a team workspace view.
- Human: ~3–5 weeks · With Claude Code: ~1–2 weeks _(with migration)_
- Human: ~2–3 weeks · With Claude Code: ~1 week _(clean slate — no migration)_

**Future (unscoped):** Version history, comments/annotations, and role-based access control.

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
