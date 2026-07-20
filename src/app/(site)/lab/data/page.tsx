import type { Metadata } from "next";
import Link from "next/link";
import manifest from "../../../../../public/datasets/manifest.json";
import type { Manifest } from "@/lib/datalab-types";

export const metadata: Metadata = {
  title: "Dataset Library — The Espresso Index",
  description:
    "Every dataset behind the Data Lab: source, license, coverage, and a direct download.",
};

const entries = manifest as unknown as Manifest;

export default function DatasetLibraryPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
      <h1 className="font-display mb-2 text-[32px] font-semibold">
        Dataset Library
      </h1>
      <p className="mb-8 max-w-2xl text-roast">
        Everything the{" "}
        <Link href="/lab" className="underline underline-offset-4">
          Data Lab
        </Link>{" "}
        can chart. Each dataset is refreshed monthly by an audited pipeline,
        normalized to one tidy schema, and free to download.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((d) => (
          <article
            key={d.id}
            className="flex flex-col gap-2 rounded-card border border-card-border bg-paper p-5"
          >
            <h2 className="font-display text-xl font-semibold">{d.name}</h2>
            <p className="text-sm text-espresso/90">{d.description}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-modeled-ink">Source</dt>
              <dd>
                <a
                  href={d.sourceUrl}
                  rel="noopener"
                  className="underline underline-offset-4 hover:text-crema"
                >
                  {d.sourceName}
                </a>
              </dd>
              <dt className="text-modeled-ink">License</dt>
              <dd>{d.license}</dd>
              <dt className="text-modeled-ink">Coverage</dt>
              <dd>
                {d.coverage.from}–{d.coverage.to} ·{" "}
                {d.coverage.countries === 1
                  ? "global series"
                  : `${d.coverage.countries} countries`}{" "}
                · {d.frequency}
              </dd>
              <dt className="text-modeled-ink">Indicators</dt>
              <dd>{d.indicators.map((i) => i.label).join(" · ")}</dd>
            </dl>
            <p className="mt-auto flex items-center justify-between pt-2 text-sm">
              <a
                href={`/datasets/${d.id}.json`}
                download
                className="inline-flex min-h-[36px] items-center rounded-[6px] border border-roast px-3 text-roast hover:bg-porcelain"
              >
                Download JSON ({Math.max(1, Math.round(d.bytes / 1024))}KB)
              </a>
              <span className="text-xs text-modeled-ink">
                updated {d.updated}
              </span>
            </p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm text-modeled-ink">
        Tidy schema: <code>{`{ iso3, date, indicator, value }`}</code> — one
        JSON array per dataset, attribution strings ship in{" "}
        <a href="/datasets/manifest.json" className="underline underline-offset-4">
          the manifest
        </a>
        .
      </p>
    </main>
  );
}
