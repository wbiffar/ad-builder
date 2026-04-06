"use client";

import React from "react";
import {
  AdTemplateProps,
  CtaButton,
  LogoImage,
  TaglineText,
  PhotoImage,
  AccentLineElement,
  getFocusPosition,
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
  const { colors, logoUrl, tagline, ctaText, templateStyle, additionalImageUrl, designElements, logoSettings, photoTreatment, photoFocusPoint } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const justify = getVerticalJustify(logoSettings.position);
  const accentLine = designElements.accentLine;
  const fp = getFocusPosition(photoFocusPoint);

  // --- BUILDING SHOWCASE: photo hero with overlay ---
  if (templateStyle === "building-showcase" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: fp, position: "absolute" }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${colors.background}99 0%, ${colors.background}dd 55%, ${colors.background} 100%)` }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: 20, textAlign: "center", gap: 10 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={120} maxHeight={45} whiteContainer={wc} />}
          <TaglineText text={tagline} color={textColor} fontSize={16} maxWidth={250} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={12} padding="7px 22px" />
        </div>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // --- PEOPLE FIRST: framed photo with content ---
  if (templateStyle === "people-first" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 8, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={110} maxHeight={40} whiteContainer={wc} />}
          <PhotoImage src={additionalImageUrl} treatment={photoTreatment} width={photoTreatment === "circular" ? 90 : 160} height={photoTreatment === "circular" ? 90 : 80} fadeColor={colors.background} focusPoint={photoFocusPoint} />
          <TaglineText text={tagline} color={textColor} fontSize={13} maxWidth={240} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={11} padding="6px 18px" />
        </div>
      </div>
    );
  }

  // --- RICH & TRADITIONAL: dark bg, script tagline, accent line ---
  if (templateStyle === "rich-traditional") {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justify, padding: 24, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 12, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={140} maxHeight={55} whiteContainer={wc} />}
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <TaglineText text={tagline} color={textColor} fontSize={19} isScript maxWidth={250} lineHeight={1.35} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="10px 28px" />
        </div>
      </div>
    );
  }

  // --- CLEAN & MINIMAL (default): light feel, modern type ---
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justify, padding: 24, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 16, ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {logoUrl && <LogoImage src={logoUrl} maxWidth={140} maxHeight={55} whiteContainer={wc} />}
        <TaglineText text={tagline} color={textColor} fontSize={18} maxWidth={260} />
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="10px 28px" />
      </div>
    </div>
  );
}
