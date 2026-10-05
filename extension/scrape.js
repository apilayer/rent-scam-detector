/**
 * Runs inside the page the user is actually looking at.
 *
 * This is the whole point of the extension: portals that refuse requests from a
 * server will happily render for a signed-in browser, so reading the DOM here
 * gets past the 403 that blocks the web version.
 */
function readListing() {
  const meta = (name) =>
    document.querySelector(`meta[property="${name}"]`)?.content ??
    document.querySelector(`meta[name="${name}"]`)?.content ??
    null;

  const JUNK = /(sprite|icon|logo|wordmark|avatar|placeholder|pixel|blank|1x1|favicon|badge|button|arrow|map-?static|loading|spinner)/i;
  const THUMB = /(\/thumb\/|[/_-]\d{2,3}px-|[?&](w|width)=\d{1,2}\b)/i;

  // Structured data first: most property sites publish it, and it beats guessing.
  let ld = {};
  for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const flat = [].concat(JSON.parse(node.textContent));
      for (const item of flat) {
        const t = String(item?.["@type"] ?? "");
        if (/Offer|Product|Residence|Apartment|House|RealEstate|Accommodation/i.test(t)) {
          ld = item;
          break;
        }
      }
    } catch {
      /* a malformed block shouldn't stop the scan */
    }
  }

  const seen = new Set();
  const images = [];
  const add = (raw, rank) => {
    if (!raw || !raw.trim()) return;
    let abs;
    try {
      abs = new URL(raw, location.href).href;
    } catch {
      return;
    }
    if (!/^https?:/.test(abs)) return;
    // An <img> with an empty src resolves to the page itself. Searching that
    // burns a 30-second lookup on something that is not a photograph.
    if (abs.split("#")[0] === location.href.split("#")[0]) return;
    if (/\.svg($|\?)/i.test(abs) || JUNK.test(abs) || THUMB.test(abs)) return;
    if (seen.has(abs)) return;
    seen.add(abs);
    images.push({ url: abs, rank });
  };

  if (typeof ld.image === "string") add(ld.image, 0);
  else if (Array.isArray(ld.image)) ld.image.forEach((i) => add(typeof i === "string" ? i : i?.url, 0));
  add(meta("og:image"), 1);

  for (const img of document.images) {
    // Rendered size is the honest test of whether something is a photo.
    if (img.naturalWidth && img.naturalWidth < 300) continue;
    if (img.clientWidth && img.clientWidth < 150) continue;
    add(img.currentSrc || img.src, 2);
  }

  const priceText =
    ld?.offers?.price ??
    meta("product:price:amount") ??
    (document.body.innerText.match(
      /(?:[$£€₦₵¥]|USD|GBP|EUR)\s?[\d,]+(?:\.\d{2})?(?:\s?(?:per|\/)\s?(?:month|mo|week|wk|pcm|pw))?/i
    )?.[0] ?? null);

  const addr = ld?.address;
  // `??` and `||` cannot be mixed without parentheses; doing so is a syntax
  // error, not a precedence quirk, so each fallback is bracketed explicitly.
  const fromParts =
    [addr?.streetAddress, addr?.addressLocality, addr?.addressRegion, addr?.postalCode]
      .filter(Boolean)
      .join(", ") || null;
  const fromMarkup =
    document.querySelector('[class*="address" i]')?.innerText?.trim()?.slice(0, 140) || null;
  const address = (typeof addr === "string" ? addr : null) || fromParts || fromMarkup || null;

  return {
    url: location.href,
    title: ld.name ?? meta("og:title") ?? document.title ?? null,
    price: priceText ? String(priceText) : null,
    address,
    description: (ld.description ?? meta("og:description") ?? "").slice(0, 600) || null,
    images: images.sort((a, b) => a.rank - b.rank).map((i) => i.url).slice(0, 8),
  };
}

readListing();
