# Changelog

## v1.3.0 — April 10, 2026

### New Features

- **Tagline Font Controls** — Bold, italic, and font size scale (70%–150%) controls for the tagline text
- **Font Selection** — Choose from 9 fonts including sans-serif (DM Sans, Inter), serif (Playfair Display, Lora, Merriweather, Roboto Slab, Georgia), display (Oswald), and script (Great Vibes). Fonts load dynamically from Google Fonts
- **Description Text Field** — Add a secondary line of text (up to 60 characters) shown on all ad sizes except Mobile Leaderboard
- **Logo Placement** — Position the logo above the tagline, between the tagline and CTA, or below the CTA
- **Save & Load Ad Sets** — Save multiple versions of ad configurations with full persistence including logos and photos. Update existing saves or create new ones. Each save shows a date and time timestamp

### Improvements

- **IndexedDB Storage** — Switched from localStorage to IndexedDB for saved ad sets, removing the 5MB size limit and enabling image persistence
- **Sidebar Redesign** — Fixed sidebar pinned to the viewport with 16px offset from all edges. Each form section is now in its own card container for better visual separation
- **Scale Dropdown** — Replaced the scale toggle buttons with a compact dropdown
- **Compact Cards** — All form sections use the small card variant for tighter spacing

### Removed

- Save Brand feature (replaced by the more capable Save Ad Set system)
- Logo alignment controls (simplified to center-only)
