# Ad Builder — Code Audit: Freezes, Bugs, Security

**Date:** 2026-10-26 · **Build reviewed:** v1.9.0 (`3ddee17`)
**Trigger:** users still report Ad Builder freezing the whole computer, so they have to hard-reboot.
The latest case was a user back from two weeks' vacation.

Each finding is tagged with how sure we are:
**Measured**: reproduced in the running app.
**From code**: follows directly from reading the code.
**Hypothesis**: likely, but needs confirming on an affected machine.

---

## How a web page can freeze the whole computer

A tab that runs out of memory normally just crashes ("Aw, Snap"). The machine stays usable.
A freeze that needs a hard reboot usually has one of two causes:

1. **A file-system stall.** Google Drive for Desktop runs as a file-system driver. When it is
   forced to download many files at once, everything that touches that drive can block,
   including Explorer, the taskbar and the file dialogs. The machine looks dead.
2. **Running out of RAM.** Chrome commits so much memory that Windows starts paging to disk
   continuously, and the UI stops responding.

The app can trigger both. The shared-folder fix in August (v1.4.0) reduced cause 1 but did not
remove it. Cause 2 has three separate sources that the August work did not address.

---

## Why the vacation user froze (most likely sequence)

1. **Folder permission expired.** Chrome drops File System Access permission after a period of
   inactivity. On load, `verifyPermission` fails without a user gesture, and the sidebar shows
   **Reconnect folder**.
2. **Reconnecting lists the whole folder straight away.** `handleConnectFolder` calls
   `loadSharedList` right after the picker returns ([page.tsx:239](src/app/page.tsx:239)).
   That listing opens and reads every `.json` in the folder. The lazy-on-picker-open fix does
   not cover this path.
3. **The Drive cache is cold.** In Stream mode, Drive keeps local copies only of files read
   recently. After two weeks, every set that teammates created or changed is cloud-only, so the
   listing forces Drive to fetch all of them. At the same moment, Drive for Desktop is still
   catching up on two weeks of sync changes.
4. **Many files are still in the heavy legacy format.** The "Optimize for faster loading"
   migration shipped and was removed on the same day (`d5a34b7`, `1c701c9`), so it most likely
   never ran. Every set saved before v1.4.0 still holds multi-MB inline base64 images. The
   listing reads only the first 8 KB, but **whether Drive for Desktop can serve 8 KB of a
   cloud-only file without downloading all of it is unverified.** If it downloads the whole
   file, the August fix does nothing for these files.

A daily user rarely hits this: their cache is warm and only a few files are new each day. That
fits who gets hit and when.

---

## Findings, in order of importance

### 1. Reconnecting a folder still reads every file in it (freeze risk) — From code + Hypothesis
**Where:** [page.tsx:239](src/app/page.tsx:239), `listAdSetsMetadata` in [shared-folder-storage.ts:170](src/lib/shared-folder-storage.ts:170)

Listing calls `getFile()` and reads a slice of every `.json`, one at a time, with no timeout,
no cap and no way to cancel it. Cost grows with folder size. The worst case is a reconnect on a
cold Stream cache.

**Fix:**
- **Short term:** stop listing on connect/reconnect; list only when the picker opens. Add a
  per-file timeout and an overall time budget, cancel the scan if the picker closes, and show
  results as they arrive instead of after the whole sweep.
- **Durable:** make listing need **zero file reads**. Put the metadata in the filename, e.g.
  `{id}__{updatedAt}__{name-slug}.json`. Listing a directory reads only its entries, which Drive
  already has locally even in Stream mode, so nothing gets downloaded. On save, write the new
  name and remove the old one. If two writers race, keep the newest timestamp per `id` and
  clean up the rest. A shared `index.json` manifest would also work, but multi-writer
  last-write-wins could drop entries. The filename approach avoids that.

### 2. Legacy multi-MB shared files were never migrated — From code
**Where:** `compactFolder` in [shared-folder-storage.ts:265](src/lib/shared-folder-storage.ts:265) is unused (its button was removed).

Pre-v1.4.0 sets still inline every image, duplicated across all 5 sizes. Opening one reads the
whole file, and each size gets its own copy of the image strings in memory.

**Fix:** run `compactFolder` once from a machine in Mirror mode, during a quiet window. Either
temporarily restore the button or run it from a small one-off admin page/script. All users are
already on a build that reads the new format (v1.4.0+), so the rollout risk described in the
August doc no longer applies.

### 3. Every export permanently adds about 4 MB of font data to the page (memory leak) — Measured
**Where:** [export.ts:71](src/lib/export.ts:71), via `html-to-image`'s `embedWebFonts`

Google Fonts stylesheets are cross-origin. `html-to-image` cannot read their rules, so on
**every capture** it re-downloads the stylesheet's fonts, converts them to base64, and
**inserts the rules into the page's own stylesheet**. Those rules are never removed.

Measured locally with one Google font (Playfair Display) loaded:

