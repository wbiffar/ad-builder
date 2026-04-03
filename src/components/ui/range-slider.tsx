"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RangeSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
};

/**
 * Native range input styled to match the app. Replaces the base-ui Slider
 * which causes "script tag" and "[object Event]" errors in Next.js 16.
 */
export function RangeSlider({ value, onChange, min, max, step, className }: RangeSliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={cn(
        "w-full h-1 bg-muted rounded-full appearance-none cursor-pointer",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:shadow-sm",
        "[&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:shadow-sm",
        className
      )}
    />
  );
}
