import type { Metadata } from "next";
import RankingsTable from "@/components/RankingsTable";

export const metadata: Metadata = {
  title: "Rankings — The Espresso Index",
  description:
    "All 196 economies ranked by the price of a shot of espresso, with purchasing-power burden and confidence tiers.",
};

export default function RankingsPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
      <h1 className="font-display mb-2 text-[32px] leading-tight font-semibold">
        Rankings
      </h1>
      <p className="mb-6 max-w-2xl text-roast">
        What a single shot of espresso costs, everywhere on Earth — and what
        share of a day&apos;s GDP per capita it takes to buy one.
      </p>
      <RankingsTable />
    </main>
  );
}
