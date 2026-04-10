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

export type DesignElementIcon = {
  enabled: boolean;
  id: string;
  color: string;
  size: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity: number;
};

export type DesignElementIllustration = {
  enabled: boolean;
  id: string;
  opacity: number;
  scale: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "background";
};

export type DesignElementShape = {
  enabled: boolean;
  type: "line" | "circle" | "rectangle";
  color: string;
  opacity: number;
  position: "top" | "bottom" | "left" | "right" | "center";
};

export type DesignElements = {
  border: DesignElementBorder;
  gradient: DesignElementGradient;
  icon: DesignElementIcon;
  illustration: DesignElementIllustration;
  shape: DesignElementShape;
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
  placement: LogoPlacement;
  alignment: LogoAlignment;
  scale: number; // 0.5–2, default 1
};

export type PhotoFocusPoint = { x: number; y: number };

export type TaglineStyle = {
  fontWeight: 400 | 600 | 700;
  fontStyle: "normal" | "italic";
  fontSizeScale: number; // 0.7–1.5, default 1
};

export const DEFAULT_TAGLINE_STYLE: TaglineStyle = {
  fontWeight: 600,
  fontStyle: "normal",
  fontSizeScale: 1,
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
  icon: {
    enabled: false,
    id: "dove",
    color: "#ffffff",
    size: 32,
    position: "top-right",
    opacity: 0.3,
  },
  illustration: {
    enabled: false,
    id: "floral-corner",
    opacity: 0.15,
    scale: 1,
    position: "bottom-right",
  },
  shape: {
    enabled: false,
    type: "line",
    color: "#dcb05e",
    opacity: 0.5,
    position: "bottom",
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
    placement: "top",
    alignment: "center",
    scale: 1,
  },
  taglineStyle: DEFAULT_TAGLINE_STYLE,
  taglineFont: "DM Sans",
  description: "",
};
