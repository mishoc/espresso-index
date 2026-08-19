import { bibliographyBib } from "@/lib/inequality/citation-export";
import { getAllWorks } from "@/lib/inequality/research-works";

export const dynamic = "force-static";

export function GET() {
  return new Response(bibliographyBib(getAllWorks()), {
    headers: { "Content-Type": "application/x-bibtex; charset=utf-8", "Content-Disposition": 'attachment; filename="inequality-explained.bib"' },
  });
}
