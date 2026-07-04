"use client";

import { useEffect, useState } from "react";

interface Macro {
  coffeeCpiYoY: number;
  coffeeCpiDate: string;
  arabicaUSDlb: number;
  arabicaDate: string;
  fetchedAt: string;
  stale: boolean;
}

const monthLabel = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function freshness(fetchedAt: string): string {
  const ageH = (Date.now() - new Date(fetchedAt).getTime()) / 3.6e6;
  if (ageH < 1) return "Updated <1h ago";
  if (ageH <= 7) return `Updated ${Math.round(ageH)}h ago`;
  // stale-on-error path: older than one ISR window → show the date plainly
  return `as of ${new Date(fetchedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })}`;
}

/* Live macro strip. Any failure → renders nothing; the core product never
   depends on it (SPEC §2: works with every API dead). */
export default function DataStrip() {
  const [macro, setMacro] = useState<Macro | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/macro")
      .then((r) => (r.ok && r.status === 200 ? r.json() : null))
      .then((m) => alive && m && setMacro(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!macro) return null;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-4">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-card border border-card-border bg-paper px-4 py-3 text-sm text-roast">
        <span>
          Arabica{" "}
          <strong className="tabular text-espresso">
            {Math.round(macro.arabicaUSDlb * 100)}¢/lb
          </strong>{" "}
          <span className="text-modeled-ink">({monthLabel(macro.arabicaDate)})</span>
        </span>
        <span>
          US coffee CPI{" "}
          <strong className="tabular text-espresso">
            {macro.coffeeCpiYoY > 0 ? "+" : ""}
            {macro.coffeeCpiYoY.toFixed(1)}% YoY
          </strong>{" "}
          <span className="text-modeled-ink">({monthLabel(macro.coffeeCpiDate)})</span>
        </span>
        <span className="text-xs text-modeled-ink">{freshness(macro.fetchedAt)}</span>
      </div>
    </section>
  );
}
