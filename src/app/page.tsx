"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AdConfig, AdSize, AD_SIZES, DEFAULT_AD_CONFIG, SavedBrand } from "@/lib/types";
import { exportAdAsPng, exportAllAdsAsZip } from "@/lib/export";
import { getSavedBrands, saveBrand, deleteBrand } from "@/lib/brand-storage";
import { AdRenderer } from "@/components/ad-canvas";
import { AdForm } from "@/components/ad-form";
// Design controls are now integrated into AdForm (Gradient always visible, Labs collapsible)
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function AdCreatorPage() {
  const [config, setConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);
  const [savedBrands, setSavedBrands] = useState<SavedBrand[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const adRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load saved brands on mount
  useEffect(() => {
    setSavedBrands(getSavedBrands());
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
      setIsExporting(true);
      try {
        await exportAdAsPng(el, size, `${config.funeralHomeName || "ad"}-${size.name}-${size.width}x${size.height}.png`);
      } finally {
        setIsExporting(false);
      }
    },
    [config.funeralHomeName]
  );

  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportAllAdsAsZip(adRefs.current, AD_SIZES, config.funeralHomeName || "funeral-home");
    } finally {
      setIsExporting(false);
    }
  }, [config.funeralHomeName]);

  const handleSaveBrand = useCallback(() => {
    if (!config.funeralHomeName) return;
    saveBrand({
      name: config.funeralHomeName,
      logoUrl: config.logoUrl,
      colors: config.colors,
    });
    setSavedBrands(getSavedBrands());
  }, [config]);

  const handleLoadBrand = useCallback(
    (brandId: string) => {
      const brand = savedBrands.find((b) => b.id === brandId);
      if (!brand) return;
      setConfig((prev) => ({
        ...prev,
        funeralHomeName: brand.name,
        logoUrl: brand.logoUrl,
        colors: brand.colors,
      }));
    },
    [savedBrands]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Ad Creator</h1>
            <Badge variant="secondary" className="text-[10px]">Legacy.com</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Scale:</span>
              {[0.5, 0.75, 1].map((scale) => (
                <button
                  key={scale}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    previewScale === scale
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setPreviewScale(scale)}
                >
                  {Math.round(scale * 100)}%
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleExportAll}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Download All"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Left sidebar — Form */}
          <aside className="w-80 flex-shrink-0 max-h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 pb-8 bg-card rounded-xl ring-1 ring-border/50 p-5 space-y-6 shadow-sm">
            {/* Saved Brands */}
            {savedBrands.length > 0 && (
              <Card className="p-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Load Saved Brand</label>
                  <Select onValueChange={(v: string | null) => { if (v) handleLoadBrand(v); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: brand.colors.primary }}
                            />
                            {brand.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}

            <AdForm config={config} onChange={setConfig} onSaveBrand={handleSaveBrand} />
          </aside>

          {/* Main content — Preview */}
          <main className="flex-1 min-w-0">
            {/* Ad Previews — responsive grid */}
            <div className="space-y-4">
              {/* Row 1: Large Leaderboard (970x90) */}
              <div className="space-y-1.5" style={{ width: 970 * previewScale }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold text-foreground">Large Leaderboard</h3>
                    <Badge variant="outline" className="text-[9px] font-mono">970x90</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => handleExportSingle(AD_SIZES[1])} disabled={isExporting}><Download className="size-3" /> PNG</Button>
                </div>
                <div className="overflow-auto">
                  <div style={{ width: 970 * previewScale, height: 90 * previewScale, position: "relative", overflow: "hidden" }}>
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                      <AdRenderer config={config} size={AD_SIZES[1]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[1].name, el)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Leaderboard (728x90) */}
              <div className="space-y-1.5" style={{ width: 728 * previewScale }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold text-foreground">Leaderboard</h3>
                    <Badge variant="outline" className="text-[9px] font-mono">728x90</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => handleExportSingle(AD_SIZES[2])} disabled={isExporting}><Download className="size-3" /> PNG</Button>
                </div>
                <div className="overflow-auto">
                  <div style={{ width: 728 * previewScale, height: 90 * previewScale, position: "relative", overflow: "hidden" }}>
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                      <AdRenderer config={config} size={AD_SIZES[2]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[2].name, el)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Mobile Leaderboard (320x50) */}
              <div className="space-y-1.5" style={{ width: 320 * previewScale }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold text-foreground">Mobile Leaderboard</h3>
                    <Badge variant="outline" className="text-[9px] font-mono">320x50</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => handleExportSingle(AD_SIZES[4])} disabled={isExporting}><Download className="size-3" /> PNG</Button>
                </div>
                <div className="overflow-auto">
                  <div style={{ width: 320 * previewScale, height: 50 * previewScale, position: "relative", overflow: "hidden" }}>
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                      <AdRenderer config={config} size={AD_SIZES[4]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[4].name, el)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Half Page (300x600) + Medium Rectangle (300x250) side by side */}
              <div className="flex gap-4 flex-wrap">
                <div className="space-y-1.5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[11px] font-semibold text-foreground">Half Page</h3>
                      <Badge variant="outline" className="text-[9px] font-mono">300x600</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => handleExportSingle(AD_SIZES[0])} disabled={isExporting}><Download className="size-3" /> PNG</Button>
                  </div>
                  <div className="overflow-auto">
                    <div style={{ width: 300 * previewScale, height: 600 * previewScale, position: "relative", overflow: "hidden" }}>
                      <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                        <AdRenderer config={config} size={AD_SIZES[0]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[0].name, el)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5" style={{ width: 300 * previewScale }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[11px] font-semibold text-foreground">Medium Rectangle</h3>
                      <Badge variant="outline" className="text-[9px] font-mono">300x250</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => handleExportSingle(AD_SIZES[3])} disabled={isExporting}><Download className="size-3" /> PNG</Button>
                  </div>
                  <div className="overflow-auto">
                    <div style={{ width: 300 * previewScale, height: 250 * previewScale, position: "relative", overflow: "hidden" }}>
                      <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
                        <AdRenderer config={config} size={AD_SIZES[3]} adRef={(el: HTMLDivElement | null) => setAdRef(AD_SIZES[3].name, el)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
