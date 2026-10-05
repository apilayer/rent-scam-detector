import type { Listing } from "@/app/lib/scrape";
import type { ImageMatch, Verdict } from "@/app/lib/verdict";

export interface ITrace {
  api: "zenserp" | "fetch";
  label: string;
  url: string;
  elapsedMs: number | null;
  status: number | null;
  notice: string | null;
}

export interface IAnalysis {
  listing: Listing;
  matches: ImageMatch[];
  verdict: Verdict;
  traces: ITrace[];
  /** Images present but not searched, because of the per-request budget. */
  skippedImages: number;
}

export interface IApiError {
  error: string;
}
