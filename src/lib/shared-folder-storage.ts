import { AdConfig } from "./types";
import { SavedAdSet, migrateAdConfig, openDB, SHARED_FOLDER_STORE } from "./ad-storage";

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

export async function saveAdSetToFolder(handle: FileSystemDirectoryHandle, adSet: SavedAdSet): Promise<void> {
  // getFileHandle({ create }) needs read-write permission; the picker can grant
  // read-only, so request the upgrade here (runs under the save-click gesture).
  if (!(await verifyPermission(handle))) {
    throw new Error("Write permission for the shared folder was denied.");
  }
  const fileHandle = await handle.getFileHandle(fileNameFor(adSet.id), { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(JSON.stringify(adSet, null, 2));
  } finally {
    await writable.close();
  }
}

export async function loadAdSetsFromFolder(handle: FileSystemDirectoryHandle): Promise<SavedAdSet[]> {
  const results: SavedAdSet[] = [];
  const iterable = handle as unknown as IterableDirectoryHandle;
  for await (const entry of iterable.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;
    try {
      const file = await (entry as FileSystemFileHandle).getFile();
      const parsed = JSON.parse(await file.text()) as Partial<SavedAdSet>;
      if (!parsed.id || !parsed.configMap) {
        console.warn(`Skipping malformed ad set file: ${entry.name}`);
        continue;
      }
      const configMap: Record<string, AdConfig> = {};
      for (const [size, cfg] of Object.entries(parsed.configMap)) {
        configMap[size] = migrateAdConfig(cfg ?? {});
      }
      results.push({
        id: parsed.id,
        name: parsed.name ?? "Untitled Ad Set",
        createdAt: parsed.createdAt ?? new Date().toISOString(),
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
        configMap,
      });
    } catch (err) {
      console.error(`Failed to parse shared ad set file: ${entry.name}`, err);
    }
  }
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results;
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
