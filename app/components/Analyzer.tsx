"use client";

import { useEffect, useRef, useState } from "react";
import type { IAnalysis } from "@/interfaces/analysis.interface";
import { Report } from "./Report";

function Field({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] tracking-wider text-fg-dim uppercase">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mono mt-1 w-full rounded-lg border border-border bg-bg-elev-2 px-2.5 py-2 text-[13px] text-fg outline-none transition focus:border-accent"
      />
      {hint && <span className="mt-1 block text-[10px] text-fg-dim">{hint}</span>}
    </label>
  );
}

/**
 * A reverse image lookup drives a real search engine and takes tens of seconds,
 * so the wait is narrated rather than hidden behind a spinner — silence for a
 * minute reads as a broken page.
 */
const STAGES = [
  "Fetching the listing page",
  "Reading the advert and its photographs",
  "Reverse image searching every photo",
  "Still searching. This step drives a real search engine.",
  "Almost there, weighing up the findings",
];

type Mode = "url" | "upload";

export function Analyzer() {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [manual, setManual] = useState({ sourceUrl: "", price: "", address: "", title: "" });
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IAnalysis | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function startProgress() {
    setBusy(true);
    setError(null);
    setData(null);
    setStage(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      9000
    );
  }

  async function send(init: RequestInit) {
    startProgress();
    try {
      const res = await fetch("/api/analyze", init);
      const json = await res.json();
      if (!res.ok) {
        setBlocked(Boolean(json.blocked));
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }
      setBlocked(false);
      setData(json as IAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (timer.current) clearInterval(timer.current);
      setBusy(false);
    }
  }

  function analyze(e: React.FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    void send({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: target }),
    });
  }

  function analyzeUploads(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    const body = new FormData();
    files.slice(0, 4).forEach((f) => body.append("photos", f));
    Object.entries(manual).forEach(([k, v]) => v.trim() && body.append(k, v.trim()));
    void send({ method: "POST", body });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-bg-elev p-4">
        <div role="tablist" className="mb-4 flex gap-1 rounded-lg bg-bg-elev-2 p-1">
          {([
            ["url", "Paste a link"],
            ["upload", "Upload the photos"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={`mono flex-1 rounded-md px-3 py-1.5 text-[11px] tracking-wide transition ${
                mode === id ? "bg-bg-elev font-semibold text-fg" : "text-fg-dim hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <form onSubmit={analyze}>
            <label htmlFor="listing-url" className="mono text-[10px] tracking-wider text-fg-dim uppercase">
              Rental listing URL
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="listing-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://  paste the listing you were sent"
                className="mono min-w-0 flex-1 rounded-lg border border-border bg-bg-elev-2 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-accent"
              />
              <button
                type="submit"
                disabled={busy || !url.trim()}
                className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-bright disabled:opacity-50"
              >
                {busy ? "Checking" : "Check this listing"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-fg-dim">
              Some portals refuse automated requests. If this one does, switch to
              uploading the photos instead.
            </p>
          </form>
        ) : (
          <form onSubmit={analyzeUploads}>
            <label className="mono text-[10px] tracking-wider text-fg-dim uppercase">
              Photos from the listing
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                setFiles([...e.dataTransfer.files].slice(0, 4));
              }}
              className={`mt-2 cursor-pointer rounded-lg border border-dashed px-3 py-6 text-center transition ${
                dragging ? "border-accent bg-accent-soft" : "border-border hover:border-accent/60"
              }`}
            >
              {files.length > 0 ? (
                <p className="text-xs text-fg">
                  {files.length} photo{files.length === 1 ? "" : "s"} ready:{" "}
                  <span className="mono text-fg-muted">
                    {files.map((f) => f.name).join(", ").slice(0, 70)}
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-xs text-fg-muted">
                    Drop up to four photos from the advert, or click to choose
                  </p>
                  <p className="mono mt-1 text-[10px] text-fg-dim">
                    Screenshots work. Saved images work. 12 MB each.
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 4))}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Field
                label="Listing URL (optional)"
                placeholder="https://  where you saw it"
                value={manual.sourceUrl}
                onChange={(v) => setManual({ ...manual, sourceUrl: v })}
                hint="Used to ignore matches on that same site."
              />
              <Field
                label="Asking rent (optional)"
                placeholder="£1,400 pcm"
                value={manual.price}
                onChange={(v) => setManual({ ...manual, price: v })}
                hint="Needed to spot a price that does not match."
              />
              <Field
                label="Address or area (optional)"
                placeholder="Bermondsey, London SE1"
                value={manual.address}
                onChange={(v) => setManual({ ...manual, address: v })}
                hint="Needed to spot the same rooms listed elsewhere."
              />
              <Field
                label="Listing title (optional)"
                placeholder="2 bed flat, Alscot Road"
                value={manual.title}
                onChange={(v) => setManual({ ...manual, title: v })}
                hint=""
              />
            </div>

            <button
              type="submit"
              disabled={busy || files.length === 0}
              className="mt-3 w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-bright disabled:opacity-50"
            >
              {busy ? "Checking" : `Check ${files.length || ""} photo${files.length === 1 ? "" : "s"}`.trim()}
            </button>
            <p className="mt-2 text-[11px] text-fg-dim">
              Give the rent and the area if you have them. Without them the photos
              can still be traced, but there is nothing to compare the other
              listings against.
            </p>
          </form>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger/5 p-3">
            <p className="text-xs text-danger">{error}</p>
            {blocked && mode === "url" && (
              <button
                type="button"
                onClick={() => {
                  setManual((m) => ({ ...m, sourceUrl: url }));
                  setMode("upload");
                  setError(null);
                }}
                className="mono mt-2 rounded-md border border-accent/50 bg-accent-soft px-2.5 py-1.5 text-[11px] text-accent transition hover:brightness-110"
              >
                Upload the photos instead
              </button>
            )}
          </div>
        )}
      </div>

      {busy && (
        <div className="rounded-xl border border-border bg-bg-elev p-5">
          <div className="flex items-center gap-3">
            <span className="pulse-soft h-2 w-2 rounded-full bg-accent" />
            <p className="text-sm text-fg">{STAGES[stage]}</p>
          </div>
          <p className="mt-2 text-[11px] text-fg-dim">
            Reverse image search can take up to a minute per listing. Leave this open.
          </p>
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-3 rounded" style={{ width: `${90 - i * 18}%` }} />
            ))}
          </div>
        </div>
      )}

      {!busy && !data && !error && (
        <div className="overflow-hidden rounded-xl border border-dashed border-border bg-bg-elev">
          <div className="flex items-center gap-4 p-4">
            <span className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=400&auto=format&fit=crop"
                alt=""
                className="h-full w-full object-cover opacity-70"
              />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">Nothing checked yet</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">
                Paste the link you were sent. The photo search is the slow part and
                takes up to a minute, so give it a moment once you start.
              </p>
            </div>
          </div>
        </div>
      )}

      {data && <Report data={data} />}
    </div>
  );
}
