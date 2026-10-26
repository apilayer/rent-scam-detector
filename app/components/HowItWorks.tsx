const STEPS = [
  {
    n: "01",
    title: "It reads the advert",
    body: "Price, address, description and every photograph, taken from the page's own structured data where it has any.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=700&auto=format&fit=crop",
    alt: "An office block, standing in for the listing page being read",
  },
  {
    n: "02",
    title: "It searches the photos",
    body: "Each picture goes to Zenserp's reverse image search, which finds the other pages publishing that exact image.",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=700&auto=format&fit=crop",
    alt: "Apartment windows, standing in for many listings of the same place",
  },
  {
    n: "03",
    title: "It compares the details",
    body: "Same price and same place means a normal cross-post. A big price gap, or a different town, is the thing worth worrying about.",
    image:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=700&auto=format&fit=crop",
    alt: "A set of keys being handed over",
  },
];

export function HowItWorks() {
  return (
    <section>
      <h2 className="display text-[1.75rem] leading-[1.2] text-fg md:text-[2.25rem] md:leading-[2.75rem]">How the check works</h2>
      <p className="mt-1 max-w-2xl text-sm text-fg-muted">
        Three steps, and the third is the one that matters.
      </p>

      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="overflow-hidden rounded-xl border border-border bg-bg-elev transition hover:border-accent/50"
          >
            <div className="relative h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-elev via-bg-elev/40 to-transparent" />
              <span className="label absolute top-2.5 left-3 text-[11px] font-bold text-accent-bright">
                {s.n}
              </span>
            </div>
            <div className="p-4 pt-2">
              <h3 className="text-sm font-semibold text-fg">{s.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
