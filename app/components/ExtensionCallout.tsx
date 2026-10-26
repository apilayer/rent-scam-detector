"use client";

import { useState } from "react";
import { assetPath } from "@/app/lib/assets";

const STEPS = [
  "Download the zip and unzip it somewhere you will keep it.",
  "Open chrome://extensions and turn on Developer mode, top right.",
  'Click "Load unpacked" and choose the folder you just unzipped.',
  "Open a rental listing, click the icon, then Scan this page.",
];

/**
 * The extension exists because of a specific failure: portals like Trulia return
 * 403 to anything that looks automated, so the server can never read them. A
 * browser the user is already signed into can.
 */
export function ExtensionCallout() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-accent/30 bg-bg-elev">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="display text-[1.25rem] leading-[1.4] text-fg md:text-[1.5rem] md:leading-[1.75rem]">Check listings the site will not let us read</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-fg-muted">
            Some portals block automated requests outright. The browser extension
            reads the page you are already looking at, so those listings can be
            checked too. Results appear in the popup.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={assetPath("/rental-scam-detector-extension.zip")}
            download
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-bright"
          >
            Add as extension
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="label rounded-lg border border-border bg-bg-elev-2 px-3 py-2 text-[11px] text-fg-muted transition hover:text-fg"
            aria-expanded={open}
          >
            {open ? "Hide steps" : "How to install"}
          </button>
        </div>
      </div>

      {open && (
        <ol className="space-y-2 border-t border-border bg-bg-elev-2 px-4 py-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-[12px] text-fg-muted">
              <span className="label shrink-0 font-semibold text-accent-bright">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{s}</span>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-3 text-[11px] text-fg-dim">
            The popup needs to know where this app is running. Open its settings,
            the gear icon, and set the address if it is not on localhost.
          </li>
        </ol>
      )}
    </section>
  );
}
