import type { ComponentType } from "react";
import type { AudienceLevel } from "./types";

export interface ExplainerMeta {
  slug: string;
  title: string;
  summary: string;
  audience_level: AudienceLevel;
  /** ResearchWork ids this article cites — surfaced in the sources box. */
  sources: string[];
}

/** Explicit registry (not fs.readdir) so the MDX modules are statically
 *  imported and bundled; add a line here when adding an article. */
export const EXPLAINER_SLUGS = [
  "what-is-inequality",
  "how-its-measured",
  "kuznets-curve",
  "reading-the-world-map",
] as const;

export async function loadExplainer(slug: string): Promise<{ meta: ExplainerMeta; Body: ComponentType } | null> {
  if (!(EXPLAINER_SLUGS as readonly string[]).includes(slug)) return null;
  const mod = await import(`@/../content/inequality/explainers/${slug}.mdx`);
  return { meta: mod.meta as ExplainerMeta, Body: mod.default as ComponentType };
}

export async function loadAllExplainerMeta(): Promise<ExplainerMeta[]> {
  const all = await Promise.all(EXPLAINER_SLUGS.map((s) => loadExplainer(s)));
  return all.filter(Boolean).map((e) => e!.meta);
}
