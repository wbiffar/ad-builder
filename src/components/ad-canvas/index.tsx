"use client";

import React from "react";
import { AdConfig, AdSize, AD_SIZES } from "@/lib/types";
import { HalfPage } from "./half-page";
import { Leaderboard, LargeLeaderboard } from "./leaderboard";
import { MediumRectangle } from "./medium-rectangle";
import { MobileLeaderboard } from "./mobile-leaderboard";

export type AdRendererProps = {
  config: AdConfig;
  size: AdSize;
  adRef?: React.Ref<HTMLDivElement>;
};

/**
 * Renders the correct ad template for a given size.
 */
export function AdRenderer({ config, size, adRef }: AdRendererProps) {
  switch (size.name) {
    case "half-page":
      return <HalfPage config={config} adRef={adRef} />;
    case "large-leaderboard":
      return <LargeLeaderboard config={config} adRef={adRef} />;
    case "leaderboard":
      return <Leaderboard config={config} adRef={adRef} />;
    case "medium-rectangle":
      return <MediumRectangle config={config} adRef={adRef} />;
    case "mobile-leaderboard":
      return <MobileLeaderboard config={config} adRef={adRef} />;
    default:
      return null;
  }
}

export { AD_SIZES };
