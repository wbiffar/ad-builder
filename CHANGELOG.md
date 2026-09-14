# Changelog

## v1.6.0 — September 11, 2026

### New Features

- **Description Font & Size** — The description field gains the same controls the tagline already had: a font picker, bold and italic toggles, and a size slider. The description used to render too small to read comfortably on the banner units with no way to correct it short of rewriting the copy shorter, which the ad team was already doing heavily for the leaderboards. Settings are per ad size like everything else in the form, so deselecting a size lets you treat it on its own — a size that works on the 300x600 doesn't force the same treatment on the leaderboard

  Raising the size can't break a layout. Each template carries a height budget for the description, and the copy scales down to stay inside it rather than spilling over: on Large Leaderboard (970x90) and Leaderboard (728x90) that budget is a single line, so the description grows to roughly 16px and holds there instead of wrapping into the tagline. The 70-character limit is unchanged, and so is the default styling — existing ads render exactly as before

### Improvements

- **Auto-Fit Accuracy** — Copy that auto-scales to fit a template (taglines, and now descriptions) is no longer rounded up to the next tenth of a pixel after the fitting measurement. Rounding up could hand back a size fractionally larger than the one that was measured as fitting, which at a wrap boundary was the difference between three lines and four. Fitted copy can now land up to 0.1px smaller than before — not perceptible, and always on the safe side
- **Font Metric Re-Measurement** — Auto-fitted copy re-measures once the selected web font actually finishes loading, not just once when the ad first renders. Picking a font mid-session previously left the fit calculated against the fallback font's metrics, which have different widths and could leave copy overflowing its template

## v1.5.0 — September 11, 2026

### New Features

- **Photo Placement** — The Building Showcase template gains a Left/Right photo placement control. Moving the photo to the right side lifts the funeral home logo off it — the logo always stays on the left of the ad — so a low-quality or awkwardly cropped partner logo no longer covers the photo the ad is built around. Applies to Large Leaderboard (970x90) and Leaderboard (728x90); every other size is unchanged, and Left is the default, so existing ads render exactly as before

## v1.4.1 — September 9, 2026

### Improvements

- **Project Name in Export Filenames** — Exported ads are now named `{project-name}-{width}x{height}.png` (e.g. `eternal-springs-funeral-home-300x600.png`) rather than by dimensions alone, so batches downloaded from different projects into one folder no longer collide. Applies to both individual PNG downloads and the zip export. Names are lowercased and hyphenated, with accents and `&` handled safely; a project with no name still exports under the dimensions-only name

## v1.4.0 — August 12, 2026

### New Features

- **Shared Folder** — Connect a local folder (such as a synced Google Drive folder) to save and load ad sets across the team, so saved ads are no longer trapped in one person's browser
- **Ad Picker** — The saved-ads sidebar list is replaced by a compact Current Ad card plus a searchable picker modal, with local and shared sets grouped separately, a "New blank ad" action, and inline delete. Unsaved edits prompt to save, discard, or cancel before switching ads
- **Tagline Line Breaks** — Insert line breaks in tagline copy, with the copy auto-scaling to fit each fixed-size template. Double breaks start a new paragraph, with a Paragraph spacing slider to tighten the gap. Capped at 5 lines / 120 characters with a live counter. Mobile Leaderboard collapses breaks to spaces
- **Logo Container Size** — A pixel-based Container size slider, shown when the white logo container toggle is on, controls the white padding around the logo. Corner radius is capped at the padding so rounded corners never clip the logo
- **Version Indicator** — The app version is shown in the header, and open tabs are prompted to refresh once a new build is deployed

### Improvements

- **Delete Confirmation** — Deleting an ad set now asks first, with a stronger warning for shared-folder sets making clear the file is removed for everyone on the team. Cancel is focused on open, so Enter and Escape both dismiss safely
- **Shared Folder Performance** — Fixes a freeze when the shared folder lived on Google Drive in "Stream" mode. Images are stored in a content-addressed `assets/` folder instead of being embedded in each ad set's JSON, which dedupes repeated images (like the same logo across sizes) and keeps files small. The folder also loads lazily: opening the app performs zero folder reads, listing never downloads image data, and a set's images are fetched only when that set is opened. Existing files still load and convert on their next save

### Removed

- Experimental Labs section — AI Inspiration Image, and the Shape, Icon, and Illustration design elements. Border and Gradient controls are unaffected, and saved ad sets still load

## v1.3.1 — April 29, 2026

### Improvements

- **Script Font Update** — Replaced Great Vibes with Courgette for a more readable, friendly script option
- **Character Limits** — Increased Tagline and Description max length from 60 to 70 characters

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
