export type FontOption = {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display";
  weights: number[];
  isSystem?: boolean;
};

export const FONT_OPTIONS: FontOption[] = [
  { name: "DM Sans", family: "DM Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Inter", family: "Inter", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Oswald", family: "Oswald", category: "display", weights: [400, 500, 600, 700] },
  { name: "Playfair Display", family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Lora", family: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Merriweather", family: "Merriweather", category: "serif", weights: [400, 700] },
  { name: "Roboto Slab", family: "Roboto Slab", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Georgia", family: "Georgia", category: "serif", weights: [400, 700], isSystem: true },
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): void {
  const font = FONT_OPTIONS.find((f) => f.family === family);
  if (!font || font.isSystem || loadedFonts.has(family)) return;
  if (typeof document === "undefined") return;

  loadedFonts.add(family);
  const weights = font.weights.join(";");
  const encoded = family.replace(/ /g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,${weights};1,${weights}&display=swap`;
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
    default:
      return `'${family}', 'Inter', 'DM Sans', sans-serif`;
  }
}
