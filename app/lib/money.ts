/** A rent figure normalised so two adverts can actually be compared. */
export type Rent = {
  amount: number;
  currency: string;
  period: "week" | "month" | "unknown";
  /** Monthly equivalent — the basis every comparison uses. */
  monthly: number;
  raw: string;
};

const SYMBOL_CURRENCY: Record<string, string> = {
  "£": "GBP", $: "USD", "€": "EUR", "₦": "NGN", "₵": "GHS", "¥": "JPY", "₹": "INR",
};

const RENT_RE =
  /([£$€₦₵¥₹]|USD|GBP|EUR|NGN|GHS|CAD|AUD|INR)\s?([\d][\d,.]*)\s*(?:(?:per|\/|a)\s*)?(pcm|pw|week|wk|month|mo|night|nightly)?/i;

/**
 * Pull a rent out of free text. Weekly and monthly adverts are both common, and
 * comparing £340/wk against £1,400pcm without converting makes a legitimate
 * cross-post look like a 75% discount — so everything is reduced to a monthly
 * figure before anything is compared.
 */
export function parseRent(text: string | null | undefined): Rent | null {
  if (!text) return null;
  const m = text.match(RENT_RE);
  if (!m) return null;

  const amount = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const token = (m[1] ?? "").toUpperCase();
  const currency = SYMBOL_CURRENCY[m[1] ?? ""] ?? token;

  const unit = (m[3] ?? "").toLowerCase();
  const period: Rent["period"] =
    /^(pw|week|wk)$/.test(unit) ? "week" : /^(pcm|month|mo)$/.test(unit) ? "month" : "unknown";

  // 52 weeks over 12 months, the convention UK lettings use.
  const monthly = period === "week" ? (amount * 52) / 12 : amount;

  return { amount, currency, period, monthly, raw: m[0].trim() };
}

export function formatRent(r: Rent): string {
  return r.raw;
}

/**
 * How much cheaper `a` is than `b`, as a fraction (0.4 = 40% cheaper), or null
 * when the two figures simply are not comparable.
 *
 * Refusing the ambiguous case matters more than covering it. "£325" with no
 * period next to "£340/wk" is almost certainly also weekly, but treated as a
 * monthly rent it reads as 78% cheaper — manufacturing exactly the dramatic
 * price gap this tool is supposed to detect honestly.
 */
export function discount(a: Rent, b: Rent): number | null {
  if (a.currency !== b.currency || b.monthly <= 0) return null;
  // Comparable only on a shared basis: both periods stated, or both unstated.
  const bothStated = a.period !== "unknown" && b.period !== "unknown";
  const bothUnstated = a.period === "unknown" && b.period === "unknown";
  if (!bothStated && !bothUnstated) return null;
  return (b.monthly - a.monthly) / b.monthly;
}

/** Whether a price gap can be judged at all, for explaining the "don't know". */
export function comparable(a: Rent, b: Rent): boolean {
  return discount(a, b) !== null;
}
