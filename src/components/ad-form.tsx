"use client";

import React, { useCallback, useState, useRef } from "react";
import { AdConfig, BrandColors, Tier, LayoutVariant, LogoPosition } from "@/lib/types";
import { extractColorsFromImage, generateBrandPalette } from "@/lib/color-utils";
import { fileToDataUrl } from "@/lib/file-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BorderPanel } from "@/components/design-elements/design-panel";

type AdFormProps = {
  config: AdConfig;
  onChange: (config: AdConfig) => void;
  onSaveBrand?: () => void;
};

export function AdForm({ config, onChange, onSaveBrand }: AdFormProps) {
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [inspirationDragActive, setInspirationDragActive] = useState(false);
  const [inspirationUrl, setInspirationUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDescription, setAnalysisDescription] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (partial: Partial<AdConfig>) => {
      onChange({ ...config, ...partial });
    },
    [config, onChange]
  );

  const updateColors = useCallback(
    (partial: Partial<BrandColors>) => {
      onChange({ ...config, colors: { ...config.colors, ...partial } });
    },
    [config, onChange]
  );

  const processLogoFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = await fileToDataUrl(file);
      update({ logoUrl: url });

      setIsExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(url);
        setExtractedPalette(colors);
        const palette = generateBrandPalette(colors);
        onChange({ ...config, logoUrl: url, colors: palette });
      } catch (err) {
        console.error("Color extraction failed:", err);
      } finally {
        setIsExtractingColors(false);
      }
    },
    [config, onChange, update]
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processLogoFile(file);
    },
    [processLogoFile]
  );

  const handleLogoDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setLogoDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processLogoFile(file);
    },
    [processLogoFile]
  );

  const handleAdditionalImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await fileToDataUrl(file);
      update({ additionalImageUrl: url });
    },
    [update]
  );

  const handleAdditionalImageDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = await fileToDataUrl(file);
      update({ additionalImageUrl: url });
    },
    [update]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processInspirationFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const url = await fileToDataUrl(file);
      setInspirationUrl(url);
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisDescription(null);

      try {
        // Convert to base64
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const res = await fetch("/api/analyze-inspiration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");

        const a = data.analysis;

        // Apply analysis to config
        const newConfig: Partial<AdConfig> = {
          colors: a.colors || config.colors,
          designElements: {
            ...config.designElements,
            border: a.border
              ? { ...config.designElements.border, ...a.border }
              : config.designElements.border,
            gradient: a.gradient
              ? { ...config.designElements.gradient, ...a.gradient }
              : config.designElements.gradient,
          },
          logoSettings: {
            whiteContainer: a.layout?.whiteLogoContainer ?? config.logoSettings.whiteContainer,
            position: a.layout?.logoPosition ?? config.logoSettings.position,
          },
          variant: a.layout?.variant ?? config.variant,
        };

        onChange({ ...config, ...newConfig });
        setAnalysisDescription(a.description || "Style applied");
      } catch (err) {
        console.error("Inspiration analysis failed:", err);
        setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [config, onChange]
  );

  const handleInspirationUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processInspirationFile(file);
    },
    [processInspirationFile]
  );

  const handleInspirationDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setInspirationDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processInspirationFile(file);
    },
    [processInspirationFile]
  );

  return (
    <div className="space-y-6">
      {/* Inspiration Image */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Inspiration Image
            <Badge variant="outline" className="text-[10px] font-normal">AI-powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              inspirationDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => { e.preventDefault(); setInspirationDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setInspirationDragActive(false); }}
            onDrop={handleInspirationDrop}
            onClick={() => !inspirationUrl && inspirationInputRef.current?.click()}
          >
            {inspirationUrl ? (
              <div className="space-y-2">
                <img
                  src={inspirationUrl}
                  alt="Inspiration"
                  className="max-h-24 mx-auto object-contain rounded"
                />
                {isAnalyzing && (
                  <p className="text-xs text-primary font-medium animate-pulse">
                    Analyzing design...
                  </p>
                )}
                {analysisDescription && (
                  <p className="text-xs text-muted-foreground italic">{analysisDescription}</p>
                )}
                {analysisError && (
                  <p className="text-xs text-red-500">{analysisError}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspirationUrl(null);
                    setAnalysisDescription(null);
                    setAnalysisError(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <div className="text-muted-foreground text-xs">
                  {inspirationDragActive ? "Drop image here" : "Drop an ad you like, or click to upload"}
                </div>
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  AI will match its colors, layout, and style
                </div>
                <input
                  ref={inspirationInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleInspirationUpload}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Funeral Home Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold">Funeral Home Name</Label>
        <Input
          id="name"
          value={config.funeralHomeName}
          onChange={(e) => update({ funeralHomeName: e.target.value })}
          placeholder="e.g., Riverside Memorial"
        />
        {onSaveBrand && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onSaveBrand}
            disabled={!config.funeralHomeName}
          >
            Save Brand
          </Button>
        )}
      </div>

      {/* Logo Upload — with drag-and-drop */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Logo</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            logoDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => { e.preventDefault(); setLogoDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setLogoDragActive(false); }}
          onDrop={handleLogoDrop}
          onClick={() => !config.logoUrl && logoInputRef.current?.click()}
        >
          {config.logoUrl ? (
            <div className="space-y-3">
              <img
                src={config.logoUrl}
                alt="Logo preview"
                className="max-h-20 mx-auto object-contain"
              />
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); update({ logoUrl: null }); }}>
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-muted-foreground text-sm">
                {logoDragActive ? "Drop logo here" : "Drop logo here or click to upload"}
              </div>
              <div className="text-muted-foreground text-xs mt-1">PNG, JPG, or SVG</div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          )}
        </div>
        {isExtractingColors && (
          <p className="text-xs text-muted-foreground">Extracting brand colors...</p>
        )}

        {/* Logo Settings — shown when a logo is uploaded */}
        {config.logoUrl && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">White logo container</Label>
              <Switch
                checked={config.logoSettings.whiteContainer}
                onCheckedChange={(checked) =>
                  update({ logoSettings: { ...config.logoSettings, whiteContainer: checked } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Logo position</Label>
              <Tabs
                value={config.logoSettings.position}
                onValueChange={(v) =>
                  update({ logoSettings: { ...config.logoSettings, position: v as LogoPosition } })
                }
              >
                <TabsList className="w-full mt-1">
                  <TabsTrigger value="top" className="flex-1 text-xs">Top</TabsTrigger>
                  <TabsTrigger value="center" className="flex-1 text-xs">Center</TabsTrigger>
                  <TabsTrigger value="bottom" className="flex-1 text-xs">Bottom</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-[10px] text-muted-foreground mt-1">
                Horizontal ads: Top = Left, Bottom = Right
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="tagline" className="text-sm font-semibold">Tagline</Label>
          <span className="text-xs text-muted-foreground">{config.tagline.length}/60</span>
        </div>
        <Textarea
          id="tagline"
          value={config.tagline}
          onChange={(e) => {
            if (e.target.value.length <= 60) update({ tagline: e.target.value });
          }}
          placeholder="Compassionate care in your time of need"
          rows={2}
        />
      </div>

      {/* CTA Text */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="cta" className="text-sm font-semibold">Call to Action</Label>
          <span className="text-xs text-muted-foreground">{config.ctaText.length}/25</span>
        </div>
        <Input
          id="cta"
          value={config.ctaText}
          onChange={(e) => {
            if (e.target.value.length <= 25) update({ ctaText: e.target.value });
          }}
          placeholder="Learn More"
        />
      </div>

      {/* Brand Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Brand Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {extractedPalette.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Extracted from logo:</p>
              <div className="flex gap-1.5">
                {extractedPalette.map((color, i) => (
                  <button
                    key={i}
                    className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      const palette = generateBrandPalette([color, ...extractedPalette.filter((_, j) => j !== i)]);
                      onChange({ ...config, colors: palette });
                    }}
                    title={`Use ${color} as primary`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {([
              ["background", "Background"],
              ["primary", "Primary"],
              ["accent", "Accent / CTA"],
              ["text", "Text"],
              ["secondary", "Secondary"],
            ] as [keyof BrandColors, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors[key]}
                    onChange={(e) => updateColors({ [key]: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={config.colors[key]}
                    onChange={(e) => updateColors({ [key]: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border — available for all tiers */}
      <BorderPanel
        elements={config.designElements}
        onChange={(elements) => onChange({ ...config, designElements: elements })}
      />

      {/* Tier Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Tier</Label>
        <Tabs value={config.tier} onValueChange={(v) => update({ tier: v as Tier })}>
          <TabsList className="w-full">
            <TabsTrigger value="good" className="flex-1">
              Good <Badge variant="secondary" className="ml-1.5 text-[10px]">Basic</Badge>
            </TabsTrigger>
            <TabsTrigger value="better" className="flex-1">
              Better <Badge variant="secondary" className="ml-1.5 text-[10px]">Mid-tier</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {config.tier === "good"
            ? "Clean, auto-generated ads from logo + tagline + CTA."
            : "Additional image, layout variants, and design elements."}
        </p>
      </div>

      {/* Better Tier Options */}
      {config.tier === "better" && (
        <>
          {/* Additional Image — with drag-and-drop */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Additional Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                imageDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => { e.preventDefault(); setImageDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setImageDragActive(false); }}
              onDrop={handleAdditionalImageDrop}
              onClick={() => !config.additionalImageUrl && imageInputRef.current?.click()}
            >
              {config.additionalImageUrl ? (
                <div className="space-y-2">
                  <img
                    src={config.additionalImageUrl}
                    alt="Additional image preview"
                    className="max-h-16 mx-auto object-contain"
                  />
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); update({ additionalImageUrl: null }); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="text-muted-foreground text-xs">
                    {imageDragActive ? "Drop image here" : "Drop image here or click to upload"}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">Staff photo, building, or scenic image</div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleAdditionalImageUpload}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Layout Variant */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Layout Variant</Label>
            <Tabs value={config.variant} onValueChange={(v) => update({ variant: v as LayoutVariant })}>
              <TabsList className="w-full">
                <TabsTrigger value="a" className="flex-1 text-xs">Clean</TabsTrigger>
                <TabsTrigger value="b" className="flex-1 text-xs">Photo BG</TabsTrigger>
                <TabsTrigger value="c" className="flex-1 text-xs">Split</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
