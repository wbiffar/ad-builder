"use client";

import React from "react";
import { AdConfig, DesignElements, PhotoTreatment, AccentLine } from "@/lib/types";
import { getContrastColor } from "@/lib/color-utils";
import { getIconById, getIllustrationById } from "@/lib/design-assets";

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
export function LogoImage({
  src,
  maxWidth,
  maxHeight,
  whiteContainer = false,
}: {
  src: string;
  maxWidth: number;
  maxHeight: number;
  whiteContainer?: boolean;
}) {
  const img = (
    <img
      src={src}
      alt="Logo"
      style={{
        maxWidth: whiteContainer ? maxWidth - 16 : maxWidth,
        maxHeight: whiteContainer ? maxHeight - 12 : maxHeight,
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
          borderRadius: 6,
          padding: "6px 8px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth,
          maxHeight,
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
 * Renders design element overlays (icons, illustrations, shapes).
 */
export function DesignElementOverlay({
  elements,
  width,
  height,
}: {
  elements: DesignElements;
  width: number;
  height: number;
}) {
  const layers: React.ReactElement[] = [];

  // Shape layer
  if (elements.shape.enabled) {
    const shapeStyle: React.CSSProperties = {
      position: "absolute",
      opacity: elements.shape.opacity,
      zIndex: 1,
    };

    if (elements.shape.type === "line") {
      const isHorizontal = elements.shape.position === "top" || elements.shape.position === "bottom";
      Object.assign(shapeStyle, {
        backgroundColor: elements.shape.color,
        ...(isHorizontal
          ? { height: 2, width: "80%", left: "10%" }
          : { width: 2, height: "60%", top: "20%" }),
        ...(elements.shape.position === "top" && { top: "8%" }),
        ...(elements.shape.position === "bottom" && { bottom: "8%" }),
        ...(elements.shape.position === "left" && { left: "5%" }),
        ...(elements.shape.position === "right" && { right: "5%" }),
      });
    } else if (elements.shape.type === "circle") {
      const circleSize = Math.min(width, height) * 0.3;
      Object.assign(shapeStyle, {
        width: circleSize,
        height: circleSize,
        borderRadius: "50%",
        border: `1px solid ${elements.shape.color}`,
        ...(elements.shape.position === "center" && { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }),
        ...(elements.shape.position === "top" && { top: "5%", left: "50%", transform: "translateX(-50%)" }),
        ...(elements.shape.position === "bottom" && { bottom: "5%", left: "50%", transform: "translateX(-50%)" }),
      });
    } else if (elements.shape.type === "rectangle") {
      Object.assign(shapeStyle, {
        width: "90%",
        height: "85%",
        top: "7.5%",
        left: "5%",
        border: `1px solid ${elements.shape.color}`,
        borderRadius: 2,
      });
    }

    layers.push(<div key="shape" style={shapeStyle} />);
  }

  // Icon layer
  if (elements.icon.enabled) {
    const icon = getIconById(elements.icon.id);
    if (icon) {
      const positionStyles: React.CSSProperties = {
        position: "absolute",
        zIndex: 2,
        opacity: elements.icon.opacity,
      };

      const offset = "6%";
      switch (elements.icon.position) {
        case "top-left": Object.assign(positionStyles, { top: offset, left: offset }); break;
        case "top-right": Object.assign(positionStyles, { top: offset, right: offset }); break;
        case "bottom-left": Object.assign(positionStyles, { bottom: offset, left: offset }); break;
        case "bottom-right": Object.assign(positionStyles, { bottom: offset, right: offset }); break;
        case "center": Object.assign(positionStyles, { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); break;
      }

      layers.push(
        <div key="icon" style={positionStyles}>
          {icon.svg(elements.icon.color, elements.icon.size)}
        </div>
      );
    }
  }

  // Illustration layer
  if (elements.illustration.enabled) {
    const illustration = getIllustrationById(elements.illustration.id);
    if (illustration) {
      const illStyles: React.CSSProperties = {
        position: "absolute",
        zIndex: 1,
        opacity: elements.illustration.opacity,
        transform: `scale(${elements.illustration.scale})`,
        transformOrigin: elements.illustration.position.replace("-", " "),
      };

      switch (elements.illustration.position) {
        case "top-left": Object.assign(illStyles, { top: 0, left: 0 }); break;
        case "top-right": Object.assign(illStyles, { top: 0, right: 0 }); break;
        case "bottom-left": Object.assign(illStyles, { bottom: 0, left: 0 }); break;
        case "bottom-right": Object.assign(illStyles, { bottom: 0, right: 0 }); break;
        case "background": Object.assign(illStyles, { top: "50%", left: "50%", transform: `translate(-50%, -50%) scale(${elements.illustration.scale})` }); break;
      }

      layers.push(
        <div key="illustration" style={illStyles}>
          {illustration.svg(elements.icon.color || "#ffffff")}
        </div>
      );
    }
  }

  return <>{layers}</>;
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
}: {
  src: string;
  treatment: PhotoTreatment;
  width: number | string;
  height: number | string;
  fadeColor?: string;
  className?: string;
}) {
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        crossOrigin="anonymous"
      />
    </div>
  );
}

/**
 * Tagline text component — uses script font for "rich-traditional" style.
 */
export function TaglineText({
  text,
  color,
  fontSize,
  isScript = false,
  maxWidth,
  lineHeight = 1.3,
  style,
}: {
  text: string;
  color: string;
  fontSize: number;
  isScript?: boolean;
  maxWidth?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight: isScript ? 400 : 600,
        fontFamily: isScript
          ? "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif"
          : "'Inter', 'DM Sans', sans-serif",
        fontStyle: isScript ? "italic" : "normal",
        lineHeight,
        maxWidth,
        textAlign: "center",
        ...style,
      }}
    >
      {text}
    </div>
  );
}
