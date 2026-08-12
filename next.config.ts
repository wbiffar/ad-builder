import type { NextConfig } from "next";

// A per-deployment build id, surfaced to the client so it can detect when a
// newer build has been deployed and prompt a refresh. On Vercel this is the git
// commit sha; locally it stays "dev" so the update prompt never fires in dev.
const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  "dev";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
};

export default nextConfig;
