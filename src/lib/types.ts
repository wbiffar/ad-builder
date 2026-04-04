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
};

export type LayoutVariant = "a" | "b" | "c";

export type LogoPosition = "top" | "center" | "bottom";

export type LogoSettings = {
  whiteContainer: boolean;
  position: LogoPosition;
};

export type AdConfig = {
  funeralHomeName: string;
  logoUrl: string | null;
  tagline: string;
  ctaText: string;
  colors: BrandColors;
  tier: Tier;
  variant: LayoutVariant;
  additionalImageUrl: string | null;
  designElements: DesignElements;
  logoSettings: LogoSettings;
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

export const DEFAULT_DESIGN_ELEMENTS: DesignElements = {
  border: {
    enabled: true,
    style: "solid",
    width: 2,
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
};

export const DEFAULT_AD_CONFIG: AdConfig = {
  funeralHomeName: "",
  logoUrl: null,
  tagline: "Compassionate care in your time of need",
  ctaText: "Learn More",
  colors: DEFAULT_COLORS,
  tier: "good",
  variant: "a",
  additionalImageUrl: null,
  designElements: DEFAULT_DESIGN_ELEMENTS,
  logoSettings: {
    whiteContainer: false,
    position: "top",
  },
};
