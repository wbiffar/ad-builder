"use client";

import React from "react";
import {
  AdTemplateProps,
  CtaButton,
  LogoImage,
  TaglineText,
  DescriptionText,
  PhotoImage,
  AccentLineElement,
  getFocusPosition,
  getTaglineStyleProps,
  getGradientCSS,
  getBorderStyles,
  DesignElementOverlay,
} from "./shared";
import { getContrastColor } from "@/lib/color-utils";

export function LeaderboardTemplate({
  config,
  adRef,
  width,
  height,
}: AdTemplateProps & { width: number; height: number }) {
  const { colors, logoUrl, tagline, ctaText, templateStyle, additionalImageUrl, designElements, logoSettings, photoTreatment, photoFocusPoint } = config;
  const bg = getGradientCSS(designElements, colors.background);
  const textColor = colors.text || getContrastColor(colors.background);
  const borderStyles = getBorderStyles(designElements);
  const wc = logoSettings.whiteContainer;
  const ls = logoSettings.scale ?? 1;
  const placement = logoSettings.placement ?? "top";
  const accentLine = designElements.accentLine;
  const fp = getFocusPosition(photoFocusPoint);
  const ts = getTaglineStyleProps(config.taglineStyle, config.taglineFont);

  const isLarge = width >= 970;
  const logoMaxW = isLarge ? 120 : 100;
  const logoMaxH = isLarge ? 55 : 50;
  const tagFontSize = isLarge ? 17 : 15;
  const descFontSize = isLarge ? 12 : 11;
  const ctaFontSize = isLarge ? 13 : 12;

  // For horizontal ads: top/middle = logo on left, bottom = logo on right
  const logoOrder = placement === "bottom" ? 2 : 0;
  const ctaOrder = placement === "bottom" ? 0 : 2;

  const logoEl = logoUrl ? <LogoImage src={logoUrl} maxWidth={logoMaxW} maxHeight={logoMaxH} whiteContainer={wc} scale={ls} /> : null;

  // --- BUILDING SHOWCASE: photo on left, content on right ---
  if (templateStyle === "building-showcase" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width, height, position: "relative", overflow: "hidden", display: "flex", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <div style={{ width: "35%", height: "100%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: fp }} crossOrigin="anonymous" />
          {logoUrl && (
            <div style={{ position: "absolute", bottom: 6, left: 6, zIndex: 2 }}>
              <LogoImage src={logoUrl} maxWidth={isLarge ? 100 : 80} maxHeight={isLarge ? 40 : 35} whiteContainer scale={ls} />
            </div>
          )}
        </div>
        {accentLine.enabled && (
          <div style={{ width: accentLine.width, height: "100%", backgroundColor: accentLine.color, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <TaglineText text={tagline} color={textColor} fontSize={tagFontSize} style={{ textAlign: "center" }} {...ts} />
            <DescriptionText text={config.description} color={textColor} fontSize={descFontSize} style={{ textAlign: "center" }} />
          </div>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" />
        </div>
        <DesignElementOverlay elements={designElements} width={width} height={height} />
      </div>
    );
  }

  // --- PEOPLE FIRST: photo accent with content ---
  if (templateStyle === "people-first" && additionalImageUrl) {
    return (
      <div ref={adRef} style={{ width, height, position: "relative", overflow: "hidden", display: "flex", fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <div style={{ flex: 1, background: bg, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
          <div style={{ order: logoOrder, flexShrink: 0 }}>{logoEl}</div>
          <div style={{ overflow: "hidden", flexShrink: 0, borderRadius: photoTreatment === "circular" ? "50%" : 0, width: height - 16, height: height - 16 }}>
            <img src={additionalImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: fp }} crossOrigin="anonymous" />
          </div>
          {accentLine.enabled && (
            <div style={{ width: accentLine.width, height: "60%", backgroundColor: accentLine.color, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, order: 1 }}>
            <TaglineText text={tagline} color={textColor} fontSize={tagFontSize} style={{ textAlign: "center" }} {...ts} />
            <DescriptionText text={config.description} color={textColor} fontSize={descFontSize} style={{ textAlign: "center" }} />
          </div>
          <div style={{ order: ctaOrder, flexShrink: 0 }}>
            <CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" />
          </div>
        </div>
        <DesignElementOverlay elements={designElements} width={width} height={height} />
      </div>
    );
  }

  // --- RICH & TRADITIONAL: dark bg, script tagline, vertical accent ---
  if (templateStyle === "rich-traditional") {
    return (
      <div ref={adRef} style={{ width, height, background: bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16, fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
        <DesignElementOverlay elements={designElements} width={width} height={height} />
        <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 16, width: "100%", justifyContent: "space-between" }}>
          <div style={{ order: logoOrder, flexShrink: 0 }}>{logoEl}</div>
          {accentLine.enabled && (
            <div style={{ width: accentLine.width, height: "60%", backgroundColor: accentLine.color, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, order: 1 }}>
            <TaglineText text={tagline} color={textColor} fontSize={tagFontSize} isScript style={{ textAlign: "center" }} lineHeight={1.2} {...ts} />
            <DescriptionText text={config.description} color={textColor} fontSize={descFontSize} style={{ textAlign: "center" }} />
          </div>
          <div style={{ order: ctaOrder, flexShrink: 0 }}>
            <CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" />
          </div>
        </div>
      </div>
    );
  }

  // --- CLEAN & MINIMAL (default): clean horizontal ---
  return (
    <div ref={adRef} style={{ width, height, background: bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 20, fontFamily: "'Inter', 'DM Sans', sans-serif", ...borderStyles }}>
      <DesignElementOverlay elements={designElements} width={width} height={height} />
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 20, width: "100%", justifyContent: "space-between" }}>
        <div style={{ order: logoOrder, flexShrink: 0 }}>{logoEl}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, order: 1 }}>
          <TaglineText text={tagline} color={textColor} fontSize={tagFontSize} style={{ textAlign: "center" }} {...ts} />
          <DescriptionText text={config.description} color={textColor} fontSize={descFontSize} style={{ textAlign: "center" }} />
        </div>
        <div style={{ order: ctaOrder, flexShrink: 0 }}>
          <CtaButton text={ctaText} bgColor={colors.accent} fontSize={ctaFontSize} padding="8px 18px" />
        </div>
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
