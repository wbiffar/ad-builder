export type FontOption = {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display" | "script";
  weights: number[];
  hasItalic?: boolean;
  isSystem?: boolean;
};

export const FONT_OPTIONS: FontOption[] = [
  { name: "DM Sans", family: "DM Sans", category: "sans-serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Inter", family: "Inter", category: "sans-serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Oswald", family: "Oswald", category: "display", weights: [400, 500, 600, 700] },
  { name: "Playfair Display", family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Lora", family: "Lora", category: "serif", weights: [400, 500, 600, 700], hasItalic: true },
  { name: "Merriweather", family: "Merriweather", category: "serif", weights: [400, 700], hasItalic: true },
  { name: "Roboto Slab", family: "Roboto Slab", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Great Vibes", family: "Great Vibes", category: "script", weights: [400] },
  { name: "Georgia", family: "Georgia", category: "serif", weights: [400, 700], isSystem: true },
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
