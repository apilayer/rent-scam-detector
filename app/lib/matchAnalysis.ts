import { discount, parseRent, type Rent } from "./money";
import type { Listing } from "./scrape";

export type MatchConcern = "none" | "low" | "high";

export type AssessedMatch = {
  title: string;
  /** Usable destination link, or null when the engine only gave us its own. */
  url: string | null;
  host: string;
  description: string | null;
  rent: Rent | null;
  concern: MatchConcern;
  /** Plain-language reasons, shown next to the link. */
  reasons: string[];
};

/** Hosts whose links are the search engine's own plumbing, not a destination. */
const ENGINE_HOST = /(^|\.)(lens\.google\.|google\.|googleusercontent\.|bing\.|yandex\.)/i;

/**
 * Zenserp drives Google Lens, and Lens hands back its own URLs. Where the real
 * destination is embedded as a parameter we recover it; otherwise we admit we
 * only have a title and refuse to render a link that goes nowhere.
 */
export function unwrapUrl(raw: string | undefined | null): { url: string | null; host: string } {
  if (!raw) return { url: null, host: "unknown" };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: null, host: "unknown" };
  }

  if (ENGINE_HOST.test(parsed.hostname)) {
    // Lens and friends wrap the destination in a query parameter.
    for (const key of ["url", "imgurl", "q", "u", "continue"]) {
      const inner = parsed.searchParams.get(key);
      if (inner && /^https?:\/\//i.test(inner)) {
        try {
          const u = new URL(inner);
          if (!ENGINE_HOST.test(u.hostname)) return { url: u.toString(), host: u.hostname };
        } catch {
          /* keep looking */
        }
      }
    }
    return { url: null, host: parsed.hostname };
  }
  return { url: parsed.toString(), host: parsed.hostname };
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "student", "accommodation", "apartment", "apartments",
  "flat", "house", "room", "rooms", "rent", "rental", "bed", "studio", "property",
  "to", "in", "at", "of", "a", "an", "from", "new", "luxury", "en", "suite", "prices",
  "updated", "only", "plus", "bedroom", "private", "hall",
]);

/** Place-ish words from a free-text address, used to compare two adverts. */
function placeTokens(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
  );
}

/**
 * Work out what a match actually means.
 *
 * Finding the same photographs elsewhere is not in itself suspicious — letting
 * agents cross-post the same property to every portal they can. What matters is
 * whether the *details* agree. The same rooms advertised far cheaper, or in a
 * different town, is the shape of a scam; the same rooms at the same price in
 * the same place is just the advert doing its job.
 */
export function assessMatch(
  listing: Listing,
  hit: { title?: string; url?: string; description?: string },
  listingRent: Rent | null,
  listingPlaces: Set<string>
): AssessedMatch {
  const { url, host } = unwrapUrl(hit.url);
  const title = hit.title?.trim() || url || "Untitled result";
  const description = hit.description?.trim() || null;
  const blob = `${title} ${description ?? ""}`;

  const rent = parseRent(blob);
  const reasons: string[] = [];
  let concern: MatchConcern = "none";
  const raise = (level: MatchConcern) => {
    const rank = { none: 0, low: 1, high: 2 };
    if (rank[level] > rank[concern]) concern = level;
  };

  // ── Price ──
  if (rent && listingRent) {
    const d = discount(listingRent, rent);
    if (d == null) {
      // Either a different currency, or one advert states a period and the
      // other does not — a gap that can't be judged shouldn't be asserted.
      reasons.push(
        `Advertised at ${rent.raw} here. That cannot be compared directly with ${listingRent.raw}.`
      );
    } else if (Math.abs(d) >= 0.35) {
      // Direction is almost irrelevant: a genuine cross-post of the same
      // property quotes the same rent. A large gap either way means these
      // photographs are being advertised as two different propositions, and at
      // least one of them is not what it claims to be.
      raise("high");
      // Each direction is expressed against its own baseline. Reusing one
      // figure for both produced impossibilities like "146% cheaper".
      const gap =
        d > 0
          ? `the listing you pasted is about ${Math.round(d * 100)}% cheaper for the same rooms`
          : `it is about ${Math.round((discount(rent, listingRent) ?? 0) * 100)}% cheaper than the listing you pasted, for the same rooms`;
      reasons.push(`Advertised at ${rent.raw} on this page. That means ${gap}.`);
    } else {
      reasons.push(`Priced ${rent.raw}, broadly in line with this listing.`);
    }
  } else if (rent) {
    reasons.push(`Advertised at ${rent.raw}.`);
  }

  // ── Place ──
  const matchPlaces = placeTokens(blob);
  if (listingPlaces.size > 0 && matchPlaces.size > 0) {
    const shared = [...listingPlaces].filter((p) => matchPlaces.has(p));
    if (shared.length > 0) {
      reasons.push(`Same location mentioned (${shared.slice(0, 3).join(", ")}).`);
    } else if (matchPlaces.size >= 3) {
      // The page is descriptive and still shares nothing with this address —
      // the same rooms being advertised somewhere else entirely.
      raise("high");
      reasons.push(
        `Describes a different location (${[...matchPlaces].slice(0, 3).join(", ")}). None of this listing's address appears on the page.`
      );
    } else {
      raise("low");
      reasons.push("Too little detail on this page to confirm it is the same address.");
    }
  }

  if (reasons.length === 0) {
    reasons.push("The page gives no price or location to compare against.");
  }

  return { title, url, host, description, rent, concern, reasons };
}

export { placeTokens };
