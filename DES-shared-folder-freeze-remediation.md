# Shared-Folder Freeze — Root Cause & Remediation Scope

**Status:** In progress · Phase 1 implemented on branch `feature/des-shared-folder-lazy-load-assets`
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
