"use client";

import { useEffect, useRef } from "react";
import { BrandColors } from "@/lib/types";
import { resolveTextColors } from "@/lib/color-utils";
import { Button } from "@/components/ui/button";

function Swatches({ label, colors }: { label: string; colors: BrandColors }) {
  const { taglineColor, descriptionColor } = resolveTextColors(colors);
  const swatches = [colors.background, colors.primary, colors.accent, taglineColor, descriptionColor];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {swatches.map((c, i) => (
          <span key={i} className="size-5 rounded border border-border" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

export type ReplaceColorsDialogProps = {
  current: BrandColors;
  generated: BrandColors;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Shown when turning on logo-based color generation would overwrite a color
 * scheme the user customized (DES-2284). Cancel leaves the toggle off and the
 * colors untouched.
 */
export function ReplaceColorsDialog({ current, generated, onConfirm, onCancel }: ReplaceColorsDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Same pattern as ConfirmDeleteDialog: Cancel is the focused, safe default.
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-card rounded-xl shadow-xl ring-1 ring-border/50 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="Replace custom colors"
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Replace your custom colors?</h2>
          <p className="text-xs text-muted-foreground">
            Generating a color scheme from the logo will replace the colors you&rsquo;ve set on the selected ad sizes.
          </p>
        </div>
        <div className="space-y-1.5 rounded-lg border border-border p-2.5">
          <Swatches label="Current" colors={current} />
          <Swatches label="From logo" colors={generated} />
        </div>
        <div className="flex gap-2">
          <Button ref={cancelRef} variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
            Keep my colors
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm}>
            Replace colors
          </Button>
        </div>
      </div>
    </div>
  );
}
