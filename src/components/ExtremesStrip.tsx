import Link from "next/link";
import { dataset } from "@/lib/data";
import CountryRow from "./CountryRow";

export default function ExtremesStrip() {
  const byRank = [...dataset.countries].sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.name.localeCompare(b.name),
  );
  const top = byRank.slice(0, 5);
  const bottom = byRank.slice(-5);

  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-12 sm:grid-cols-2">
      <div className="min-w-0">
        <h2 className="font-display mb-3 text-xl font-semibold">
          Most expensive
        </h2>
        <ul className="flex flex-col gap-2">
          {top.map((c) => (
            <CountryRow key={c.iso3} c={c} />
          ))}
        </ul>
      </div>
      <div className="min-w-0">
        <h2 className="font-display mb-3 text-xl font-semibold">
          Least expensive
        </h2>
        <ul className="flex flex-col gap-2">
          {bottom.map((c) => (
            <CountryRow key={c.iso3} c={c} />
          ))}
        </ul>
      </div>
      <p className="text-sm text-modeled sm:col-span-2">
        <Link href="/rankings" className="underline underline-offset-4 hover:text-espresso">
          See all {dataset.total} economies →
        </Link>
      </p>
    </section>
  );
}
