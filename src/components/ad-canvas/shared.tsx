"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AdConfig, DesignElements, PhotoTreatment, PhotoFocusPoint, AccentLine, TaglineStyle, DEFAULT_TAGLINE_STYLE } from "@/lib/types";
import { getFontFallback } from "@/lib/fonts";
import { getContrastColor } from "@/lib/color-utils";

/** Returns a CSS object-position value from a focus point. */
export function getFocusPosition(fp?: PhotoFocusPoint): string {
  return fp ? `${fp.x}% ${fp.y}%` : "center";
}

/** Returns TaglineText style override props from a TaglineStyle config + font. */
export function getTaglineStyleProps(ts?: TaglineStyle, taglineFont?: string) {
  const s = ts ?? DEFAULT_TAGLINE_STYLE;
  return {
    fontWeightOverride: s.fontWeight,
    fontStyleOverride: s.fontStyle,
    fontSizeScale: s.fontSizeScale,
    paragraphScale: s.paragraphScale,
    fontFamily: taglineFont ? getFontFallback(taglineFont) : undefined,
  };
}

export type AdTemplateProps = {
  config: AdConfig;
  adRef?: React.Ref<HTMLDivElement>;
};

/**
 * Renders the CTA button for an ad.
 */
export function CtaButton({
  text,
  bgColor,
  textColor,
  fontSize = 14,
  padding = "8px 20px",
}: {
  text: string;
  bgColor: string;
  textColor?: string;
  fontSize?: number;
  padding?: string;
}) {
  const color = textColor || getContrastColor(bgColor);
  return (
    <div
      style={{
        backgroundColor: bgColor,
        color,
        fontSize,
        fontWeight: 700,
        fontFamily: "'Inter', 'DM Sans', sans-serif",
        padding,
        borderRadius: 4,
        textAlign: "center",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {text}
    </div>
  );
}

/**
 * Renders the logo image, optionally inside a white container.
 */
// Minimum white-container padding in px.
const LOGO_CONTAINER_MIN_PAD = 1;
// Corner radius of the white container, capped at the padding so the rounded
// corner never cuts inside the logo's square corners.
const LOGO_CONTAINER_RADIUS = 6;

export function LogoImage({
  src,
  maxWidth,
  maxHeight,
  whiteContainer = false,
  scale = 1,
  containerPadding = LOGO_CONTAINER_MIN_PAD,
}: {
  src: string;
  maxWidth: number;
  maxHeight: number;
  whiteContainer?: boolean;
  scale?: number;
  containerPadding?: number;
}) {
  const scaledMaxW = maxWidth * scale;
  const scaledMaxH = maxHeight * scale;
  const pad = Math.max(LOGO_CONTAINER_MIN_PAD, containerPadding);

  const img = (
    <img
      src={src}
      alt="Logo"
      style={{
        maxWidth: whiteContainer ? Math.max(0, scaledMaxW - pad * 2) : scaledMaxW,
        maxHeight: whiteContainer ? Math.max(0, scaledMaxH - pad * 2) : scaledMaxH,
        objectFit: "contain",
        display: "block",
      }}
      crossOrigin="anonymous"
    />
  );

  if (whiteContainer) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: Math.min(LOGO_CONTAINER_RADIUS, pad),
          padding: pad,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: scaledMaxW,
          maxHeight: scaledMaxH,
        }}
      >
        {img}
      </div>
    );
  }

  return img;
}

/**
 * Generates CSS for gradient background.
 */
export function getGradientCSS(elements: DesignElements, fallbackColor: string): string {
  if (elements.gradient.enabled) {
    const stops = elements.gradient.stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (elements.gradient.type === "linear") {
      return `linear-gradient(${elements.gradient.direction}deg, ${stops})`;
    }
    return `radial-gradient(circle, ${stops})`;
  }
  return fallbackColor;
}

/**
 * Get border styles from design elements.
 */
export function getBorderStyles(elements: DesignElements): React.CSSProperties {
  if (!elements.border.enabled) return {};
  return {
    border: `${elements.border.width}px ${elements.border.style} ${elements.border.color}`,
    borderRadius: elements.border.radius,
  };
}

/**
 * Renders an accent/divider line.
 */
export function AccentLineElement({
  accentLine,
  orientation: overrideOrientation,
}: {
  accentLine: AccentLine;
  orientation?: "horizontal" | "vertical";
}) {
  if (!accentLine.enabled) return null;
  const dir = overrideOrientation || accentLine.orientation;
  const isHorizontal = dir === "horizontal";

  return (
    <div
      style={{
        width: isHorizontal ? "80%" : accentLine.width,
        height: isHorizontal ? accentLine.width : "60%",
        backgroundColor: accentLine.color,
        alignSelf: "center",
        flexShrink: 0,
        borderStyle: accentLine.style === "solid" ? undefined : accentLine.style,
        borderWidth: accentLine.style !== "solid" ? accentLine.width : undefined,
        borderColor: accentLine.style !== "solid" ? accentLine.color : undefined,
      }}
    />
  );
}

