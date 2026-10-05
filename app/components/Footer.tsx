import { ApiLayerLogo, ZenserpLogo } from "./Brand";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5">
            <span className="mono text-[10px] tracking-wider text-fg-dim uppercase">Powered by</span>
            <ZenserpLogo height={16} />
            <span className="h-3.5 w-px bg-border-strong" />
            <ApiLayerLogo height={12} />
          </span>
          <p className="max-w-md text-[11px] leading-relaxed text-fg-muted">
            This tool reports what it can observe. A clean result is not a
            guarantee. Always view a property in person before paying anything.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <a
            href="https://zenserp.com/documentation/"
            target="_blank"
            rel="noreferrer noopener"
            className="mono text-[11px] text-fg-muted transition hover:text-fg"
          >
            Zenserp docs ↗
          </a>
          <a
            href="https://apilayer.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="mono text-[11px] text-fg-muted transition hover:text-fg"
          >
            APILayer ↗
          </a>
        </div>
      </div>
      <p className="mono mt-5 border-t border-border py-4 text-[10px] text-fg-dim">
        © {YEAR} Rental Scam Detector · Zenserp by APILayer
      </p>
    </footer>
  );
}
