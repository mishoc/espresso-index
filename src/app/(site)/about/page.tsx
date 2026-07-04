import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — The Espresso Index",
  description: "Why this exists.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10">
      <h1 className="font-display mb-6 text-[32px] font-semibold">About</h1>
      <div className="flex flex-col gap-4 text-espresso/90">
        <p>
          I wanted the Big Mac Index, but for the drink I actually buy every
          day.
        </p>
        <p>
          An espresso is close to the perfect economic probe: the recipe is
          identical everywhere — seven grams of coffee, hot water, thirty
          seconds — so every difference in price is telling you about the
          economy around the machine, not the thing in the cup. Rent, wages,
          taxes, tariffs, currency, and what a society thinks a small daily
          pleasure should cost.
        </p>
        <p>
          The index covers 196 economies. Some numbers are solid, some are
          honest estimates — the{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            methodology page
          </Link>{" "}
          tells you which is which, every time. The dataset is versioned in a
          public git repository, every change is a commit, and the CSV is free
          to download with no email gate. If you teach with it, write with it,
          or argue about it over coffee, it&apos;s doing its job.
        </p>
        <p>
          Built in Chicago. Fueled by the obvious.
        </p>
        <p>
          <a
            href="mailto:mishoceko@gmail.com?subject=Espresso%20Index%20price%20correction"
            className="text-crema underline underline-offset-4"
          >
            Suggest a price correction →
          </a>
        </p>
      </div>
    </main>
  );
}
