import { ApiLayerLogo, ZenserpLogo } from "./Brand";

const SIGNUP =
  "https://app.apilayer.com/signup/zenserp/?utm_source=rentalscamdetector_devtools&utm_medium=internal&utm_campaign=featured_section";

/** Zenserp indigo over its deep navy, straight from the brand palette. */
export function ApiBanner() {
  return (
    <a
      href={SIGNUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full overflow-hidden rounded-xl border border-accent/30 bg-bg-elev transition select-none hover:border-accent/70"
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-accent/15" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl transition-opacity group-hover:bg-accent/30" />

      <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <ZenserpLogo height={18} />
            <span className="h-4 w-px bg-border-strong" />
            <ApiLayerLogo height={13} />
          </div>
          <p className="mono text-[10px] font-semibold tracking-widest text-accent-bright uppercase">
            Reverse image search API
          </p>
          <p className="max-w-md text-sm leading-snug font-medium text-fg/80">
            The duplicate-photo check on this page is one Zenserp call per image.
            It is the same API you can run against your own listings.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition group-hover:bg-accent-bright">
            Get your free API key
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          <span className="mono text-[9px] tracking-widest text-fg-dim uppercase">
            Zenserp, powered by APILayer
          </span>
        </div>
      </div>
    </a>
  );
}

export function ApiBannerCompact() {
  return (
    <a
      href={SIGNUP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-accent/30 bg-bg-elev px-3 py-2.5 transition select-none hover:border-accent/70"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-accent/10" />
      <span className="relative z-10 flex min-w-0 items-center gap-2">
        <ZenserpLogo height={14} />
        <span className="mono truncate text-[10px] tracking-widest text-accent-bright uppercase">
          Reverse image search
        </span>
      </span>
      <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-bold text-white transition group-hover:bg-accent-bright">
        Get API key
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </a>
  );
}
