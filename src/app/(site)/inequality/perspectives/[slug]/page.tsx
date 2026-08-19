import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { loadPerspective, PERSPECTIVE_SLUGS } from "@/lib/inequality/perspectives";
import { formatAuthors, getWorkById, getWorksByPerspective } from "@/lib/inequality/research-works";

export function generateStaticParams() {
  return PERSPECTIVE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadPerspective(slug);
  return p ? { title: `${p.meta.title} — Inequality Explained`, description: p.meta.framing } : {};
}

export default async function PerspectivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await loadPerspective(slug);
  if (!p) notFound();
  const { meta, Body } = p;
  // Every library work flagged with this perspective slug is listed here —
  // the cross-link P4.1's Done-When verifies programmatically.
  const flagged = getWorksByPerspective(slug);
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-contested">Contested question</p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">{meta.title}</h1>
      <p className="mt-3 text-lg text-roast">{meta.framing}</p>
      <div className="prose-site mt-6 text-[17px]">
        <Body />
      </div>
      <aside className="mt-10 rounded-md border border-card-border bg-paper p-4 text-sm">
        <h2 className="font-semibold">Library entries in this debate</h2>
        <ul className="mt-2 space-y-1">
          {flagged.map((w) => (
            <li key={w.id}>
              <Link href={`/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}`} className="text-crema-ink underline underline-offset-2">{w.title}</Link>{" "}
              <span className="text-modeled-ink">— {formatAuthors(w.authors)}, {w.year}{w.is_contested ? " · contested" : ""}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-modeled-ink">
          Viewpoint sources: {meta.viewpoints.map((v) => `${v.label} (${v.sources.map((id) => getWorkById(id)?.year ?? id).join(", ")})`).join(" · ")}
        </p>
      </aside>
    </article>
  );
}
