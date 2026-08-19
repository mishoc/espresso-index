import type { DatasetMeta } from "@/lib/inequality/dataset-metadata";
import SourceStamp from "@/components/inequality/SourceStamp";

/** The Data Explorer page template (architecture §3): caption above the
 *  fold, chart, methodology note, data-as-of stamp from the dataset's own
 *  metadata, download link, and a text/table alternative. */
export default function ChartFrame({
  title,
  caption,
  meta,
  downloadHref,
  children,
  table,
  howToRead,
}: {
  title: string;
  caption: string;
  meta: DatasetMeta;
  downloadHref: string;
  children: React.ReactNode;
  table: React.ReactNode;
  howToRead?: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-[900px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">{title}</h1>
      <p className="mt-3 text-lg text-roast">{caption}</p>
      <figure className="mt-6">
        {children}
        <figcaption className="mt-2">
          <SourceStamp label="Data as of" date={meta.last_synced} source={`${meta.source_org} (${meta.source_version})`} href={meta.url} />
        </figcaption>
      </figure>
      {howToRead && (
        <details className="mt-4 rounded-md border border-card-border bg-paper p-4 text-sm">
          <summary className="cursor-pointer font-medium">How to read this chart</summary>
          <div className="mt-2">{howToRead}</div>
        </details>
      )}
      <section className="mt-6 text-sm">
        <h2 className="font-semibold">Methodology</h2>
        <p className="mt-1 text-roast">{meta.methodology}</p>
        <p className="mt-2 text-modeled-ink">
          Coverage: {meta.coverage}. {meta.update_frequency}. License: {meta.license}.{" "}
          <a href={downloadHref} download className="text-crema-ink underline underline-offset-2">Download the data (JSON)</a>.
        </p>
      </section>
      <details className="mt-6 rounded-md border border-card-border p-4">
        <summary className="cursor-pointer font-medium">Data table (text alternative)</summary>
        <div className="mt-3 overflow-x-auto">{table}</div>
      </details>
    </article>
  );
}
