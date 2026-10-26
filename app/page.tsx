import { Analyzer } from "./components/Analyzer";
import { FaqSection } from "./components/FaqSection";
import { ApiBanner } from "./components/ApiBanner";
import { ExtensionCallout } from "./components/ExtensionCallout";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HowItWorks } from "./components/HowItWorks";

const SIGNS = [
""
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* Hero */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-bg-elev">
          <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
            <div className="p-6 md:p-8">
              <span className="label text-[10px] tracking-wider text-accent uppercase">
                Before you pay a deposit
              </span>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[1.24] text-fg md:text-[2.8125rem] md:leading-[3.5rem]">
                Is this rental listing a scam?
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-muted md:text-[1.1875rem] md:leading-[1.7]">
                Rental fraud usually starts the same way. Someone lifts the pictures
                from a real advert and reposts the place cheaper. This tool reads the
                listing, reverse image searches every photo with Zenserp, then checks
                what those other pages say.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                <strong className="font-semibold text-fg">
                  Finding the same photos elsewhere is not suspicious on its own.
                </strong>{" "}
                Agents cross-post to every portal going. What matters is whether the
                price and the location agree. When they do, the place is simply
                advertised widely and may already be gone. When they do not, that gap
                is what a scam looks like.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {SIGNS.map((s) => (
                  <li
                    key={s}
                    className="label rounded-md border border-border bg-bg-elev-2 px-2.5 py-1 text-[10px] text-fg-muted"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative hidden min-h-[260px] md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop"
                alt="A furnished flat of the kind rental adverts show"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-elev via-bg-elev/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-elev/70 to-transparent" />
            </div>
          </div>
        </section>

        <div className="mb-6">
          <ExtensionCallout />
        </div>

        <Analyzer />

        <div className="mt-10">
          <HowItWorks />
        </div>

        <div className="mt-8">
          <ApiBanner />
        </div>

        <div className="mt-8">
          <FaqSection />
        </div>

        <Footer />
      </main>
    </>
  );
}
