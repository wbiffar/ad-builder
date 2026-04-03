import { SavedBrand, BrandColors } from "./types";

const STORAGE_KEY = "legacy-ad-creator-brands";

export function getSavedBrands(): SavedBrand[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBrand(brand: Omit<SavedBrand, "id" | "createdAt">): SavedBrand {
  const brands = getSavedBrands();
  const newBrand: SavedBrand = {
    ...brand,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  brands.push(newBrand);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  return newBrand;
}

export function updateBrand(id: string, updates: Partial<Pick<SavedBrand, "name" | "colors" | "logoUrl">>): void {
  const brands = getSavedBrands();
  const index = brands.findIndex((b) => b.id === id);
  if (index !== -1) {
    brands[index] = { ...brands[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  }
}

export function deleteBrand(id: string): void {
  const brands = getSavedBrands().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

export function getBrandById(id: string): SavedBrand | undefined {
  return getSavedBrands().find((b) => b.id === id);
}
