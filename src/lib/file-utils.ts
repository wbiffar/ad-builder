/**
 * Convert a File to a base64 data URL.
 * Unlike blob: URLs, data URLs are inline and work with
 * html-to-image canvas rendering (no cross-origin issues).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
