import Link from "next/link";
import { ApiLayerLogo, Mark } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-accent transition hover:opacity-80">
            <Mark />
            <span className="mono text-sm font-semibold tracking-tight text-fg">
              Rental Scam Detector
            </span>
          </Link>
          <span className="hidden text-xs text-fg-dim sm:inline">by</span>
          <a
            href="https://apilayer.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden transition hover:opacity-80 sm:flex"
          >
            <ApiLayerLogo height={18} />
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://app.apilayer.com/signup/zenserp/?utm_source=rentalscamdetector_devtools&utm_medium=internal&utm_campaign=header"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white transition hover:bg-accent-bright sm:block"
          >
            Get API Key
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
