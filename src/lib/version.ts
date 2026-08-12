// Human-readable release version, shown in the app header. Bump on each release.
export const APP_VERSION = "1.4.0";

// Per-deployment build id — the git commit sha on Vercel, or "dev" locally —
// injected via next.config's `env`. The client compares the build it loaded with
// against what /api/version reports to detect a newer deployment.
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
