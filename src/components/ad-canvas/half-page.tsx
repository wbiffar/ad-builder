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
const HEIGHT = 600;

function getVerticalLayout(position: string) {
  switch (position) {
    case "top": return { justify: "flex-start" as const, logoOrder: 0, contentOrder: 1 };
    case "bottom": return { justify: "flex-end" as const, logoOrder: 2, contentOrder: 0 };
    default: return { justify: "center" as const, logoOrder: 0, contentOrder: 1 };
  }
}

export function HalfPage({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, additionalImageUrl, designElements, logoSettings, photoTreatment, photoFocusPoint } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const layout = getVerticalLayout(logoSettings.position);
  const accentLine = designElements.accentLine;

  // --- BUILDING SHOWCASE: large photo hero with content below ---
  if (templateStyle === "building-showcase" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", display: "flex", flexDirection: "column", ...borderStyles }}>
        {/* Logo + tagline area */}
        <div style={{ background: bg, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={160} maxHeight={70} whiteContainer={wc} />}
          <TaglineText text={tagline} color={textColor} fontSize={20} maxWidth={240} lineHeight={1.35} />
        </div>
        {/* Photo area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <PhotoImage src={additionalImageUrl} treatment={photoTreatment === "fade" ? "fade" : "rectangular"} width="100%" height="100%" fadeColor={colors.background} focusPoint={photoFocusPoint} />
        </div>
        {/* CTA area */}
        <div style={{ background: bg, padding: "16px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={15} padding="12px 32px" />
        </div>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      </div>
    );
  }

  // --- PEOPLE FIRST: centered framed photo with warm feel ---
  if (templateStyle === "people-first" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 16, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={160} maxHeight={70} whiteContainer={wc} />}
          <TaglineText text={tagline} color={textColor} fontSize={20} maxWidth={240} lineHeight={1.35} />
          <PhotoImage
            src={additionalImageUrl}
            treatment={photoTreatment}
            width={photoTreatment === "circular" ? 160 : 240}
            height={photoTreatment === "circular" ? 160 : 160}
            fadeColor={colors.background}
            focusPoint={photoFocusPoint}
          />
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={15} padding="12px 32px" />
        </div>
      </div>
    );
  }

  // --- RICH & TRADITIONAL: dark bg, script tagline, accent line, elegant spacing ---
  if (templateStyle === "rich-traditional") {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: layout.justify, padding: 36, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 24, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, order: layout.logoOrder }}>
          {logoUrl && <LogoImage src={logoUrl} maxWidth={180} maxHeight={100} whiteContainer={wc} />}
        </div>
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, order: layout.contentOrder }}>
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <TaglineText text={tagline} color={textColor} fontSize={26} isScript maxWidth={240} lineHeight={1.4} />
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={16} padding="14px 36px" />
        </div>
      </div>
    );
  }

  // --- CLEAN & MINIMAL (default): clean vertical stack ---
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: layout.justify, padding: 32, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 24, ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 32, order: layout.logoOrder }}>
        {logoUrl && <LogoImage src={logoUrl} maxWidth={180} maxHeight={100} whiteContainer={wc} />}
      </div>
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, order: layout.contentOrder }}>
        <TaglineText text={tagline} color={textColor} fontSize={24} maxWidth={240} lineHeight={1.35} />
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={16} padding="14px 36px" />
      </div>
    </div>
  );
}
