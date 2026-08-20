import Link from "next/link";

export const metadata = { title: "Editorial standards" };

export default function Page() {
  return (
    <article className="prose-site mx-auto w-full max-w-[720px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Editorial standards</h1>
      <p className="mt-3 text-lg text-roast">Income inequality is politically charged. This site earns trust one way: by being visibly careful.</p>
      <h2>We take no policy positions</h2>
      <p>You will not find a recommended tax rate, redistribution scheme, or program here. Where research bears on policy, we describe what the research found and where it is disputed, and stop.</p>
      <h2>Contested means contested</h2>
      <p>Each library entry carries an <code>is_contested</code> flag and, where one exists, a link to a <Link href="/inequality/perspectives">Perspectives</Link> page that gives each side its strongest evidence and ends with an explicit &ldquo;where the field stands&rdquo; that does not pick a winner. We would rather say &ldquo;unresolved&rdquo; than be confidently wrong.</p>
      <h2>Every claim is traceable</h2>
      <p>Explainers cite library entries inline; each page ends with a &ldquo;sources for this page&rdquo; box. Statistics on data pages show a &ldquo;data as of&rdquo; stamp taken from the dataset&rsquo;s own metadata, a methodology note, and a download link. We do not write a statistic we cannot source; when an article would need one we do not have, we leave it out and note the gap.</p>
      <h2>Plain language first</h2>
      <p>Every explainer and library entry leads with a summary a non-economist can follow. Technical detail is always available — behind a toggle or link — but never the only version.</p>
      <h2>Accessibility is a requirement</h2>
      <p>We target WCAG 2.1 AA. Every chart ships with a text or table alternative for screen readers, and all controls work by keyboard.</p>
      <h2>When we get something wrong</h2>
      <p>See <Link href="/inequality/about/corrections">Corrections</Link>. Errors are fixed in place and logged publicly.</p>
    </article>
  );
}
