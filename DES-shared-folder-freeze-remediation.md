# Shared-Folder Freeze — Root Cause & Remediation Scope

**Status:** Phases 1–2 (freeze fix) + Phase 4 (optimize) + Phase 5 (version prompt)
implemented on branch `feature/des-shared-folder-lazy-load-assets`; Phase 3 manual
verification pending. See "Rollout sequence" before optimizing production.
**Jira:** Epic + stories drafted below (IDs TBD — see "Jira backlog")
**Date:** 2026-08-12

---

## Problem

A single user's Windows PC freezes when she uses Ad Builder while connected to the
Google Shared Drive. Started ~3 weeks ago; no other users affected. The tool
previously worked fine for her.

## Root cause (confirmed)

The freeze is **not** caused by the last build (2026-07-21), which only removed
experimental Labs features and adjusted the logo container — it never touched the
shared-folder code path.

The real cause is a pre-existing design issue in the shared-folder feature
(added 2026-05-27) interacting with **Google Drive "Stream" mode**:

1. Every image is stored as a base64 **data URL inlined into the ad-set JSON**
   (`logoUrl`, `additionalImageUrl` in `AdConfig`), duplicated across every ad
   size in a set. Each `{id}.json` can be several MB.
2. On mount **and after every save/update/delete**, the app reads the **entire
   folder** — `loadAdSetsFromFolder` iterates every `.json` and fully reads each
   one (`src/app/page.tsx` `refreshSharedAdSets`).
3. Her Drive is in **Stream** mode, so files are cloud-only until read. The read
   sweep forces Drive for Desktop to download + hydrate every file at once → an
   I/O storm that freezes the machine.
4. It's a slow-motion failure: the shared folder accumulated files over weeks
   until the hydration cost crossed her machine's threshold.

Users on **Mirror** mode (files already local) never pay this cost — which is why
only she is affected.

### Immediate mitigation (no code change)

Switch her Drive for Desktop to **Mirror files**, or right-click the shared
folder → **Available offline**. Either makes the files local so the read sweep
stops triggering downloads. Confirms the diagnosis and gives instant relief.

## Decision

Ship a durable, app-side fix so correct behavior no longer depends on each user's
Drive configuration:

- **Approach A — lazy loading:** stop reading the whole folder on mount; load the
  list when the picker opens; update the in-memory list incrementally after
  save/update/delete instead of re-reading everything.
- **Image externalization:** move images out of the ad-set JSON into a
  content-addressed `assets/` subfolder; the JSON holds small references. This
  shrinks each file from MB to KB and dedupes images shared across ad sizes.

Together these make both mount and picker-open cheap even in Stream mode, and
images download only for the one set actually opened.

## Architecture

**Key constraint:** `file-utils.ts` documents that the app deliberately uses
**data URLs, not `blob:` URLs**, because blob URLs break `html-to-image` export
(cross-origin). Therefore the **runtime shape is unchanged** — `logoUrl` /
`additionalImageUrl` remain data-URL strings in memory. Only *persistence*
changes, at a single serialize/hydrate boundary:

- **Save (serialize):** data URL → write `assets/{sha256}.{ext}` → store an
  `AssetRef { assetId, mime, ext }` in the JSON.
- **Load (hydrate):** `AssetRef` → read the asset file → convert back to a data
  URL for the renderer/form/export to consume exactly as before.

Content addressing (SHA-256 of the bytes) makes asset files **immutable and
idempotent**, so concurrent multi-user writes never conflict and duplicate images
collapse to one file.

## Phased delivery

### Phase 1 — Asset store + serialize/hydrate boundary  ✅ implemented
Files shrink on save; behavior otherwise identical; old files keep loading.

- `src/lib/types.ts` — added `AssetRef`, `PersistedAdConfig`, `PersistedSavedAdSet`.
- `src/lib/asset-store.ts` *(new)* — SHA-256 hashing, data-URL ⇄ bytes, folder
  `assets/` read/write with existence-skip dedup, `serializeConfig` /
  `hydrateConfig`.
- `src/lib/shared-folder-storage.ts` — `saveAdSetToFolder` externalizes images
  before writing; `loadAdSetsFromFolder` hydrates references after reading.

Back-compat: legacy `{id}.json` files with inline data URLs pass through hydrate
unchanged and are converted to the external format on their next save. No
destructive migration.

Validated: `tsc --noEmit` clean; base64 round-trip is byte-exact; hashing is
deterministic (dedup) and change-sensitive.

### Phase 2 — Lazy load (the freeze fix)  ✅ implemented
- `shared-folder-storage.ts`: replaced `loadAdSetsFromFolder` with
  `listAdSetsMetadata` (enumerate, **no asset reads**) and `readAdSet(id)`
  (one file + only its assets).
- `ad-storage.ts`: added `AdSetMetadata` type.
- `page.tsx`: mount reconnects the handle but no longer loads the folder; the
  list loads lazily on picker-open (`openPicker`) and right after connecting;
  `doLoadAdSet` fetches a shared set on demand via `readAdSet`; save/update/
  delete now update the in-memory list **incrementally** (`upsertSharedMeta` /
  filter) instead of re-reading the folder. Added an "Opening ad…" indicator.
- `ad-picker-modal.tsx`: switched to `AdSetMetadata`; added a `sharedLoading`
  state.

