import Link from "next/link";
import { formatAuthors, getWorkById } from "@/lib/inequality/research-works";

/** Inline citation to a ResearchWork by id. Throws at build if the id does
 *  not exist — an explainer must never cite something not in the library. */
export default function Cite({ id, children }: { id: string; children?: React.ReactNode }) {
  const w = getWorkById(id);
  if (!w) throw new Error(`<Cite id="${id}"> — no such research work`);
  const href = `/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}`;
  return (
    <Link href={href} className="text-crema-ink underline underline-offset-2" title={w.title}>
      {children ?? `${formatAuthors(w.authors)} (${w.year})`}
    </Link>
  );
}
