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
const HEIGHT = 250;

function getVerticalJustify(position: string) {
  switch (position) {
    case "top": return "flex-start" as const;
    case "bottom": return "flex-end" as const;
    default: return "center" as const;
  }
}

export function MediumRectangle({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, tier, variant, additionalImageUrl, designElements, logoSettings } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const justify = getVerticalJustify(logoSettings.position);

  // Better variant B: photo background
  if (tier === "better" && variant === "b" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${colors.background}aa 0%, ${colors.background}ee 70%)` }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justify, height: "100%", padding: 20, textAlign: "center", gap: 12 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={120} maxHeight={50} whiteContainer={wc} />}
          <div style={{ color: textColor, fontSize: 17, fontWeight: 600, lineHeight: 1.3, maxWidth: 250 }}>{tagline}</div>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="8px 24px" />
        </div>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // Better variant C: split layout
  if (tier === "better" && variant === "c" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", display: "flex", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <div style={{ width: "40%", height: "100%", overflow: "hidden" }}>
          <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
        </div>
        <div style={{ flex: 1, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justify, padding: 16, textAlign: "center", gap: 10 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={100} maxHeight={40} whiteContainer={wc} />}
          <div style={{ color: textColor, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{tagline}</div>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={11} padding="6px 16px" />
        </div>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // Default / Good / Better variant A
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justify, padding: 24, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 16, ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {logoUrl && <LogoImage src={logoUrl} maxWidth={140} maxHeight={55} whiteContainer={wc} />}
        <div style={{ color: textColor, fontSize: 18, fontWeight: 600, lineHeight: 1.3, maxWidth: 260 }}>{tagline}</div>
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="10px 28px" />
      </div>
    </div>
  );
}
