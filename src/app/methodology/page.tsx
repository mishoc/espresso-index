import type { Metadata } from "next";
import { dataset } from "@/lib/data";
import ConfidenceBadge from "@/components/ConfidenceBadge";

export const metadata: Metadata = {
  title: "Methodology — The Espresso Index",
  description:
    "Where every number comes from: sources, the cappuccino conversion, confidence tiers, and the limitations stated plainly.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display mt-10 mb-3 text-2xl font-semibold">{children}</h2>
  );
}

export default function MethodologyPage() {
  const { counts, total, version, generated } = dataset;
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10">
      <h1 className="font-display mb-4 text-[32px] font-semibold">Methodology</h1>
      <p className="text-roast">
        No global body tracks the price of an espresso. This page explains how
        we estimate one anyway — and exactly how much to trust each number.
      </p>

      <H2>Sources</H2>
      <p>
        Every price is the estimated cost, in US dollars, of a single espresso
        shot at an ordinary café in the country&apos;s major cities. Three kinds
        of evidence feed the index, and every row is labeled by which kind
        produced it:
      </p>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
        <li>
          Espresso price surveys and public price-index data, for the {counts.surveyed}{" "}
          economies where espresso itself is directly tracked.
        </li>
        <li>
          Cappuccino price data — including crowd-sourced cost-of-living
          indices such as Numbeo, used strictly as an input for our own derived
          estimates and never republished as raw data — converted to espresso
          prices for {counts.derived} economies.
        </li>
        <li>
          Regional anchor prices and cost-of-living relationships, for the{" "}
          {counts.modeled} economies with no reliable direct data.
        </li>
      </ul>
      <p className="mt-3">
        Purchasing-power context comes from the World Bank (GDP per capita,
        current US$, series NY.GDP.PCAP.CD). The homepage macro strip reads the
        FRED coffee CPI series and the IMF arabica price series, refreshed at
        most every six hours.
      </p>

      <H2>The cappuccino conversion</H2>
      <p>
        Cappuccino prices are tracked far more widely than espresso prices. In
        markets where both are known, an espresso typically runs 60–75% of the
        cappuccino price — the milk, the cup size, and the counter time are
        what you&apos;re paying for. In Southern European counter-service
        cultures the espresso is independently cheaper still. We convert at
        ~65%, the middle of that band, and label every converted price{" "}
        <em>derived</em>.
      </p>

      <H2>Confidence tiers</H2>
      <p className="mb-3">
        Every row carries one of three badges. The bands below are encoded in
        each record&apos;s <code>priceLow</code>/<code>priceHigh</code> and
        shown wherever the price appears.
      </p>
      <div className="flex flex-col gap-3">
        <p>
          <ConfidenceBadge tier="surveyed" /> — {counts.surveyed} economies.
          Direct espresso surveys and price-index data. Band: ±12%.
        </p>
        <p>
          <ConfidenceBadge tier="derived" /> — {counts.derived} economies.
          Converted from cappuccino prices at ~65%. Band: ±20%.
        </p>
        <p>
          <ConfidenceBadge tier="modeled" /> — {counts.modeled} economies.
          Estimated from regional anchors and cost-of-living relationships.
          Band: ±40%. This is an estimate, not a measurement.
        </p>
      </div>

      <H2>Burden and ranking</H2>
      <p>
        The Espresso Burden is the share of one day&apos;s GDP per capita that a
        single shot costs: <code>price ÷ (GDP per capita ÷ 365) × 100</code>.
        Ranks use competition ranking on price, descending — ties share the
        minimum rank and the next rank skips (1, 2, 2, 4) — with tied economies
        listed alphabetically. Rank 1 is the most expensive shot on Earth.
      </p>

      <H2>Limitations, stated plainly</H2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
        <li>
          No global body tracks espresso prices. Everything here is an
          estimate; the tiers say how good an estimate.
        </li>
        <li>Crowd-sourced price data skews urban and touristy.</li>
        <li>
          The modeled tier (±40%) is inference, not observation — {counts.modeled}{" "}
          of {total} economies.
        </li>
        <li>
          Currency swings can move rankings quickly — an Argentina-style
          devaluation reshuffles the board between data updates.
        </li>
        <li>
          GDP per capita is a proxy for daily income, not disposable income.
          It is the biggest methodological leap on this site.
        </li>
        <li>
          World Bank GDP figures use the most recent available year and can
          lag badly: Eritrea&apos;s latest is 2011, South Sudan&apos;s 2015,
          Yemen&apos;s 2018, Cuba&apos;s 2020. Burdens built on pre-2022 GDP
          show their year in the table.
        </li>
        <li>
          Two economies have no World Bank GDP data at all — Taiwan and
          Vatican City — so their burden shows &ldquo;—&rdquo;.
        </li>
      </ul>

      <H2>Why 196 economies</H2>
      <p>
        The count is {total} <em>economies</em>, not 195 UN member states: we
        include Taiwan, Hong Kong, Kosovo, and Vatican City, and exclude North
        Korea, which has no market café pricing to estimate.
      </p>

      <H2>Changelog</H2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm">
        <li>
          <strong>{generated} — v{version}.</strong> Initial dataset: {total}{" "}
          economies ({counts.surveyed} surveyed, {counts.derived} derived,{" "}
          {counts.modeled} modeled). Burden and ranks computed from World Bank
          GDP per capita, most recent non-empty year.
        </li>
      </ul>
      <p className="mt-6 text-sm text-modeled">
        Every price change lands as a git commit in the public repository —
        the full audit history is the point. Spotted a wrong price?{" "}
        <a
          href="mailto:mishoceko@gmail.com?subject=Espresso%20Index%20price%20correction"
          className="underline underline-offset-4 hover:text-espresso"
        >
          Tell us.
        </a>
      </p>
    </main>
  );
}
