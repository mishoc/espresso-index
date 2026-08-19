import Link from "next/link";
import type { ResearchWork } from "@/lib/inequality/types";
import { formatAuthors, getThemeById, getWorkById } from "@/lib/inequality/research-works";
import CitationCountBadge from "./CitationCountBadge";

export default function ResearchWorkDetail({ work }: { work: ResearchWork }) {
  const related = work.related_works.map(getWorkById).filter(Boolean) as ResearchWork[];
  return (
    <article className="mx-auto w-full max-w-[820px] px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">
        {work.type === "paper" ? "Paper" : "Book"} · {work.year} ·{" "}
        {work.audience_level} level
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">{work.title}</h1>
      <p className="mt-2 text-lg text-roast">{work.authors.join(", ")}</p>

      {/* Full citation */}
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-modeled-ink">Venue</dt>
        <dd>{work.venue}</dd>
        {work.doi_or_isbn && (
          <>
            <dt className="text-modeled-ink">{work.type === "paper" ? "DOI" : "ISBN"}</dt>
            <dd>{work.doi_or_isbn}</dd>
          </>
        )}
        <dt className="text-modeled-ink">Link</dt>
        <dd>
          {work.url ? (
            <a href={work.url} rel="noopener" className="text-crema-ink underline underline-offset-2">
              publisher / source page
            </a>
          ) : (
            <span className="text-modeled-ink">not available</span>
          )}
        </dd>
      </dl>

      <div className="mt-6">
        <CitationCountBadge count={work.citation_count} />
      </div>

      {work.is_contested && (
        <div className="mt-4 rounded-md border border-contested/40 bg-contested/5 px-3 py-2 text-sm">
          <p className="font-medium text-contested">Contested finding</p>
          {work.contested_note && <p className="text-roast">{work.contested_note}</p>}
          {work.related_perspective_slug && (
            <p className="mt-1">
              <Link href={`/inequality/perspectives/${work.related_perspective_slug}`} className="text-crema-ink underline underline-offset-2">
                Read both sides of this debate →
              </Link>
            </p>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">In plain language</h2>
        <p className="mt-2 text-lg">{work.summary_plain}</p>
      </section>
      <details className="mt-4 rounded-md border border-card-border bg-paper p-4">
        <summary className="cursor-pointer font-medium">Technical summary</summary>
        <p className="mt-2">{work.summary_technical}</p>
      </details>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Key takeaways</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {work.key_takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 text-sm">
        <h2 className="text-base font-semibold">Themes</h2>
        <p className="mt-1 flex flex-wrap gap-2">
          {work.themes.map((t) => (
            <Link key={t} href={`/inequality/library/themes/${t}`} className="rounded border border-card-border px-2 py-0.5 hover:border-crema">
              {getThemeById(t)?.name ?? t}
            </Link>
          ))}
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Related works</h2>
          <ul className="mt-2 space-y-1">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/inequality/library/${r.type === "paper" ? "papers" : "books"}/${r.id}`} className="text-crema-ink underline underline-offset-2">
                  {r.title}
                </Link>{" "}
                <span className="text-modeled-ink">— {formatAuthors(r.authors)}, {r.year}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-sm">
        <a href={`/inequality/library/cite/${work.id}.bib`} className="text-crema-ink underline underline-offset-2">Cite (BibTeX)</a>
        {" · "}
        <a href={`/inequality/library/cite/${work.id}.ris`} className="text-crema-ink underline underline-offset-2">Cite (RIS)</a>
        {" · "}
        <Link href="/inequality/library" className="text-crema-ink underline underline-offset-2">← Library</Link>
      </p>
    </article>
  );
}
