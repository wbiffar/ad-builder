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
import { LogoPosition } from "@/lib/types";

/**
 * In horizontal layouts, logo position maps:
 * "top" → left, "center" → center, "bottom" → right
 */
function getHorizontalOrder(position: LogoPosition) {
  switch (position) {
    case "top": return { logoOrder: 0, ctaOrder: 2 }; // logo left, CTA right
    case "bottom": return { logoOrder: 2, ctaOrder: 0 }; // logo right, CTA left
    default: return { logoOrder: 0, ctaOrder: 2 }; // default: logo left
  }
}

export function LeaderboardTemplate({
  config,
  adRef,
  width,
  height,
}: AdTemplateProps & { width: number; height: number }) {
  const { colors, logoUrl, tagline, ctaText, tier, variant, additionalImageUrl, designElements, logoSettings } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const order = getHorizontalOrder(logoSettings.position);

  const isLarge = width >= 970;
  const logoMaxW = isLarge ? 120 : 100;
  const logoMaxH = isLarge ? 55 : 50;
  const tagFontSize = isLarge ? 17 : 15;
  const ctaFontSize = isLarge ? 13 : 12;

  const logoEl = logoUrl ? <LogoImage src={logoUrl} maxWidth={logoMaxW} maxHeight={logoMaxH} whiteContainer={wc} /> : null;

  // Better variant B: photo accent on left
  if (tier === "better" && variant === "b" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width, height, position: "relative", overflow: "hidden", display: "flex", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <div style={{ width: "15%", height: "100%", overflow: "hidden", flexShrink: 0 }}>
          <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
        </div>
        <div style={{ flex: 1, background: bg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 20 }}>
          <div style={{ order: order.logoOrder, flexShrink: 0 }}>{logoEl}</div>
          <div style={{ color: textColor, fontSize: tagFontSize, fontWeight: 600, lineHeight: 1.3, flex: 1, textAlign: "center", order: 1 }}>{tagline}</div>
          <div style={{ order: order.ctaOrder, flexShrink: 0 }}><CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" /></div>
        </div>
        <DesignElementOverlay elements={designElements} width={width} height={height} />
      </div>
    );
  }

  // Better variant C: photo background with overlay
  if (tier === "better" && variant === "c" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width, height, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: `${colors.background}dd` }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 24px", gap: 20 }}>
          <div style={{ order: order.logoOrder, flexShrink: 0 }}>{logoEl}</div>
          <div style={{ color: textColor, fontSize: tagFontSize, fontWeight: 600, lineHeight: 1.3, flex: 1, textAlign: "center", order: 1 }}>{tagline}</div>
          <div style={{ order: order.ctaOrder, flexShrink: 0 }}><CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" /></div>
        </div>
        <DesignElementOverlay elements={designElements} width={width} height={height} />
      </div>
    );
  }

  // Default / Good / Better variant A: clean horizontal
  return (
    <div ref={adRef} style={{ width, height, background: bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 20, fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={width} height={height} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 20, width: "100%", justifyContent: "space-between" }}>
        <div style={{ order: order.logoOrder, flexShrink: 0 }}>{logoEl}</div>
        <div style={{ color: textColor, fontSize: tagFontSize, fontWeight: 600, lineHeight: 1.3, flex: 1, textAlign: "center", order: 1 }}>{tagline}</div>
        <div style={{ order: order.ctaOrder, flexShrink: 0 }}><CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" /></div>
      </div>
    </div>
  );
}

export function Leaderboard(props: AdTemplateProps) {
  return <LeaderboardTemplate {...props} width={728} height={90} />;
}

export function LargeLeaderboard(props: AdTemplateProps) {
  return <LeaderboardTemplate {...props} width={970} height={90} />;
}
