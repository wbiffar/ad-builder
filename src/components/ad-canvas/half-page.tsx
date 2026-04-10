"use client";

import React from "react";
import {
  AdTemplateProps,
  CtaButton,
  LogoImage,
  TaglineText,
  PhotoImage,
  DescriptionText,
  AccentLineElement,
  getFocusPosition,
  getTaglineStyleProps,
  getGradientCSS,
  getBorderStyles,
  DesignElementOverlay,
} from "./shared";
import { getContrastColor } from "@/lib/color-utils";

const WIDTH = 300;
const HEIGHT = 600;

function getAlignSelf(alignment?: string) {
  if (alignment === "left") return "flex-start" as const;
  if (alignment === "right") return "flex-end" as const;
  return "center" as const;
}

export function HalfPage({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, additionalImageUrl, designElements, logoSettings, photoTreatment, photoFocusPoint } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const ls = logoSettings.scale ?? 1;
  const placement = logoSettings.placement ?? "top";
  const logoAlign = getAlignSelf(logoSettings.alignment);
  const accentLine = designElements.accentLine;
  const ts = getTaglineStyleProps(config.taglineStyle, config.taglineFont);

  const logoEl = logoUrl ? (
    <div style={{ alignSelf: logoAlign }}>
      <LogoImage src={logoUrl} maxWidth={180} maxHeight={100} whiteContainer={wc} scale={ls} />
    </div>
  ) : null;

  // --- BUILDING SHOWCASE: large photo hero with content below ---
  if (templateStyle === "building-showcase" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", display: "flex", flexDirection: "column", ...borderStyles }}>
        <div style={{ background: bg, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
          {placement === "top" && logoEl}
          <TaglineText text={tagline} color={textColor} fontSize={20} maxWidth={240} lineHeight={1.35} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={14} maxWidth={230} />
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <PhotoImage src={additionalImageUrl} treatment={photoTreatment === "fade" ? "fade" : "rectangular"} width="100%" height="100%" fadeColor={colors.background} focusPoint={photoFocusPoint} />
        </div>
        <div style={{ background: bg, padding: "16px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={15} padding="12px 32px" />
          {placement === "bottom" && logoEl}
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
          {placement === "top" && logoEl}
          <TaglineText text={tagline} color={textColor} fontSize={20} maxWidth={240} lineHeight={1.35} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={14} maxWidth={230} />
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
          {placement === "bottom" && logoEl}
        </div>
      </div>
    );
  }

  // --- RICH & TRADITIONAL: dark bg, script tagline, accent line, elegant spacing ---
  if (templateStyle === "rich-traditional") {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 36, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 24, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {placement === "top" && logoEl}
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <TaglineText text={tagline} color={textColor} fontSize={26} isScript maxWidth={240} lineHeight={1.4} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={15} maxWidth={230} />
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={16} padding="14px 36px" />
          {placement === "bottom" && logoEl}
        </div>
      </div>
    );
  }

  // --- CLEAN & MINIMAL (default): clean vertical stack ---
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 24, ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        {placement === "top" && logoEl}
        <TaglineText text={tagline} color={textColor} fontSize={24} maxWidth={240} lineHeight={1.35} {...ts} />
        {placement === "middle" && logoEl}
        <DescriptionText text={config.description} color={textColor} fontSize={15} maxWidth={230} />
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={16} padding="14px 36px" />
        {placement === "bottom" && logoEl}
      </div>
    </div>
  );
}
