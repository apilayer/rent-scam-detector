const BASE = "https://app.zenserp.com/api/v2/search";

/**
 * Upper bound on a single search. Reverse image lookups genuinely take around
 * 30s — Zenserp drives a real search engine behind the scenes — so this needs
 * real headroom, not a web-request-sized timeout. Calls are made concurrently,
 * so this is roughly the whole analysis's wall time, not a multiple of it.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.ZENSERP_TIMEOUT_MS ?? 90_000);

export type ZenserpOrganic = {
  title?: string;
  url?: string;
  destination?: string;
  description?: string;
};

export type ZenserpNewsItem = {
  title?: string;
  link?: string;
  date?: string;
  date_parsed?: string;
  source?: string;
  description?: string;
  thumbnail?: string;
};

export type ZenserpOutcome<T> = {
  data: T | null;
  elapsedMs: number;
  status: number;
  /** Non-fatal explanation, so one failed call never blanks the whole case file. */
  notice: string | null;
  maskedUrl: string;
};

const mask = (url: string) => url.replace(/apikey=[^&]+/i, "apikey=••••••••");

/**
 * Zenserp reports trouble two different ways: a plain `error` string, or an
 * `errors` array whose entries carry the upstream message. The second form is
 * the one that actually explains a 502 — without unwrapping it the UI just said
 * "Bad Gateway" and hid the real cause, which is usually rate limiting.
 */
function describeFailure(json: Record<string, unknown>): string | null {
  if (typeof json.error === "string") return json.error;

  const errors = json.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const messages = errors
      .map((e) => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object") {
          const o = e as Record<string, unknown>;
          const text = o.upstream ?? o.message ?? o.error;
          if (typeof text === "string") return text;
        }
        return null;
      })
      .filter((m): m is string => Boolean(m));
    if (messages.length) return messages.join(" · ");
  }
  return null;
}

async function call<T>(params: Record<string, string>, pick: (json: Record<string, unknown>) => T | null): Promise<ZenserpOutcome<T>> {
  const key = process.env.ZENSERP_API_KEY;
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}?${qs}`;
  const base = { data: null, elapsedMs: 0, status: 0, maskedUrl: mask(url) };

  if (!key) {
    return { ...base, notice: "ZENSERP_API_KEY is not set. Add it to .env.local and restart." };
  }

  const started = Date.now();
  try {
    // Zenserp takes the key as a header; keeping it out of the query string
    // means the masked URL above is safe to show in the request inspector.
    const res = await fetch(url, {
      headers: { apikey: key },
      cache: "no-store",
      // Zenserp can sit on a request for a minute when its upstream is slow;
      // a bounded wait keeps the whole analysis inside a serverless timeout.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const elapsedMs = Date.now() - started;
    const json = (await res.json()) as Record<string, unknown>;

    const failure = describeFailure(json);
    if (!res.ok || failure) {
      return {
        ...base,
        elapsedMs,
        status: res.status,
        notice: `Zenserp: ${failure ?? res.statusText}`,
      };
    }
    return { ...base, data: pick(json), elapsedMs, status: res.status, notice: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timedOut = msg.includes("timed out") || msg.includes("aborted") || msg.includes("TimeoutError");
    return {
      ...base,
      elapsedMs: Date.now() - started,
      notice: timedOut
        ? `Zenserp did not respond within ${REQUEST_TIMEOUT_MS / 1000}s.`
        : `Couldn't reach Zenserp: ${msg}`,
    };
  }
}

/** Where else on the public web does this exact image appear? */
export function reverseImageSearch(imageUrl: string, num = 30) {
  return call<ZenserpOrganic[]>(
    { image_url: imageUrl, num: String(num) },
    (json) => {
      const block = json.reverse_image_results as { organic?: ZenserpOrganic[] } | undefined;
      return block?.organic ?? [];
    }
  );
}

/** What has been written about this name in the news? */
export function newsSearch(query: string, num = 20) {
  return call<ZenserpNewsItem[]>(
    { q: query, tbm: "nws", num: String(num), hl: "en" },
    (json) => (json.news_results as ZenserpNewsItem[] | undefined) ?? []
  );
}
