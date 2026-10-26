"use client";

import type { AssessedMatch } from "@/app/lib/matchAnalysis";
import type { IAnalysis } from "@/interfaces/analysis.interface";
import { ApiBannerCompact, ApiBannerPanel } from "./ApiBanner";

const LEVEL_CLASS: Record<string, string> = {
  danger: "v-danger",
  warn: "v-warn",
  safe: "v-safe",
  info: "v-info",
};

/** Conflicting results are the point, so they sort to the top. */
const RANK: Record<string, number> = { high: 2, low: 1, none: 0 };

const BAND_COLOUR: Record<string, string> = {
  "almost certainly a scam": "var(--danger)",
  "high risk": "var(--danger)",
  "worth checking": "var(--warn)",
  "looks clean": "var(--safe)",
};

export function Report({ data }: { data: IAnalysis }) {
  const { listing, verdict, matches } = data;
  const colour = BAND_COLOUR[verdict.band] ?? "var(--fg-muted)";
  const reused = matches.filter((m) => m.elsewhere.length > 0);
  const failed = matches.filter((m) => m.notice);

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <section
        className="rounded-xl border bg-bg-elev p-5"
        style={{ borderColor: `color-mix(in oklab, ${colour} 45%, transparent)` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="label text-3xl font-bold" style={{ color: colour }}>
              {verdict.score}
            </span>
            <span className="label text-xs tracking-widest uppercase" style={{ color: colour }}>
              {verdict.band}
            </span>
          </div>
          <span className="label text-[10px] tracking-wider text-fg-dim uppercase">
            risk score · 0–100
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-elev-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(3, verdict.score)}%`, background: colour }}
          />
        </div>

        <p className="mt-3 text-sm leading-relaxed font-medium text-fg">{verdict.headline}</p>

        <ul className="mt-4 space-y-3 border-t border-border pt-4">
          {verdict.findings.map((f) => (
            <li key={f.label}>
              <div className="flex items-center gap-2">
                <span
                  className={`label shrink-0 rounded border px-1.5 py-0.5 text-[9px] tracking-widest uppercase ${LEVEL_CLASS[f.level]}`}
                >
                  {f.level}
                </span>
                <span className="text-xs font-medium text-fg">{f.label}</span>
                {f.points > 0 && (
                  <span className="label ml-auto shrink-0 text-[10px] text-fg-dim">+{f.points}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{f.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Where the photos turned up */}
      <section className="rounded-xl border border-border bg-bg-elev p-5">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-border pb-2.5">
          <div>
            <p className="label text-[10px] tracking-wider text-fg-dim uppercase">zenserp</p>
            <h3 className="text-sm font-semibold text-fg">Where these photos appear, and whether the details agree</h3>
          </div>
          <span className="label shrink-0 text-xs text-fg-dim">
            {matches.length} checked
            {data.skippedImages > 0 && ` · ${data.skippedImages} not checked`}
          </span>
        </div>

        {matches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-fg-dim">
            No usable photographs were found on the page, so the strongest check could not run.
          </p>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.imageUrl} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  {m.notice ? (
                    <p className="text-[11px] text-warn">{m.notice}</p>
                  ) : m.elsewhere.length === 0 ? (
                    <p className="text-[11px] text-safe">
                      Not found anywhere else
                      {m.sameSite > 0 && ` (${m.sameSite} hit${m.sameSite === 1 ? "" : "s"} on this listing's own site)`}
                      .
                    </p>
                  ) : (
                    <>
                      {(() => {
                        const bad = m.elsewhere.filter((e) => e.concern === "high").length;
                        return (
                          <p
                            className={`text-[11px] font-medium ${bad > 0 ? "text-danger" : "text-fg-muted"}`}
                          >
                            Found on {m.elsewhere.length} other page
                            {m.elsewhere.length === 1 ? "" : "s"}
                            {bad > 0
                              ? ` · ${bad} disagree${bad === 1 ? "s" : ""} on price or location`
                              : " · details consistent with this listing"}
                          </p>
                        );
                      })()}
                      <ul className="mt-1.5 space-y-1.5">
                        {[...m.elsewhere]
                          .sort((a, b) => RANK[b.concern] - RANK[a.concern])
                          .slice(0, 5)
                          .map((e, i) => (
                            <MatchRow key={i} match={e} />
                          ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {failed.length > 0 && (
          <p className="mt-3 rounded border border-warn/40 bg-warn/5 px-2.5 py-2 text-[11px] leading-snug text-fg-muted">
            {failed.length} search{failed.length === 1 ? "" : "es"} did not complete, so this
            verdict is based on less evidence than it should be. A reverse image
            lookup drives a real search engine and can take up to a minute.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_240px]">
          <ApiBannerCompact />
          <div className="hidden sm:block">
            <ApiBannerPanel />
          </div>
        </div>
      </section>

      {/* What the page said */}
      <section className="rounded-xl border border-border bg-bg-elev p-5">
        <div className="mb-3 border-b border-border pb-2.5">
          <p className="label text-[10px] tracking-wider text-fg-dim uppercase">
            Read from the page{listing.via.length > 0 && ` · ${listing.via.join(", ")}`}
          </p>
          <h3 className="text-sm font-semibold text-fg">The listing</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <Row label="Title" value={listing.title} />
            <Row label="Price" value={[listing.price, listing.currency].filter(Boolean).join(" ") || null} />
            <Row label="Address" value={listing.address} />
            <Row label="Site" value={listing.siteName ?? listing.host} />
            <Row label="Photos found" value={String(listing.images.length)} />
            <Row label="Emails on page" value={listing.emails.join(", ") || null} />
            <Row label="Phones on page" value={listing.phones.join(", ") || null} />
            {listing.description && (
              <details className="mt-3">
                <summary className="label cursor-pointer text-[10px] tracking-wider text-fg-dim uppercase transition hover:text-fg">
                  description
                </summary>
                <p className="mt-2 text-[11px] leading-relaxed text-fg-muted">{listing.description}</p>
              </details>
            )}
          </div>
          {reused.length > 0 && (
            <p
              className="label h-fit shrink-0 rounded-lg border px-3 py-2 text-[10px] leading-relaxed tracking-wide"
              style={{ borderColor: "color-mix(in oklab, var(--danger) 45%, transparent)", color: "var(--danger)" }}
            >
              {reused.length} photo{reused.length === 1 ? "" : "s"} reused
            </p>
          )}
        </div>
      </section>

      {/* Working */}
      <details className="rounded-xl border border-border bg-bg-elev-2">
        <summary className="label cursor-pointer px-4 py-3 text-[10px] tracking-wider text-fg-dim uppercase transition hover:text-fg">
          {data.traces.length} request{data.traces.length === 1 ? "" : "s"} behind this report
        </summary>
        <ul className="space-y-2 border-t border-border px-4 py-3">
          {data.traces.map((t, i) => (
            <li key={i} className="text-[11px]">
              <div className="flex items-center gap-2">
                <span className="label rounded bg-bg-elev px-1.5 py-0.5 text-[9px] tracking-wider text-accent-bright uppercase">
                  {t.api}
                </span>
                <span className="truncate text-fg-muted">{t.label}</span>
                {t.elapsedMs != null && (
                  <span className="label ml-auto shrink-0 text-fg-dim">{(t.elapsedMs / 1000).toFixed(1)}s</span>
                )}
              </div>
              <p className="label mt-1 break-all text-[10px] text-fg-dim">{t.url}</p>
              {t.notice && <p className="mt-1 text-[11px] text-warn">{t.notice}</p>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

const CONCERN_STYLE: Record<string, { cls: string; label: string }> = {
  high: { cls: "v-danger", label: "conflicts" },
  low: { cls: "v-warn", label: "check" },
  none: { cls: "v-safe", label: "consistent" },
};

/**
 * One page that carries the same photograph. The reasons matter more than the
 * link — "these photos are elsewhere" says nothing on its own, so what differs
 * is shown first.
 */
function MatchRow({ match }: { match: AssessedMatch }) {
  const style = CONCERN_STYLE[match.concern];
  return (
    <li className="min-w-0 rounded-lg border border-border bg-bg-elev-2 p-2.5">
      <div className="flex items-start gap-2">
        <span
          className={`label mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] tracking-widest uppercase ${style.cls}`}
        >
          {style.label}
        </span>
        <div className="min-w-0 flex-1">
          {match.url ? (
            <a
              href={match.url}
              target="_blank"
              rel="noreferrer noopener nofollow"
              className="text-[11px] font-medium text-accent-bright transition hover:underline"
            >
              {match.title.slice(0, 90)}
            </a>
          ) : (
            <p className="text-[11px] font-medium text-fg">{match.title.slice(0, 90)}</p>
          )}
          <p className="label truncate text-[10px] text-fg-dim">
            {match.url ? match.host : `${match.host} (no direct link available)`}
          </p>
        </div>
      </div>
      <ul className="mt-1.5 space-y-0.5 pl-1">
        {match.reasons.map((r, i) => (
          <li key={i} className="text-[11px] leading-snug text-fg-muted">
            · {r}
          </li>
        ))}
      </ul>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-fg-muted">{label}</span>
      <span className="label min-w-0 truncate text-right text-xs text-fg">
        {value ?? <span className="text-fg-dim">not found</span>}
      </span>
    </div>
  );
}