/**
 * Renders a photo with the specified treatment (rectangular, circular, fade).
 */
export function PhotoImage({
  src,
  treatment,
  width,
  height,
  fadeColor,
  className,
  focusPoint,
}: {
  src: string;
  treatment: PhotoTreatment;
  width: number | string;
  height: number | string;
  fadeColor?: string;
  className?: string;
  focusPoint?: { x: number; y: number };
}) {
  const objectPosition = focusPoint ? `${focusPoint.x}% ${focusPoint.y}%` : "center";

  if (treatment === "circular") {
    const size = typeof width === "number" && typeof height === "number"
      ? Math.min(width, height)
      : typeof width === "number" ? width : 150;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          border: "3px solid rgba(255,255,255,0.3)",
        }}
      >
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition }}
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  if (treatment === "fade") {
    const bg = fadeColor || "#ffffff";
    return (
      <div style={{ position: "relative", width, height, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition }}
          crossOrigin="anonymous"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, transparent 30%, ${bg} 100%)`,
          }}
        />
      </div>
    );
  }

  // Default: rectangular
  return (
    <div style={{ width, height, overflow: "hidden", flexShrink: 0 }}>
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition }}
        crossOrigin="anonymous"
      />
    </div>
  );
}

/**
 * Per-template copy-area budget for tagline auto-fit (DES-2209).
 *
 * `maxHeight` is the vertical space the tagline may occupy before it must
 * scale down; `minFontSize` is the readability floor for that template. These
 * are tuned for the dominant centered layouts — photo templates give the
 * tagline a smaller band, but there a taller tagline shrinks the flexible
 * photo area rather than overflowing the fixed frame.
 */
export type TaglineFit = { maxHeight: number; minFontSize: number };

export const TAGLINE_FIT: Record<string, TaglineFit> = {
  "half-page": { maxHeight: 240, minFontSize: 13 },
  "medium-rectangle": { maxHeight: 104, minFontSize: 11 },
  leaderboard: { maxHeight: 56, minFontSize: 10 },
  "large-leaderboard": { maxHeight: 56, minFontSize: 10 },
};

/** Splits tagline copy into paragraphs on blank lines (a double line break). */
const PARAGRAPH_SPLIT = /\n{2,}/;

/**
 * Renders text and shrinks its font size (down to `minFontSize`) until the
 * content fits within `maxHeight`. The fit is found by an imperative binary
 * search against the real DOM inside a layout effect — no per-step re-render —
 * so the same logic drives the on-screen preview and the html-to-image export.
 * When even the floor overflows, the copy is clamped so it can never spill past
 * the fixed template bounds.
 *
 * A double line break starts a new paragraph; the gap between paragraphs is
 * `lineHeight * paragraphScale` (in `em`, so it scales with the fitted font
 * size). At `paragraphScale` 1 that matches a natural blank line — the max —
 * and lower values tighten it.
 */
function FitText({
  text,
  color,
  maxFontSize,
  minFontSize,
  maxHeight,
  lineHeight,
  paragraphScale,
  fontWeight,
  fontStyle,
  fontFamily,
  maxWidth,
  style,
}: {
  text: string;
  color: string;
  maxFontSize: number;
  minFontSize: number;
  maxHeight: number;
  lineHeight: number;
  paragraphScale: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  fontFamily: string;
  maxWidth?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fitted, setFitted] = useState<{ fontSize: number; clamped: boolean }>({
    fontSize: maxFontSize,
    clamped: false,
  });
  // Web fonts load asynchronously and have different metrics than the fallback,
  // so re-measure once they're ready.
  const [fontNonce, setFontNonce] = useState(0);

  const paragraphs = useMemo(() => text.split(PARAGRAPH_SPLIT), [text]);
  const multi = paragraphs.length > 1;
  // em so the gap scales with font size during the imperative measurement below.
  const paragraphGap = `${lineHeight * paragraphScale}em`;

  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) return;
    let active = true;
    fonts.ready.then(() => {
      if (active) setFontNonce((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Neutralize any committed clamp so scrollHeight reflects the full,
    // unclamped content while we measure. Keep flex layout for multi-paragraph
    // copy so the em paragraph gaps still apply.
    const saved = {
      fontSize: el.style.fontSize,
      display: el.style.display,
      clamp: el.style.webkitLineClamp,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
    };
    el.style.display = multi ? "flex" : "block";
    el.style.webkitLineClamp = "";
    el.style.overflow = "visible";
    el.style.maxHeight = "";

    const fits = (fs: number) => {
      el.style.fontSize = `${fs}px`;
      return el.scrollHeight <= maxHeight + 0.5;
    };

    let best = minFontSize;
    if (fits(maxFontSize)) {
      best = maxFontSize;
    } else {
      let lo = minFontSize;
      let hi = maxFontSize;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
    }
    const clamped = !fits(minFontSize);

    // Restore inline styles; React re-applies the style object on the
    // synchronous re-render below (before paint), so there's no flash.
    el.style.fontSize = saved.fontSize;
    el.style.display = saved.display;
    el.style.webkitLineClamp = saved.clamp;
    el.style.overflow = saved.overflow;
    el.style.maxHeight = saved.maxHeight;

    setFitted({ fontSize: Math.round(best * 10) / 10, clamped });
  }, [text, maxFontSize, minFontSize, maxHeight, lineHeight, paragraphScale, multi, fontWeight, fontStyle, fontFamily, maxWidth, fontNonce]);

  const clampLines = Math.max(1, Math.floor(maxHeight / (minFontSize * lineHeight)));

  return (
    <div
      ref={ref}
      style={{
        color,
        fontSize: fitted.fontSize,
        fontWeight,
        fontFamily,
        fontStyle,
        lineHeight,
        maxWidth,
        textAlign: "center",
        overflowWrap: "break-word",
        ...(multi
          ? { display: "flex", flexDirection: "column", gap: paragraphGap }
          : { whiteSpace: "pre-line" }),
        ...(fitted.clamped
          ? multi
            ? { maxHeight, overflow: "hidden" }
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: clampLines,
                overflow: "hidden",
              }
          : null),
        ...style,
      }}
    >
      {multi
        ? paragraphs.map((p, i) => (
            <div key={i} style={{ whiteSpace: "pre-line" }}>
              {p}
            </div>
          ))
        : text}
    </div>
  );
}

/**
 * Tagline text component — uses script font for "rich-traditional" style.
 * Honors literal line breaks (`\n`) via `white-space: pre-line`. When a `fit`
 * budget is supplied, the font auto-scales to stay within the template's copy
 * area (see {@link FitText}); the supplied `fontSize` (times any manual
 * `fontSizeScale`) is treated as the target/maximum size.
 */
export function TaglineText({
  text,
  color,
  fontSize,
  isScript = false,
  maxWidth,
  lineHeight = 1.3,
  style,
  fontWeightOverride,
  fontStyleOverride,
  fontSizeScale,
  paragraphScale,
  fontFamily,
  fit,
}: {
  text: string;
  color: string;
  fontSize: number;
  isScript?: boolean;
  maxWidth?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
  fontWeightOverride?: number;
  fontStyleOverride?: "normal" | "italic";
  fontSizeScale?: number;
  paragraphScale?: number;
  fontFamily?: string;
  fit?: TaglineFit;
}) {
  const defaultWeight = isScript ? 400 : 600;
  const defaultStyle = isScript ? "italic" : "normal";
  const defaultFamily = isScript
    ? "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif"
    : "'Inter', 'DM Sans', sans-serif";

  const resolvedWeight = fontWeightOverride ?? defaultWeight;
  const resolvedStyle = fontStyleOverride ?? defaultStyle;
  const resolvedFamily = fontFamily ?? defaultFamily;
  const maxFontSize = fontSize * (fontSizeScale ?? 1);
  const resolvedParagraphScale = paragraphScale ?? 1;

  if (fit) {
    return (
      <FitText
        text={text}
        color={color}
        maxFontSize={maxFontSize}
        // Never let the floor exceed the user's chosen size.
        minFontSize={Math.min(fit.minFontSize, maxFontSize)}
        maxHeight={fit.maxHeight}
        lineHeight={lineHeight}
        paragraphScale={resolvedParagraphScale}
        fontWeight={resolvedWeight}
        fontStyle={resolvedStyle}
        fontFamily={resolvedFamily}
        maxWidth={maxWidth}
        style={style}
      />
    );
  }

  const paragraphs = text.split(PARAGRAPH_SPLIT);
  const multi = paragraphs.length > 1;

  return (
    <div
      style={{
        color,
        fontSize: maxFontSize,
        fontWeight: resolvedWeight,
        fontFamily: resolvedFamily,
        fontStyle: resolvedStyle,
        lineHeight,
        maxWidth,
        textAlign: "center",
        overflowWrap: "break-word",
        ...(multi
          ? { display: "flex", flexDirection: "column", gap: `${lineHeight * resolvedParagraphScale}em` }
          : { whiteSpace: "pre-line" }),
        ...style,
      }}
    >
      {multi
        ? paragraphs.map((p, i) => (
            <div key={i} style={{ whiteSpace: "pre-line" }}>
              {p}
            </div>
          ))
        : text}
    </div>
  );
}

/**
 * Description text — lighter weight, smaller than tagline. Returns null if text is empty.
 */
export function DescriptionText({
  text,
  color,
  fontSize,
  maxWidth,
  fontFamily,
  style,
}: {
  text: string;
  color: string;
  fontSize: number;
  maxWidth?: number;
  fontFamily?: string;
  style?: React.CSSProperties;
}) {
  if (!text) return null;
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight: 400,
        fontFamily: fontFamily ?? "'Inter', 'DM Sans', sans-serif",
        lineHeight: 1.4,
        maxWidth,
        textAlign: "center",
        opacity: 0.85,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
