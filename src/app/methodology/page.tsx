import type { Metadata } from "next";
import { dataset } from "@/lib/data";
import ConfidenceBadge from "@/components/ConfidenceBadge";

export const metadata: Metadata = {
  title: "Methodology — The Espresso Index",
  description: "Sources, conversion method, confidence tiers, and limitations.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10">
      <h1 className="font-display mb-6 text-[32px] font-semibold">Methodology</h1>
      <div className="flex flex-col gap-4 text-espresso/90">
        <p>
          Full methodology copy lands this week. The short version, so nothing
          here is ever a black box:
        </p>
        <p>
          <ConfidenceBadge tier="surveyed" /> {dataset.counts.surveyed} economies
          — espresso surveys and price-index data (±12%).
        </p>
        <p>
          <ConfidenceBadge tier="derived" /> {dataset.counts.derived} economies —
          converted from cappuccino prices at ~65% (±20%).
        </p>
        <p>
          <ConfidenceBadge tier="modeled" /> {dataset.counts.modeled} economies —
          regional anchors and cost-of-living relationships (±40%). An estimate,
          not a measurement.
        </p>
        <p className="text-sm text-modeled">
          Burden = price ÷ (GDP per capita ÷ 365) × 100. GDP per capita is a
          proxy for daily income, not disposable income — the biggest
          methodological leap on this site. World Bank GDP figures can lag by
          years; stale figures are marked with their year.
        </p>
      </div>
    </main>
  );
}
