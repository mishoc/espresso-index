import { getAllWorks, WORKS_META } from "@/lib/inequality/research-works";

export const metadata = { title: "How we verify citations" };

export default function Page() {
  const works = getAllWorks();
  const verified = works.filter((w) => w.citation_count !== null);
  return (
    <article className="prose-site mx-auto w-full max-w-[720px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">How we verify citations</h1>
      <p className="mt-3 text-lg text-roast">This is the credibility backbone of the site, so here is the actual process — not a promise to &ldquo;take accuracy seriously.&rdquo;</p>

      <h2>What &ldquo;verified&rdquo; means here</h2>
      <p>For every one of the {works.length} works in the library, the bibliographic details — authors, year, venue, volume and pages, DOI or ISBN where one exists — were checked against the publisher&rsquo;s or journal&rsquo;s own page, the NBER working-paper record, or the American Economic Association&rsquo;s site when the bibliography was compiled (last full pass: {WORKS_META.migrated_date}).</p>
      <p>Citation counts are held to a stricter standard. A number appears on this site only when it was independently confirmed against the Semantic Scholar API (or an aggregator quoting it) in that session, and it is always stored and displayed as three things together: the value, the source it came from, and the date it was checked. Of the {works.length} works, <strong>{verified.length}</strong> currently carry a verified count. The other {works.length - verified.length} say &ldquo;citation count not independently verified&rdquo; — not a placeholder, not &ldquo;~1,000+&rdquo;, not a blank that looks like zero.</p>

      <h2>Why the numbers will drift</h2>
      <p>Citation counts change daily and databases disagree: Google Scholar typically reports higher figures than Semantic Scholar, which is higher than Web of Science. A count on this site is a dated snapshot from a named source, nothing more. When we re-ran the Semantic Scholar check while building this site, one paper&rsquo;s count had already moved by a few citations from the figure in our bibliography — which is exactly why every number carries its date.</p>

      <h2>What we would not do</h2>
      <ul>
        <li>Invent or estimate a citation count to fill a gap.</li>
        <li>Invent a DOI, ISBN, or URL. Where the seed data has none, the page says &ldquo;not available.&rdquo;</li>
        <li>Copy a number we saw somewhere but could not corroborate. (One such figure was deliberately excluded during compilation rather than repeated.)</li>
      </ul>

      <h2>Re-verification schedule</h2>
      <p>We re-check citation counts against Semantic Scholar on a quarterly cadence and update the value and date together. Automated live refresh on every page view is intentionally not used: it would make numbers change under readers and would hammer a free API.</p>

      <h2>Data pages</h2>
      <p>Charts use static snapshots of public datasets (currently the World Inequality Database and SWIID), synced on a schedule by scripts in the open-source repository. Each page shows the dataset&rsquo;s own vintage and our sync date, the methodology, license, and a download of the exact file the chart was built from. A build check fails if any snapshot is more than 120 days old.</p>
    </article>
  );
}
