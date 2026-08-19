import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResearchWorkDetail from "@/components/inequality/ResearchWorkDetail";
import { getAllWorks, getWorkById } from "@/lib/inequality/research-works";

const TYPE_SEGMENT = { paper: "papers", book: "books" } as const;

export function generateStaticParams() {
  return getAllWorks().map((w) => ({ type: TYPE_SEGMENT[w.type], slug: w.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = getWorkById(slug);
  return w ? { title: `${w.title} — Inequality Explained`, description: w.summary_plain } : {};
}

export default async function WorkPage({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params;
  const work = getWorkById(slug);
  if (!work || TYPE_SEGMENT[work.type] !== type) notFound();
  return <ResearchWorkDetail work={work} />;
}
