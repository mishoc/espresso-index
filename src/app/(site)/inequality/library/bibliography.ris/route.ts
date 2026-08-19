import { bibliographyRis } from "@/lib/inequality/citation-export";
import { getAllWorks } from "@/lib/inequality/research-works";

export const dynamic = "force-static";

export function GET() {
  return new Response(bibliographyRis(getAllWorks()), {
    headers: { "Content-Type": "application/x-research-info-systems; charset=utf-8", "Content-Disposition": 'attachment; filename="inequality-explained.ris"' },
  });
}
