import type { NextRequest } from "next/server";
import { BASE_PATH } from "./basePath";

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|.*\.local)$/i;

export type OriginInfo = {
  /** Scheme and host only, e.g. "https://ipstack.com". */
  origin: string;
  /**
   * Origin plus the app's basePath, e.g.
   * "https://ipstack.com/devtools/rental-scam-detector". This is what an
   * outside caller must fetch; `origin` alone 404s whenever the app is served
   * under a sub-path.
   */
  baseUrl: string;
  /** Whether a third-party API could actually fetch a URL on this origin. */
  publiclyReachable: boolean;
  reason: string | null;
};

/**
 * Where this app is reachable from the outside. Zenserp has to fetch an
 * uploaded photo over the public internet, so a dev server on localhost cannot
 * be used to check uploads — better to say that plainly than to
 * send an unreachable URL and report an empty result.
 */
export function resolveOrigin(request: NextRequest): OriginInfo {
  // PUBLIC_ORIGIN is scheme and host only; the basePath is appended here so
  // the two cannot drift apart.
  const configured = process.env.PUBLIC_ORIGIN?.trim();
  if (configured) {
    const origin = configured.replace(/\/$/, "");
    return { origin, baseUrl: origin + BASE_PATH, publiclyReachable: true, reason: null };
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto =
    request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const hostname = host.split(":")[0];

  if (!host) {
    return {
      origin: "",
      baseUrl: "",
      publiclyReachable: false,
      reason: "Could not determine this app's own URL.",
    };
  }
  if (PRIVATE_HOST.test(hostname)) {
    return {
      origin: `${proto}://${host}`,
      baseUrl: `${proto}://${host}${BASE_PATH}`,
      publiclyReachable: false,
      reason:
        "Checking uploaded photos needs a URL the search engine can reach, and this app is running on a private address. Deploy it, or set PUBLIC_ORIGIN to a tunnel URL, to use the upload option.",
    };
  }
  return {
    origin: `${proto}://${host}`,
    baseUrl: `${proto}://${host}${BASE_PATH}`,
    publiclyReachable: true,
    reason: null,
  };
}
