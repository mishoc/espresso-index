import Link from "next/link";
import { DATASET_META } from "@/lib/inequality/data-snapshots";

export const metadata = { title: "Data Explorer" };

export default function DataHub() {
  const live = [
    { href: "/inequality/data/us-top-income-shares", title: "US top income shares, 1913–today", meta: DATASET_META["wid-us-top-shares"], blurb: "The top 1% and top 10% share of pre-tax income across a century of tax data." },
    { href: "/inequality/data/country-comparison", title: "Compare countries: Gini over time", meta: DATASET_META["swiid-gini"], blurb: "Pick 2–4 countries and compare standardized Gini coefficients with uncertainty bands." },
    { href: "/inequality/data/gini-world-map", title: "World map: income inequality", meta: DATASET_META["wdi-gini"], blurb: "A heat map of the World Bank Gini index — every country's most recent household survey, with a year slider." },
  ];
  const deferred = [
    { title: "Mobility map (Opportunity Atlas)", note: "Coming later — place-level intergenerational mobility, pending embed/reuse terms." },
    { title: "Where's my income? (percentile tool)", note: "Coming later — an illustrative citizen tool, clearly labeled as such." },
    { title: "Global inequality (elephant curve)", note: "Coming later — Lakner–Milanovic global distribution." },
  ];
  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Data Explorer</h1>
      <p className="mt-2 text-roast">Charts built from static snapshots of public datasets — every one stamped with its data vintage, methodology, and a download link.</p>
      <ul className="mt-8 space-y-4">
        {live.map((c) => (
          <li key={c.href} className="rounded-md border border-card-border p-4">
            <h2 className="text-xl font-semibold"><Link href={c.href} className="hover:underline underline-offset-4">{c.title}</Link></h2>
            <p className="mt-1 text-roast">{c.blurb}</p>
            <p className="mt-1 text-sm text-modeled-ink">{c.meta.source_org} · data as of {c.meta.last_synced}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-lg font-semibold text-modeled-ink">Not yet available</h2>
      <ul className="mt-2 space-y-2">
        {deferred.map((d) => (
          <li key={d.title} className="rounded-md border border-dashed border-card-border p-3 text-sm">
            <span className="font-medium">{d.title}</span> <span className="text-modeled-ink">— {d.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
