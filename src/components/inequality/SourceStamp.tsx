/** The persistent "last verified / data as of" stamp required on every
 *  factual claim and statistic (CLAUDE.md). Render it, don't paraphrase it. */
export default function SourceStamp({
  date,
  source,
  href,
  label = "Source",
}: {
  date: string;
  source: string;
  href?: string;
  label?: string;
}) {
  return (
    <p className="text-sm text-modeled-ink">
      {label}:{" "}
      {href ? (
        <a href={href} rel="noopener" className="underline underline-offset-2 hover:text-espresso">
          {source}
        </a>
      ) : (
        source
      )}
      {" · "}
      <time dateTime={date}>verified {date}</time>
    </p>
  );
}
