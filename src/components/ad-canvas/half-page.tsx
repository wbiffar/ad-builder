"use client";

import React from "react";
import {
  AdTemplateProps,
  CtaButton,
  LogoImage,
  getGradientCSS,
  getBorderStyles,
  DesignElementOverlay,
} from "./shared";
import { getContrastColor } from "@/lib/color-utils";

const WIDTH = 300;
const HEIGHT = 600;

/**
 * Maps logoSettings.position to flexbox justifyContent for vertical layouts.
 * "top" = logo at top, tagline + CTA fill center/bottom
 * "center" = everything centered (default look)
 * "bottom" = logo at bottom, tagline + CTA fill center/top
 */
function getVerticalLayout(position: string) {
  switch (position) {
    case "top": return { justify: "flex-start" as const, logoOrder: 0, contentOrder: 1 };
    case "bottom": return { justify: "flex-end" as const, logoOrder: 2, contentOrder: 0 };
    default: return { justify: "center" as const, logoOrder: 0, contentOrder: 1 };
  }
}

export function HalfPage({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, tier, variant, additionalImageUrl, designElements, logoSettings } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const layout = getVerticalLayout(logoSettings.position);

  // Better tier variant B: photo background with overlay
  if (tier === "better" && variant === "b" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(180deg, ${colors.background}cc 0%, ${colors.background}ee 60%, ${colors.background} 100%)` }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: layout.justify, height: "100%", padding: 32, textAlign: "center", gap: 32 }}>
          <div style={{ order: layout.logoOrder }}>{logoUrl && <LogoImage src={logoUrl} maxWidth={160} maxHeight={80} whiteContainer={wc} />}</div>
          <div style={{ order: layout.contentOrder, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <div style={{ color: textColor, fontSize: 22, fontWeight: 600, lineHeight: 1.3, maxWidth: 240 }}>{tagline}</div>
            <CtaButton text={ctaText} bgColor={colors.accent} fontSize={15} padding="12px 32px" />
          </div>
        </div>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // Better tier variant C: split layout with photo
  if (tier === "better" && variant === "c" && additionalImageUrl) {
    const photoTop = logoSettings.position !== "top";
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles, display: "flex", flexDirection: "column" }}>
        {photoTop && (
          <div style={{ width: "100%", height: "45%", overflow: "hidden" }}>
            <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
          </div>
        )}
        <div style={{ width: "100%", flex: 1, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 16 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={140} maxHeight={60} whiteContainer={wc} />}
          <div style={{ color: textColor, fontSize: 20, fontWeight: 600, lineHeight: 1.3, maxWidth: 240 }}>{tagline}</div>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={14} padding="10px 28px" />
        </div>
        {!photoTop && (
          <div style={{ width: "100%", height: "45%", overflow: "hidden" }}>
            <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
          </div>
        )}
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // Default / Good tier / Better variant A: clean vertical stack
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: layout.justify, padding: 32, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 32, order: layout.logoOrder }}>
        {logoUrl && <LogoImage src={logoUrl} maxWidth={180} maxHeight={100} whiteContainer={wc} />}
      </div>
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, order: layout.contentOrder }}>
        <div style={{ color: textColor, fontSize: 24, fontWeight: 600, lineHeight: 1.35, maxWidth: 240 }}>{tagline}</div>
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={16} padding="14px 36px" />
      </div>
    </div>
  );
}
