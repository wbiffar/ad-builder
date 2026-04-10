import { AdConfig, DEFAULT_AD_CONFIG, AD_SIZES } from "./types";

export type SavedAdSet = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  configMap: Record<string, AdConfig>;
};

const STORAGE_KEY = "legacy-ad-creator-saved-ads";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fills in any missing fields from DEFAULT_AD_CONFIG (handles old saved data). */
function migrateAdConfig(saved: Partial<AdConfig>): AdConfig {
  return {
    ...DEFAULT_AD_CONFIG,
    ...saved,
    colors: { ...DEFAULT_AD_CONFIG.colors, ...(saved.colors ?? {}) },
    designElements: {
      ...DEFAULT_AD_CONFIG.designElements,
      ...(saved.designElements ?? {}),
      border: { ...DEFAULT_AD_CONFIG.designElements.border, ...(saved.designElements?.border ?? {}) },
      gradient: { ...DEFAULT_AD_CONFIG.designElements.gradient, ...(saved.designElements?.gradient ?? {}) },
      icon: { ...DEFAULT_AD_CONFIG.designElements.icon, ...(saved.designElements?.icon ?? {}) },
      illustration: { ...DEFAULT_AD_CONFIG.designElements.illustration, ...(saved.designElements?.illustration ?? {}) },
      shape: { ...DEFAULT_AD_CONFIG.designElements.shape, ...(saved.designElements?.shape ?? {}) },
      accentLine: { ...DEFAULT_AD_CONFIG.designElements.accentLine, ...(saved.designElements?.accentLine ?? {}) },
    },
    logoSettings: { ...DEFAULT_AD_CONFIG.logoSettings, ...(saved.logoSettings ?? {}) },
    taglineStyle: { ...DEFAULT_AD_CONFIG.taglineStyle, ...(saved.taglineStyle ?? {}) },
  };
}

function migrateConfigMap(raw: Record<string, Partial<AdConfig>>): Record<string, AdConfig> {
  const result: Record<string, AdConfig> = {};
  for (const size of AD_SIZES) {
    result[size.name] = migrateAdConfig(raw[size.name] ?? {});
  }
  return result;
}

export function getSavedAdSets(): SavedAdSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAdSet[];
    return parsed.map((set) => ({
      ...set,
      configMap: migrateConfigMap(set.configMap),
    }));
  } catch {
    return [];
  }
}

export function getAdSetById(id: string): SavedAdSet | undefined {
  return getSavedAdSets().find((s) => s.id === id);
}

/** Strip large data URLs from configs to fit in localStorage. */
function stripDataUrls(configMap: Record<string, AdConfig>): Record<string, AdConfig> {
  const result: Record<string, AdConfig> = {};
  for (const [key, config] of Object.entries(configMap)) {
    result[key] = {
      ...config,
      logoUrl: config.logoUrl?.startsWith("data:") ? null : config.logoUrl,
      additionalImageUrl: config.additionalImageUrl?.startsWith("data:") ? null : config.additionalImageUrl,
    };
  }
  return result;
}

function safeSave(sets: SavedAdSet[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    return true;
  } catch {
    return false;
  }
}

export function saveAdSet(name: string, configMap: Record<string, AdConfig>): SavedAdSet {
  const sets = getSavedAdSets();
  const now = new Date().toISOString();
  const newSet: SavedAdSet = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    configMap: stripDataUrls(configMap),
  };
  sets.push(newSet);
  safeSave(sets);
  return newSet;
}

export function updateAdSet(id: string, configMap: Record<string, AdConfig>): void {
  const sets = getSavedAdSets();
  const idx = sets.findIndex((s) => s.id === id);
  if (idx === -1) return;
  sets[idx] = {
    ...sets[idx],
    configMap: stripDataUrls(configMap),
    updatedAt: new Date().toISOString(),
  };
  safeSave(sets);
}

export function deleteAdSet(id: string): void {
  const sets = getSavedAdSets().filter((s) => s.id !== id);
  safeSave(sets);
}
