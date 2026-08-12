import { APP_VERSION, BUILD_ID } from "@/lib/version";

// Served fresh on every request: an already-loaded (possibly stale) client polls
// this to learn the currently deployed build id. Once a new deployment is live,
// this route — running from that new deployment — returns its id, so older tabs
// see the mismatch and can prompt a refresh.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { buildId: BUILD_ID, version: APP_VERSION },
    { headers: { "Cache-Control": "no-store" } }
  );
}
