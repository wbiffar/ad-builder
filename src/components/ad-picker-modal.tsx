"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SavedAdSet } from "@/lib/ad-storage";
import { Button } from "@/components/ui/button";
import { Cloud, HardDrive, Plus, Search, Trash2, X } from "lucide-react";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function AdRow({
  set,
  shared,
  isCurrent,
  onSelect,
  onDelete,
}: {
  set: SavedAdSet;
  shared: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex items-center justify-between gap-3 p-3 rounded-lg text-sm transition-colors cursor-pointer ${
        isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {shared ? (
          <Cloud className="size-4 text-primary flex-shrink-0" aria-label="Shared" />
        ) : (
          <HardDrive className="size-4 text-muted-foreground flex-shrink-0" aria-label="Local" />
        )}
        <div className="min-w-0">
          <div className="font-medium truncate">
            {set.name}
            {isCurrent && <span className="ml-2 text-[10px] text-primary font-normal">• open</span>}
          </div>
          <div className="text-[11px] text-muted-foreground">Updated {formatTimestamp(set.updatedAt)}</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-destructive p-1.5 flex-shrink-0"
        aria-label={`Delete ${set.name}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export type AdPickerModalProps = {
  localSets: SavedAdSet[];
  sharedSets: SavedAdSet[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function AdPickerModal({
  localSets,
  sharedSets,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: AdPickerModalProps) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A set present in the folder is shown only under "Shared" (it's the synced
  // source of truth); local-only sets show under "On this device".
  const { shared, local } = useMemo(() => {
    const sharedIds = new Set(sharedSets.map((s) => s.id));
    const q = query.trim().toLowerCase();
    const match = (s: SavedAdSet) => !q || s.name.toLowerCase().includes(q);
    const byUpdated = (a: SavedAdSet, b: SavedAdSet) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return {
      shared: sharedSets.filter(match).sort(byUpdated),
      local: localSets.filter((s) => !sharedIds.has(s.id)).filter(match).sort(byUpdated),
    };
  }, [localSets, sharedSets, query]);

  const isEmpty = shared.length === 0 && local.length === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 sm:pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card rounded-xl shadow-xl ring-1 ring-border/50 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Open ad"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Open Ad</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ads by name…"
              className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2 space-y-1">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2.5 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
          >
            <span className="size-4 flex items-center justify-center text-primary flex-shrink-0">
              <Plus className="size-4" />
            </span>
            New blank ad
          </button>

          {shared.length > 0 && (
            <div className="pt-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Shared folder
              </div>
              {shared.map((set) => (
                <AdRow
                  key={set.id}
                  set={set}
                  shared
                  isCurrent={set.id === currentId}
                  onSelect={() => onSelect(set.id)}
                  onDelete={() => onDelete(set.id)}
                />
              ))}
            </div>
          )}

          {local.length > 0 && (
            <div className="pt-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                On this device
              </div>
              {local.map((set) => (
                <AdRow
                  key={set.id}
                  set={set}
                  shared={false}
                  isCurrent={set.id === currentId}
                  onSelect={() => onSelect(set.id)}
                  onDelete={() => onDelete(set.id)}
                />
              ))}
            </div>
          )}

          {isEmpty && (
            <p className="text-center text-xs text-muted-foreground py-8">
              {query ? "No ads match your search." : "No saved ads yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export type UnsavedChangesDialogProps = {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export function UnsavedChangesDialog({ onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-card rounded-xl shadow-xl ring-1 ring-border/50 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="Unsaved changes"
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Unsaved changes</h2>
          <p className="text-xs text-muted-foreground">
            You have unsaved changes to this ad. Save them before continuing, or discard them.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={onSave}>
            Save &amp; continue
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onDiscard}>
              Discard
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
