import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { AdSize } from "./types";

/**
 * Max characters kept from the project-name prefix, so a very long project name
 * can't push the filename past filesystem limits once the size suffix is added.
 */
const MAX_SLUG_LENGTH = 60;

/**
 * Turn a project name into a filename-safe slug: lowercase, hyphen-separated,
 * ASCII only. Accents are transliterated ("Muñoz" -> "munoz") and ampersands
 * become "and" instead of vanishing ("Smith & Sons" -> "smith-and-sons").
 * Returns "" when nothing usable is left, so callers can omit the prefix
 * rather than emit a leading hyphen.
 */
export function slugifyProjectName(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop the combining marks NFKD split off
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, ""); // truncation can land on a hyphen
}

/**
 * `{project-name-slug}-{width}x{height}.{ext}`, falling back to the plain
 * `{width}x{height}.{ext}` when the project has no usable name.
 */
export function buildExportFilename(
  projectName: string | undefined | null,
  size: AdSize,
  ext = "png"
): string {
  const slug = slugifyProjectName(projectName);
  return `${slug ? `${slug}-` : ""}${size.width}x${size.height}.${ext}`;
}

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
 * Export a single ad element as a PNG at 2x resolution, named after the saved
 * project. Uses blob URL + saveAs for reliable cross-browser downloads.
 */
export async function exportAdAsPng(
  element: HTMLElement,
  size: AdSize,
  projectName?: string
): Promise<void> {
  const blob = await captureElement(element, size);
  saveAs(blob, buildExportFilename(projectName, size));
}

/**
 * Export all ads as a zip file. Entries use the same project-prefixed names as
 * individual downloads, so the two paths stay consistent.
 */
export async function exportAllAdsAsZip(
  elements: Map<string, HTMLElement>,
  sizes: AdSize[],
  projectName: string
): Promise<void> {
  const zip = new JSZip();
  const slug = slugifyProjectName(projectName);
  const folder = zip.folder(slug || "ads");

  if (!folder) return;

  // Two selected sizes could in principle share dimensions; keep entries distinct.
  const used = new Set<string>();

  for (const size of sizes) {
    const element = elements.get(size.name);
    if (!element) continue;

    const blob = await captureElement(element, size);
    const base = buildExportFilename(projectName, size);
    let filename = base;
    for (let i = 2; used.has(filename); i++) {
      filename = base.replace(/\.png$/, `-${i}.png`);
    }
    used.add(filename);
    folder.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${slug ? `${slug}-` : ""}ads.zip`);
}
