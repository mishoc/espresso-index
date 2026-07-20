/** Data Lab shared types (SPEC-DATALAB §3). Used by the build pipeline
 *  (scripts/datasets/*) and the Lab UI. */

/** Tidy row — every dataset normalizes to this (§3.1). */
export interface TidyRow {
  iso3: string; // ISO alpha-3; "WLD" for non-country/global series
  date: string; // ISO-8601, precision varies: "2025" or "2025-06"
  indicator: string;
  value: number;
}

export interface ManifestIndicator {
  code: string;
  label: string;
}

/** Manifest entry — the single source of truth for names, sources, and
 *  licenses (§3.2). No source/license strings hardcoded in components. */
export interface ManifestEntry {
  id: string;
  name: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  /** Footer template, e.g. "Source: World Bank Open Data (CC-BY 4.0)" */
  attribution: string;
  license: string;
  unit: string;
  frequency: "annual" | "biannual" | "monthly" | "snapshot";
  coverage: { from: string; to: string; countries: number };
  indicators: ManifestIndicator[];
  updated: string; // YYYY-MM-DD of last refresh
  bytes: number; // uncompressed size of the dataset JSON
  /** Per-indicator sanity bounds for validate-datasets (min ≤ value ≤ max). */
  bounds: Record<string, { min: number; max: number }>;
}

export type Manifest = ManifestEntry[];

/** A fetcher produces the tidy rows + its manifest entry (sans bytes,
 *  which the orchestrator computes after serialization). */
export interface FetcherResult {
  rows: TidyRow[];
  manifest: Omit<ManifestEntry, "bytes" | "updated">;
}

export type Fetcher = () => Promise<FetcherResult>;

export const DATASETS_DIR = "public/datasets";

/** Every outbound request identifies itself — WB began rejecting default
 *  client UAs with its 2026-07-13 update; assume any upstream may. */
export const FETCH_UA = "espresso-index-bot/1.0 (+https://www.espressoindex.org)";
