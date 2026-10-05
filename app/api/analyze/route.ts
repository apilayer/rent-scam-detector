import { NextRequest } from "next/server";
import { putBlob } from "@/app/lib/blobStore";
import { assessMatch, placeTokens, unwrapUrl } from "@/app/lib/matchAnalysis";
import { resolveOrigin } from "@/app/lib/origin";
import { parseRent } from "@/app/lib/money";
import { fetchListing, parseListing, type Listing } from "@/app/lib/scrape";
import { grade, type ImageMatch } from "@/app/lib/verdict";
import { reverseImageSearch } from "@/app/lib/zenserp";
import type { IAnalysis, ITrace } from "@/interfaces/analysis.interface";

export const dynamic = "force-dynamic";

/**
 * A reverse image search takes ~30s, so the default serverless ceiling is not
 * enough. Hosts that honour this (Vercel) will allow the full analysis.
 */
export const maxDuration = 120;

/** The extension popup runs on a chrome-extension:// origin, so it needs CORS. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/**
 * Reverse image search is the expensive part — one Zenserp call per photo — so
 * only the first few are checked. Listing galleries repeat the same rooms, and
 * a scammer who lifted one picture lifted the set.
 */
const MAX_IMAGES_TO_SEARCH = 4;

const BLOCKED_HOST = /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/** What the extension sends after reading the page in the user's browser. */
type ScrapedPayload = {
  url: string;
  title?: string | null;
  price?: string | null;
  address?: string | null;
  description?: string | null;
  images?: string[];
};

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** Build a listing out of what the user typed, when scraping is impossible. */
function manualListing(form: FormData, images: string[]): Listing {
  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const sourceUrl = str("sourceUrl");
  let host = "uploaded-photos";
  if (sourceUrl) {
    try {
      host = new URL(sourceUrl.startsWith("http") ? sourceUrl : `https://${sourceUrl}`).host;
    } catch {
      /* a malformed reference URL just means we can't exclude its own hits */
    }
  }
  return {
    url: sourceUrl ?? "",
    host,
    title: str("title"),
    price: str("price"),
    currency: null,
    address: str("address"),
    description: null,
    images,
    emails: [],
    phones: [],
    siteName: null,
    via: ["entered by hand"],
  };
}

