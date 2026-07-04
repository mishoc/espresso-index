import type { Metadata } from "next";
import MapServer from "@/components/MapServer";
import { dataset } from "@/lib/data";

/* Internal route: rendered at 1200×630 and screenshotted into /public/og.png
   (see scripts note in D13). Not linked from nav; noindexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OgCard() {
  return (
    <div className="flex h-[630px] w-[1200px] flex-col overflow-hidden bg-porcelain px-14 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[52px] font-semibold">
          The Espresso Index
        </h1>
        <p className="text-lg text-roast">
          What a shot costs in {dataset.total} economies
        </p>
      </div>
      <div className="mt-2 flex-1">
        <MapServer />
      </div>
    </div>
  );
}
