import Link from "next/link";
import { loadAllPerspectiveMeta } from "@/lib/inequality/perspectives";

export const metadata = { title: "Perspectives & debates" };

export default async function PerspectivesHub() {
  const pages = await loadAllPerspectiveMeta();
  return (
    <div className="mx-auto w-full max-w-[820px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Perspectives &amp; debates</h1>
      <p className="mt-2 text-roast">
        Where researchers genuinely disagree, we present each side with its
        strongest evidence and say plainly that the question is open. These
        pages take no policy position.
      </p>
      <ul className="mt-8 space-y-4">
        {pages.map((p) => (
          <li key={p.slug} className="rounded-md border border-card-border p-4">
            <h2 className="text-xl font-semibold">
              <Link href={`/inequality/perspectives/${p.slug}`} className="hover:underline underline-offset-4">{p.title}</Link>
            </h2>
            <p className="mt-1 text-roast">{p.framing}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
