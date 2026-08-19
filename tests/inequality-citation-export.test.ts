import { describe, expect, it } from "vitest";
import { bibliographyBib, bibliographyRis, toBibTeX, toRIS } from "@/lib/inequality/citation-export";
import { getAllWorks, getWorkById } from "@/lib/inequality/research-works";

/** Minimal-but-real BibTeX structural parser: balanced braces, one entry
 *  per @type{key, ...} block, key/value fields. Mirrors what bibtexparser
 *  rejects (unbalanced braces, missing keys, duplicate keys). */
function parseBib(src: string) {
  const entries: { type: string; key: string; fields: Record<string, string> }[] = [];
  const re = /@(\w+)\{([^,\s]+),/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let depth = 1, i = re.lastIndex;
    while (i < src.length && depth > 0) { if (src[i] === "{") depth++; else if (src[i] === "}") depth--; i++; }
    if (depth !== 0) throw new Error(`unbalanced braces in ${m[2]}`);
    const body = src.slice(re.lastIndex, i - 1);
    const fields: Record<string, string> = {};
    for (const fm of body.matchAll(/(\w+)\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) fields[fm[1]] = fm[2];
    entries.push({ type: m[1], key: m[2], fields });
    re.lastIndex = i;
  }
  return entries;
}

describe("citation export (P2.3)", () => {
  it("site-wide .bib parses: 22 entries, unique keys, required fields present", () => {
    const entries = parseBib(bibliographyBib(getAllWorks()));
    expect(entries).toHaveLength(22);
    expect(new Set(entries.map((e) => e.key)).size).toBe(22);
    for (const e of entries) {
      expect(["article", "book"]).toContain(e.type);
      expect(e.fields.title).toBeTruthy();
      expect(e.fields.author).toBeTruthy();
      expect(e.fields.year).toMatch(/^\d{4}$/);
    }
  });

  it("never invents fields: no abstract/pages/DOI unless present in source data", () => {
    const kuznets = toBibTeX(getWorkById("kuznets-1955")!);
    expect(kuznets).not.toContain("abstract");
    expect(kuznets).not.toContain("doi");
    const ps = toBibTeX(getWorkById("piketty-saez-2003")!);
    expect(ps).toContain("doi = {10.1162/00335530360535135}");
    expect(ps).toContain("pages = {1--39}");
  });

  it("RIS has TY/ER framing for every entry and an AU per author", () => {
    const ris = bibliographyRis(getAllWorks());
    expect((ris.match(/^TY  - /gm) ?? []).length).toBe(22);
    expect((ris.match(/^ER  - /gm) ?? []).length).toBe(22);
    const chetty = toRIS(getWorkById("chetty-et-al-2017")!);
    expect((chetty.match(/^AU  - /gm) ?? []).length).toBe(6);
  });
});
