"use client";

import React from "react";
import {
  DesignElements,
  DesignElementBorder,
  DesignElementGradient,
  DesignElementIcon,
  DesignElementIllustration,
  DesignElementShape,
  BrandColors,
} from "@/lib/types";
import { ICONS, ILLUSTRATIONS } from "@/lib/design-assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RangeSlider } from "@/components/ui/range-slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DesignPanelProps = {
  elements: DesignElements;
  colors: BrandColors;
  onChange: (elements: DesignElements) => void;
};

/**
 * Border controls — used by all tiers.
 */
export function BorderPanel({
  elements,
  onChange,
}: {
  elements: DesignElements;
  onChange: (elements: DesignElements) => void;
}) {
  const updateBorder = (partial: Partial<DesignElementBorder>) =>
    onChange({ ...elements, border: { ...elements.border, ...partial } });

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold">Border</CardTitle>
          <Switch checked={elements.border.enabled} onCheckedChange={(checked) => updateBorder({ enabled: checked })} />
        </div>
      </CardHeader>
      {elements.border.enabled && (
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Style</Label>
              <Select value={elements.border.style} onValueChange={(v) => { if (v) updateBorder({ style: v as DesignElementBorder["style"] }); }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Color</Label>
              <input type="color" value={elements.border.color} onChange={(e) => updateBorder({ color: e.target.value })} className="w-full h-7 rounded border cursor-pointer" />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Width: {elements.border.width}px</Label>
            <RangeSlider value={elements.border.width} onChange={(v) => updateBorder({ width: v })} min={1} max={8} step={1} className="mt-1" />
          </div>
          <div>
            <Label className="text-[10px]">Radius: {elements.border.radius}px</Label>
            <RangeSlider value={elements.border.radius} onChange={(v) => updateBorder({ radius: v })} min={0} max={24} step={2} className="mt-1" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Gradient controls — always available.
 */
export function GradientPanel({
  elements,
  onChange,
}: {
  elements: DesignElements;
  onChange: (elements: DesignElements) => void;
}) {
  const updateGradient = (partial: Partial<DesignElementGradient>) =>
    onChange({ ...elements, gradient: { ...elements.gradient, ...partial } });

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold">Gradient</CardTitle>
          <Switch checked={elements.gradient.enabled} onCheckedChange={(checked) => updateGradient({ enabled: checked })} />
        </div>
      </CardHeader>
      {elements.gradient.enabled && (
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Type</Label>
              <Select value={elements.gradient.type} onValueChange={(v) => { if (v) updateGradient({ type: v as "linear" | "radial" }); }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {elements.gradient.type === "linear" && (
              <div>
                <Label className="text-[10px]">Direction: {elements.gradient.direction}deg</Label>
                <RangeSlider value={elements.gradient.direction} onChange={(v) => updateGradient({ direction: v })} min={0} max={360} step={15} className="mt-1" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {elements.gradient.stops.map((stop, i) => (
              <div key={i} className="flex-1 space-y-1">
                <Label className="text-[10px]">Stop {i + 1}</Label>
                <input type="color" value={stop.color} onChange={(e) => { const stops = [...elements.gradient.stops]; stops[i] = { ...stops[i], color: e.target.value }; updateGradient({ stops }); }} className="w-full h-7 rounded border cursor-pointer" />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Labs panel — Shape, Icon, Illustration controls (hidden behind Labs toggle).
 */
export function LabsDesignPanel({ elements, colors, onChange }: DesignPanelProps) {
  const updateIcon = (partial: Partial<DesignElementIcon>) =>
    onChange({ ...elements, icon: { ...elements.icon, ...partial } });

  const updateIllustration = (partial: Partial<DesignElementIllustration>) =>
    onChange({ ...elements, illustration: { ...elements.illustration, ...partial } });

  const updateShape = (partial: Partial<DesignElementShape>) =>
    onChange({ ...elements, shape: { ...elements.shape, ...partial } });

  return (
    <div className="space-y-4">
      {/* Shape */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">Shape</CardTitle>
            <Switch checked={elements.shape.enabled} onCheckedChange={(checked) => updateShape({ enabled: checked })} />
          </div>
        </CardHeader>
        {elements.shape.enabled && (
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Type</Label>
                <Select value={elements.shape.type} onValueChange={(v) => { if (v) updateShape({ type: v as DesignElementShape["type"] }); }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Position</Label>
                <Select value={elements.shape.position} onValueChange={(v) => { if (v) updateShape({ position: v as DesignElementShape["position"] }); }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Color</Label>
                <input type="color" value={elements.shape.color} onChange={(e) => updateShape({ color: e.target.value })} className="w-full h-7 rounded border cursor-pointer" />
              </div>
              <div>
                <Label className="text-[10px]">Opacity: {Math.round(elements.shape.opacity * 100)}%</Label>
                <RangeSlider value={elements.shape.opacity} onChange={(v) => updateShape({ opacity: v })} min={0.05} max={1} step={0.05} className="mt-1" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Icon */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">Icon</CardTitle>
            <Switch checked={elements.icon.enabled} onCheckedChange={(checked) => updateIcon({ enabled: checked })} />
          </div>
        </CardHeader>
        {elements.icon.enabled && (
          <CardContent className="space-y-2">
            <div>
              <Label className="text-[10px]">Choose Icon</Label>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    className={`p-1.5 rounded border flex items-center justify-center transition-colors ${elements.icon.id === icon.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                    onClick={() => updateIcon({ id: icon.id })}
                    title={icon.label}
                  >
                    {icon.svg(elements.icon.id === icon.id ? colors.primary : "#666", 20)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Color</Label>
                <input type="color" value={elements.icon.color} onChange={(e) => updateIcon({ color: e.target.value })} className="w-full h-7 rounded border cursor-pointer" />
              </div>
              <div>
                <Label className="text-[10px]">Position</Label>
                <Select value={elements.icon.position} onValueChange={(v) => { if (v) updateIcon({ position: v as DesignElementIcon["position"] }); }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Size: {elements.icon.size}px</Label>
                <RangeSlider value={elements.icon.size} onChange={(v) => updateIcon({ size: v })} min={16} max={80} step={4} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px]">Opacity: {Math.round(elements.icon.opacity * 100)}%</Label>
                <RangeSlider value={elements.icon.opacity} onChange={(v) => updateIcon({ opacity: v })} min={0.05} max={1} step={0.05} className="mt-1" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Illustration */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">Illustration</CardTitle>
            <Switch checked={elements.illustration.enabled} onCheckedChange={(checked) => updateIllustration({ enabled: checked })} />
          </div>
        </CardHeader>
        {elements.illustration.enabled && (
          <CardContent className="space-y-2">
            <div>
              <Label className="text-[10px]">Choose Pattern</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {ILLUSTRATIONS.map((ill) => (
                  <button
                    key={ill.id}
                    className={`p-2 rounded border flex items-center justify-center transition-colors h-12 overflow-hidden ${elements.illustration.id === ill.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                    onClick={() => updateIllustration({ id: ill.id })}
                    title={ill.label}
                  >
                    <div className="scale-[0.3]" style={{ transformOrigin: "center" }}>
                      {ill.svg(elements.illustration.id === ill.id ? colors.primary : "#999")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Position</Label>
                <Select value={elements.illustration.position} onValueChange={(v) => { if (v) updateIllustration({ position: v as DesignElementIllustration["position"] }); }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Opacity: {Math.round(elements.illustration.opacity * 100)}%</Label>
                <RangeSlider value={elements.illustration.opacity} onChange={(v) => updateIllustration({ opacity: v })} min={0.05} max={0.5} step={0.05} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Scale: {elements.illustration.scale.toFixed(1)}x</Label>
              <RangeSlider value={elements.illustration.scale} onChange={(v) => updateIllustration({ scale: v })} min={0.5} max={3} step={0.1} className="mt-1" />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/**
 * Full design elements panel — kept for backward compat.
 */
export function DesignPanel({ elements, colors, onChange }: DesignPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Design Elements</h3>
      <GradientPanel elements={elements} onChange={onChange} />
      <LabsDesignPanel elements={elements} colors={colors} onChange={onChange} />
    </div>
  );
}
