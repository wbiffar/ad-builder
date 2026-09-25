import { useSyncExternalStore } from "react";

/**
 * User-level preferences — settings that belong to the person using the
 * builder rather than to any one ad, so they apply across every ad set and
 * survive reloads. There are no accounts, so "account-wide" means this browser
 * profile, the same scope saved brands already use. They are deliberately not
 * written to the shared folder: one designer's preference shouldn't flip the
 * behavior for the whole team.
 */
export type Preferences = {
  /**
   * Whether uploading a logo generates the color scheme from it (DES-2284).
   * Off by default, including for anyone who used the builder before the
   * toggle existed — generation used to run on every upload and overwrote
   * custom colors whenever a logo was replaced.
   */
  generateColorsFromLogo: boolean;
};

const STORAGE_KEY = "legacy-ad-creator-preferences";

const DEFAULT_PREFERENCES: Preferences = {
  generateColorsFromLogo: false,
};

const listeners = new Set<() => void>();
let cached: Preferences | null = null;

function read(): Preferences {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cached = { ...DEFAULT_PREFERENCES, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    cached = DEFAULT_PREFERENCES;
  }
  return cached!;
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  cached = { ...read(), [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Storage unavailable (private mode, quota) — the setting still holds for
    // this session, it just won't persist.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other open tabs in step when the preference changes in one of them.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reads one preference; the server render always sees the default. */
export function usePreference<K extends keyof Preferences>(key: K): Preferences[K] {
  return useSyncExternalStore(
    subscribe,
    () => read()[key],
    () => DEFAULT_PREFERENCES[key]
  );
}
