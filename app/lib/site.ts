/**
 * Canonical facts about this page, deliberately decoupled from routing.
 *
 * NEXT_PUBLIC_BASE_PATH says where Next serves the app from; these say what a
 * crawler should be told about it. Conflating the two either 404s local dev or
 * points the canonical at a URL nobody can reach.
 */
const DEFAULT_ORIGIN = "https://apilayer.com";
const DEFAULT_PATH = "/devtools/rental-scam-detector";

export const SITE = {
  name: "Rental Scam Detector",
  origin: (process.env.NEXT_PUBLIC_SITE_ORIGIN || DEFAULT_ORIGIN).replace(
    /\/$/,
    ""
  ),
  publicPath: (process.env.NEXT_PUBLIC_SITE_PATH ?? DEFAULT_PATH).replace(
    /\/$/,
    ""
  ),
  tagline: "Is this rental listing a scam?",
  description:
    "Check a rental listing before you pay a deposit. Paste the link and the tool reverse image searches every photo, then shows you where else those same pictures appear and whether the price or the address changed.",
  locale: "en_US",
} as const;

export const SITE_URL = `${SITE.origin}${SITE.publicPath}`;
