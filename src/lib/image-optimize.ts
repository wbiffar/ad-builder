import { fileToDataUrl } from "./file-utils";

export const PHOTO_MAX_EDGE = 1920;
export const PHOTO_MAX_BYTES = 300 * 1024;
export const LOGO_MAX_EDGE = 800;
export const LOGO_MAX_BYTES = 150 * 1024;
const MIN_RASTER_EDGE = 640;

// Hard limits checked before anything is decoded (DES-2312). Past these an
// upload is refused outright rather than stored raw.
export const UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
export const SVG_MAX_BYTES = 500 * 1024;
// ~400 MB of decoded RGBA pixels at 100 MP; 50 MP keeps it near 200 MB.
const MAX_DECODE_PIXELS = 50_000_000;

export const ACCEPTED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const ACCEPTED_UPLOAD_ATTR = ACCEPTED_UPLOAD_TYPES.join(",");

/** An upload that was refused; `message` is safe to show the user. */
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Resize / recompress an upload without changing format.
 * SVG, PNG, JPEG, and WebP stay SVG / PNG / JPEG / WebP. Files already within
 * the edge and byte caps are stored as-is (no canvas re-encode).
 * Throws UploadError when the file is refused or can't be processed — the
 * original is never stored as a fallback.
 */
export async function optimizeUpload(file: File, kind: "photo" | "logo"): Promise<string> {
  const type = normalizeType(file.type);
  if (!ACCEPTED_UPLOAD_TYPES.includes(type)) {
    throw new UploadError("Unsupported file type. Use PNG, JPG, WebP, or SVG.");
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new UploadError(`File is ${formatMb(file.size)}; the limit is ${formatMb(UPLOAD_MAX_BYTES)}.`);
  }
  if (type === "image/svg+xml") {
    if (file.size > SVG_MAX_BYTES) {
      throw new UploadError(
        `SVG is ${formatKb(file.size)}; the limit is ${formatKb(SVG_MAX_BYTES)}. Export a simpler SVG, or upload a PNG instead.`
      );
    }
    return fileToDataUrl(file);
  }

  const maxEdge = kind === "photo" ? PHOTO_MAX_EDGE : LOGO_MAX_EDGE;
  const maxBytes = kind === "photo" ? PHOTO_MAX_BYTES : LOGO_MAX_BYTES;
  try {
    await assertDecodable(file);
    return await rasterizeSameFormat(file, type, maxEdge, maxBytes);
  } catch (err) {
    if (err instanceof UploadError) throw err;
    console.error("Image optimize failed", err);
    throw new UploadError("Couldn't read this image. It may be damaged — try re-saving it as PNG or JPG.");
  }
}

function normalizeType(type: string): string {
  return type === "image/jpg" ? "image/jpeg" : type;
}

function formatMb(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Read the image's dimensions without decoding its pixels (an <img> that
 * isn't drawn only parses the header), and refuse anything too large to
 * decode safely.
 */
async function assertDecodable(file: File): Promise<void> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image header could not be read"));
      img.src = url;
    });
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w * h > MAX_DECODE_PIXELS) {
      throw new UploadError(
        `Image is ${w} × ${h} px, too large to process. Resize it under ${Math.round(MAX_DECODE_PIXELS / 1_000_000)} megapixels and try again.`
      );
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterizeSameFormat(file: File, type: string, maxEdge: number, maxBytes: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge && file.size <= maxBytes) {
    bitmap.close();
    return fileToDataUrl(file);
  }

  const scale = Math.min(1, maxEdge / longest);
  const canvas = drawToCanvas(bitmap, Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  bitmap.close();

  if (type === "image/jpeg" || type === "image/webp") return encodeLossy(canvas, type, maxBytes);
  return encodePng(canvas, maxBytes);
}

function drawToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function shrinkCanvas(current: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const longest = Math.max(current.width, current.height);
  const nextLongest = Math.max(MIN_RASTER_EDGE, Math.round(longest * factor));
  const scale = nextLongest / longest;
  const width = Math.max(1, Math.round(current.width * scale));
  const height = Math.max(1, Math.round(current.height * scale));
  return drawToCanvas(current, width, height);
}

function canShrink(current: HTMLCanvasElement): boolean {
  return Math.max(current.width, current.height) > MIN_RASTER_EDGE;
}

async function encodePng(canvas: HTMLCanvasElement, maxBytes: number): Promise<string> {
  let current = canvas;
  let blob = await canvasToBlob(current, "image/png");
  while (blob.size > maxBytes && canShrink(current)) {
    current = shrinkCanvas(current, Math.min(0.85, Math.sqrt(maxBytes / blob.size)));
    blob = await canvasToBlob(current, "image/png");
  }
  return blobToDataUrl(blob);
}

async function encodeLossy(canvas: HTMLCanvasElement, type: string, maxBytes: number): Promise<string> {
  let current = canvas;
  let quality = 0.82;
  let blob = await canvasToBlob(current, type, quality);
  while (blob.size > maxBytes && quality > 0.5) {
    quality = Math.max(0.5, quality - 0.08);
    blob = await canvasToBlob(current, type, quality);
  }
  while (blob.size > maxBytes && canShrink(current)) {
    current = shrinkCanvas(current, Math.min(0.85, Math.sqrt(maxBytes / blob.size)));
    blob = await canvasToBlob(current, type, 0.7);
  }
  return blobToDataUrl(blob);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas encode failed"))),
      type,
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read optimized image"));
    reader.readAsDataURL(blob);
  });
}
