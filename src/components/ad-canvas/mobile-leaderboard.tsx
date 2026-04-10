"use client";

import React from "react";
import {
  AdTemplateProps,
  CtaButton,
  LogoImage,
  TaglineText,
  getGradientCSS,
  getBorderStyles,
  DesignElementOverlay,
} from "./shared";
import { getContrastColor } from "@/lib/color-utils";
import { getFontFallback } from "@/lib/fonts";

const WIDTH = 320;
const HEIGHT = 50;

export function MobileLeaderboard({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, designElements, logoSettings, taglineStyle, taglineFont } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const ls = logoSettings.scale ?? 1;
  const placement = logoSettings.placement ?? "top";
  const isScript = templateStyle === "rich-traditional";
  const tss = taglineStyle ?? { fontWeight: 600, fontStyle: "normal" as const, fontSizeScale: 1 };

  // For horizontal: top/middle = logo left, bottom = logo right
  const logoOrder = placement === "bottom" ? 2 : 0;
  const ctaOrder = placement === "bottom" ? 0 : 2;

  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", gap: 8, fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between" }}>
        <div style={{ order: logoOrder, flexShrink: 0 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={60} maxHeight={35} whiteContainer={wc} scale={ls} />}
        </div>
        <div style={{
          color: textColor,
          fontSize: 11 * (tss.fontSizeScale ?? 1),
          fontWeight: tss.fontWeight ?? (isScript ? 400 : 600),
          fontFamily: taglineFont ? getFontFallback(taglineFont) : (isScript ? "'Georgia', 'Palatino Linotype', serif" : "'Inter', 'DM Sans', sans-serif"),
          fontStyle: tss.fontStyle ?? (isScript ? "italic" : "normal"),
          lineHeight: 1.2,
          flex: 1,
          textAlign: "center",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          order: 1,
        }}>
          {tagline}
        </div>
        <div style={{ order: ctaOrder, flexShrink: 0 }}>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={9} padding="4px 10px" />
        </div>
      </div>
    </div>
  );
}
