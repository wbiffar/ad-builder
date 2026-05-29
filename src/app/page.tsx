"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AdConfig, AdSize, AD_SIZES, DEFAULT_AD_CONFIG } from "@/lib/types";
import { exportAdAsPng, exportAllAdsAsZip } from "@/lib/export";
import { SavedAdSet, getSavedAdSets, saveAdSet, updateAdSet, deleteAdSet } from "@/lib/ad-storage";
import {
  isSharedFolderSupported,
  pickDirectory,
  getStoredDirectoryHandle,
  storeDirectoryHandle,
  clearDirectoryHandle,
  verifyPermission,
  saveAdSetToFolder,
  loadAdSetsFromFolder,
  deleteAdSetFromFolder,
} from "@/lib/shared-folder-storage";
import { AdRenderer } from "@/components/ad-canvas";
import { AdForm } from "@/components/ad-form";
// Design controls are now integrated into AdForm (Gradient always visible, Labs collapsible)
import { InContextPreview } from "@/components/in-context-preview";
import { AdPickerModal, UnsavedChangesDialog, ConfirmDeleteDialog } from "@/components/ad-picker-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download, Eye, Check, Save, Cloud, HardDrive, RefreshCw, FolderOpen } from "lucide-react";

function AdCard({
  size,
  selected,
  onToggle,
  onExport,
  isExporting,
  previewScale,
  className,
  children,
}: {
  size: AdSize;
  selected: boolean;
  onToggle: (name: string) => void;
  onExport: (size: AdSize) => void;
  isExporting: boolean;
  previewScale: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`} style={{ width: size.width * previewScale }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggle(size.name)}
            className={`size-4 rounded border flex items-center justify-center transition-colors ${
              selected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40 hover:border-foreground"
            }`}
            aria-label={`${selected ? "Deselect" : "Select"} ${size.label}`}
          >
            {selected && <Check className="size-3" strokeWidth={3} />}
          </button>
          <h3 className={`text-[11px] font-semibold transition-colors ${selected ? "text-foreground" : "text-muted-foreground"}`}>{size.label}</h3>
          <Badge variant="outline" className="text-[9px] font-mono">{size.width}x{size.height}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => onExport(size)} disabled={isExporting}>
          <Download className="size-3" /> PNG
        </Button>
      </div>
      <div className={`overflow-auto transition-opacity ${selected ? "opacity-100" : "opacity-30"}`}>
        <div style={{ width: size.width * previewScale, height: size.height * previewScale, position: "relative", overflow: "hidden" }}>
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type ConfigMap = Record<string, AdConfig>;

// A switch the user requested while they had unsaved edits — held until they
// resolve the unsaved-changes prompt.
type PendingAction = { type: "load"; id: string } | { type: "new" } | null;

const INITIAL_CONFIG_MAP: ConfigMap = Object.fromEntries(
  AD_SIZES.map((s) => [s.name, DEFAULT_AD_CONFIG])
);

export default function AdCreatorPage() {
  const [configMap, setConfigMap] = useState<ConfigMap>(INITIAL_CONFIG_MAP);
  const [savedAdSets, setSavedAdSets] = useState<SavedAdSet[]>([]);
  const [sharedAdSets, setSharedAdSets] = useState<SavedAdSet[]>([]);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  // null = support not yet determined (avoids hydration flash); true/false once known.
  const [sharedSupported, setSharedSupported] = useState<boolean | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [folderMessage, setFolderMessage] = useState<string | null>(null);
  const [currentAdSetId, setCurrentAdSetId] = useState<string | null>(null);
  // Snapshot of configMap as of the last load/save — used to detect unsaved edits.
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(INITIAL_CONFIG_MAP));
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; shared: boolean } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(
    () => new Set(AD_SIZES.map((s) => s.name))
  );
  const adRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // The form displays the config of the first selected ad
  const firstSelected = AD_SIZES.find((s) => selectedAds.has(s.name))?.name ?? AD_SIZES[0].name;
  const formConfig = configMap[firstSelected];

  // Unsaved-changes detection + the label shown in the Current Ad card.
  const isDirty = JSON.stringify(configMap) !== baseline;
  const currentSet = currentAdSetId
    ? savedAdSets.find((s) => s.id === currentAdSetId) ?? sharedAdSets.find((s) => s.id === currentAdSetId)
    : null;
  const currentName = currentSet?.name ?? (currentAdSetId ? "Untitled Ad Set" : "Unsaved ad");

  const toggleAd = useCallback((name: string) => {
    setSelectedAds((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // Apply form changes only to selected ads
  const handleConfigChange = useCallback(
    (newConfig: AdConfig) => {
      setConfigMap((prev) => {
        const next = { ...prev };
        for (const name of selectedAds) {
          next[name] = newConfig;
        }
        return next;
      });
    },
    [selectedAds]
  );

  // Load saved ad sets on mount
  useEffect(() => {
    getSavedAdSets().then(setSavedAdSets);
  }, []);

  const refreshSharedAdSets = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      setSharedAdSets(await loadAdSetsFromFolder(handle));
    } catch (err) {
      console.error("Failed to load ad sets from folder", err);
      setFolderMessage("Failed to load ad sets from the shared folder.");
    }
  }, []);

  // Reconnect a previously chosen shared folder on mount, if permission persists.
  useEffect(() => {
    if (!isSharedFolderSupported()) {
      setSharedSupported(false);
      return;
    }
    setSharedSupported(true);
    (async () => {
      const handle = await getStoredDirectoryHandle();
      if (!handle) return;
      setDirHandle(handle);
      // No user gesture on load, so this only succeeds if permission still holds.
      if (await verifyPermission(handle)) {
        await refreshSharedAdSets(handle);
      } else {
        setNeedsReconnect(true);
      }
    })();
  }, [refreshSharedAdSets]);

  const handleConnectFolder = useCallback(async () => {
    try {
      // showDirectoryPicker({ mode: "readwrite" }) already grants read-write on
      // the returned handle. Do NOT call requestPermission here — the picker
      // consumes transient activation, so a follow-up request can't prompt and
      // would silently fail. (Restored handles re-request under the save click.)
      const handle = await pickDirectory();
      await storeDirectoryHandle(handle);
      setDirHandle(handle);
      setNeedsReconnect(false);
      setFolderMessage(null);
      await refreshSharedAdSets(handle);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return; // user cancelled the picker
      console.error("Failed to connect shared folder", err);
      setFolderMessage("Could not connect the folder.");
    }
  }, [refreshSharedAdSets]);

  const handleDisconnectFolder = useCallback(async () => {
    await clearDirectoryHandle();
    setDirHandle(null);
    setSharedAdSets([]);
    setNeedsReconnect(false);
    setFolderMessage(null);
  }, []);

  const setAdRef = useCallback((name: string, el: HTMLDivElement | null) => {
    if (el) {
      adRefs.current.set(name, el);
    } else {
      adRefs.current.delete(name);
    }
  }, []);

  const handleExportSingle = useCallback(
    async (size: AdSize) => {
      const el = adRefs.current.get(size.name);
      if (!el) return;
      const adConfig = configMap[size.name];
      setIsExporting(true);
      try {
        await exportAdAsPng(el, size, `${adConfig.funeralHomeName || "ad"}-${size.name}-${size.width}x${size.height}.png`);
      } finally {
        setIsExporting(false);
      }
    },
    [configMap]
  );

  const handleExportAll = useCallback(async () => {
    const selected = AD_SIZES.filter((s) => selectedAds.has(s.name));
    if (selected.length === 0) return;
    setIsExporting(true);
    try {
      await exportAllAdsAsZip(adRefs.current, selected, formConfig.funeralHomeName || "funeral-home");
    } finally {
      setIsExporting(false);
    }
  }, [formConfig.funeralHomeName, selectedAds]);

  const handleSaveAdSet = useCallback(async () => {
    const name = formConfig.funeralHomeName || "Untitled Ad Set";
    const newSet = await saveAdSet(name, configMap);
    setCurrentAdSetId(newSet.id);
    setBaseline(JSON.stringify(configMap));
    setSavedAdSets(await getSavedAdSets());
    if (dirHandle) {
      try {
        await saveAdSetToFolder(dirHandle, newSet);
        await refreshSharedAdSets(dirHandle);
      } catch (err) {
        console.error("Failed to write ad set to shared folder", err);
        setFolderMessage("Saved locally, but writing to the shared folder failed.");
      }
    }
  }, [configMap, formConfig.funeralHomeName, dirHandle, refreshSharedAdSets]);

  const handleUpdateAdSet = useCallback(async () => {
    if (!currentAdSetId) return;
    const name = formConfig.funeralHomeName || "Untitled Ad Set";
    await updateAdSet(currentAdSetId, configMap, name);
    setBaseline(JSON.stringify(configMap));
    const fresh = await getSavedAdSets();
    setSavedAdSets(fresh);
    if (dirHandle) {
      const existing =
        fresh.find((s) => s.id === currentAdSetId) ??
        sharedAdSets.find((s) => s.id === currentAdSetId);
      const now = new Date().toISOString();
      const updated: SavedAdSet = existing
        ? { ...existing, name, configMap, updatedAt: now }
        : {
            id: currentAdSetId,
            name,
            createdAt: now,
            updatedAt: now,
            configMap,
          };
      try {
        await saveAdSetToFolder(dirHandle, updated);
        await refreshSharedAdSets(dirHandle);
      } catch (err) {
        console.error("Failed to write ad set to shared folder", err);
        setFolderMessage("Updated locally, but writing to the shared folder failed.");
      }
    }
  }, [configMap, currentAdSetId, dirHandle, sharedAdSets, formConfig.funeralHomeName, refreshSharedAdSets]);

  // The combined save action surfaced in the Current Ad card: update the loaded
  // set, or create a new one if nothing is loaded yet.
  const handleSaveCurrent = useCallback(
    () => (currentAdSetId ? handleUpdateAdSet() : handleSaveAdSet()),
    [currentAdSetId, handleUpdateAdSet, handleSaveAdSet]
  );

  // Plain (non-memoized) helpers: only called from modal callbacks, so they read
  // the latest state at call time without dependency-array bookkeeping.
  const doLoadAdSet = (id: string) => {
    const set = savedAdSets.find((s) => s.id === id) ?? sharedAdSets.find((s) => s.id === id);
    if (!set) return;
    const clone: ConfigMap = JSON.parse(JSON.stringify(set.configMap));
    setConfigMap(clone);
    setCurrentAdSetId(set.id);
    setBaseline(JSON.stringify(clone));
    setShowPicker(false);
  };

  const doNewAdSet = () => {
    setConfigMap(INITIAL_CONFIG_MAP);
    setCurrentAdSetId(null);
    setBaseline(JSON.stringify(INITIAL_CONFIG_MAP));
    setShowPicker(false);
  };

  const requestLoadAdSet = (id: string) => {
    if (id === currentAdSetId) {
      setShowPicker(false);
      return;
    }
    if (isDirty) setPendingAction({ type: "load", id });
    else doLoadAdSet(id);
  };

  const requestNewAdSet = () => {
    if (isDirty) setPendingAction({ type: "new" });
    else doNewAdSet();
  };

  const runPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "load") doLoadAdSet(pendingAction.id);
    else doNewAdSet();
    setPendingAction(null);
  };

  const handleConfirmSave = async () => {
    await handleSaveCurrent();
    runPendingAction();
  };

  // Deletes route through a confirmation dialog. Shared-folder sets get a
  // sterner message because removing the file affects everyone.
  const requestDeleteAdSet = (id: string) => {
    const shared = sharedAdSets.some((s) => s.id === id);
    const set = shared
      ? sharedAdSets.find((s) => s.id === id)
      : savedAdSets.find((s) => s.id === id);
    if (!set) return;
    setPendingDelete({ id, name: set.name, shared });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    await handleDeleteAdSet(id);
  };

  const handleDeleteAdSet = useCallback(
    async (id: string) => {
      await deleteAdSet(id);
      if (currentAdSetId === id) setCurrentAdSetId(null);
      setSavedAdSets(await getSavedAdSets());
      if (dirHandle) {
        try {
          await deleteAdSetFromFolder(dirHandle, id);
          await refreshSharedAdSets(dirHandle);
        } catch (err) {
          console.error("Failed to delete ad set from shared folder", err);
          setFolderMessage("Deleted locally, but removing from the shared folder failed.");
        }
      }
    },
    [currentAdSetId, dirHandle, refreshSharedAdSets]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Ad Creator</h1>
            <Badge variant="secondary" className="text-[10px]">BETA</Badge>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={previewScale}
              onChange={(e) => setPreviewScale(Number(e.target.value))}
              className="text-xs h-8 px-2 rounded-md border border-border bg-white text-foreground cursor-pointer"
            >
              <option value={0.5}>Scale: 50%</option>
              <option value={0.75}>Scale: 75%</option>
              <option value={1}>Scale: 100%</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
            </Button>
            <Button
              size="sm"
              onClick={handleExportAll}
              disabled={isExporting || selectedAds.size === 0}
            >
              {isExporting ? "Exporting..." : `Download${selectedAds.size < AD_SIZES.length ? ` (${selectedAds.size})` : " All"}`}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto pr-4 sm:pr-6 py-4 pl-[calc(320px+16px+24px)]">
        <div>
          {/* Left sidebar — Form */}
          <aside className="w-80 fixed top-[calc(3.5rem+16px)] left-4 bottom-4 overflow-y-auto bg-card rounded-xl ring-1 ring-border/50 p-4 shadow-sm z-40 space-y-4">
            {/* Current Ad */}
            <Card size="sm" className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Current Ad</label>
                  {isDirty && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                      <span className="size-1.5 rounded-full bg-amber-500" /> Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  {currentSet &&
                    (sharedAdSets.some((s) => s.id === currentSet.id) ? (
                      <Cloud className="size-3.5 text-primary flex-shrink-0" aria-label="Shared" />
                    ) : (
                      <HardDrive className="size-3.5 text-muted-foreground flex-shrink-0" aria-label="Local" />
                    ))}
                  <span className="text-sm font-medium truncate">{currentName}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPicker(true)}>
                    <FolderOpen className="size-3.5 mr-1.5" /> Open ad
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleSaveCurrent}>
                    <Save className="size-3.5 mr-1.5" /> {currentAdSetId ? "Save" : "Save new"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Shared Folder */}
            {sharedSupported === true && (
              <Card size="sm" className="p-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Shared Folder</label>
                  {dirHandle ? (
                    needsReconnect ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground">
                          Access to <span className="font-medium">{dirHandle.name}</span> needs to be re-granted. Re-select the folder to restore access.
                        </p>
                        <Button variant="outline" size="sm" className="w-full" onClick={handleConnectFolder}>
                          <RefreshCw className="size-3 mr-1.5" /> Reconnect folder
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-[10px] h-6"
                          onClick={handleDisconnectFolder}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Cloud className="size-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{dirHandle.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 px-1.5 flex-shrink-0"
                          onClick={handleDisconnectFolder}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={handleConnectFolder}>
                      <Cloud className="size-3 mr-1.5" /> Connect Google Drive folder
                    </Button>
                  )}
                  {folderMessage && <p className="text-[11px] text-destructive">{folderMessage}</p>}
                </div>
              </Card>
            )}
            {sharedSupported === false && (
              <p className="text-[11px] text-muted-foreground px-1">Shared folders require Chrome or Edge.</p>
            )}

            <AdForm config={formConfig} onChange={handleConfigChange} />
          </aside>

          {/* Main content — Preview */}
          <main className="flex-1 min-w-0">
            {/* Ad Previews — responsive grid */}
            <div className="space-y-4">
              {/* Row 1: Large Leaderboard (970x90) */}
              <AdCard size={AD_SIZES[1]} selected={selectedAds.has(AD_SIZES[1].name)} onToggle={toggleAd} onExport={handleExportSingle} isExporting={isExporting} previewScale={previewScale}>
                <AdRenderer config={configMap[AD_SIZES[1].name]} size={AD_SIZES[1]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[1].name, el)} />
              </AdCard>

              {/* Row 2: Leaderboard (728x90) */}
              <AdCard size={AD_SIZES[2]} selected={selectedAds.has(AD_SIZES[2].name)} onToggle={toggleAd} onExport={handleExportSingle} isExporting={isExporting} previewScale={previewScale}>
                <AdRenderer config={configMap[AD_SIZES[2].name]} size={AD_SIZES[2]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[2].name, el)} />
              </AdCard>

              {/* Row 3: Mobile Leaderboard (320x50) */}
              <AdCard size={AD_SIZES[4]} selected={selectedAds.has(AD_SIZES[4].name)} onToggle={toggleAd} onExport={handleExportSingle} isExporting={isExporting} previewScale={previewScale}>
                <AdRenderer config={configMap[AD_SIZES[4].name]} size={AD_SIZES[4]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[4].name, el)} />
              </AdCard>

              {/* Row 4: Half Page (300x600) + Medium Rectangle (300x250) side by side */}
              <div className="flex gap-4 flex-wrap">
                <AdCard size={AD_SIZES[0]} selected={selectedAds.has(AD_SIZES[0].name)} onToggle={toggleAd} onExport={handleExportSingle} isExporting={isExporting} previewScale={previewScale} className="flex-shrink-0">
                  <AdRenderer config={configMap[AD_SIZES[0].name]} size={AD_SIZES[0]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[0].name, el)} />
                </AdCard>

                <AdCard size={AD_SIZES[3]} selected={selectedAds.has(AD_SIZES[3].name)} onToggle={toggleAd} onExport={handleExportSingle} isExporting={isExporting} previewScale={previewScale}>
                  <AdRenderer config={configMap[AD_SIZES[3].name]} size={AD_SIZES[3]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[3].name, el)} />
                </AdCard>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* In-context preview modal */}
      {showPreview && (
        <InContextPreview config={formConfig} onClose={() => setShowPreview(false)} />
      )}

      {/* Ad picker modal */}
      {showPicker && (
        <AdPickerModal
          localSets={savedAdSets}
          sharedSets={sharedAdSets}
          currentId={currentAdSetId}
          onSelect={requestLoadAdSet}
          onNew={requestNewAdSet}
          onDelete={requestDeleteAdSet}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Unsaved-changes guard */}
      {pendingAction && (
        <UnsavedChangesDialog
          onSave={handleConfirmSave}
          onDiscard={runPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <ConfirmDeleteDialog
          name={pendingDelete.name}
          shared={pendingDelete.shared}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
