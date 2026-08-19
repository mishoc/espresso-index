import type { Metadata } from "next";
import ChartFrame from "@/components/inequality/charts/ChartFrame";
import TopIncomeShareChart from "@/components/inequality/charts/TopIncomeShareChart";
import { DATASET_META, WID_US } from "@/lib/inequality/data-snapshots";
import Link from "next/link";

export const metadata: Metadata = { title: "US top income shares" };

export default function Page() {
  const meta = DATASET_META["wid-us-top-shares"];
  const top1 = WID_US.series.top1;
  const top10 = WID_US.series.top10;
  const latest = top1.at(-1)!;
  const latest10 = top10.at(-1)!;
  const rows = top1.filter((p) => p.year >= 1913 && p.year % 5 === 0 || p.year === latest.year);
  const t10 = new Map(top10.map((p) => [p.year, p.share]));
  return (
    <ChartFrame
      title="US top income shares, 1913–today"
      caption={`In ${latest.year}, the top 1% of US adults received about ${latest.share.toFixed(0)}% of all pre-tax income and the top 10% about ${latest10.share.toFixed(0)}% — the U-shaped century first documented from tax records by Piketty and Saez.`}
      meta={meta}
      downloadHref="/data/wid-us-top-shares.json"
      howToRead={
        <p>
          Each line is the slice of the nation&apos;s total pre-tax income going to that group in a given year. Read left to right: high concentration before 1929, a sharp fall through the Depression and WWII, decades of low concentration, then a climb from around 1980. These are <em>pre-tax</em> shares — after taxes and transfers the top shares are lower. Background: <Link href="/inequality/learn/how-its-measured" className="text-crema-ink underline underline-offset-2">how inequality is measured</Link>; the original paper: <Link href="/inequality/library/papers/piketty-saez-2003" className="text-crema-ink underline underline-offset-2">Piketty &amp; Saez (2003)</Link>.
        </p>
      }
      table={
        <table className="w-full text-sm">
          <caption className="sr-only">US top 1% and top 10% pre-tax income shares, every fifth year from 1913 plus the latest year</caption>
          <thead><tr className="border-b border-card-border text-left"><th className="py-1 pr-4">Year</th><th className="py-1 pr-4">Top 1% share</th><th className="py-1">Top 10% share</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.year} className="border-b border-card-border/60">
                <td className="py-1 pr-4 tabular-nums">{p.year}</td>
                <td className="py-1 pr-4 tabular-nums">{p.share.toFixed(1)}%</td>
                <td className="py-1 tabular-nums">{t10.get(p.year)?.toFixed(1) ?? "—"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <TopIncomeShareChart series={WID_US.series} />
    </ChartFrame>
  );
}
