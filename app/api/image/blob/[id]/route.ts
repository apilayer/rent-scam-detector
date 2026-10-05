import { NextRequest } from "next/server";
import { BLOB_TTL_MS, getBlob } from "@/app/lib/blobStore";

export const dynamic = "force-dynamic";

/**
 * Serves an uploaded image for exactly as long as a reverse image search needs
 * it. Marked noindex so the temporary URL can't end up in a search index — this
 * is a privacy tool, and the image belongs to whoever uploaded it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = getBlob(id);

  if (!entry) {
    return new Response("Not found or expired.", { status: 404 });
  }

  return new Response(new Uint8Array(entry.bytes), {
    headers: {
      "content-type": entry.type,
      "content-length": String(entry.bytes.length),
      "cache-control": `private, max-age=${Math.floor(BLOB_TTL_MS / 1000)}`,
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}
