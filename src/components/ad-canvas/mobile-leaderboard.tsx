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
import { LogoPosition } from "@/lib/types";

const WIDTH = 320;
const HEIGHT = 50;

function getHorizontalOrder(position: LogoPosition) {
  switch (position) {
    case "bottom": return { logoOrder: 2, ctaOrder: 0 };
    default: return { logoOrder: 0, ctaOrder: 2 };
  }
}

export function MobileLeaderboard({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, designElements, logoSettings } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const order = getHorizontalOrder(logoSettings.position);
  const isScript = templateStyle === "rich-traditional";

  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", gap: 8, fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between" }}>
        <div style={{ order: order.logoOrder, flexShrink: 0 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={60} maxHeight={35} whiteContainer={wc} />}
        </div>
        <div style={{
          color: textColor,
          fontSize: 11,
          fontWeight: isScript ? 400 : 600,
          fontFamily: isScript ? "'Georgia', 'Palatino Linotype', serif" : "'Inter', 'DM Sans', sans-serif",
          fontStyle: isScript ? "italic" : "normal",
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
        <div style={{ order: order.ctaOrder, flexShrink: 0 }}>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={9} padding="4px 10px" />
        </div>
      </div>
    </div>
  );
}