Result: mount performs **zero** folder reads; listing reads only small JSON
metadata (never the `assets/` bytes); opening one set reads only that set.
Validated: `tsc --noEmit` clean, `eslint` (0 errors), `next build` succeeds,
and an app smoke test (picker opens, empty state correct, no runtime errors).

### Phase 3 — Verification & hardening  ⏳
- Confirm `html-to-image` export still works with hydrated data URLs (expected —
  runtime shape unchanged).
- Manual Stream-mode check: mount does zero content reads; picker-open reads only
  metadata; opening a set fetches only its assets.
- Follow-up (not in this effort): orphaned-asset garbage collection on delete
  (deferred — dedup makes eager deletion unsafe).

### Phase 4 — "Optimize for faster loading" (one-time migration)  ✅ implemented
Old folders still hold pre-externalization files that inline base64 images, so
listing them still downloads image bytes even on the new build. `compactFolder()`
reads each set and re-saves it (moving images into `assets/`, shrinking the
JSON); ids/names/timestamps preserved; idempotent and safe to re-run. Surfaced
as a sidebar button with live progress. Best run from a **Mirror**-mode machine
so the affected user never sweeps the old files.

### Phase 5 — Version indicator + refresh prompt  ✅ implemented
Because this is a hosted web app, a migrated (new-format) file shows broken
images to anyone still on an **old build**. To make build state visible and
actionable: a per-deployment build id (Vercel commit sha) is injected via
`next.config` `env`; a dynamic `/api/version` route reports the deployed id; a
client `VersionWatcher` compares it to the tab's loaded id and shows a "new
version available — Refresh" prompt on mismatch (polls on mount, focus, and
every 5 min). The header shows `APP_VERSION`. No-ops in local dev.

## Rollout sequence

The one hard rule: a file is only rewritten to the new format when someone on the
**new build** saves or optimizes it, and **old builds cannot render images from
new-format files** (data is intact; images reappear on refresh to the new build).
So order matters:

1. **Merge + deploy the new build to production first.** The Optimize button only
   exists in the new build, and everyone must be able to *reach* the new build
   before any file is migrated. Never optimize from a local/preview build against
   the real folder while production is still the old build — that would break
   images for all current production users.
2. **Nudge active users onto the new build.** After deploy, open tabs get the
   refresh prompt (within ~5 min or on focus); they click Refresh. New/returning
   visitors load it fresh automatically.
3. **Run "Optimize for faster loading" once**, ideally from a **Mirror**-mode
   machine, during a quiet window. Partial failures are safe — unmigrated sets
   stay old-format (still readable by everyone) and can be re-optimized later.
4. **Interim mitigation** for the affected user until she's confirmed on the new
   build: Drive for Desktop → **Mirror**, or mark the folder **Available offline**.

**Users on vacation are not a concern.** They have nothing loaded now, so when
they return they load the new build fresh and read new-format files correctly.
The only exposure is a user with an *old tab actively open at optimize time* who
views a migrated set before refreshing — a momentary broken image, fixed by the
refresh prompt, with no data loss.

## Risks

- **Export capturing images** — mitigated by keeping data URLs at runtime.
- **Asset GC** — intentionally skipped now; orphaned assets are harmless.
- **SubtleCrypto** requires a secure context — fine for localhost/https.
- **Concurrency** — asset files immutable/idempotent; ad-set JSON keeps today's
  last-writer-wins semantics per file (unchanged).

## Testing

- Type-check + algorithm round-trip (done in Phase 1).
- Manual: save a set to a real folder → confirm `assets/` appears and JSON is KB;
  reload → images render; export a PNG → images present.
- Stream-mode: verify no freeze after Phase 2 with the folder in Stream mode.

---

## Jira backlog (ready to create in project **DES**)

> Not yet created — the Atlassian connector needs authorization in an interactive
> session first (see handoff note). Content below is ready to paste/create.

**Epic — Ad Builder shared-folder freeze remediation**
Ad Builder freezes for users on Google Drive "Stream" mode because the app reads
the entire shared folder (multi-MB base64-inlined ad-set files) on mount and
after every save. Externalize images and lazy-load the folder so behavior no
longer depends on each user's Drive configuration.

**Story 1 — Externalize shared-folder images into a content-addressed asset store**
As the storage layer, move `logoUrl`/`additionalImageUrl` out of the ad-set JSON
into `assets/{sha256}.{ext}`, replacing them with references so files stay small
and duplicate images dedupe.
*AC:* new saves write small JSON + asset files; duplicate images write once;
legacy inline-data-URL files still load; export unaffected. *(Implemented.)*

**Story 2 — Lazy-load shared ad sets; stop full-folder reads**
Load the ad-set list only when the picker opens (metadata only, no content
reads); hydrate a set's images only when it is opened; update the in-memory list
incrementally after save/update/delete.
*AC:* mount performs zero ad-set content reads; opening the picker lists sets
without downloading image bytes; opening one set downloads only that set's
assets; saving does not re-read the whole folder.

**Story 3 — Verify export + Stream-mode behavior; document Drive guidance**
Confirm PNG export still embeds images; verify no freeze in Stream mode; document
the Mirror/offline mitigation for support.
*AC:* export includes images; manual Stream-mode run shows no freeze; support doc
updated.
