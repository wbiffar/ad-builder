# Claude Code Prompt — Implement Approach A1 (Shared Google Drive Folder)

Paste the following into Claude Code to implement A1.

---

## Task

Add shared folder support to the Ad Builder so that ad sets can be saved to and loaded from a local folder (e.g., a synced Google Drive folder). This enables multiple users to share in-progress work without any backend infrastructure — one user saves to the shared folder, another opens the app and sees it immediately.

This is a frontend-only change. Do not modify any backend or API routes.

---

## Technical approach

Use the **File System Access API** (`window.showDirectoryPicker()`) to let the user grant the app permission to a local folder. Once granted, the app can read and write `.json` files in that folder across sessions. Store the `FileSystemDirectoryHandle` in IndexedDB so the permission persists without the user having to re-select the folder every time.

**Browser support note:** The File System Access API is supported in Chrome and Edge but not Firefox. This is acceptable for an internal tool. Gracefully disable the shared folder UI in unsupported browsers with a clear message.

---

## What to build

### 1. Shared folder storage utilities (`src/lib/shared-folder-storage.ts`)

Create a new file with the following functions:

- `getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null>` — retrieves a previously stored handle from IndexedDB.
- `storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void>` — persists the handle to IndexedDB.
- `clearDirectoryHandle(): Promise<void>` — removes the stored handle (used when disconnecting the folder).
- `verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean>` — checks that the app still has read/write permission to the handle; prompts the user to re-grant if needed.
- `saveAdSetToFolder(handle: FileSystemDirectoryHandle, adSet: SavedAdSet): Promise<void>` — serializes the `SavedAdSet` to JSON and writes it as `[id].json` to the folder.
- `loadAdSetsFromFolder(handle: FileSystemDirectoryHandle): Promise<SavedAdSet[]>` — reads all `.json` files from the folder, parses them, runs `migrateAdConfig()` on each for backward compatibility, and returns the valid results. Skip and log any files that fail to parse.
- `deleteAdSetFromFolder(handle: FileSystemDirectoryHandle, id: string): Promise<void>` — deletes the corresponding `.json` file from the folder.

Import `SavedAdSet` and `migrateAdConfig` from their existing locations (`src/lib/types.ts` and `src/lib/ad-storage.ts`).

### 2. Shared folder settings UI

Add a "Shared Folder" section to the existing saved ads sidebar in `src/app/page.tsx` (or extract it into a small `SharedFolderSettings` component if that's cleaner). It should include:

- A button labeled **"Connect Google Drive folder"** that calls `window.showDirectoryPicker()`, stores the returned handle, and immediately loads ad sets from the folder.
- Once connected, show the folder name and a **"Disconnect"** button that calls `clearDirectoryHandle()` and removes shared ad sets from the list.
- If the browser doesn't support `window.showDirectoryPicker`, hide the section entirely and show a small note: _"Shared folders require Chrome or Edge."_

### 3. Shared ad sets in the sidebar

Update the saved ads sidebar to show shared ad sets (loaded from the folder) alongside locally saved ones. Distinguish them visually — a small label or icon (e.g., a cloud or folder icon from Lucide) so users know which ones are local vs. shared.

When the app loads, if a stored directory handle exists, call `verifyPermission()` and if valid, load the shared ad sets automatically. If permission has been revoked, show a prompt to reconnect rather than silently failing.

### 4. Save to folder on save

When a user saves or updates an ad set (the existing save/update flow in `page.tsx`), also write it to the shared folder if one is connected. Use the existing `saveAdSet` / `updateAdSet` logic as the source of truth — the folder write is additive, not a replacement.

### 5. Delete from folder on delete

When a user deletes an ad set, also delete the corresponding `.json` file from the shared folder if connected.

---

## Key files to read before starting

- `src/lib/ad-storage.ts` — existing IndexedDB logic; understand `SavedAdSet`, `saveAdSet`, `updateAdSet`, `deleteAdSet`, `getSavedAdSets`, and `migrateAdConfig`.
- `src/lib/types.ts` — the `SavedAdSet` and `AdConfig` types.
- `src/app/page.tsx` — where save/load/delete is orchestrated and where the sidebar lives.

---

## Constraints

- Do not remove or replace the existing IndexedDB storage — the folder is additive. Local saves should continue to work as before.
- Do not add any new dependencies if possible. Lucide icons are already available for any UI indicators needed.
- Handle errors gracefully — if a folder read/write fails, log the error and show a non-blocking toast or inline message. Do not let folder errors break the existing local save flow.
- Keep the `FileSystemDirectoryHandle` stored in the existing `legacy-ad-creator` IndexedDB database under a new object store (e.g., `shared-folder`) rather than creating a second database.

---

## Acceptance criteria

- [ ] User can connect a local folder (e.g., a synced Google Drive folder) via a folder picker.
- [ ] Ad sets saved in the connected folder appear in the sidebar alongside local ad sets, with a visual distinction.
- [ ] Saving or updating an ad set writes a `.json` file to the connected folder.
- [ ] Deleting an ad set removes the corresponding `.json` file from the folder.
- [ ] The folder connection persists across page reloads without requiring the user to re-select.
- [ ] If folder permission is revoked, the app prompts to reconnect rather than crashing.
- [ ] The feature is gracefully hidden in unsupported browsers (non-Chrome/Edge).
- [ ] Existing local IndexedDB save/load behavior is unchanged.
