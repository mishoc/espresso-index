import type { Tier } from "@/lib/types";

const STYLES: Record<Tier, { label: string; cls: string }> = {
  surveyed: { label: "Surveyed", cls: "text-verified border-verified/40 bg-verified/5" },
  derived: { label: "Derived", cls: "text-caution border-caution/40 bg-caution/5" },
  modeled: { label: "Modeled", cls: "text-modeled border-modeled/40 bg-modeled/10" },
};

export default function ConfidenceBadge({ tier }: { tier: Tier }) {
  const { label, cls } = STYLES[tier];
  return (
    <span
      className={`inline-block rounded-[4px] border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${cls}`}
      title={
        tier === "surveyed"
          ? "Espresso surveys and price-index data (±12%)"
          : tier === "derived"
            ? "Derived from cappuccino index at ~65% (±20%)"
            : "Modeled from regional anchors and cost of living (±40%)"
      }
    >
      {label}
    </span>
  );
}
