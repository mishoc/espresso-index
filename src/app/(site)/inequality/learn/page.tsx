import Link from "next/link";
import { loadAllExplainerMeta } from "@/lib/inequality/explainers";

export const metadata = { title: "Learn the basics" };

export default async function LearnHub() {
  const articles = await loadAllExplainerMeta();
  return (
    <div className="mx-auto w-full max-w-[820px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Learn the basics</h1>
      <p className="mt-2 text-roast">
        Plain-language explainers. Every factual claim links to the research it
        comes from; technical detail is a click away, never the only version.
      </p>
      <ul className="mt-8 space-y-4">
        {articles.map((a) => (
          <li key={a.slug} className="rounded-md border border-card-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">{a.audience_level}</p>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/inequality/learn/${a.slug}`} className="hover:underline underline-offset-4">
                {a.title}
              </Link>
            </h2>
            <p className="mt-1 text-roast">{a.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
