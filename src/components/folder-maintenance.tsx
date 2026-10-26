"use client";

import { useState } from "react";
import { compactFolder, type CompactProgress, type CompactResult } from "@/lib/shared-folder-storage";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * One-off maintenance for the shared folder, shown only with ?maintenance in
 * the URL. Step 1 counts ad sets still saved in the pre-August format (images
 * inlined in the JSON); step 2 converts them. Both read every file in full, so
 * this must be run from a machine with Google Drive in Mirror mode.
 */
export function FolderMaintenance({
  handle,
  onMigrated,
}: {
  handle: FileSystemDirectoryHandle;
  onMigrated: () => void;
}) {
  const [busy, setBusy] = useState<"scan" | "convert" | null>(null);
  const [progress, setProgress] = useState<CompactProgress | null>(null);
  const [scan, setScan] = useState<CompactResult | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    setBusy(dryRun ? "scan" : "convert");
    setProgress(null);
    setNote(null);
    try {
      const result = await compactFolder(handle, setProgress, { dryRun });
      if (dryRun) {
        setScan(result);
      } else {
        setScan(null);
        setNote(
          `Converted ${result.migrated} of ${result.legacy} old-format ad set${result.legacy === 1 ? "" : "s"}` +
            (result.failed ? ` (${result.failed} failed — see console).` : ".")
        );
        onMigrated();
      }
    } catch (err) {
      console.error("Folder maintenance failed", err);
      setNote("Folder maintenance failed — see console.");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const progressLabel = progress && progress.total > 0 ? ` ${progress.done}/${progress.total}` : "";

  return (
    <div className="space-y-1.5 rounded-md border border-dashed border-border p-2">
      <p className="text-[11px] font-medium">Folder maintenance</p>
      <p className="text-[11px] text-muted-foreground">
        Reads every file in the folder. Run only with Google Drive in Mirror mode.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-[11px] h-7"
        onClick={() => run(true)}
        disabled={busy !== null}
      >
        <RefreshCw className={`size-3 mr-1.5 ${busy === "scan" ? "animate-spin" : ""}`} />
        {busy === "scan" ? `Checking${progressLabel}…` : "Check for old-format ads"}
      </Button>
      {scan && (
        <p className="text-[11px] text-muted-foreground">
          {scan.legacy === 0
            ? `All ${scan.total} ad sets are in the current format.`
            : `${scan.legacy} of ${scan.total} ad sets are in the old format (${formatMB(scan.legacyBytes)}).`}
        </p>
      )}
      {scan && scan.legacy > 0 && (
        <Button
          size="sm"
          className="w-full text-[11px] h-7"
          onClick={() => run(false)}
          disabled={busy !== null}
        >
          <RefreshCw className={`size-3 mr-1.5 ${busy === "convert" ? "animate-spin" : ""}`} />
          {busy === "convert" ? `Converting${progressLabel}…` : `Convert ${scan.legacy} ad set${scan.legacy === 1 ? "" : "s"}`}
        </Button>
      )}
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
