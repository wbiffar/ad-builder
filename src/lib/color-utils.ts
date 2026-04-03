import { BrandColors } from "./types";

/**
 * Extract dominant colors from an image URL using canvas pixel sampling.
 */
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Scale down for faster processing
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Collect non-transparent, non-white, non-black pixels
      const colorCounts = new Map<string, number>();

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Skip near-white and near-black
        const brightness = (r + g + b) / 3;
        if (brightness > 240 || brightness < 15) continue;

        // Quantize to reduce similar colors
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }

      // Sort by frequency and get top colors
      const sorted = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => {
          const [r, g, b] = key.split(",").map(Number);
          return rgbToHex(r, g, b);
        });

      // Ensure we have at least some colors
      if (sorted.length === 0) {
        sorted.push("#293548"); // fallback navy
      }

      resolve(sorted);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

/**
 * Generate a brand color palette from extracted dominant colors.
 */
export function generateBrandPalette(extractedColors: string[]): BrandColors {
  const primary = extractedColors[0] || "#293548";
  const secondary = extractedColors[1] || darken(primary, 20);
  const accent = extractedColors[2] || lighten(primary, 40);

  // Determine text color based on background contrast
  const textColor = getContrastColor(primary);
  const bgColor = primary;

  return {
    primary,
    secondary,
    accent,
    text: textColor,
    background: bgColor,
  };
}

/**
 * Get relative luminance of a hex color (WCAG formula).
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get contrast ratio between two colors (WCAG).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA for normal text (4.5:1).
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Get a contrasting text color (black or white) for a given background.
 */
export function getContrastColor(background: string): string {
  const luminance = getLuminance(background);
  return luminance > 0.35 ? "#1a1a1a" : "#ffffff";
}

// --- Utility functions ---

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, "0")).join("")}`;
}

export function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = Math.round(2.55 * percent);
  return rgbToHex(
    Math.min(255, rgb.r + amount),
    Math.min(255, rgb.g + amount),
    Math.min(255, rgb.b + amount)
  );
}

export function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = Math.round(2.55 * percent);
  return rgbToHex(
    Math.max(0, rgb.r - amount),
    Math.max(0, rgb.g - amount),
    Math.max(0, rgb.b - amount)
  );
}
