import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getAllWorks, getWorkById } from "@/lib/inequality/research-works";

const SLUGS = ["technology-vs-politics", "does-inequality-hurt-growth", "gilens-page-debate"];
const DEFERRED = ["spirit-level-critique"]; // v1.1 per BUILD_PLAN

describe("perspectives (P4.1) — cross-linking and editorial rules", () => {
  it("every library work with a related_perspective_slug points at a built page (or the one documented deferral)", () => {
    for (const w of getAllWorks()) {
      if (w.related_perspective_slug)
        expect([...SLUGS, ...DEFERRED], `${w.id} → ${w.related_perspective_slug}`).toContain(w.related_perspective_slug);
    }
  });

  it("every viewpoint source is a real library work, and both viewpoints are sourced", () => {
    for (const slug of SLUGS) {
      const src = readFileSync(`content/inequality/perspectives/${slug}.mdx`, "utf8");
      const metaSrc = src.slice(0, src.indexOf("};") + 2);
      const ids = [...metaSrc.matchAll(/"([a-z0-9-]+-\d{4}(?:-[a-z]+)?)"/g)].map((m) => m[1]);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(getWorkById(id), `${slug} cites unknown ${id}`).toBeDefined();
      expect((metaSrc.match(/label:/g) ?? []).length, `${slug} needs two viewpoints`).toBeGreaterThanOrEqual(2);
      expect(src).toContain("## Where the field stands");
    }
  });

  it("contains no policy-recommendation language (CLAUDE.md editorial rule)", () => {
    const banned = [/\bshould (raise|cut|adopt|abolish|tax)\b/i, /\bthe answer is\b/i, /\bpolicymakers must\b/i, /\bwe recommend\b/i];
    for (const slug of SLUGS) {
      const body = readFileSync(`content/inequality/perspectives/${slug}.mdx`, "utf8");
      for (const re of banned) expect(body, `${slug} matches ${re}`).not.toMatch(re);
    }
  });
});
