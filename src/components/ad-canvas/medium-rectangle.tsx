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
const HEIGHT = 250;

function getAlignSelf(alignment?: string) {
  if (alignment === "left") return "flex-start" as const;
  if (alignment === "right") return "flex-end" as const;
  return "center" as const;
}

export function MediumRectangle({ config, adRef }: AdTemplateProps) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, additionalImageUrl, designElements, logoSettings, photoTreatment, photoFocusPoint } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const ls = logoSettings.scale ?? 1;
  const placement = logoSettings.placement ?? "top";
  const logoAlign = getAlignSelf(logoSettings.alignment);
  const accentLine = designElements.accentLine;
  const fp = getFocusPosition(photoFocusPoint);
  const ts = getTaglineStyleProps(config.taglineStyle, config.taglineFont);

  const logoEl = logoUrl ? (
    <div style={{ alignSelf: logoAlign }}>
      <LogoImage src={logoUrl} maxWidth={140} maxHeight={55} whiteContainer={wc} scale={ls} />
    </div>
  ) : null;

  // --- BUILDING SHOWCASE: photo hero with overlay ---
  if (templateStyle === "building-showcase" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: fp, position: "absolute" }} crossOrigin="anonymous" />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${colors.background}99 0%, ${colors.background}dd 55%, ${colors.background} 100%)` }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: 20, textAlign: "center", gap: 10 }}>
          {placement === "top" && logoEl}
          <TaglineText text={tagline} color={textColor} fontSize={16} maxWidth={250} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={11} maxWidth={240} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={12} padding="7px 22px" />
          {placement === "bottom" && logoEl}
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
          {placement === "top" && logoEl}
          <PhotoImage src={additionalImageUrl} treatment={photoTreatment} width={photoTreatment === "circular" ? 90 : 160} height={photoTreatment === "circular" ? 90 : 80} fadeColor={colors.background} focusPoint={photoFocusPoint} />
          <TaglineText text={tagline} color={textColor} fontSize={13} maxWidth={240} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={10} maxWidth={230} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={11} padding="6px 18px" />
          {placement === "bottom" && logoEl}
        </div>
      </div>
    );
  }

  // --- RICH & TRADITIONAL: dark bg, script tagline, accent line ---
  if (templateStyle === "rich-traditional") {
    return (
      <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 12, ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {placement === "top" && logoEl}
          <AccentLineElement accentLine={accentLine} orientation="horizontal" />
          <TaglineText text={tagline} color={textColor} fontSize={19} isScript maxWidth={250} lineHeight={1.35} {...ts} />
          {placement === "middle" && logoEl}
          <DescriptionText text={config.description} color={textColor} fontSize={11} maxWidth={240} />
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="10px 28px" />
          {placement === "bottom" && logoEl}
        </div>
      </div>
    );
  }

  // --- CLEAN & MINIMAL (default): light feel, modern type ---
  return (
    <div ref={adRef} style={{ width: WIDTH, height: HEIGHT, background: bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "'Inter', 'DM Sans', sans-serif", gap: 16, ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={WIDTH} height={HEIGHT} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {placement === "top" && logoEl}
        <TaglineText text={tagline} color={textColor} fontSize={18} maxWidth={260} {...ts} />
        {placement === "middle" && logoEl}
        <DescriptionText text={config.description} color={textColor} fontSize={12} maxWidth={250} />
        <CtaButton text={ctaText} bgColor={colors.accent} fontSize={13} padding="10px 28px" />
        {placement === "bottom" && logoEl}
      </div>
    </div>
  );
}
