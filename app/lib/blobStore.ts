import { randomBytes } from "crypto";

type Entry = { bytes: Buffer; type: string; at: number };

/**
 * Short-lived, in-memory home for uploaded images.
 *
 * Zenserp's reverse image search fetches the image itself, so a photo pasted in
 * by hand has to be reachable over HTTP for the length of one search. Nothing is written to
 * disk, ids are unguessable, and entries evict themselves — this is a holding
 * area for a single lookup, not storage.
 */
const TTL_MS = 10 * 60_000;
const MAX_ENTRIES = 40;

const store = new Map<string, Entry>();

function sweep() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, e] of store) if (e.at < cutoff) store.delete(id);
  // Hard ceiling so a burst of uploads can't grow memory without bound.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (!oldest) break;
    store.delete(oldest);
  }
}

export function putBlob(bytes: Buffer, type: string): string {
  sweep();
  const id = randomBytes(16).toString("hex");
  store.set(id, { bytes, type: type || "application/octet-stream", at: Date.now() });
  return id;
}

export function getBlob(id: string): Entry | null {
  sweep();
  return store.get(id) ?? null;
}

export const BLOB_TTL_MS = TTL_MS;
