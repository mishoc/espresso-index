import Link from "next/link";
import lists from "@/../content/inequality/resources/reading-lists.json";

export const metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Resources</h1>
      <p className="mt-2 text-roast">One reading list per audience, built entirely from pages on this site — so every link carries its sourcing with it.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {lists.lists.map((l) => (
          <section key={l.id} className="rounded-md border border-card-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">{l.audience}</p>
            <h2 className="mt-1 text-xl font-semibold">{l.title}</h2>
            <p className="mt-1 text-sm text-roast">{l.description}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {l.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-crema-ink underline underline-offset-2">{i.label}</Link>
                  <span className="text-modeled-ink"> — {i.note}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
