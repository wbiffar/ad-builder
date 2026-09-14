import { AdConfig, PersistedAdConfig, PersistedSavedAdSet } from "./types";
import { AdSetMetadata, SavedAdSet, migrateAdConfig, openDB, SHARED_FOLDER_STORE } from "./ad-storage";
import { serializeConfig, hydrateConfig, type AssetReadCache } from "./asset-store";

// --- Minimal File System Access API typings ---
// These cover the non-standard / not-yet-ubiquitous surface we rely on, so the
// code type-checks regardless of the installed lib.dom version. The handle types
// themselves (FileSystemDirectoryHandle / FileSystemFileHandle) come from lib.dom.

type FileSystemPermissionMode = "read" | "readwrite";

interface PermissionAwareHandle {
  queryPermission(descriptor?: { mode?: FileSystemPermissionMode }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode?: FileSystemPermissionMode }): Promise<PermissionState>;
}

interface DirectoryPickerWindow {
  showDirectoryPicker(options?: { mode?: FileSystemPermissionMode }): Promise<FileSystemDirectoryHandle>;
}

// Async iteration over directory entries lives in lib.dom.asynciterable, which
// this project's tsconfig does not include — declare the slice we use.
interface IterableDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

const HANDLE_KEY = "directory-handle";

/** True when the current browser supports the File System Access directory picker. */
export function isSharedFolderSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Opens the native folder picker and returns the granted directory handle. */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  return (window as unknown as DirectoryPickerWindow).showDirectoryPicker({ mode: "readwrite" });
}

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined") return null;
  try {
    const db = await openDB();
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(SHARED_FOLDER_STORE, "readonly");
      const store = tx.objectStore(SHARED_FOLDER_STORE);
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to read stored directory handle", err);
    return null;
  }
}

export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SHARED_FOLDER_STORE, "readwrite");
    const store = tx.objectStore(SHARED_FOLDER_STORE);
    const request = store.put(handle, HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SHARED_FOLDER_STORE, "readwrite");
    const store = tx.objectStore(SHARED_FOLDER_STORE);
    const request = store.delete(HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Checks read/write permission on the handle, prompting the user to re-grant if
 * needed. requestPermission requires a user gesture, so when called outside one
 * (e.g. on page load) it may throw — treated here as "not granted".
 */
export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: "readwrite" as const };
  const h = handle as unknown as PermissionAwareHandle;
  try {
    if ((await h.queryPermission(opts)) === "granted") return true;
    if ((await h.requestPermission(opts)) === "granted") return true;
  } catch (err) {
    console.error("Permission check failed", err);
  }
  return false;
}

function fileNameFor(id: string): string {
  return `${id}.json`;
}

/**
 * Drive conflict copies (and a crashed write) sometimes append bytes after a
 * valid JSON document. V8 reports that as "Unexpected non-whitespace character
 * after JSON at position N" — slice to N and parse the real object.
 */
function parseJsonAllowingTrailer<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const match = /position (\d+)/i.exec(err instanceof Error ? err.message : "");
    const pos = match ? Number(match[1]) : NaN;
    if (Number.isFinite(pos) && pos > 0 && pos < text.length) {
      return JSON.parse(text.slice(0, pos)) as T;
    }
    throw err;
  }
}

export async function saveAdSetToFolder(handle: FileSystemDirectoryHandle, adSet: SavedAdSet): Promise<void> {
  // getFileHandle({ create }) needs read-write permission; the picker can grant
  // read-only, so request the upgrade here (runs under the save-click gesture).
  if (!(await verifyPermission(handle))) {
    throw new Error("Write permission for the shared folder was denied.");
  }
  // Externalize images into assets/ so the JSON we sync stays small; the same
  // logo shared across ad sizes collapses to one file via content hashing.
  const configMap: Record<string, PersistedAdConfig> = {};
  for (const [size, cfg] of Object.entries(adSet.configMap)) {
    configMap[size] = await serializeConfig(handle, cfg);
  }
  const persisted: PersistedSavedAdSet = { ...adSet, configMap };
  const fileHandle = await handle.getFileHandle(fileNameFor(adSet.id), { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(JSON.stringify(persisted, null, 2));
  } finally {
    await writable.close();
  }
}

const LIST_PREFIX_BYTES = 8192;
const SMALL_JSON_FALLBACK_BYTES = 32 * 1024;

function metadataFromPrefix(text: string): AdSetMetadata | null {
  const id = /"id"\s*:\s*"([^"]+)"/.exec(text)?.[1];
  if (!id) return null;
  return {
    id,
    name: /"name"\s*:\s*"([^"]*)"/.exec(text)?.[1] ?? "Untitled Ad Set",
    createdAt: /"createdAt"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? new Date().toISOString(),
    updatedAt: /"updatedAt"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? new Date().toISOString(),
  };
}

/**
 * Lists ad sets from the first 8KB of each JSON — enough for id/name/timestamps
 * on both new-format and legacy files (those fields are written first). Does not
 * read inlined images or touch assets/, so Drive Stream never hydrates megabytes
 * just to open the picker.
 */
