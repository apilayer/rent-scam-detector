import * as cheerio from "cheerio";

export type Listing = {
  url: string;
  host: string;
  title: string | null;
  price: string | null;
  currency: string | null;
  address: string | null;
  description: string | null;
  images: string[];
  /** Contact details the page exposes — scams lean on off-platform channels. */
  emails: string[];
  phones: string[];
  siteName: string | null;
  /** Where each field came from, so the report can show its working. */
  via: string[];
};

const ABS = (src: string, base: string): string | null => {
  try {
    const u = new URL(src, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

/** Chrome, not content — searching these wastes a Zenserp call each. */
const JUNK_IMAGE =
  /(sprite|icon|logo|wordmark|tagline|avatar|placeholder|pixel|blank|1x1|favicon|badge|button|arrow|map-?static|loading|spinner|watermark)/i;

/** Thumbnail markers: a 40px crop tells a reverse search engine nothing. */
const THUMBNAIL = /(\/thumb\/|[/_-]\d{2,3}px-|[?&](w|width)=\d{1,2}\b|[_-](thumb|small|tiny|xs)\b)/i;

const PRICE_RE =
  /(?:[$£€₦₵¥]|USD|GBP|EUR|NGN|GHS|CAD|AUD)\s?[\d,]+(?:\.\d{2})?(?:\s?(?:per|\/)\s?(?:month|mo|week|wk|night|pcm))?/i;

function collectJsonLd($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const push = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(push);
        else if (v && typeof v === "object") out.push(v as Record<string, unknown>);
      };
      push(parsed);
      // @graph wrappers are common on listing sites.
      for (const node of [...out]) {
        if (Array.isArray(node["@graph"])) push(node["@graph"]);
      }
    } catch {
      /* a malformed block is not worth failing the scrape over */
    }
  });
  return out;
}

const firstString = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
};

/**
 * Pull a listing out of a page. Structured data first — most property sites
 * publish JSON-LD or Open Graph, which is far more reliable than guessing at
 * markup — then fall back to meta tags and the page body.
 */
export function parseListing(html: string, url: string): Listing {
  const $ = cheerio.load(html);
  const via: string[] = [];
  const host = new URL(url).host;

  const meta = (prop: string) =>
    $(`meta[property="${prop}"]`).attr("content") ??
    $(`meta[name="${prop}"]`).attr("content") ??
    null;

  const ld = collectJsonLd($);
  const offer = ld.find((n) =>
    /Offer|Product|Residence|Apartment|House|RealEstateListing|Accommodation/i.test(
      String(n["@type"] ?? "")
    )
  );
  if (offer) via.push("JSON-LD");

  // ── Title ──
  const title =
    firstString(offer?.name, meta("og:title"), $("h1").first().text(), $("title").text()) ?? null;
  if (meta("og:title")) via.push("Open Graph");

  // ── Price ──
  const offers = (offer?.offers ?? {}) as Record<string, unknown>;
  let price = firstString(
    offers.price,
    (offers as { priceSpecification?: Record<string, unknown> }).priceSpecification?.price,
    meta("product:price:amount")
  );
  const currency = firstString(offers.priceCurrency, meta("product:price:currency"));
  if (!price) {
    const body = $("body").text().replace(/\s+/g, " ");
    price = body.match(PRICE_RE)?.[0] ?? null;
    if (price) via.push("price matched in page text");
  }

  // ── Address ──
  const addr = (offer?.address ?? {}) as Record<string, unknown>;
  const address =
    firstString(
      typeof offer?.address === "string" ? offer.address : null,
      [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode]
        .filter(Boolean)
        .join(", ") || null,
      $('[class*="address" i]').first().text().trim() || null
    ) ?? null;

  // ── Description ──
  const description =
    firstString(offer?.description, meta("og:description"), meta("description")) ?? null;

  // ── Images ──
  // Candidates are ranked rather than taken in document order: the structured
  // data and Open Graph images are the actual listing photographs, while page
  // markup is mostly interface furniture. Only the best few get searched, so
  // picking the right ones matters more than collecting many.
  const seen = new Set<string>();
  const candidates: { url: string; rank: number }[] = [];
  const addImage = (raw: string | undefined | null, rank: number) => {
    if (!raw || !raw.trim()) return;
    const abs = ABS(raw.trim(), url);
    if (!abs || seen.has(abs)) return;
    // An empty or fragment-only src resolves back to the page. That is not a
    // photograph, and searching it wastes a lookup.
    if (abs.split("#")[0] === url.split("#")[0]) return;
    // Vector art is never a photograph of a flat.
    if (/\.svg(\?|$)/i.test(abs)) return;
    if (JUNK_IMAGE.test(abs) || THUMBNAIL.test(abs)) return;
    seen.add(abs);
    candidates.push({ url: abs, rank });
  };

  const ldImage = offer?.image;
  if (typeof ldImage === "string") addImage(ldImage, 0);
  else if (Array.isArray(ldImage))
    ldImage.forEach((i) => addImage(typeof i === "string" ? i : null, 0));

  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) =>
    addImage($(el).attr("content"), 1)
  );
  $("img").each((_, el) => {
    const $el = $(el);
    const w = Number($el.attr("width") ?? 0);
    const h = Number($el.attr("height") ?? 0);
    // A declared size under ~200px is an icon, whatever it is called.
    if ((w && w < 200) || (h && h < 200)) return;
    // Lazy-loaded galleries keep the real file in a data attribute.
    addImage($el.attr("src") ?? $el.attr("data-src") ?? $el.attr("data-lazy-src"), 2);
    const srcset = $el.attr("srcset") ?? $el.attr("data-srcset");
    if (srcset) addImage(srcset.split(",")[0]?.trim().split(" ")[0], 3);
  });

  const images = candidates.sort((a, b) => a.rank - b.rank).map((c) => c.url);

  // ── Contact channels ──
  const bodyText = $("body").text();
  const emails = [
    ...new Set(bodyText.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? []),
  ].slice(0, 5);
  const phones = [
    ...new Set(bodyText.match(/\+?\d[\d\s().-]{7,16}\d/g) ?? []),
  ]
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 9)
    .slice(0, 5);

  return {
    url,
    host,
    title,
    price,
    currency,
    address,
    description,
    images: images.slice(0, 12),
    emails,
    phones,
    siteName: meta("og:site_name"),
    via,
  };
}

export type FetchOutcome =
  | { ok: true; html: string; elapsedMs: number; finalUrl: string }
  | { ok: false; error: string; status?: number };

/** Fetch a listing page, looking enough like a browser to get the real markup. */
export async function fetchListing(url: string): Promise<FetchOutcome> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          res.status === 403 || res.status === 429
            ? `The site returned ${res.status} and blocks automated requests. Try a listing from another site.`
            : `The page returned HTTP ${res.status}.`,
      };
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) {
      return { ok: false, error: `That URL returned ${type || "a non-HTML response"}, not a web page.` };
    }
    return { ok: true, html: await res.text(), elapsedMs: Date.now() - started, finalUrl: res.url || url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: msg.includes("timed out") || msg.includes("aborted")
        ? "The page took too long to respond."
        : `Couldn't fetch that page: ${msg}`,
    };
  }
}
