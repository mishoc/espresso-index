import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EXPLAINER_SLUGS, loadExplainer } from "@/lib/inequality/explainers";
import { formatAuthors, getWorkById, WORKS_META } from "@/lib/inequality/research-works";
import SourceStamp from "@/components/inequality/SourceStamp";

export function generateStaticParams() {
  return EXPLAINER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await loadExplainer(slug);
  return e ? { title: `${e.meta.title} — Inequality Explained`, description: e.meta.summary } : {};
}

export default async function ExplainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await loadExplainer(slug);
  if (!e) notFound();
  const { meta, Body } = e;
  const sources = meta.sources.map(getWorkById);
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">
        Explainer · {meta.audience_level} level
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">{meta.title}</h1>
      <p className="mt-3 text-lg text-roast">{meta.summary}</p>
      <div className="prose-site mt-6 text-[17px]">
        <Body />
      </div>
      <aside className="mt-10 rounded-md border border-card-border bg-paper p-4 text-sm">
        <h2 className="font-semibold">Sources for this page</h2>
        <ul className="mt-2 space-y-1">
          {sources.map((w) =>
            w ? (
              <li key={w.id}>
                <Link href={`/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}`} className="text-crema-ink underline underline-offset-2">
                  {w.title}
                </Link>{" "}
                <span className="text-modeled-ink">— {formatAuthors(w.authors)}, {w.year}</span>
              </li>
            ) : null,
          )}
        </ul>
        <div className="mt-3">
          <SourceStamp
            label="Bibliography verified"
            date={WORKS_META.migrated_date}
            source="publisher pages, NBER, Semantic Scholar"
            href="/inequality/about/how-we-verify-citations"
          />
        </div>
      </aside>
    </article>
  );
}
