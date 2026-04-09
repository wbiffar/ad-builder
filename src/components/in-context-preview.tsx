"use client";

import React from "react";
import { AdConfig, AD_SIZES } from "@/lib/types";
import { AdRenderer } from "@/components/ad-canvas";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/*
 * Legacy Design System tokens used here (inline styles for isolation from app theme):
 *
 * surface/page:       gold/50    #fbf7ef
 * surface/card:       white      #ffffff
 * text/heading:       navy/700   #293548
 * text/secondary:     warmBlack/700  #514d45
 * text/muted:         warmBlack/400  #afadaa
 * border/default:     warmBlack/300  #dbdad7
 * accent/gold:        gold/500   #dcb05e
 * pill bg:            gold/100   #f6e5b8
 * pill text:          gold/900   #655b34
 * link:               navy/500   #42608f
 * nav bg:             navy/700   #293548
 */

const DS = {
  page: "#fbf7ef",
  card: "#ffffff",
  heading: "#293548",
  secondary: "#514d45",
  muted: "#afadaa",
  border: "#dbdad7",
  gold: "#dcb05e",
  goldLight: "#f6e5b8",
  goldDark: "#655b34",
  link: "#42608f",
  navBg: "#293548",
  text: "#262116",
} as const;

type InContextPreviewProps = {
  config: AdConfig;
  onClose: () => void;
};

/** Fake obituary card for the mockup. */
function ObituaryCard({
  name,
  years,
  description,
}: {
  name: string;
  years: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: DS.card,
        borderRadius: 8,
        border: `1px solid ${DS.border}`,
        padding: 24,
        display: "flex",
        gap: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: DS.heading,
            margin: 0,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {name}
        </h3>
        <p style={{ fontSize: 13, color: DS.gold, margin: "6px 0 0" }}>{years}</p>
        <p
          style={{
            fontSize: 13,
            color: DS.secondary,
            margin: "12px 0 0",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {["Tribute Page", "Guest Book", "Share Memory"].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${DS.border}`,
                color: DS.secondary,
                background: DS.card,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 8,
          flexShrink: 0,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${DS.border} 0%, ${DS.muted} 100%)`,
        }}
      />
    </div>
  );
}

/** Sidebar filter mockup */
function SidebarFilters() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Funeral Homes filter */}
      <div
        style={{
          background: DS.card,
          borderRadius: 8,
          border: `1px solid ${DS.border}`,
          padding: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 600, color: DS.heading, margin: 0 }}>
            Funeral Homes
          </h4>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke={DS.muted}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search for a Funeral Home"
            disabled
            style={{
              width: "100%",
              fontSize: 12,
              border: `1px solid ${DS.border}`,
              borderRadius: 6,
              padding: "7px 10px 7px 30px",
              color: DS.muted,
              background: DS.card,
              boxSizing: "border-box",
            }}
          />
          <svg
            width="14"
            height="14"
            fill="none"
            stroke={DS.muted}
            viewBox="0 0 24 24"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Active radio */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: DS.secondary }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `2px solid ${DS.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.gold }} />
            </div>
            All Funeral Homes
          </label>
          {["Funeral Homes .01", "Funeral Homes .02", "Funeral Homes .03", "Funeral Homes .04", "Funeral Homes .05"].map(
            (fh) => (
              <label
                key={fh}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: DS.secondary }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1px solid ${DS.border}`,
                  }}
                />
                {fh}
              </label>
            )
          )}
        </div>
        <button
          style={{
            fontSize: 12,
            color: DS.link,
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "default",
            padding: 0,
          }}
        >
          View more
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Layout toggle */}
      <div
        style={{
          background: DS.card,
          borderRadius: 8,
          border: `1px solid ${DS.border}`,
          padding: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 600, color: DS.heading, margin: 0 }}>Layout</h4>
          <svg width="16" height="16" fill="none" stroke={DS.muted} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <div
            style={{
              width: 40,
              height: 32,
              borderRadius: 4,
              border: `2px solid ${DS.gold}`,
              background: DS.goldLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" fill="none" stroke={DS.goldDark} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div
            style={{
              width: 40,
              height: 32,
              borderRadius: 4,
              border: `1px solid ${DS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" fill="none" stroke={DS.muted} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InContextPreview({ config, onClose }: InContextPreviewProps) {
  const leaderboardSize = AD_SIZES[2]; // 728x90
  const halfPageSize = AD_SIZES[0]; // 300x600

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 110 }}>
        <Button variant="secondary" size="sm" onClick={onClose} className="shadow-lg">
          <X className="w-4 h-4 mr-1" /> Close Preview
        </Button>
      </div>

      {/* Page mockup */}
      <div
        style={{
          margin: "32px 16px",
          background: DS.page,
          borderRadius: 12,
          overflow: "hidden",
          width: 1400,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Nav bar */}
        <div
          style={{
            background: DS.navBg,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Preview
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              width: 280,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search by Name
          </div>
        </div>

        {/* Page body */}
        <div style={{ display: "flex" }}>
          {/* Left sidebar — Filters */}
          <div style={{ width: 260, flexShrink: 0, padding: 20 }}>
            <SidebarFilters />
          </div>

          {/* Main content — Obituaries + Leaderboard ad */}
          <div style={{ flex: 1, padding: "20px 20px 20px 0", maxWidth: 800, display: "flex", flexDirection: "column", gap: 16 }}>
            <ObituaryCard
              name="Noah Johnson"
              years="1993 — 2025"
              description="Noah Johnson, 32, is an influential sculptor whose monumental works challenge perceptions of space and structure in urban environments."
            />

            {/* === LEADERBOARD AD IN CONTEXT === */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 10,
                    color: DS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 500,
                  }}
                >
                  Ad
                </div>
                <AdRenderer config={config} size={leaderboardSize} adRef={() => {}} />
              </div>
            </div>

            <ObituaryCard
              name="Olivia Smith"
              years="1991 — 2025"
              description="Olivia Smith, 34, is a pioneering fashion designer known for her sustainable practices and commitment to ethical production in the fashion industry."
            />

            <ObituaryCard
              name="Liam Taylor"
              years="1989 — 2025"
              description="Liam Taylor, 36, is an acclaimed marine biologist dedicated to ocean conservation and the study of deep-sea ecosystems around the world."
            />
          </div>

          {/* Right sidebar — Half Page ad */}
          <div style={{ width: 320, flexShrink: 0, padding: "20px 20px 20px 8px" }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  color: DS.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                Ad
              </div>
              <AdRenderer config={config} size={halfPageSize} adRef={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
