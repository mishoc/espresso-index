import { flagEmoji } from "@/lib/data";
import type { Country } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";

export default function CountryRow({ c }: { c: Country }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-card border border-card-border bg-paper px-4 py-3">
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="tabular shrink-0 text-sm text-roast">#{c.rank}</span>
        <span className="truncate font-medium">
          {flagEmoji(c.iso3)} {c.name}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="tabular font-medium">${c.priceUSD.toFixed(2)}</span>
        <ConfidenceBadge tier={c.tier} />
      </span>
    </li>
  );
}
