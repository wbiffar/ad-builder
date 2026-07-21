"use client";

import React from "react";
import {
  DesignElements,
  DesignElementBorder,
  DesignElementGradient,
} from "@/lib/types";
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