| Exports | `@font-face` rules on page | Base64 font CSS held by page |
|---|---|---|
| 0 | 13 | 0 MB |
| 1 | 117 | 4.05 MB |
| 3 | 325 | 12.15 MB |
| 7 | 741 | 28.34 MB |

- Each font a user picks during a session adds another family to every later export.
- **Download All** captures every selected size, so it costs about 5× per click.
- A user who keeps one tab open for days and exports a lot builds up hundreds of MB of CSS in
  memory. Chrome's style engine also parses it, which adds more.

**Fix:** build the font CSS **once**, using `getFontEmbedCSS(node)` from `html-to-image`. Cache
it per set of fonts in use, and pass it as `fontEmbedCSS` to every `toBlob` call. That stops
the per-capture fetch and insert. As a further option, self-host the fonts with `next/font`
(same-origin, so the rules are readable) and add `crossOrigin="anonymous"` to the font `<link>`
in [fonts.ts:50](src/lib/fonts.ts:50). Also drop `cacheBust: true`: images are data URLs, so
it only defeats HTTP caching.

### 4. Every locally saved ad set is loaded into memory on startup, with each image stored 5× — Measured + From code
**Where:** `getSavedAdSets` in [ad-storage.ts:72](src/lib/ad-storage.ts:72), called on mount ([page.tsx:178](src/app/page.tsx:178)) and again after every save, update and delete ([page.tsx:294](src/app/page.tsx:294), [311](src/app/page.tsx:311), [437](src/app/page.tsx:437))

- **"Save new" always writes a full local copy**, even with a shared folder connected. The local
  IndexedDB keeps every set a user has ever saved and never prunes.
- IndexedDB does not deduplicate strings. One logo shared across the 5 sizes is stored 5 times
  and read back as 5 separate strings. **Measured:** a 10 MB string referenced from 5 fields
  took 50 MB in storage.
- Image size limits only arrived on 2026-09-14 (`422e97f`). Sets saved earlier may hold
  unresized camera photos (5–15 MB each).
- So a long-time heavy user's startup can pull **hundreds of MB to GBs** into the tab. Each
  save then re-reads all of it while the old copy is still in memory.

This fits "some users, repeatedly": it scales with how much each person has saved.

**Fix:**
- Load only metadata for the local list, as the shared list already does. Use a separate
  metadata object store, or a cursor that reads keys and fields only. Read the full set on open.
- After a save, update the in-memory list incrementally instead of calling `getSavedAdSets()`
  again.
- Store each image once per set: either a per-set `images` map that the configs reference, or
  the same content-addressed scheme `asset-store.ts` already uses for the shared folder.
- Run a one-time local migration that re-compresses old oversized images through
  `optimizeUpload`.
- Decide whether shared saves should also be kept locally. If not, stop the double-write.

### 5. Image uploads have no hard size cap, and several paths store the original as-is — From code
**Where:** [image-optimize.ts:14-23](src/lib/image-optimize.ts:14)

- **SVG** is stored as-is at any size. A "logo" SVG with a 20 MB embedded raster passes straight
  through and is then rendered by 7 `<img>` elements (5 previews plus 2 in-context previews).
- **If optimizing fails, the original file is stored.** That covers HEIC, TIFF, a corrupt file,
  or `createImageBitmap` failing on a huge image. The image may not even render, but it still
  gets saved, duplicated and synced.
- **No limit on input size before decoding.** `createImageBitmap` on a 100-megapixel image
  allocates about 400 MB of decoded pixels.
- The photo upload path ([ad-form.tsx:216](src/components/ad-form.tsx:216)) does not check
  `file.type`, so anything can be passed.

**Fix:**
- Reject files over a hard limit (e.g. 25 MB) before decoding.
- Reject or rasterize SVGs over about 500 KB.
- If optimizing fails, show an error instead of falling back to the original.
- Check `image/*` on both upload paths, and limit uploads to `png`, `jpeg`, `webp` and `svg`.

### 6. IndexedDB connections are opened on every call and never closed — From code
**Where:** `openDB` in [ad-storage.ts:54](src/lib/ad-storage.ts:54), used by every storage function

Each save, load or delete opens a new connection and leaks it. Today that is mostly waste. It
becomes a hard hang the next time `DB_VERSION` is bumped: the upgrade waits on the leaked
connections in other tabs, and `onblocked` is not handled, so the app silently loads nothing.

**Fix:** open once and cache the connection promise. Handle `onversionchange` by closing the
connection, and `onblocked` by asking the user to close other tabs.

### 7. Logo upload can overwrite edits made while colors are being extracted — From code (bug)
**Where:** `processLogoFile` in [ad-form.tsx:114-137](src/components/ad-form.tsx:114)

The second `onChange({...config, ...})` uses the `config` captured before the `await`. Any edits
the user makes during extraction are reverted, for example typing a tagline while a large logo
is processed. The same pattern is in `handleGenerateToggle`.

