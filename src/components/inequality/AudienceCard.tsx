import Link from "next/link";

export default function AudienceCard({
  title,
  who,
  body,
  href,
  cta,
}: {
  title: string;
  who: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-md border border-card-border bg-paper p-5 hover:border-crema focus-visible:border-crema"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">{who}</p>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-roast">{body}</p>
      <span className="mt-auto pt-2 text-sm font-medium text-crema-ink">{cta} →</span>
    </Link>
  );
}
