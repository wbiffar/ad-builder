import { AdConfig, AssetRef, PersistedAdConfig } from "./types";

// Images are stored as individual files under this subdirectory of the shared
// folder, keyed by content hash. Keeping them out of the ad-set JSON is what
// lets the JSON stay small (KB, not MB) so it syncs cheaply through Drive.
const ASSETS_DIR = "assets";

// The image fields on AdConfig that carry (potentially large) picture data.
const IMAGE_FIELDS = ["logoUrl", "additionalImageUrl"] as const;

/** Narrows a persisted image field to an AssetRef (vs. a legacy data-URL string). */
export function isAssetRef(value: unknown): value is AssetRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "assetId" in value &&
    "mime" in value &&
    "ext" in value
  );
}

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
};

function extForMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] ?? "bin";
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Splits a `data:<mime>;base64,<payload>` URL into its mime type and raw bytes. */
function dataUrlToBytes(dataUrl: string): { mime: string; bytes: ArrayBuffer } {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, comma); // strip leading "data:"
  const mime = header.split(";")[0] || "application/octet-stream";
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { mime, bytes: bytes.buffer };
}

function bytesToDataUrl(bytes: ArrayBuffer, mime: string): string {
  const arr = new Uint8Array(bytes);
  let binary = "";
  // Chunk to stay well under argument-count limits on fromCharCode.
  const CHUNK = 0x8000;
  for (let i = 0; i < arr.length; i += CHUNK) {
    binary += String.fromCharCode(...arr.subarray(i, i + CHUNK));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

async function getAssetsDir(
  handle: FileSystemDirectoryHandle,
  create: boolean
): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await handle.getDirectoryHandle(ASSETS_DIR, { create });
  } catch (err) {
    if (!create && (err as DOMException)?.name === "NotFoundError") return null;
    throw err;
  }
}

/**
 * Writes an image (given as a data URL) into the folder's assets directory and
 * returns a reference to it. Content-addressed: if a file with the same hash
 * already exists it is left untouched, so repeated saves and duplicate images
 * across ad sizes never rewrite bytes.
 */
async function writeAsset(handle: FileSystemDirectoryHandle, dataUrl: string): Promise<AssetRef> {
  const { mime, bytes } = dataUrlToBytes(dataUrl);
  const assetId = await sha256Hex(bytes);
  const ext = extForMime(mime);
  const dir = await getAssetsDir(handle, true);
  if (!dir) throw new Error("Could not open the assets directory.");
  const name = `${assetId}.${ext}`;

  let exists = false;
  try {
    await dir.getFileHandle(name);
    exists = true;
  } catch {
    exists = false;
  }
  if (!exists) {
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(bytes);
    } finally {
      await writable.close();
    }
  }
  return { assetId, mime, ext };
}

/** Reads an asset back into a data URL for runtime use, or null if missing. */
async function readAsset(handle: FileSystemDirectoryHandle, ref: AssetRef): Promise<string | null> {
  const dir = await getAssetsDir(handle, false);
  if (!dir) return null;
  try {
    const fileHandle = await dir.getFileHandle(`${ref.assetId}.${ref.ext}`);
    const file = await fileHandle.getFile();
    return bytesToDataUrl(await file.arrayBuffer(), ref.mime);
  } catch (err) {
    if ((err as DOMException)?.name === "NotFoundError") return null;
    throw err;
  }
}

/** Converts one runtime image field (a data URL, or null) into a persisted form. */
async function externalize(
  handle: FileSystemDirectoryHandle,
  value: string | null
): Promise<AssetRef | string | null> {
  if (!value) return null;
  // Only inline data URLs get externalized; anything else is passed through.
  if (!value.startsWith("data:")) return value;
  return writeAsset(handle, value);
}

/** Converts one persisted image field back into a runtime data URL, or null. */
async function internalize(
  handle: FileSystemDirectoryHandle,
  value: AssetRef | string | null
): Promise<string | null> {
  if (!value) return null;
  if (typeof value === "string") return value; // legacy inline data URL
  if (isAssetRef(value)) return readAsset(handle, value);
  return null;
}

/**
 * Serializes a runtime AdConfig for storage in the shared folder: extracts each
 * image into the assets directory and replaces it with a reference. The rest of
 * the config is copied verbatim.
 */
export async function serializeConfig(
  handle: FileSystemDirectoryHandle,
  config: AdConfig
): Promise<PersistedAdConfig> {
  const [logoUrl, additionalImageUrl] = await Promise.all(
    IMAGE_FIELDS.map((field) => externalize(handle, config[field]))
  );
  return { ...config, logoUrl, additionalImageUrl };
}

/**
 * Hydrates a persisted config back into a runtime AdConfig by resolving its
 * asset references to data URLs. Missing assets resolve to null rather than
 * throwing, so one lost image never blocks loading the whole set. Tolerates
 * legacy files whose image fields still hold inline data-URL strings.
 */
export async function hydrateConfig(
  handle: FileSystemDirectoryHandle,
  persisted: PersistedAdConfig
): Promise<AdConfig> {
  const [logoUrl, additionalImageUrl] = await Promise.all([
    internalize(handle, persisted.logoUrl),
    internalize(handle, persisted.additionalImageUrl),
  ]);
  return { ...persisted, logoUrl, additionalImageUrl };
}
