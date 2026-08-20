import type { Metadata } from "next";
import Link from "next/link";
import giniRows from "@/../public/datasets/wdi-gini.json";
import ChartFrame from "@/components/inequality/charts/ChartFrame";
import GiniWorldMap from "@/components/inequality/charts/GiniWorldMap";
import type { TidyRow } from "@/lib/datalab-types";
import { DATASET_META } from "@/lib/inequality/data-snapshots";
import { latestGini } from "@/lib/inequality/gini-map";
import { countryName } from "@/lib/lab-data";

export const metadata: Metadata = { title: "World map: income inequality (Gini index)" };

const ROWS = giniRows as TidyRow[];

export default function Page() {
  const meta = DATASET_META["wdi-gini"];
  const latest = latestGini(ROWS);
  const hi = latest[0];
  const lo = latest[latest.length - 1];
  return (
    <ChartFrame
      title="World map: income inequality"
      caption={`The Gini index runs from 0 (everyone earns the same) to 100 (one person earns everything). In each country's most recent survey, the range runs from ${countryName(lo.iso3)} at ${lo.value.toFixed(1)} (${lo.year}) to ${countryName(hi.iso3)} at ${hi.value.toFixed(1)} (${hi.year}). Darker red means more unequal; hover any country for its value.`}
      meta={meta}
      downloadHref="/datasets/wdi-gini.json"
      howToRead={
        <p>
          Each country shows its most recent household survey, so values come
          from different years — check the survey year in the table below
          before comparing two countries. Some countries measure income and
          others consumption, which are not perfectly comparable; for a
          series standardized across those differences, see{" "}
          <Link href="/inequality/data/country-comparison" className="text-crema-ink underline underline-offset-2">
            the SWIID country comparison
          </Link>
          . Background:{" "}
          <Link href="/inequality/learn/how-its-measured" className="text-crema-ink underline underline-offset-2">
            how inequality is measured
          </Link>
          . You can also explore this dataset against others in{" "}
          <Link href="/lab?type=map&series=wdi-gini.gini_index&countries=all" className="text-crema-ink underline underline-offset-2">
            the Data Lab
          </Link>
          .
        </p>
      }
      table={
        <table className="tabular w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs text-modeled-ink uppercase tracking-wide">
              <th className="py-1 pr-4">Country</th>
              <th className="py-1 pr-4">Gini index</th>
              <th className="py-1">Survey year</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((g) => (
              <tr key={g.iso3} className="border-b border-card-border/60">
                <td className="py-1 pr-4">{countryName(g.iso3)}</td>
                <td className="py-1 pr-4">{g.value.toFixed(1)}</td>
                <td className="py-1">{g.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <GiniWorldMap rows={ROWS} />
    </ChartFrame>
  );
}
