import type { CitationCount } from "@/lib/inequality/types";

/** The single most important UI component on the site (BUILD_PLAN P1.3):
 *  the two states must be visually distinct, and the unverified state must
 *  never look like zero or a blank. */
export default function CitationCountBadge({ count }: { count: CitationCount | null }) {
  if (!count) {
    return (
      <div className="rounded-md border border-unverified/40 bg-unverified/5 px-3 py-2 text-sm">
        <p className="font-medium text-unverified">Citation count not independently verified</p>
        <p className="text-modeled-ink">
          We only publish a number when we have checked it ourselves. None was
          confirmed for this work at the last review.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-verified/40 bg-verified/5 px-3 py-2 text-sm">
      <p className="font-medium text-verified-ink">
        ~{count.value.toLocaleString()} citations
      </p>
      <p className="text-modeled-ink">
        Source: {count.source} · verified {count.verified_date}. Counts drift
        daily and differ by database; treat as a dated snapshot.
      </p>
    </div>
  );
}
