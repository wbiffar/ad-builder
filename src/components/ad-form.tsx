"use client";

import React, { useCallback, useState, useRef } from "react";
import { AdConfig, BrandColors, TemplateStyle, PhotoTreatment, LogoPosition } from "@/lib/types";
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
import { BorderPanel, GradientPanel, LabsDesignPanel } from "@/components/design-elements/design-panel";

type AdFormProps = {
  config: AdConfig;
  onChange: (config: AdConfig) => void;
  onSaveBrand?: () => void;
};

export function AdForm({ config: rawConfig, onChange, onSaveBrand }: AdFormProps) {
  // Ensure photoFocusPoint exists (handles stale state from before this field was added)
  const config = { ...rawConfig, photoFocusPoint: rawConfig.photoFocusPoint ?? { x: 50, y: 50 } };

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

  const applyPhoto = useCallback(
    (url: string) => {
      const needsPhotoTemplate = config.templateStyle !== "building-showcase" && config.templateStyle !== "people-first";
      update({ additionalImageUrl: url, ...(needsPhotoTemplate ? { templateStyle: "building-showcase" as TemplateStyle } : {}) });
    },
    [config.templateStyle, update]
  );

  const handleAdditionalImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await fileToDataUrl(file);
      applyPhoto(url);
    },
    [applyPhoto]
  );

  const handleAdditionalImageDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImageDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = await fileToDataUrl(file);
      applyPhoto(url);
    },
    [applyPhoto]
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
          templateStyle: a.layout?.templateStyle ?? config.templateStyle,
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

  const [labsOpen, setLabsOpen] = useState(false);

  return (
    <div className="space-y-6">
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

      {/* Photo */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Photo
          {(config.templateStyle === "building-showcase" || config.templateStyle === "people-first") && (
            <span className="text-amber-600 text-[10px] font-normal ml-1.5">Required for this template</span>
          )}
        </Label>
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
              {/* Focal point picker */}
              <div
                className="relative mx-auto cursor-crosshair"
                style={{ maxHeight: 160 }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  update({ photoFocusPoint: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } });
                }}
              >
                <img
                  src={config.additionalImageUrl}
                  alt="Additional image preview"
                  className="max-h-40 mx-auto object-contain rounded"
                  draggable={false}
                />
                {/* Focus point indicator */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${config.photoFocusPoint.x}%`,
                    top: `${config.photoFocusPoint.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-md" style={{ background: "rgba(59, 130, 246, 0.5)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Click to set focus point</p>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); update({ additionalImageUrl: null, photoFocusPoint: { x: 50, y: 50 } }); }}>
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-muted-foreground text-xs">
                {imageDragActive ? "Drop image here" : "Drop image here or click to upload"}
              </div>
              <div className="text-muted-foreground text-[10px] mt-0.5">Building, staff, or scenic photo</div>
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

        {/* Photo Treatment — shown when image uploaded */}
        {config.additionalImageUrl && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs">Photo treatment</Label>
            <Tabs
              value={config.photoTreatment}
              onValueChange={(v) => update({ photoTreatment: v as PhotoTreatment })}
            >
              <TabsList className="w-full">
                <TabsTrigger value="rectangular" className="flex-1 text-xs">Rectangle</TabsTrigger>
                <TabsTrigger value="circular" className="flex-1 text-xs">Circular</TabsTrigger>
                <TabsTrigger value="fade" className="flex-1 text-xs">Fade</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
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

      {/* Template Style */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Template Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {([
              ["clean-minimal", "Clean & Minimal", "Light bg, modern type"],
              ["rich-traditional", "Rich & Traditional", "Dark bg, script tagline"],
              ["building-showcase", "Building Showcase", "Building photo hero"],
              ["people-first", "People First", "Owner/staff photo focus"],
            ] as [TemplateStyle, string, string][]).map(([value, label, desc]) => {
              const needsImage = value === "building-showcase" || value === "people-first";
              const isActive = config.templateStyle === value;
              return (
                <button
                  key={value}
                  className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  } ${needsImage && !config.additionalImageUrl ? "opacity-60" : ""}`}
                  onClick={() => update({ templateStyle: value })}
                >
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
                  {needsImage && !config.additionalImageUrl && (
                    <div className="text-[9px] text-amber-600 mt-1">Photo required</div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Border */}
      <BorderPanel
        elements={config.designElements}
        onChange={(elements) => onChange({ ...config, designElements: elements })}
      />

      {/* Accent Line */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Accent Line</CardTitle>
            <Switch
              checked={config.designElements.accentLine.enabled}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  designElements: {
                    ...config.designElements,
                    accentLine: { ...config.designElements.accentLine, enabled: checked },
                  },
                })
              }
            />
          </div>
        </CardHeader>
        {config.designElements.accentLine.enabled && (
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Orientation</Label>
              <Tabs
                value={config.designElements.accentLine.orientation}
                onValueChange={(v) =>
                  onChange({
                    ...config,
                    designElements: {
                      ...config.designElements,
                      accentLine: { ...config.designElements.accentLine, orientation: v as "horizontal" | "vertical" },
                    },
                  })
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="horizontal" className="flex-1 text-xs">Horizontal</TabsTrigger>
                  <TabsTrigger value="vertical" className="flex-1 text-xs">Vertical</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.designElements.accentLine.color}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      designElements: {
                        ...config.designElements,
                        accentLine: { ...config.designElements.accentLine, color: e.target.value },
                      },
                    })
                  }
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={config.designElements.accentLine.color}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      designElements: {
                        ...config.designElements,
                        accentLine: { ...config.designElements.accentLine, color: e.target.value },
                      },
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Gradient — always available */}
      <GradientPanel
        elements={config.designElements}
        onChange={(elements) => onChange({ ...config, designElements: elements })}
      />

      {/* Labs — collapsible section for experimental features */}
      <div className="space-y-3">
        <button
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg border border-dashed border-border hover:border-primary/40 transition-colors text-left"
          onClick={() => setLabsOpen(!labsOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labs</span>
            <Badge variant="outline" className="text-[9px] font-normal">Experimental</Badge>
          </div>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${labsOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {labsOpen && (
          <div className="space-y-4 pl-1">
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

            {/* Shape, Icon, Illustration */}
            <LabsDesignPanel
              elements={config.designElements}
              colors={config.colors}
              onChange={(elements) => onChange({ ...config, designElements: elements })}
            />
          </div>
        )}
      </div>

    </div>
  );
}
