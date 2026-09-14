import { AdSetMetadata } from "./ad-storage";

const META_PREFIX_BYTES = 8192;

type IterableDirectoryHandle = {
  values(): AsyncIterableIterator<FileSystemHandle>;
};

export type AdSetFormat = "new" | "legacy" | "mixed" | "unknown" | "corrupt";

export type AdSetAuditRow = {
  fileName: string;
  bytes: number;
  prefixBytes: number;
  format: AdSetFormat;
  id?: string;
  name?: string;
};

export type FolderAudit = {
  folderName: string;
  measuredAt: string;
  elapsedMs: number;
  jsonCount: number;
  listedCount: number;
  corruptCount: number;
  formatCounts: Record<AdSetFormat, number>;
  jsonBytes: number;
  prefixBytes: number;
  assetCount: number;
  assetBytes: number;
  listingSavedBytes: number;
  listingSavedPct: number;
  impliedInlineImageBytes: number;
  oversizedAssetCount: number;
  oversizedAssetBytes: number;
  resizeCapBytes: number;
  resizeSavedBytes: number;
  rows: AdSetAuditRow[];
};

const RESIZE_CAP_BYTES = 300 * 1024;

export function metadataFromPrefix(text: string): AdSetMetadata | null {
  const id = /"id"\s*:\s*"([^"]+)"/.exec(text)?.[1];
  if (!id) return null;
  return {
    id,
    name: /"name"\s*:\s*"([^"]*)"/.exec(text)?.[1] ?? "Untitled Ad Set",
    createdAt: /"createdAt"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? new Date().toISOString(),
    updatedAt: /"updatedAt"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? new Date().toISOString(),
  };
}

export function classifyPrefix(text: string): Exclude<AdSetFormat, "corrupt"> {
  const hasAsset = text.includes('"assetId"');
  const hasData = text.includes("data:image");
  if (hasAsset && hasData) return "mixed";
  if (hasAsset) return "new";
  if (hasData) return "legacy";
  return "unknown";
}

async function readPrefix(file: File, bytes = META_PREFIX_BYTES): Promise<string> {
  const slice = file.slice(0, Math.min(bytes, file.size));
  return slice.text();
}

/**
 * Walks the connected folder using file.size + an 8KB prefix. Never reads a
 * whole legacy JSON, so this is safe on Drive Stream.
 */
export async function auditSharedFolder(handle: FileSystemDirectoryHandle): Promise<FolderAudit> {
  const started = performance.now();
  const rows: AdSetAuditRow[] = [];
  const formatCounts: Record<AdSetFormat, number> = {
    new: 0,
    legacy: 0,
    mixed: 0,
    unknown: 0,
    corrupt: 0,
  };
  let jsonBytes = 0;
  let prefixBytes = 0;
  let listedCount = 0;

  const iterable = handle as unknown as IterableDirectoryHandle;
  for await (const entry of iterable.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;

    try {
      const file = await (entry as FileSystemFileHandle).getFile();
      const prefix = await readPrefix(file);
      const meta = metadataFromPrefix(prefix);
      const format: AdSetFormat = meta ? classifyPrefix(prefix) : "corrupt";
      const usedPrefix = Math.min(META_PREFIX_BYTES, file.size);
      rows.push({
        fileName: entry.name,
        bytes: file.size,
        prefixBytes: usedPrefix,
        format,
        id: meta?.id,
        name: meta?.name,
      });
      formatCounts[format] += 1;
      jsonBytes += file.size;
      prefixBytes += usedPrefix;
      if (meta) listedCount += 1;
    } catch {
      formatCounts.corrupt += 1;
      rows.push({
        fileName: entry.name,
        bytes: 0,
        prefixBytes: 0,
        format: "corrupt",
      });
    }
  }

  // Legacy JSON minus a small header is almost entirely inlined base64 images.
  const impliedInlineImageBytes = rows
    .filter((r) => r.format === "legacy" || r.format === "mixed")
    .reduce((sum, r) => sum + Math.max(0, r.bytes - 2048), 0);

  const assets = await auditAssetsForResize(handle);
  const listingSavedBytes = Math.max(0, jsonBytes - prefixBytes);
  const listingSavedPct = jsonBytes > 0 ? (listingSavedBytes / jsonBytes) * 100 : 0;

  return {
    folderName: handle.name,
    measuredAt: new Date().toISOString(),
    elapsedMs: Math.round(performance.now() - started),
    jsonCount: rows.length,
    listedCount,
    corruptCount: formatCounts.corrupt,
    formatCounts,
    jsonBytes,
    prefixBytes,
    listingSavedBytes,
    listingSavedPct,
    impliedInlineImageBytes,
    resizeCapBytes: RESIZE_CAP_BYTES,
    ...assets,
    rows: rows.sort((a, b) => b.bytes - a.bytes),
  };
}

/** Per-asset resize estimate: bytes over the 300 KB cap. */
export async function auditAssetsForResize(
  handle: FileSystemDirectoryHandle
): Promise<Pick<FolderAudit, "oversizedAssetCount" | "oversizedAssetBytes" | "resizeSavedBytes" | "assetCount" | "assetBytes">> {
  let assetCount = 0;
  let assetBytes = 0;
  let oversizedAssetCount = 0;
  let oversizedAssetBytes = 0;
  let resizeSavedBytes = 0;
  try {
    const assets = await handle.getDirectoryHandle("assets");
    const assetIter = assets as unknown as IterableDirectoryHandle;
    for await (const asset of assetIter.values()) {
      if (asset.kind !== "file") continue;
      const file = await (asset as FileSystemFileHandle).getFile();
      assetCount += 1;
      assetBytes += file.size;
      if (file.size > RESIZE_CAP_BYTES) {
        oversizedAssetCount += 1;
        oversizedAssetBytes += file.size;
        resizeSavedBytes += file.size - RESIZE_CAP_BYTES;
      }
    }
  } catch (err) {
    if ((err as DOMException)?.name !== "NotFoundError") throw err;
  }
  return { assetCount, assetBytes, oversizedAssetCount, oversizedAssetBytes, resizeSavedBytes };
}
