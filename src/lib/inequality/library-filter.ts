import type { ResearchWork } from "./types";
import { disciplineOf } from "./research-works";

export interface LibraryFilters {
  discipline: "all" | "economics" | "political-science";
  themes: string[]; // empty = all
  yearMin: number;
  yearMax: number;
  verifiedOnly: boolean;
  contestedOnly: boolean;
  query: string;
}

export const DEFAULT_FILTERS: LibraryFilters = {
  discipline: "all",
  themes: [],
  yearMin: 1900,
  yearMax: 2100,
  verifiedOnly: false,
  contestedOnly: false,
  query: "",
};

/** Pure, so P2.1's correctness test can hit it directly with fixtures. */
export function applyFilters(works: ResearchWork[], f: LibraryFilters): ResearchWork[] {
  const q = f.query.trim().toLowerCase();
  return works.filter((w) => {
    if (f.discipline !== "all") {
      const d = disciplineOf(w);
      if (d !== f.discipline && d !== "both") return false;
    }
    if (f.themes.length && !f.themes.some((t) => w.themes.includes(t))) return false;
    if (w.year < f.yearMin || w.year > f.yearMax) return false;
    if (f.verifiedOnly && w.citation_count === null) return false;
    if (f.contestedOnly && !w.is_contested) return false;
    if (q) {
      const hay = `${w.title} ${w.authors.join(" ")} ${w.venue}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export type SortKey = "year" | "title" | "citations";
export function sortWorks(works: ResearchWork[], key: SortKey, dir: "asc" | "desc"): ResearchWork[] {
  const s = dir === "asc" ? 1 : -1;
  return [...works].sort((a, b) => {
    if (key === "year") return s * (a.year - b.year) || a.title.localeCompare(b.title);
    if (key === "title") return s * a.title.localeCompare(b.title);
    // citations: unverified always last regardless of direction
    const av = a.citation_count?.value ?? null;
    const bv = b.citation_count?.value ?? null;
    if (av === null && bv === null) return a.title.localeCompare(b.title);
    if (av === null) return 1;
    if (bv === null) return -1;
    return s * (av - bv);
  });
}