**Fix:** use a functional update in the page (`setConfigMap(prev => …)`), or merge only the
changed fields into the latest config through a ref.

### 8. Opening a set has no guard against double clicks or concurrent opens — From code
**Where:** `doLoadAdSet` in [page.tsx:346](src/app/page.tsx:346)

Clicking two sets quickly starts two `readAdSet` calls. Whichever finishes last wins, so the
wrong set can end up open. Each call also reads every image in its set.

**Fix:** keep a request token or `AbortController`, ignore results that are no longer current,
and disable the picker while a set is opening.

### 9. The shared `assets/` folder only grows — From code
Nothing is ever deleted; this was a deliberate trade-off in the August doc. For Mirror-mode
users, Drive downloads the whole folder, so it costs disk and sync time on every machine.

**Fix:** add an occasional, manually triggered "clean up" step. It scans every set's
references (cheap once filenames carry metadata) and deletes unreferenced assets older than N
days.

### 10. Drive conflict copies produce duplicate entries and can open the wrong file — From code
`listAdSetsMetadata` lists `123-abc (1).json` with the same `id` as `123-abc.json`. That gives
duplicate React keys in the picker, and `readAdSet(id)` always opens the original, never the
conflict copy.

**Fix:** de-duplicate by `id`, keeping the newest `updatedAt`, and remember which filename it
came from. The filename-metadata scheme in finding 1 handles this naturally.

### 11. Security (low severity overall)
- **Image fields from shared files are passed through unchecked**
  ([asset-store.ts:150](src/lib/asset-store.ts:150)). Any non-`data:` string goes straight into
  `<img src>`, so a hand-edited JSON could point at an external tracking URL. Scripts cannot run
  this way (images never execute script). **Fix:** on hydrate, accept only `data:image/*` or an
  `AssetRef`, and drop anything else.
- **Color and gradient strings from shared JSON end up in inline CSS** (`getGradientCSS`). React
  limits this to one property, but a value like `url(https://…)` would still make a network
  request. **Fix:** validate colors against a hex/rgb pattern in `migrateAdConfig`.
- **No security headers.** [next.config.ts](next.config.ts) sets no CSP, `X-Frame-Options` or
  `Referrer-Policy`. **Fix:** add a basic CSP that allows `self`, `fonts.googleapis.com`,
  `fonts.gstatic.com` and `data:`/`blob:` images, plus `frame-ancestors 'none'`.
- **Content-addressed asset names stop accidental overwrites but not deliberate ones.** Anyone
  with folder access can replace an asset file. That is acceptable for an internal team folder;
  just note it.

### 12. Smaller performance items — From code
- **Repeated layout measurement while typing.** `FitText` forces about 10 synchronous layouts
  per text block on every change, across 5 sizes plus the preview, so roughly 100+ per
  keystroke. Fine today; debounce it if typing ever feels slow.
- **Export changes the live preview's styles.** `captureElement` edits styles on the on-screen
  preview while it captures. Changing the preview scale mid-export restores the wrong values.
  Capture a detached clone instead.

---

## Recommended order of work

| # | Action | Effort | Addresses |
|---|---|---|---|
| 1 | Stop listing on reconnect; add timeout, budget and cancel to listing | S | Vacation freeze |
| 2 | Run `compactFolder` once from a Mirror-mode machine | S | Heavy legacy files |
| 3 | Cache `fontEmbedCSS` once; drop `cacheBust` | S | Export memory leak |
| 4 | Metadata-only local list; incremental updates after save | M | Startup memory |
| 5 | Hard upload limits; no fallback to the original file | S | Huge images getting in |
| 6 | Move shared listing to filename metadata (zero file reads) | M | Root fix for Stream mode |
| 7 | One-time local image re-compression and dedupe | M | Existing local bloat |
| 8 | Single IndexedDB connection; fix stale-closure and double-open bugs | S | Latent hang and bugs |
| 9 | Security hardening (validate inputs, add CSP) | S | Low-risk exposure |

Items 1–3 are small and can ship together as the next patch.

---

## Confirming the cause with the affected user (before or alongside the fixes)

Ask the vacation user, or the next person it happens to, for:

1. **Drive mode:** Drive for Desktop → Settings → Google Drive → Stream or Mirror.
2. **What they clicked just before the freeze:** Reconnect folder, Open ad, or Download.
3. **Shared folder size:** number of `.json` files, and the size of the largest ones. Files
   over about 100 KB are legacy inline sets.
4. **Local storage size.** In Ad Builder, open DevTools → Console and run:
   ```js
   (await navigator.storage.estimate()).usage / 1e6 + " MB"
   ```
   Hundreds of MB or more confirms finding 4.
5. **Chrome Task Manager** (Shift+Esc), taken after a session with many exports: the Ad Builder
   tab's memory footprint. Steadily rising memory confirms finding 3.

**Interim advice for affected users:**
- Set Drive to **Mirror**, or mark the shared folder **Available offline**.
- Reload the Ad Builder tab once a day rather than leaving it open for days.
