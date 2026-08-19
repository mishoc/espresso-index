import type { Metadata } from "next";
import AudienceCard from "@/components/inequality/AudienceCard";
import { getAllWorks } from "@/lib/inequality/research-works";

export const metadata: Metadata = {
  title: "Inequality Explained — The Espresso Index",
  description:
    "Income inequality research for citizens, researchers, and educators. Every claim sourced, every citation count verified, no policy positions.",
};

export default function InequalityHome() {
  const n = getAllWorks().length;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-12">
      <section className="max-w-2xl">
        <h1 className="font-display text-[40px] leading-[1.1] font-semibold">
          Income inequality, explained from the research.
        </h1>
        <p className="mt-4 text-lg text-roast">
          A nonpartisan guide to what economists and political scientists have
          actually found — {n} foundational papers and books, every claim
          sourced, every citation count verified, and the open debates presented
          as open. We take no policy positions.
        </p>
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="Choose where to start">
        <AudienceCard who="Citizens" title="Start with the basics" body="Is inequality actually rising? How is it measured? Plain-language explainers, every fact traceable." href="/inequality/learn" cta="Learn the basics" />
        <AudienceCard who="Researchers" title="Search the library" body="A verified bibliography with plain and technical summaries, contested-finding flags, and sourced citation counts." href="/inequality/library" cta="Open the library" />
        <AudienceCard who="Educators & media" title="Grab ready-made resources" body="Reading lists by audience and balanced framing of the field's real debates, built for lesson plans and articles." href="/inequality/resources" cta="Browse resources" />
      </section>
      <section className="mt-12 max-w-2xl text-sm text-modeled-ink">
        <p>
          How we stay trustworthy: every citation count shows where it came
          from and when it was checked — or says plainly that it hasn&apos;t been
          verified. Contested findings link to a page presenting each side.
          Read our{" "}
          <a href="/inequality/about/editorial-standards" className="underline underline-offset-2">editorial standards</a>.
          Want to chart inequality against espresso prices? The{" "}
          <a href="/lab?type=scatter&x=top10-share.top10_share_pct&y=espresso.priceUSD&countries=all&trend=1&year=2026" className="underline underline-offset-2">Data Lab</a>{" "}
          has the top-10% income share loaded.
        </p>
      </section>
    </div>
  );
}
