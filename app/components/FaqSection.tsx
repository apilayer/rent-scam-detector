"use client";

import { useState } from "react";
import { FAQ_DATA } from "@/app/lib/faq";

export function FaqSection() {
  const [open, setOpen] = useState<string | null>(FAQ_DATA[0]?.id ?? null);

  return (
    <section
      aria-labelledby="faq-heading"
      className="rounded-xl border border-border bg-bg-elev p-6 md:p-8"
    >
      <span className="label text-[10px] font-semibold uppercase text-accent">
        FAQ
      </span>
      <h2
        id="faq-heading"
        className="mt-1 text-[1.75rem] font-semibold leading-[1.2] text-fg md:text-[2.25rem] md:leading-[2.75rem]"
      >
        Rental scams, answered
      </h2>

      <div className="mt-6 divide-y divide-border border-t border-border">
        {FAQ_DATA.map((item, index) => {
          const isOpen = open === item.id;
          return (
            <div key={item.id} className="py-4">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`${item.id}-answer`}
                className="flex w-full items-start justify-between gap-4 text-left transition hover:text-accent"
              >
                <span className="flex items-center gap-3">
                  <span className="label text-xs font-semibold text-fg-dim select-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-semibold text-fg md:text-[1.1875rem]">
                    {item.question}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`mt-1 shrink-0 text-fg-dim transition-transform ${
                    isOpen ? "rotate-180 text-accent" : ""
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
              {/* Rendered always and hidden with [hidden], never unmounted:
                  a collapsed answer that leaves the DOM is invisible to
                  crawlers and answer engines. */}
              <div
                id={`${item.id}-answer`}
                hidden={!isOpen}
                className="mt-3 pl-9 text-sm leading-relaxed text-fg-muted"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