export async function listAdSetsMetadata(handle: FileSystemDirectoryHandle): Promise<AdSetMetadata[]> {
  const results: AdSetMetadata[] = [];
  const iterable = handle as unknown as IterableDirectoryHandle;
  for await (const entry of iterable.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;
    try {
      const file = await (entry as FileSystemFileHandle).getFile();
      const prefix = await file.slice(0, Math.min(LIST_PREFIX_BYTES, file.size)).text();
      let meta = metadataFromPrefix(prefix);
      // Tiny files may not include the header fields in a regex-friendly way
      // after truncation; only then fall back to a full read, and only if the
      // file is small enough that a full read cannot freeze the machine.
      if (!meta && file.size <= SMALL_JSON_FALLBACK_BYTES) {
        const parsed = parseJsonAllowingTrailer<Partial<PersistedSavedAdSet>>(await file.text());
        if (parsed.id && parsed.configMap) {
          meta = {
            id: parsed.id,
            name: parsed.name ?? "Untitled Ad Set",
            createdAt: parsed.createdAt ?? new Date().toISOString(),
            updatedAt: parsed.updatedAt ?? new Date().toISOString(),
          };
        }
      }
      if (!meta) {
        console.warn(`Skipping malformed ad set file: ${entry.name}`);
        continue;
      }
      results.push(meta);
    } catch (err) {
      console.error(`Failed to parse shared ad set file: ${entry.name}`, err);
    }
  }
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results;
}

/**
 * Reads a single ad set by id and hydrates its image assets into data URLs.
 * Only the one requested file and its assets are read, so opening a set costs
 * exactly that set's data — not the whole folder. Returns null if the file is
 * missing or malformed.
 */
export async function readAdSet(handle: FileSystemDirectoryHandle, id: string): Promise<SavedAdSet | null> {
  let file: File;
  try {
    const fileHandle = await handle.getFileHandle(fileNameFor(id));
    file = await fileHandle.getFile();
  } catch (err) {
    if ((err as DOMException)?.name === "NotFoundError") return null;
    throw err;
  }
  try {
    const parsed = parseJsonAllowingTrailer<Partial<PersistedSavedAdSet>>(await file.text());
    if (!parsed.id || !parsed.configMap) {
      console.warn(`Skipping malformed ad set file: ${fileNameFor(id)}`);
      return null;
    }
    // One cache for the whole set: the same logo/photo is referenced by every
    // size, so we read each asset file once instead of ten times.
    const cache: AssetReadCache = new Map();
    const configMap: Record<string, AdConfig> = {};
    await Promise.all(
      Object.entries(parsed.configMap).map(async ([size, cfg]) => {
        const hydrated = await hydrateConfig(handle, (cfg ?? {}) as PersistedAdConfig, cache);
        configMap[size] = migrateAdConfig(hydrated);
      })
    );
    return {
      id: parsed.id,
      name: parsed.name ?? "Untitled Ad Set",
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      configMap,
    };
  } catch (err) {
    console.error(`Failed to read shared ad set: ${id}`, err);
    return null;
  }
}

export type CompactProgress = { done: number; total: number };
export type CompactResult = { migrated: number; failed: number };

/**
 * Rewrites every ad set in the folder through the current save path: reads each
 * set (hydrating its images) and saves it back, which externalizes any inline
 * images into assets/ and shrinks the JSON. This is a one-time migration for
 * folders created before image externalization — once compacted, listing the
 * folder no longer downloads image data. Re-running it is safe: already-external
 * sets simply re-write identical (content-hashed) assets, which are skipped.
 *
 * Names, ids, and timestamps are preserved. Runs serially and deliberately — it
 * is a heavy operation best triggered from a machine whose Drive copy is local
 * (Mirror mode) so the affected user never sweeps the old files.
 */
export async function compactFolder(
  handle: FileSystemDirectoryHandle,
  onProgress?: (p: CompactProgress) => void
): Promise<CompactResult> {
  if (!(await verifyPermission(handle))) {
    throw new Error("Write permission for the shared folder was denied.");
  }
  const metas = await listAdSetsMetadata(handle);
  let migrated = 0;
  let failed = 0;
  for (let i = 0; i < metas.length; i++) {
    try {
      const set = await readAdSet(handle, metas[i].id);
      if (set) {
        await saveAdSetToFolder(handle, set);
        migrated++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`Failed to compact ad set ${metas[i].id}`, err);
      failed++;
    }
    onProgress?.({ done: i + 1, total: metas.length });
  }
  return { migrated, failed };
}

export async function deleteAdSetFromFolder(handle: FileSystemDirectoryHandle, id: string): Promise<void> {
  if (!(await verifyPermission(handle))) {
    throw new Error("Write permission for the shared folder was denied.");
  }
  try {
    await handle.removeEntry(fileNameFor(id));
  } catch (err) {
    // A missing file is fine — nothing to delete.
    if ((err as DOMException)?.name !== "NotFoundError") throw err;
  }
}
