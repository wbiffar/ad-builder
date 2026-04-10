"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AdConfig, AdSize, AD_SIZES, DEFAULT_AD_CONFIG } from "@/lib/types";
import { exportAdAsPng, exportAllAdsAsZip } from "@/lib/export";
import { SavedAdSet, getSavedAdSets, saveAdSet, updateAdSet, deleteAdSet } from "@/lib/ad-storage";
import { AdRenderer } from "@/components/ad-canvas";
import { AdForm } from "@/components/ad-form";
// Design controls are now integrated into AdForm (Gradient always visible, Labs collapsible)
import { InContextPreview } from "@/components/in-context-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download, Eye, Check, Save, Trash2 } from "lucide-react";

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

const INITIAL_CONFIG_MAP: ConfigMap = Object.fromEntries(
  AD_SIZES.map((s) => [s.name, DEFAULT_AD_CONFIG])
);

export default function AdCreatorPage() {
  const [configMap, setConfigMap] = useState<ConfigMap>(INITIAL_CONFIG_MAP);
  const [savedAdSets, setSavedAdSets] = useState<SavedAdSet[]>([]);
  const [currentAdSetId, setCurrentAdSetId] = useState<string | null>(null);
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
    setSavedAdSets(await getSavedAdSets());
  }, [configMap, formConfig.funeralHomeName]);

  const handleUpdateAdSet = useCallback(async () => {
    if (!currentAdSetId) return;
    await updateAdSet(currentAdSetId, configMap);
    setSavedAdSets(await getSavedAdSets());
  }, [configMap, currentAdSetId]);

  const handleLoadAdSet = useCallback(
    (id: string) => {
      const set = savedAdSets.find((s) => s.id === id);
      if (!set) return;
      setConfigMap(JSON.parse(JSON.stringify(set.configMap)));
      setCurrentAdSetId(set.id);
    },
    [savedAdSets]
  );

  const handleDeleteAdSet = useCallback(
    async (id: string) => {
      await deleteAdSet(id);
      if (currentAdSetId === id) setCurrentAdSetId(null);
      setSavedAdSets(await getSavedAdSets());
    },
    [currentAdSetId]
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
              onClick={handleSaveAdSet}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save New
            </Button>
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
            {/* Saved Ad Sets */}
            {savedAdSets.length > 0 && (
              <Card size="sm" className="p-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Saved Ads</label>
                  <div className="space-y-1.5">
                    {savedAdSets.map((set) => (
                      <div
                        key={set.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-md text-xs transition-colors cursor-pointer ${
                          currentAdSetId === set.id
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleLoadAdSet(set.id)}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{set.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(set.updatedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {currentAdSetId === set.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateAdSet(); }}
                              className="text-muted-foreground hover:text-foreground p-1"
                              aria-label={`Update ${set.name}`}
                            >
                              <Save className="size-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAdSet(set.id); }}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label={`Delete ${set.name}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
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
    </div>
  );
}
