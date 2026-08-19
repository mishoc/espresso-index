import type { ResearchWork } from "./types";

/** BibTeX/RIS built ONLY from fields present in research-works.json.
 *  No abstracts, no invented pages/publishers — if it isn't in the data,
 *  it isn't in the export (BUILD_PLAN P2.3). */

const bibEscape = (s: string) => s.replace(/[{}]/g, "").replace(/&/g, "\\&").replace(/%/g, "\\%");

function splitVenue(venue: string): { journal?: string; publisher?: string; volume?: string; number?: string; pages?: string } {
  // Papers: "Quarterly Journal of Economics, 118(1), 1–39"
  const m = venue.match(/^(.+?),\s*(\d+)\((\d+)\),\s*([\d–-]+)$/);
  if (m) return { journal: m[1], volume: m[2], number: m[3], pages: m[4].replace("–", "--") };
  return { publisher: venue };
}

export function toBibTeX(w: ResearchWork): string {
  const v = splitVenue(w.venue);
  const fields: [string, string | undefined][] = [
    ["title", `{${bibEscape(w.title)}}`],
    ["author", w.authors.map(bibEscape).join(" and ")],
    ["year", String(w.year)],
  ];
  if (w.type === "paper") {
    fields.push(["journal", v.journal ?? w.venue], ["volume", v.volume], ["number", v.number], ["pages", v.pages]);
    if (w.doi_or_isbn) fields.push(["doi", w.doi_or_isbn]);
  } else {
    fields.push(["publisher", bibEscape(w.venue)]);
    if (w.doi_or_isbn) fields.push(["isbn", w.doi_or_isbn]);
  }
  if (w.url) fields.push(["url", w.url]);
  const body = fields
    .filter(([, val]) => val !== undefined && val !== "")
    .map(([k, val]) => `  ${k} = {${val}}`)
    .join(",\n");
  return `@${w.type === "paper" ? "article" : "book"}{${w.id},\n${body}\n}\n`;
}

export function toRIS(w: ResearchWork): string {
  const v = splitVenue(w.venue);
  const lines: string[] = [`TY  - ${w.type === "paper" ? "JOUR" : "BOOK"}`, `ID  - ${w.id}`, `TI  - ${w.title}`];
  for (const a of w.authors) lines.push(`AU  - ${a}`);
  lines.push(`PY  - ${w.year}`);
  if (w.type === "paper") {
    lines.push(`JO  - ${v.journal ?? w.venue}`);
    if (v.volume) lines.push(`VL  - ${v.volume}`);
    if (v.number) lines.push(`IS  - ${v.number}`);
    if (v.pages) {
      const [sp, ep] = v.pages.split("--");
      lines.push(`SP  - ${sp}`);
      if (ep) lines.push(`EP  - ${ep}`);
    }
    if (w.doi_or_isbn) lines.push(`DO  - ${w.doi_or_isbn}`);
  } else {
    lines.push(`PB  - ${w.venue}`);
    if (w.doi_or_isbn) lines.push(`SN  - ${w.doi_or_isbn}`);
  }
  if (w.url) lines.push(`UR  - ${w.url}`);
  lines.push("ER  - ");
  return lines.join("\n") + "\n";
}

export const bibliographyBib = (works: ResearchWork[]) => works.map(toBibTeX).join("\n");
export const bibliographyRis = (works: ResearchWork[]) => works.map(toRIS).join("\n");
