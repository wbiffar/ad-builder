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

function stringFieldFromPrefix(text: string, field: string): string | null {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`"${escapedField}"\\s*:\\s*("(?:\\\\.|[^"\\\\])*")`).exec(text);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as string;
  } catch {
    return null;
  }
}

function metadataFromPrefix(text: string): AdSetMetadata | null {
  const id = stringFieldFromPrefix(text, "id");
  if (!id) return null;
  return {
    id,
    name: stringFieldFromPrefix(text, "name") ?? "Untitled Ad Set",
    createdAt: stringFieldFromPrefix(text, "createdAt") ?? new Date().toISOString(),
    updatedAt: stringFieldFromPrefix(text, "updatedAt") ?? new Date().toISOString(),
  };
}

export type ListOptions = {
  /** Stops the scan between files; whatever was read so far is returned. */
  signal?: AbortSignal;
  /** Give up waiting on one file after this long (ms). 0 disables. */
  perFileTimeoutMs?: number;
  /** Stop scanning after this much total time (ms). 0 disables. */
  budgetMs?: number;
  /** Stop after this many files in a row time out — Drive is likely stalled. */
  maxConsecutiveTimeouts?: number;
};

export type ListResult = {
  sets: AdSetMetadata[];
  /** True when the scan stopped early (timeout, budget, stall, or cancel). */
  partial: boolean;
  /** Files skipped because they took longer than perFileTimeoutMs. */
  timedOut: number;
  /** Why the scan stopped early, when it did. */
  stoppedBy?: "cancel" | "budget" | "stall";
};

// Defaults sized for Drive "Stream" mode: a cold file that hasn't been fetched
// yet can take seconds, but one that takes longer than this is better skipped
// than waited on, and a whole scan should never hold the tab hostage.
const DEFAULT_PER_FILE_TIMEOUT_MS = 4000;
const DEFAULT_LIST_BUDGET_MS = 20000;
const DEFAULT_MAX_CONSECUTIVE_TIMEOUTS = 3;

class ListTimeoutError extends Error {}
class ListAbortError extends Error {}

/**
 * Resolves with the promise, or rejects with ListTimeoutError after `ms` (or
 * ListAbortError when `signal` fires). The underlying file read can't be
 * cancelled, but we stop waiting on it — and stop queuing further reads behind
 * it — so a stuck Drive download can't pile up.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  if (!ms && !signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = ms ? setTimeout(() => settle(() => reject(new ListTimeoutError())), ms) : undefined;
    const onAbort = () => settle(() => reject(new ListAbortError()));
    function settle(fn: () => void) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      fn();
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => settle(() => resolve(v)),
      (e) => settle(() => reject(e))
    );
  });
}

async function readListEntry(entry: FileSystemFileHandle): Promise<AdSetMetadata | null> {
  const file = await entry.getFile();
  const prefix = await file.slice(0, Math.min(LIST_PREFIX_BYTES, file.size)).text();
  const meta = metadataFromPrefix(prefix);
  if (meta) return meta;
  // Tiny files may not include the header fields in a regex-friendly way
  // after truncation; only then fall back to a full read, and only if the
  // file is small enough that a full read cannot freeze the machine.
  if (file.size > SMALL_JSON_FALLBACK_BYTES) return null;
  const parsed = parseJsonAllowingTrailer<Partial<PersistedSavedAdSet>>(await file.text());
  if (!parsed.id || !parsed.configMap) return null;
  return {
    id: parsed.id,
    name: parsed.name ?? "Untitled Ad Set",
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Lists ad sets from the first 8KB of each JSON — enough for id/name/timestamps
 * on both new-format and legacy files (those fields are written first). Does not
 * read inlined images or touch assets/, so Drive Stream never hydrates megabytes
 * just to open the picker.
 *
 * Files are read one at a time under a per-file timeout and an overall budget,
 * and the scan can be cancelled. A cold Drive cache (e.g. after time away) can
 * make every file a download; rather than queue them all, the scan returns what
 * it has with `partial: true` so the UI can offer a retry.
 */
