import { toBibTeX, toRIS } from "@/lib/inequality/citation-export";
import { getAllWorks, getWorkById } from "@/lib/inequality/research-works";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllWorks().flatMap((w) => [{ file: `${w.id}.bib` }, { file: `${w.id}.ris` }]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = file.match(/^(.+)\.(bib|ris)$/);
  const w = m ? getWorkById(m[1]) : undefined;
  if (!w || !m) return new Response("Not found", { status: 404 });
  const body = m[2] === "bib" ? toBibTeX(w) : toRIS(w);
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"` },
  });
}
