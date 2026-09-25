export type FontOption = {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display" | "script";
  weights: number[];
  hasItalic?: boolean;
  isSystem?: boolean;
  /**
   * Explicit CSS font stack, overriding the generic one for the category. Used
   * where the category default would swap in a visibly different face — the
   * serif default leads with Georgia, which is wider and rounder than Times New
   * Roman, so a machine without Times New Roman should fall back to its
   * metric-compatible stand-ins instead (DES-2286).
   */
  fallback?: string;
};

export const FONT_OPTIONS: FontOption[] = [
  { name: "DM Sans", family: "DM Sans", category: "sans-serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Inter", family: "Inter", category: "sans-serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Oswald", family: "Oswald", category: "display", weights: [400, 500, 600, 700] },
  { name: "Playfair Display", family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Lora", family: "Lora", category: "serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Merriweather", family: "Merriweather", category: "serif", weights: [400, 700], hasItalic: true },
  { name: "Roboto Slab", family: "Roboto Slab", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Courgette", family: "Courgette", category: "script", weights: [400] },
  { name: "Georgia", family: "Georgia", category: "serif", weights: [400, 700], isSystem: true },
  // System font on Windows and macOS, so nothing is fetched or licensed. Times
  // (macOS/iOS), Liberation Serif and Tinos (Linux/ChromeOS) share its metrics,
  // so copy that auto-fits against one fits the others (DES-2286).
  {
    name: "Times New Roman",
    family: "Times New Roman",
    category: "serif",
    weights: [400, 700],
    hasItalic: true,
    isSystem: true,
    fallback: "'Times New Roman', Times, 'Liberation Serif', Tinos, serif",
  },
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): void {
  const font = FONT_OPTIONS.find((f) => f.family === family);
  if (!font || font.isSystem || loadedFonts.has(family)) return;
  if (typeof document === "undefined") return;

  loadedFonts.add(family);
  const encoded = family.replace(/ /g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  if (font.hasItalic) {
    // Request both regular and italic: ital,wght@0,400;0,700;1,400;1,700
    const tuples = font.weights
      .flatMap((w) => [`0,${w}`, `1,${w}`])
      .join(";");
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@${tuples}&display=swap`;
  } else {
    // Regular weights only: wght@400;500;600;700
    const weights = font.weights.join(";");
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`;
  }
  document.head.appendChild(link);
}

export function getFontFallback(family: string): string {
  const font = FONT_OPTIONS.find((f) => f.family === family);
  if (!font) return `'${family}', sans-serif`;
  if (font.fallback) return font.fallback;
  switch (font.category) {
    case "serif":
      return `'${family}', Georgia, 'Palatino Linotype', serif`;
    case "display":
      return `'${family}', 'Impact', sans-serif`;
    case "script":
      return `'${family}', 'Georgia', cursive`;
    default:
      return `'${family}', 'Inter', 'DM Sans', sans-serif`;
  }
}
