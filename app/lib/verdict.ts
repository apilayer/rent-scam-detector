import type { AssessedMatch } from "./matchAnalysis";
import type { Listing } from "./scrape";

export type Finding = {
  label: string;
  level: "danger" | "warn" | "safe" | "info";
  points: number;
  detail: string;
};

export type ImageMatch = {
  imageUrl: string;
  /** Pages carrying this same photo, excluding the listing's own site. */
  elsewhere: AssessedMatch[];
  sameSite: number;
  notice: string | null;
};

export type Verdict = {
  score: number; // 0 clean → 100 almost certainly a scam
  band: "looks clean" | "worth checking" | "high risk" | "almost certainly a scam";
  headline: string;
  findings: Finding[];
};

/** Language that turns up again and again in advance-fee rental scams. */
const SCAM_PHRASES: { re: RegExp; label: string; points: number }[] = [
  { re: /\b(western union|moneygram|wire transfer|bank transfer before|zelle|cash ?app)\b/i, label: "Untraceable payment method", points: 18 },
  { re: /\b(bitcoin|crypto|usdt|gift ?card)\b/i, label: "Crypto or gift-card payment", points: 18 },
  { re: /\b(i am|i'm|currently) (abroad|overseas|out of the country|on a mission|missionary)\b/i, label: "Landlord claims to be abroad", points: 16 },
  { re: /\b(no (viewing|inspection|visit)|without (viewing|seeing)|cannot show)\b/i, label: "Viewing refused", points: 16 },
  { re: /\b(deposit|first month).{0,30}\b(before|prior to).{0,20}\b(view|see|visit|key)/i, label: "Payment demanded before viewing", points: 20 },
  { re: /\b(keys? will be (shipped|sent|couriered)|send the keys)\b/i, label: "Keys to be posted", points: 14 },
  { re: /\b(urgent|act fast|first come first serve|limited time|today only)\b/i, label: "Manufactured urgency", points: 6 },
  { re: /\b(god|blessed|christian|trustworthy person)\b/i, label: "Trust-building appeals", points: 4 },
];

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|aol|protonmail|yandex|mail)\./i;

const band = (n: number): Verdict["band"] =>
  n >= 70 ? "almost certainly a scam" : n >= 45 ? "high risk" : n >= 20 ? "worth checking" : "looks clean";

/**
 * Weigh everything found into one graded answer.
 *
 * Reused photographs carry the most weight by a distance. Rental fraud almost
 * always starts by lifting pictures from a real advert, so the same images
 * sitting on an unrelated site is the strongest signal available — and it also
 * catches the other case this tool is for: a genuine property that was listed
 * elsewhere first and has probably already gone.
 */
export function grade(listing: Listing, matches: ImageMatch[]): Verdict {
  const findings: Finding[] = [];
  let score = 0;

  // 1 — What the photographs being elsewhere actually tells us.
  //
  // Reuse on its own is not evidence of anything: letting agents cross-post the
  // same property to every portal going. What counts is whether the details on
  // those other pages agree. The same rooms advertised far cheaper, or in a
  // different place, is the shape of a scam. The same rooms at the same price is
  // the advert doing its job — though it may well mean the place has gone.
  const allMatches = matches.flatMap((m) => m.elsewhere);
  const conflicting = allMatches.filter((a) => a.concern === "high");
  const soft = allMatches.filter((a) => a.concern === "low");
  const consistent = allMatches.filter((a) => a.concern === "none");
  const foreignHosts = new Set(allMatches.map((a) => a.host));
  const reusedImages = matches.filter((m) => m.elsewhere.length > 0).length;
  const searched = matches.filter((m) => !m.notice).length;

  if (searched === 0) {
    findings.push({
      label: "Photo check",
      level: "info",
      points: 0,
      detail: "No photographs could be checked, so the strongest signal is missing from this verdict.",
    });
  } else if (reusedImages === 0) {
    findings.push({
      label: "Photographs appear original",
      level: "safe",
      points: 0,
      detail: `All ${searched} photo${searched === 1 ? "" : "s"} checked, none found published anywhere else.`,
    });
  } else {
    // The headline number: pages using these photos that disagree on the facts.
    if (conflicting.length > 0) {
      const pts = Math.min(50, 18 + conflicting.length * 8);
      score += pts;
      findings.push({
        label: "Same photos, different details",
        level: "danger",
        points: pts,
        detail: `${conflicting.length} page${conflicting.length === 1 ? "" : "s"} using these photographs disagree with this listing on price or location. That mismatch, rather than the reuse itself, is what rental fraud looks like. The specific conflicts are listed against each result below.`,
      });
    }

    if (soft.length > 0 && conflicting.length === 0) {
      const pts = Math.min(14, soft.length * 3);
      score += pts;
      findings.push({
        label: "Some details don't line up",
        level: "warn",
        points: pts,
        detail: `${soft.length} page${soft.length === 1 ? "" : "s"} carrying these photographs differ in ways worth checking, though none decisively.`,
      });
    }

    if (consistent.length > 0 && conflicting.length === 0) {
      findings.push({
        label: "Looks cross-posted, not stolen",
        level: "safe",
        points: 0,
        detail: `These photographs appear on ${foreignHosts.size} other site${foreignHosts.size === 1 ? "" : "s"}, but the price and location there agree with this listing. That is normal. Agents advertise the same property everywhere at once.`,
      });
    }

    // Cross-posting still answers the other question this tool is for.
    findings.push({
      label: "May already be taken",
      level: "info",
      points: 0,
      detail: `The same property is advertised on ${foreignHosts.size} other site${foreignHosts.size === 1 ? "" : "s"}: ${[...foreignHosts].slice(0, 4).join(", ")}. Worth confirming it is still available before you travel to view it.`,
    });
  }

  // 2 — Scam language in the advert.
  const text = `${listing.title ?? ""} ${listing.description ?? ""}`;
  for (const phrase of SCAM_PHRASES) {
    const hit = text.match(phrase.re);
    if (hit) {
      score += phrase.points;
      findings.push({
        label: phrase.label,
        level: phrase.points >= 14 ? "danger" : "warn",
        points: phrase.points,
        detail: `The advert says “…${hit[0]}…”, which is a standard feature of advance-fee rental fraud.`,
      });
    }
  }

  // 3 — Contact pushed off-platform.
  const freeMail = listing.emails.filter((e) => FREE_MAIL.test(e));
  if (freeMail.length > 0) {
    score += 8;
    findings.push({
      label: "Free email address as contact",
      level: "warn",
      points: 8,
      detail: `Contact runs through ${freeMail.join(", ")} rather than an agency address. Legitimate agents usually use their own domain.`,
    });
  }

  // 4 — Did we even get enough to judge?
  if (!listing.price) {
    findings.push({
      label: "No price found",
      level: "info",
      points: 0,
      detail: "No price could be read from the page, so nothing here reflects whether it is priced oddly.",
    });
  }
  if (listing.images.length === 0) {
    score += 6;
    findings.push({
      label: "No photographs",
      level: "warn",
      points: 6,
      detail: "The page has no usable photographs, which is unusual for a genuine rental advert.",
    });
  }

  const final = Math.max(0, Math.min(100, score));
  const b = band(final);
  const headline =
    b === "almost certainly a scam"
      ? "Do not send money. Several signals here match known rental fraud."
      : b === "high risk"
        ? "Treat this with suspicion and insist on an in-person viewing before paying anything."
        : b === "worth checking"
          ? "Mostly unremarkable, but a few things are worth confirming before you commit."
          : "Nothing alarming surfaced. Still view the property in person before paying a deposit.";

  return { score: final, band: b, headline, findings };
}
