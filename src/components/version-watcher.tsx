"use client";

import { useCallback, useEffect, useState } from "react";
import { BUILD_ID } from "@/lib/version";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// How often to re-check for a newer deployment while the tab stays open.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Watches for a newer deployment. The client knows the build it loaded with
 * (BUILD_ID, baked in at build time); it polls /api/version, which reports the
 * currently deployed build id. A mismatch means a newer build shipped while this
 * tab was open, so we surface a refresh prompt. No-ops in local dev.
 */
export function VersionWatcher() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const check = useCallback(async () => {
    if (BUILD_ID === "dev" || updateAvailable) return;
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { buildId?: string };
      if (data.buildId && data.buildId !== BUILD_ID) setUpdateAvailable(true);
    } catch {
      // Offline or transient network error — ignore and try again next tick.
    }
  }, [updateAvailable]);

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(check, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [check]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-xs text-primary-foreground shadow-lg ring-1 ring-black/10">
      <span>A new version of Ad Creator is available.</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 text-[11px]"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="size-3 mr-1.5" /> Refresh
      </Button>
    </div>
  );
}
