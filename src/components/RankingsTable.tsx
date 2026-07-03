"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { dataset, flagEmoji } from "@/lib/data";
import type { Country, Tier } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";

type SortKey = "rank" | "name" | "priceUSD" | "burdenPct" | "tier";
type SortDir = "asc" | "desc";

const TIER_ORDER: Record<Tier, number> = { surveyed: 0, derived: 1, modeled: 2 };
const PIN_KEY = "espresso-index:reference";

/* localStorage can be unavailable (private mode) — pin degrades to
   per-session state, silently (SPEC §2 edge cases). */
let sessionPin = "";
const pinListeners = new Set<() => void>();

function readPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? sessionPin;
  } catch {
    return sessionPin;
  }
}
function writePin(iso3: string) {
  sessionPin = iso3;
  try {
    if (iso3) localStorage.setItem(PIN_KEY, iso3);
    else localStorage.removeItem(PIN_KEY);
  } catch {
    /* per-session only */
  }
  pinListeners.forEach((l) => l());
}
function subscribePin(listener: () => void): () => void {
  pinListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    pinListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function compare(a: Country, b: Country, key: SortKey, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  // Null burden always sorts to the bottom, regardless of direction (SPEC §4 DoD).
  if (key === "burdenPct") {
    if (a.burdenPct === null && b.burdenPct === null) return a.name.localeCompare(b.name);
    if (a.burdenPct === null) return 1;
    if (b.burdenPct === null) return -1;
    return sign * (a.burdenPct - b.burdenPct);
  }
  let d: number;
  switch (key) {
    case "rank":
      d = (a.rank ?? Infinity) - (b.rank ?? Infinity);
      break;
    case "name":
      d = a.name.localeCompare(b.name);
      break;
    case "priceUSD":
      d = a.priceUSD - b.priceUSD;
      break;
    case "tier":
      d = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      break;
  }
  return sign * (d || a.name.localeCompare(b.name));
}

const fmtPrice = (v: number) => `$${v.toFixed(2)}`;
const fmtBurden = (c: Country) =>
  c.burdenPct === null ? "—" : `${c.burdenPct.toFixed(1)}%`;

function citation(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `The Espresso Index (v${dataset.version}, data as of ${dataset.generated}). Espresso prices and purchasing-power burden across ${dataset.total} economies. Retrieved ${today}.`;
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex min-h-[28px] items-center gap-1 hover:text-espresso ${active ? "text-espresso" : "text-roast"}`}
      >
        {label}
        <span className="text-[10px]">{active ? (sort.dir === "asc" ? "▲" : "▼") : "△"}</span>
      </button>
    </th>
  );
}

function BurdenCell({ c }: { c: Country }) {
  if (c.burdenPct === null)
    return (
      <span title="No World Bank GDP-per-capita data for this economy" className="text-modeled">
        —
      </span>
    );
  const stale = c.gdpYear !== null && c.gdpYear < 2022;
  return (
    <span title={stale ? `GDP figure as of ${c.gdpYear}` : undefined}>
      {fmtBurden(c)}
      {stale && <span className="text-modeled text-xs"> ({c.gdpYear})</span>}
    </span>
  );
}

export default function RankingsTable() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "rank", dir: "asc" });
  const pin = useSyncExternalStore(subscribePin, readPin, () => "");
  const [toast, setToast] = useState(false);

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));

  const setReference = (iso3: string) => {
    writePin(iso3);
  };

  const cite = async () => {
    try {
      await navigator.clipboard.writeText(citation());
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch {
      window.prompt("Copy citation:", citation());
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dataset.countries.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [query, sort]);

  const pinned = pin ? dataset.countries.find((c) => c.iso3 === pin) : undefined;
  const display = pinned ? [pinned, ...rows.filter((c) => c.iso3 !== pin)] : rows;

  return (
    <div className="w-full">
      {/* sticky controls */}
      <div className="sticky top-0 z-10 -mx-2 mb-4 flex flex-wrap items-center gap-2 border-b border-card-border bg-porcelain/95 px-2 py-3 backdrop-blur">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 196 economies…"
          aria-label="Search economies"
          className="min-h-[44px] w-full max-w-xs rounded-[6px] border border-card-border bg-paper px-3 text-sm outline-none focus:border-crema sm:w-auto"
        />
        <select
          value={pin}
          onChange={(e) => setReference(e.target.value)}
          aria-label="Pin a reference country"
          className="min-h-[44px] rounded-[6px] border border-card-border bg-paper px-2 text-sm text-roast focus:border-crema"
        >
          <option value="">Pin a reference…</option>
          {[...dataset.countries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name}
              </option>
            ))}
        </select>
        <div className="ml-auto flex gap-2">
          <a
            href="/espresso-index.csv"
            download
            className="inline-flex min-h-[44px] items-center rounded-[6px] bg-crema px-4 text-sm font-medium text-espresso hover:brightness-105"
          >
            Download CSV
          </a>
          <button
            onClick={cite}
            className="inline-flex min-h-[44px] items-center rounded-[6px] border border-roast px-4 text-sm text-roast hover:bg-paper"
          >
            Cite this index
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-modeled">
        {dataset.total} economies · {dataset.counts.surveyed} surveyed ·{" "}
        {dataset.counts.derived} derived · {dataset.counts.modeled} modeled ·{" "}
        <Link href="/methodology" className="underline underline-offset-4 hover:text-espresso">
          how we know
        </Link>
      </p>

      {display.length === 0 ? (
        <p className="py-16 text-center text-roast">
          No country matches “{query.trim()}” — yet.
        </p>
      ) : (
        <>
          {/* table ≥ sm */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="mx-auto w-full max-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-xs uppercase tracking-wide">
                  <SortHeader label="Rank" k="rank" sort={sort} onSort={onSort} className="w-16" />
                  <SortHeader label="Country" k="name" sort={sort} onSort={onSort} />
                  <SortHeader label="Price" k="priceUSD" sort={sort} onSort={onSort} className="text-right" />
                  <SortHeader label="Burden" k="burdenPct" sort={sort} onSort={onSort} className="text-right" />
                  <SortHeader label="Confidence" k="tier" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody>
                {display.map((c) => {
                  const isPinned = c.iso3 === pin;
                  return (
                    <tr
                      key={c.iso3 + (isPinned ? "-pin" : "")}
                      className={`border-b border-card-border/60 hover:bg-paper ${isPinned ? "border-l-4 border-l-crema bg-paper" : ""}`}
                    >
                      <td className="tabular px-3 py-2 text-roast">{c.rank}</td>
                      <td className="px-3 py-2">
                        <span className="mr-2">{flagEmoji(c.iso3)}</span>
                        {c.name}
                        <span className="ml-2 text-xs text-modeled">{c.region}</span>
                      </td>
                      <td className="tabular px-3 py-2 text-right">{fmtPrice(c.priceUSD)}</td>
                      <td className="tabular px-3 py-2 text-right">
                        <BurdenCell c={c} />
                      </td>
                      <td className="px-3 py-2">
                        <ConfidenceBadge tier={c.tier} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* cards < sm (SPEC: mobile collapses to cards) */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {display.map((c) => {
              const isPinned = c.iso3 === pin;
              return (
                <li
                  key={c.iso3 + (isPinned ? "-pin" : "")}
                  className={`rounded-card border border-card-border bg-paper p-3 ${isPinned ? "border-l-4 border-l-crema" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      <span className="tabular mr-2 text-roast">#{c.rank}</span>
                      {flagEmoji(c.iso3)} {c.name}
                    </span>
                    <span className="tabular font-medium">{fmtPrice(c.priceUSD)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-modeled">
                    <span>
                      Burden: <BurdenCell c={c} />
                    </span>
                    <ConfidenceBadge tier={c.tier} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* CitationToast */}
      <div
        role="status"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[6px] bg-espresso px-4 py-2 text-sm text-porcelain shadow-lg transition-opacity ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        Citation copied to clipboard
      </div>
    </div>
  );
}
