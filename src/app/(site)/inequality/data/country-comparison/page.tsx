import type { Metadata } from "next";
import Link from "next/link";
import ChartFrame from "@/components/inequality/charts/ChartFrame";
import CountryComparisonChart from "@/components/inequality/charts/CountryComparisonChart";
import { DATASET_META, SWIID } from "@/lib/inequality/data-snapshots";

export const metadata: Metadata = { title: "Compare countries: Gini coefficients" };

const DEFAULTS = ["United States", "Sweden", "Brazil"];

export default function Page() {
  const meta = DATASET_META["swiid-gini"];
  const us = SWIID.data["United States"].at(-1)!;
  const se = SWIID.data["Sweden"].at(-1)!;
  return (
    <ChartFrame
      title="Compare countries: income inequality over time"
      caption={`Pick two to four countries and compare their Gini coefficients (0 = perfect equality, 100 = one person has everything). In the latest year, the United States sits near ${us.gini_disp.toFixed(0)} and Sweden near ${se.gini_disp.toFixed(0)} on disposable income.`}
      meta={meta}
      downloadHref="/data/swiid-gini.json"
      howToRead={
        <p>
          Higher is more unequal. The shaded band is SWIID&apos;s uncertainty from harmonizing different national sources — differences smaller than the bands shouldn&apos;t be over-read. Disposable income means after taxes and transfers. Background: <Link href="/inequality/learn/how-its-measured" className="text-crema-ink underline underline-offset-2">how inequality is measured</Link>; the dataset paper: <Link href="/inequality/library/papers/solt-2020" className="text-crema-ink underline underline-offset-2">Solt (2020)</Link>.
        </p>
      }
      table={<p className="text-sm text-modeled-ink">The data table for the currently selected countries is below the chart.</p>}
    >
      <CountryComparisonChart countries={SWIID.countries} data={SWIID.data} defaults={DEFAULTS} />
    </ChartFrame>
  );
}
