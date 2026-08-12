export type AdSize = {
  name: string;
  label: string;
  width: number;
  height: number;
};

export const AD_SIZES: AdSize[] = [
  { name: "half-page", label: "Half Page", width: 300, height: 600 },
  { name: "large-leaderboard", label: "Large Leaderboard", width: 970, height: 90 },
  { name: "leaderboard", label: "Leaderboard", width: 728, height: 90 },
  { name: "medium-rectangle", label: "Medium Rectangle", width: 300, height: 250 },
  { name: "mobile-leaderboard", label: "Mobile Leaderboard", width: 320, height: 50 },
];

export type Tier = "good" | "better";

export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

export type DesignElementBorder = {
  enabled: boolean;
  style: "solid" | "dashed" | "double";
  width: number;
  color: string;
  radius: number;
};

export type DesignElementGradient = {
  enabled: boolean;
  type: "linear" | "radial";
  direction: number; // degrees for linear
  stops: { color: string; position: number }[];
};

export type DesignElements = {
  border: DesignElementBorder;
  gradient: DesignElementGradient;
  accentLine: AccentLine;
};

export type LayoutVariant = "a" | "b" | "c"; // legacy — kept for backward compat

export type TemplateStyle =
  | "clean-minimal"      // White/cream bg, modern sans-serif, lots of whitespace
  | "rich-traditional"   // Dark brand bg, script tagline, gold accent line
  | "building-showcase"  // Building photo as hero (requires additional image)
  | "people-first";      // People photo framed/centered (requires additional image)

export type PhotoTreatment = "rectangular" | "circular" | "fade";

export type AccentLine = {
  enabled: boolean;
  orientation: "horizontal" | "vertical";
  color: string;
  width: number;
  style: "solid" | "dashed" | "double";
};

/** Where the logo sits in the element stack. */
export type LogoPlacement = "top" | "middle" | "bottom";
/** Horizontal alignment of the logo within its slot. */
export type LogoAlignment = "left" | "center" | "right";

export type LogoSettings = {
  whiteContainer: boolean;
  containerPadding: number; // px of white padding around the logo, default 1, min 1
  placement: LogoPlacement;
  alignment: LogoAlignment;
  scale: number; // 0.5–2, default 1
};

export type PhotoFocusPoint = { x: number; y: number };

export type TaglineStyle = {
  fontWeight: 400 | 600 | 700;
  fontStyle: "normal" | "italic";
  fontSizeScale: number; // 0.7–1.5, default 1
  paragraphScale: number; // 0–1 multiplier on the blank-line gap (double line break), default 1 (= natural height)
};

export const DEFAULT_TAGLINE_STYLE: TaglineStyle = {
  fontWeight: 600,
  fontStyle: "normal",
  fontSizeScale: 1,
  paragraphScale: 1,
};

export type AdConfig = {
  funeralHomeName: string;
  logoUrl: string | null;
  tagline: string;
  ctaText: string;
  colors: BrandColors;
  tier: Tier;
  variant: LayoutVariant;
  templateStyle: TemplateStyle;
  photoTreatment: PhotoTreatment;
  additionalImageUrl: string | null;
  photoFocusPoint: PhotoFocusPoint;
  designElements: DesignElements;
  logoSettings: LogoSettings;
  taglineStyle: TaglineStyle;
  taglineFont: string;
  description: string;
};

export type SavedBrand = {
  id: string;
  name: string;
  logoUrl: string | null;
  colors: BrandColors;
  createdAt: string;
};

/**
 * A content-addressed reference to an image stored outside the ad-set JSON
 * (in the shared folder's `assets/` subdirectory). Keeps the JSON small so it
 * syncs cheaply through Google Drive Stream instead of embedding megabytes of
 * base64 per file. `assetId` is the SHA-256 hex of the raw bytes, so identical
 * images (e.g. the same logo across every ad size) dedupe to a single file.
 */
export type AssetRef = {
  assetId: string;
  mime: string;
  ext: string;
};

/**
 * AdConfig as persisted to the shared folder. The two image fields hold an
 * AssetRef (new format) instead of an inline data URL. Legacy files still carry
 * a plain data-URL string here; the hydrate step tolerates both, so old ad sets
 * keep loading and are only converted to the external format on their next save.
 */
export type PersistedAdConfig = Omit<AdConfig, "logoUrl" | "additionalImageUrl"> & {
  logoUrl: AssetRef | string | null;
  additionalImageUrl: AssetRef | string | null;
};

export type PersistedSavedAdSet = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  configMap: Record<string, PersistedAdConfig>;
};

export const DEFAULT_COLORS: BrandColors = {
  primary: "#293548",
  secondary: "#42608f",
  accent: "#dcb05e",
  text: "#ffffff",
  background: "#293548",
};

export const DEFAULT_ACCENT_LINE: AccentLine = {
  enabled: false,
  orientation: "horizontal",
  color: "#dcb05e",
  width: 2,
  style: "solid",
};

export const DEFAULT_DESIGN_ELEMENTS: DesignElements = {
  border: {
    enabled: true,
    style: "solid",
    width: 1,
    color: "#e9e9e9",
    radius: 0,
  },
  gradient: {
    enabled: false,
    type: "linear",
    direction: 180,
    stops: [
      { color: "#293548", position: 0 },
      { color: "#42608f", position: 100 },
    ],
  },
  accentLine: DEFAULT_ACCENT_LINE,
};

export const DEFAULT_AD_CONFIG: AdConfig = {
  funeralHomeName: "",
  logoUrl: null,
  tagline: "Compassionate care in your time of need",
  ctaText: "Learn More",
  colors: DEFAULT_COLORS,
  tier: "good",
  variant: "a",
  templateStyle: "clean-minimal",
  photoTreatment: "rectangular",
  additionalImageUrl: null,
  photoFocusPoint: { x: 50, y: 50 },
  designElements: DEFAULT_DESIGN_ELEMENTS,
  logoSettings: {
    whiteContainer: false,
    containerPadding: 1,
    placement: "top",
    alignment: "center",
    scale: 1,
  },
  taglineStyle: DEFAULT_TAGLINE_STYLE,
  taglineFont: "DM Sans",
  description: "",
};
