import type { ComponentType } from "react";

export interface PerspectiveMeta {
  slug: string;
  title: string;
  framing: string;
  viewpoints: { label: string; sources: string[] }[];
}

/** spirit-level-critique is deferred to v1.1 per BUILD_PLAN P4.1. */
export const PERSPECTIVE_SLUGS = ["technology-vs-politics", "does-inequality-hurt-growth", "gilens-page-debate"] as const;

export async function loadPerspective(slug: string): Promise<{ meta: PerspectiveMeta; Body: ComponentType } | null> {
  if (!(PERSPECTIVE_SLUGS as readonly string[]).includes(slug)) return null;
  const mod = await import(`@/../content/inequality/perspectives/${slug}.mdx`);
  return { meta: mod.meta as PerspectiveMeta, Body: mod.default as ComponentType };
}

export async function loadAllPerspectiveMeta(): Promise<PerspectiveMeta[]> {
  const all = await Promise.all(PERSPECTIVE_SLUGS.map(loadPerspective));
  return all.filter(Boolean).map((p) => p!.meta);
}
