import { AdConfig, DEFAULT_AD_CONFIG, AD_SIZES } from "./types";

export type SavedAdSet = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  configMap: Record<string, AdConfig>;
};

const DB_NAME = "legacy-ad-creator";
const DB_VERSION = 1;
const STORE_NAME = "saved-ads";

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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSavedAdSets(): Promise<SavedAdSet[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const sets = (request.result as SavedAdSet[]).map((set) => ({
          ...set,
          configMap: migrateConfigMap(set.configMap),
        }));
        sets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(sets);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function getAdSetById(id: string): Promise<SavedAdSet | undefined> {
  const sets = await getSavedAdSets();
  return sets.find((s) => s.id === id);
}

export async function saveAdSet(name: string, configMap: Record<string, AdConfig>): Promise<SavedAdSet> {
  const db = await openDB();
  const now = new Date().toISOString();
  const newSet: SavedAdSet = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    configMap,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(newSet);
    request.onsuccess = () => resolve(newSet);
    request.onerror = () => reject(request.error);
  });
}

export async function updateAdSet(id: string, configMap: Record<string, AdConfig>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as SavedAdSet | undefined;
      if (!existing) { resolve(); return; }
      const updated: SavedAdSet = {
        ...existing,
        configMap,
        updatedAt: new Date().toISOString(),
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteAdSet(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
