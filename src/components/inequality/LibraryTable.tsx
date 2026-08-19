"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResearchWork, Theme } from "@/lib/inequality/types";
import { applyFilters, DEFAULT_FILTERS, sortWorks, type LibraryFilters, type SortKey } from "@/lib/inequality/library-filter";
import { formatAuthors } from "@/lib/inequality/research-works";

export function ariaSort(k: SortKey, sort: { key: SortKey; dir: "asc" | "desc" }): "ascending" | "descending" | "none" {
  return sort.key === k ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
}

function SortButton({ label, k, sort, onSort }: { label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (k: SortKey) => void }) {
  const active = sort.key === k;
  return (
    <button
      onClick={() => onSort(k)}
      className={`inline-flex min-h-[32px] items-center gap-1 font-medium ${active ? "text-espresso" : "text-modeled-ink"} hover:text-espresso`}
    >
      {label} <span aria-hidden className="text-xs">{active ? (sort.dir === "asc" ? "▲" : "▼") : "△"}</span>
    </button>
  );
}

export default function LibraryTable({
  works,
  themes,
  lockedTheme,
}: {
  works: ResearchWork[];
  themes: Theme[];
  /** Theme pages pre-filter and hide the theme picker (P2.2). */
  lockedTheme?: string;
}) {
  const [filters, setFilters] = useState<LibraryFilters>({
    ...DEFAULT_FILTERS,
    themes: lockedTheme ? [lockedTheme] : [],
  });
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "year", dir: "asc" });
  const set = (patch: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: k === "citations" ? "desc" : "asc" }));

  const rows = useMemo(() => sortWorks(applyFilters(works, filters), sort.key, sort.dir), [works, filters, sort]);
  const themeName = (id: string) => themes.find((t) => t.id === id)?.name ?? id;

  return (
    <div>
      <form className="grid gap-3 rounded-md border border-card-border bg-paper p-4 text-sm sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()} aria-label="Filter the library">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Search</span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="title, author, venue"
            className="min-h-[40px] rounded border border-card-border bg-porcelain px-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Discipline</span>
          <select
            value={filters.discipline}
            onChange={(e) => set({ discipline: e.target.value as LibraryFilters["discipline"] })}
            className="min-h-[40px] rounded border border-card-border bg-porcelain px-2"
          >
            <option value="all">All</option>
            <option value="economics">Economics</option>
            <option value="political-science">Political science</option>
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="font-medium">Years</span>
          <div className="flex items-center gap-2">
            <input type="number" aria-label="From year" value={filters.yearMin} min={1900} max={2100} onChange={(e) => set({ yearMin: Number(e.target.value) || 1900 })} className="min-h-[40px] w-full rounded border border-card-border bg-porcelain px-2" />
            <span aria-hidden>–</span>
            <input type="number" aria-label="To year" value={filters.yearMax} min={1900} max={2100} onChange={(e) => set({ yearMax: Number(e.target.value) || 2100 })} className="min-h-[40px] w-full rounded border border-card-border bg-porcelain px-2" />
          </div>
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-medium">Show only</legend>
          <label className="flex items-center gap-2"><input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => set({ verifiedOnly: e.target.checked })} /> verified citation count</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={filters.contestedOnly} onChange={(e) => set({ contestedOnly: e.target.checked })} /> contested findings</label>
        </fieldset>
        {!lockedTheme && (
          <fieldset className="sm:col-span-2 lg:col-span-4">
            <legend className="font-medium">Themes</legend>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {themes.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={filters.themes.includes(t.id)}
                    onChange={(e) => set({ themes: e.target.checked ? [...filters.themes, t.id] : filters.themes.filter((x) => x !== t.id) })}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form>

      <p className="mt-3 text-sm text-modeled-ink" aria-live="polite">
        {rows.length} of {works.length} works
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-2 py-2" aria-sort={ariaSort("title", sort)}><SortButton label="Title" k="title" sort={sort} onSort={onSort} /></th>
              <th className="px-2 py-2">Authors</th>
              <th className="px-2 py-2" aria-sort={ariaSort("year", sort)}><SortButton label="Year" k="year" sort={sort} onSort={onSort} /></th>
              <th className="px-2 py-2">Venue</th>
              <th className="px-2 py-2">Themes</th>
              <th className="px-2 py-2" aria-sort={ariaSort("citations", sort)}><SortButton label="Citations" k="citations" sort={sort} onSort={onSort} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-b border-card-border/70 align-top">
                <td className="px-2 py-2">
                  <Link href={`/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}`} className="font-medium text-crema-ink underline underline-offset-2">
                    {w.title}
                  </Link>
                  {w.is_contested && (
                    <span className="ml-2 rounded border border-contested/50 px-1.5 py-0.5 text-xs text-contested">contested</span>
                  )}
                </td>
                <td className="px-2 py-2 text-roast">{formatAuthors(w.authors)}</td>
                <td className="px-2 py-2 tabular-nums">{w.year}</td>
                <td className="px-2 py-2 text-roast">{w.venue.split(",")[0]}</td>
                <td className="px-2 py-2 text-xs text-modeled-ink">{w.themes.map(themeName).join(" · ")}</td>
                <td className="px-2 py-2">
                  {w.citation_count ? (
                    <span className="text-verified-ink" title={`${w.citation_count.source} · ${w.citation_count.verified_date}`}>
                      ~{w.citation_count.value.toLocaleString()} <span className="text-xs">✓ verified</span>
                    </span>
                  ) : (
                    <span className="text-xs text-unverified">not verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-8 text-center text-modeled-ink">No works match these filters.</p>}
      </div>
    </div>
  );
}
