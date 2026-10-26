import Image from "next/image";
import { assetPath } from "@/app/lib/assets";

const SIGNUP =
  "https://app.apilayer.com/signup/zenserp/?utm_source=rentalscamdetector_devtools&utm_medium=internal&utm_campaign=featured_section";

/** Zenserp's brand indigo, taken from their own site. */
const BRAND = "#5a67d8";

/**
 * Promo banner for the Zenserp API. Same layout as the ipstack banner in the
 * What Is My IP devtool: brand lockup and copy on the left, call to action on
 * the right, over a grid and a brand-coloured glow. Follows the app's theme
 * toggle, so the wordmark swaps between its light and dark artwork.
 */
export function ApiBanner() {
  return (
    <a
      href={SIGNUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full overflow-hidden rounded-lg border border-accent/30 bg-bg-elev transition select-none hover:border-accent/70"
    >
      {/* subtle grid + indigo glow backdrop */}
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef0fb] via-white/40 to-accent/10" />

      <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {/* brand lockup + copy */}
        <div className="flex items-center gap-4">
          <Image
            src={assetPath("/brand/zenserp-icon.png")}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-md"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Image
                src={assetPath("/brand/zenserp-logo-dark.svg")}
                alt="Zenserp"
                width={92}
                height={24}
                className="h-4 w-auto"
              />
              <span className="h-3.5 w-px bg-black/15" />
              <Image
                src={assetPath("/apilayer-logo.png")}
                alt="APILayer"
                width={80}
                height={16}
                className="h-3 w-auto"
              />
            </div>
            <p className="label text-[10px] font-semibold tracking-widest text-accent uppercase">
              Reverse image search API
            </p>
            <p className="max-w-md text-sm leading-snug font-medium text-fg/80">
              Every photo on this page is checked with one Zenserp call. It is the
              same API you can run against your own listings.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold text-white transition group-hover:brightness-110"
            style={{ background: BRAND, boxShadow: `0 10px 15px -3px ${BRAND}33` }}
          >
            Get your free API key
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          <span className="label text-[9px] tracking-widest text-fg-dim uppercase">
            Zenserp by APILayer
          </span>
        </div>
      </div>
    </a>
  );
}

/**
 * Tall ad panel, the layout AeroStack uses inside its flight detail drawer:
 * a dimmed photo backdrop with the lockup, headline and CTA stacked over it.
 * Sized for a column beside a result rather than a full-width row.
 */
export function ApiBannerPanel() {
  return (
    <a
      href={SIGNUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block h-48 w-full overflow-hidden rounded-lg bg-[#0d0d18] select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity group-hover:opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/85 via-[#0d0d18]/80 to-accent/25" />

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Light artwork here: this panel is the one dark surface left. */}
            <Image
              src={assetPath("/brand/zenserp-logo-light.svg")}
              alt="Zenserp"
              width={92}
              height={24}
              className="h-4 w-auto"
            />
            <span className="h-4 w-px bg-white/25" />
            <Image
              src={assetPath("/apilayer-logo.png")}
              alt="APILayer"
              width={70}
              height={14}
              className="h-4 w-auto brightness-0 invert"
            />
          </div>
        </div>

        <div>
          <p className="label mb-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9aa3ec" }}>
            Reverse image search API
          </p>
          <h3 className="display text-xl leading-tight text-white">
            Find every page using
            <br />
            the same photo.
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold text-white transition group-hover:brightness-110"
            style={{ background: BRAND }}
          >
            Get Your API Key
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          <span className="text-[10px] text-white/55">Zenserp, powered by APILayer</span>
        </div>
      </div>
    </a>
  );
}

/** Single-row variant for tight columns. */
export function ApiBannerCompact() {
  return (
    <a
      href={SIGNUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-accent/30 bg-bg-elev px-3 py-2.5 transition select-none hover:border-accent/70"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-accent/10" />
      <div className="relative z-10 flex min-w-0 items-center gap-2.5">
        <Image
          src={assetPath("/brand/zenserp-icon.png")}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded"
        />
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src={assetPath("/brand/zenserp-logo-dark.svg")}
            alt="Zenserp"
            width={70}
            height={15}
            className="h-3.5 w-auto shrink-0"
          />
          <span className="label truncate text-[10px] tracking-widest text-accent uppercase">
            Reverse image search
          </span>
        </div>
      </div>
      <span
        className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-white transition group-hover:brightness-110"
        style={{ background: BRAND }}
      >
        Get API key
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </a>
  );
}

export { SIGNUP as ZENSERP_SIGNUP_URL };
