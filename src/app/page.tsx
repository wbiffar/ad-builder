"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AdConfig, AdSize, AD_SIZES, DEFAULT_AD_CONFIG, SavedBrand } from "@/lib/types";
import { exportAdAsPng, exportAllAdsAsZip } from "@/lib/export";
import { getSavedBrands, saveBrand, deleteBrand } from "@/lib/brand-storage";
import { AdRenderer } from "@/components/ad-canvas";
import { AdForm } from "@/components/ad-form";
import { DesignPanel, BorderPanel } from "@/components/design-elements/design-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  const [previewScale, setPreviewScale] = useState(0.5);
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveBrand}
              disabled={!config.funeralHomeName}
            >
              Save Brand
            </Button>
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
          <aside className="w-80 flex-shrink-0 space-y-6 max-h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 pb-8">
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

            <AdForm config={config} onChange={setConfig} />

            {/* Border — available for ALL tiers */}
            <Separator />
            <BorderPanel
              elements={config.designElements}
              onChange={(elements) => setConfig((prev) => ({ ...prev, designElements: elements }))}
            />

            {/* Additional design elements (Better tier only) */}
            {config.tier === "better" && (
              <DesignPanel
                elements={config.designElements}
                colors={config.colors}
                onChange={(elements) => setConfig((prev) => ({ ...prev, designElements: elements }))}
              />
            )}
          </aside>

          {/* Main content — Preview */}
          <main className="flex-1 min-w-0">
            {/* Preview Controls */}
            <div className="flex items-center justify-between mb-4 sticky top-20 bg-background z-10 pb-2">
              <h2 className="text-sm font-semibold text-foreground">Preview — All Sizes</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Scale:</span>
                {[0.35, 0.5, 0.75, 1].map((scale) => (
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
            </div>

            {/* Ad Previews */}
            <div className="space-y-8">
              {AD_SIZES.map((size) => (
                <div key={size.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-foreground">{size.label}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {size.width} x {size.height}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleExportSingle(size)}
                      disabled={isExporting}
                    >
                      Download PNG
                    </Button>
                  </div>

                  <div className="bg-muted/30 rounded-lg border border-border p-4 overflow-auto">
                    <div
                      style={{
                        width: size.width * previewScale,
                        height: size.height * previewScale,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          transform: `scale(${previewScale})`,
                          transformOrigin: "top left",
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                      >
                        <AdRenderer
                          config={config}
                          size={size}
                          adRef={(el: HTMLDivElement | null) => setAdRef(size.name, el)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
