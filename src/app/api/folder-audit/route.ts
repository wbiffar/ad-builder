import { writeFile } from "fs/promises";

export const dynamic = "force-dynamic";

const OUT = "/tmp/ad-builder-folder-audit.json";

export async function POST(req: Request) {
  const body = await req.json();
  await writeFile(OUT, JSON.stringify(body, null, 2));
  console.log("FOLDER_AUDIT", {
    folderName: body.folderName,
    jsonCount: body.jsonCount,
    jsonBytes: body.jsonBytes,
    prefixBytes: body.prefixBytes,
    listingSavedPct: body.listingSavedPct,
    formatCounts: body.formatCounts,
  });
  return Response.json({ ok: true, wrote: OUT });
}
