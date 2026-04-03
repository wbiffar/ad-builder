import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { AdSize } from "./types";

/**
 * Temporarily unscale the element and its parent for capture,
 * then restore after. This ensures html-to-image captures the
 * full-resolution ad regardless of preview zoom level.
 */
async function captureElement(element: HTMLElement, size: AdSize): Promise<Blob> {
  const parent = element.parentElement;
  const grandparent = parent?.parentElement;

  // Save original styles
  const origParentTransform = parent?.style.transform || "";
  const origGrandparentWidth = grandparent?.style.width || "";
  const origGrandparentHeight = grandparent?.style.height || "";
  const origGrandparentOverflow = grandparent?.style.overflow || "";

  // Temporarily remove scale and overflow clipping
  if (parent) {
    parent.style.transform = "none";
  }
  if (grandparent) {
    grandparent.style.width = `${size.width}px`;
    grandparent.style.height = `${size.height}px`;
    grandparent.style.overflow = "visible";
  }

  try {
    const blob = await toBlob(element, {
      width: size.width,
      height: size.height,
      pixelRatio: 2,
      cacheBust: true,
    });
    if (!blob) throw new Error("Failed to capture ad");
    return blob;
  } finally {
    // Restore original styles
    if (parent) {
      parent.style.transform = origParentTransform;
    }
    if (grandparent) {
      grandparent.style.width = origGrandparentWidth;
      grandparent.style.height = origGrandparentHeight;
      grandparent.style.overflow = origGrandparentOverflow;
    }
  }
}

/**
 * Export a single ad element as a PNG at 2x resolution.
 * Uses blob URL + saveAs for reliable cross-browser downloads.
 */
export async function exportAdAsPng(
  element: HTMLElement,
  size: AdSize,
  filename?: string
): Promise<void> {
  const blob = await captureElement(element, size);
  saveAs(blob, filename || `${size.name}-${size.width}x${size.height}.png`);
}

/**
 * Export all ads as a zip file.
 */
export async function exportAllAdsAsZip(
  elements: Map<string, HTMLElement>,
  sizes: AdSize[],
  brandName: string
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(brandName || "funeral-home-ads");

  if (!folder) return;

  for (const size of sizes) {
    const element = elements.get(size.name);
    if (!element) continue;

    const blob = await captureElement(element, size);
    folder.file(`${size.name}-${size.width}x${size.height}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${brandName || "funeral-home"}-ads.zip`);
}
