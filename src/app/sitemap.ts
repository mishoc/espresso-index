import type { MetadataRoute } from "next";
import { getAllThemes, getAllWorks } from "@/lib/inequality/research-works";
import { EXPLAINER_SLUGS } from "@/lib/inequality/explainers";
import { PERSPECTIVE_SLUGS } from "@/lib/inequality/perspectives";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.espressoindex.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const espresso = ["", "/rankings", "/lab", "/lab/data", "/methodology", "/about"];
  const ineq = ["", "/learn", "/data", "/data/us-top-income-shares", "/data/country-comparison", "/library", "/perspectives", "/resources", "/about", "/about/editorial-standards", "/about/how-we-verify-citations", "/about/corrections", "/about/contact", "/search"].map((p) => `/inequality${p}`);
  return [
    ...espresso.map((p) => ({ url: `${BASE}${p}` })),
    ...ineq.map((p) => ({ url: `${BASE}${p}` })),
    ...EXPLAINER_SLUGS.map((s) => ({ url: `${BASE}/inequality/learn/${s}` })),
    ...PERSPECTIVE_SLUGS.map((s) => ({ url: `${BASE}/inequality/perspectives/${s}` })),
    ...getAllThemes().map((t) => ({ url: `${BASE}/inequality/library/themes/${t.id}` })),
    ...getAllWorks().map((w) => ({ url: `${BASE}/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}` })),
  ];
}