export async function listAdSetsMetadata(
  handle: FileSystemDirectoryHandle,
  options: ListOptions = {}
): Promise<ListResult> {
  const {
    signal,
    perFileTimeoutMs = DEFAULT_PER_FILE_TIMEOUT_MS,
    budgetMs = DEFAULT_LIST_BUDGET_MS,
    maxConsecutiveTimeouts = DEFAULT_MAX_CONSECUTIVE_TIMEOUTS,
  } = options;
  const sets: AdSetMetadata[] = [];
  const startedAt = Date.now();
  let timedOut = 0;
  let consecutiveTimeouts = 0;
  let stoppedBy: ListResult["stoppedBy"];

  const iterable = handle as unknown as IterableDirectoryHandle;
  for await (const entry of iterable.values()) {
    if (signal?.aborted) {
      stoppedBy = "cancel";
      break;
    }
    if (budgetMs && Date.now() - startedAt > budgetMs) {
      stoppedBy = "budget";
      break;
    }
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;
    try {
      const meta = await withTimeout(readListEntry(entry as FileSystemFileHandle), perFileTimeoutMs, signal);
      consecutiveTimeouts = 0;
      if (!meta) {
        console.warn(`Skipping malformed ad set file: ${entry.name}`);
        continue;
      }
      sets.push(meta);
    } catch (err) {
      if (err instanceof ListAbortError) {
        stoppedBy = "cancel";
        break;
      }
      if (err instanceof ListTimeoutError) {
        timedOut++;
        consecutiveTimeouts++;
        console.warn(`Timed out reading shared ad set file: ${entry.name}`);
        if (maxConsecutiveTimeouts && consecutiveTimeouts >= maxConsecutiveTimeouts) {
          stoppedBy = "stall";
          break;
        }
        continue;
      }
      consecutiveTimeouts = 0;
      console.error(`Failed to parse shared ad set file: ${entry.name}`, err);
    }
  }
  sets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { sets, partial: !!stoppedBy || timedOut > 0, timedOut, stoppedBy };
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
export type CompactResult = {
  /** Ad set files found in the folder. */
  total: number;
  /** Files still carrying inline images (the pre-August format). */
  legacy: number;
  /** Combined size of those legacy files, in bytes. */
  legacyBytes: number;
  /** Legacy files rewritten into the current format (0 on a dry run). */
  migrated: number;
  failed: number;
};

// Inline images are stored as data URLs; the current format replaces every one
// with an AssetRef, so any `"data:` left in a file marks it as legacy.
const INLINE_IMAGE_MARKER = '"data:';

/**
 * Finds ad sets that still carry inline images and, unless `dryRun`, rewrites
 * each through the current save path: images move into assets/ and the JSON
 * shrinks to a few KB. Sets already in the current format are left untouched,
 * so re-running it is cheap and safe.
 *
 * Names, ids, and timestamps are preserved. It reads every file in full, so it
 * must run from a machine whose Drive copy is local (Mirror mode) — never from
 * a Stream-mode machine, where it would trigger the very download storm it is
 * meant to prevent. Runs serially with no timeouts: it is a deliberate,
 * one-off maintenance action, not part of normal use.
 */
export async function compactFolder(
  handle: FileSystemDirectoryHandle,
  onProgress?: (p: CompactProgress) => void,
  { dryRun = false, signal }: { dryRun?: boolean; signal?: AbortSignal } = {}
): Promise<CompactResult> {
  if (!dryRun && !(await verifyPermission(handle))) {
    throw new Error("Write permission for the shared folder was denied.");
  }
  const { sets: metas } = await listAdSetsMetadata(handle, {
    signal,
    perFileTimeoutMs: 0,
    budgetMs: 0,
    maxConsecutiveTimeouts: 0,
  });
  const result: CompactResult = { total: metas.length, legacy: 0, legacyBytes: 0, migrated: 0, failed: 0 };
  for (let i = 0; i < metas.length; i++) {
    if (signal?.aborted) break;
    const id = metas[i].id;
    try {
      const file = await (await handle.getFileHandle(fileNameFor(id))).getFile();
      if ((await file.text()).includes(INLINE_IMAGE_MARKER)) {
        result.legacy++;
        result.legacyBytes += file.size;
        if (!dryRun) {
          const set = await readAdSet(handle, id);
          if (set) {
            await saveAdSetToFolder(handle, set);
            result.migrated++;
          } else {
            result.failed++;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to compact ad set ${id}`, err);
      result.failed++;
    }
    onProgress?.({ done: i + 1, total: metas.length });
  }
  return result;
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
