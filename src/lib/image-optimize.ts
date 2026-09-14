import { fileToDataUrl } from "./file-utils";

export const PHOTO_MAX_EDGE = 1920;
export const PHOTO_MAX_BYTES = 300 * 1024;
export const LOGO_MAX_EDGE = 800;
export const LOGO_MAX_BYTES = 150 * 1024;
const MIN_RASTER_EDGE = 640;

/**
 * Resize / recompress an upload without changing format.
 * SVG, PNG, and JPEG stay SVG / PNG / JPEG. Files already within the
 * edge and byte caps are stored as-is (no canvas re-encode).
 */
export async function optimizeUpload(file: File, kind: "photo" | "logo"): Promise<string> {
  if (file.type === "image/svg+xml") return fileToDataUrl(file);
  const maxEdge = kind === "photo" ? PHOTO_MAX_EDGE : LOGO_MAX_EDGE;
  const maxBytes = kind === "photo" ? PHOTO_MAX_BYTES : LOGO_MAX_BYTES;
  try {
    return await rasterizeSameFormat(file, maxEdge, maxBytes);
  } catch (err) {
    console.error("Image optimize failed; using original file", err);
    return fileToDataUrl(file);
  }
}

function isJpeg(type: string): boolean {
  return type === "image/jpeg" || type === "image/jpg";
}

async function rasterizeSameFormat(file: File, maxEdge: number, maxBytes: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge && file.size <= maxBytes) {
    bitmap.close();
    return fileToDataUrl(file);
  }

  const scale = Math.min(1, maxEdge / longest);
  const canvas = drawToCanvas(bitmap, Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  bitmap.close();

  if (isJpeg(file.type)) return encodeJpeg(canvas, maxBytes);
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

async function encodeJpeg(canvas: HTMLCanvasElement, maxBytes: number): Promise<string> {
  let current = canvas;
  let quality = 0.82;
  let blob = await canvasToBlob(current, "image/jpeg", quality);
  while (blob.size > maxBytes && quality > 0.5) {
    quality = Math.max(0.5, quality - 0.08);
    blob = await canvasToBlob(current, "image/jpeg", quality);
  }
  while (blob.size > maxBytes && canShrink(current)) {
    current = shrinkCanvas(current, Math.min(0.85, Math.sqrt(maxBytes / blob.size)));
    blob = await canvasToBlob(current, "image/jpeg", 0.7);
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