export async function POST(request: NextRequest) {
  const traces: ITrace[] = [];
  let listing: Listing;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // Upload path. Plenty of portals block automated requests outright, so the
    // photos can be handed over directly instead of being scraped.
    const form = await request.formData();
    const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return Response.json({ error: "Attach at least one photo from the listing." }, { status: 400, headers: CORS });
    }
    const tooBig = files.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig) {
      return Response.json(
        { error: `${tooBig.name} is ${(tooBig.size / 1e6).toFixed(1)} MB; the limit is 12 MB per photo.` },
        { status: 413 }
      );
    }

    const origin = resolveOrigin(request);
    if (!origin.publiclyReachable) {
      return Response.json({ error: origin.reason }, { status: 400, headers: CORS });
    }

    const hosted: string[] = [];
    for (const file of files.slice(0, MAX_IMAGES_TO_SEARCH)) {
      const bytes = Buffer.from(await file.arrayBuffer());
      hosted.push(`${origin.origin}/api/image/blob/${putBlob(bytes, file.type || "image/jpeg")}`);
    }

    listing = manualListing(form, hosted);
    traces.push({
      api: "fetch",
      label: `${hosted.length} photo${hosted.length === 1 ? "" : "s"} uploaded`,
      url: listing.url || "(no listing URL given)",
      elapsedMs: null,
      status: null,
      notice: null,
    });
  } else {
    let body: { url?: string; scraped?: ScrapedPayload };
    try {
      body = (await request.json()) as { url?: string; scraped?: ScrapedPayload };
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: CORS });
    }

    // The browser extension reads the page the user is already looking at, so
    // the markup arrives already parsed. This is how a portal that refuses
    // server-side requests gets checked at all.
    if (body.scraped) {
      const sc = body.scraped;
      const images = (sc.images ?? [])
        .filter((i) => typeof i === "string" && /^https?:\/\//i.test(i))
        .slice(0, 12);
      if (images.length === 0) {
        return Response.json(
          { error: "No usable photographs were found on that page." },
          { status: 400 }
        );
      }
      let host = "page";
      try {
        host = new URL(sc.url).host;
      } catch {
        /* without a URL we simply can't exclude same-site hits */
      }
      listing = {
        url: sc.url ?? "",
        host,
        title: sc.title ?? null,
        price: sc.price ?? null,
        currency: null,
        address: sc.address ?? null,
        description: sc.description ?? null,
        images,
        emails: [],
        phones: [],
        siteName: null,
        via: ["read in your browser by the extension"],
      };
      traces.push({
        api: "fetch",
        label: "Page read by the browser extension",
        url: sc.url ?? "(no URL)",
        elapsedMs: null,
        status: 200,
        notice: null,
      });
      return analyse(listing, traces);
    }

    const raw = body.url?.trim();
    if (!raw) return Response.json({ error: "Paste a rental listing URL." }, { status: 400, headers: CORS });

    let target: URL;
    try {
      target = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    } catch {
      return Response.json({ error: `"${raw}" is not a valid URL.` }, { status: 400 });
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return Response.json({ error: "Only http and https URLs are supported." }, { status: 400, headers: CORS });
    }
    if (BLOCKED_HOST.test(target.hostname)) {
      return Response.json({ error: "That address is not reachable from here." }, { status: 400, headers: CORS });
    }

    const page = await fetchListing(target.toString());
    if (!page.ok) {
      return Response.json(
        { error: page.error, blocked: page.status === 403 || page.status === 429 },
        { status: 502, headers: CORS }
      );
    }
    traces.push({
      api: "fetch",
      label: "Fetch listing page",
      url: target.toString(),
      elapsedMs: page.elapsedMs,
      status: 200,
      notice: null,
    });

    listing = parseListing(page.html, page.finalUrl);
  }

  return analyse(listing, traces);
}

/** Search the photographs and grade what comes back. */
async function analyse(listing: Listing, traces: ITrace[]) {
  const toSearch = listing.images.slice(0, MAX_IMAGES_TO_SEARCH);

  // Compared against every match, so parse them once rather than per result.
  const listingRent = parseRent(`${listing.price ?? ""} ${listing.title ?? ""}`);
  const listingPlaces = placeTokens(`${listing.address ?? ""} ${listing.title ?? ""}`);

  // Concurrently: these are independent lookups, and run back to back they add
  // up to minutes rather than seconds.
  const matches: ImageMatch[] = await Promise.all(
    toSearch.map(async (imageUrl) => {
      const res = await reverseImageSearch(imageUrl, 20);
      traces.push({
        api: "zenserp",
        label: `Reverse image search — ${imageUrl.split("/").pop()?.slice(0, 40)}`,
        url: res.maskedUrl,
        elapsedMs: res.elapsedMs,
        status: res.status,
        notice: res.notice,
      });

      const elsewhere = [];
      let sameSite = 0;

      for (const hit of res.data ?? []) {
        const { host } = unwrapUrl(hit.url);
        if (host.replace(/^www\./, "") === listing.host.replace(/^www\./, "")) {
          sameSite++;
          continue;
        }
        elsewhere.push(assessMatch(listing, hit, listingRent, listingPlaces));
      }

      return { imageUrl, elsewhere, sameSite, notice: res.notice };
    })
  );

  const payload: IAnalysis = {
    listing,
    matches,
    verdict: grade(listing, matches),
    traces,
    skippedImages: Math.max(0, listing.images.length - toSearch.length),
  };
  return Response.json(payload, { headers: { "cache-control": "no-store", ...CORS } });
}
