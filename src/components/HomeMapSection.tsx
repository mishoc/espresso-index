"use client";

import { useState } from "react";
import EspressoMap from "./EspressoMap";

/* 375px screens get the list (extremes strip below) by default;
   the map stays one tap away (SPEC §2 edge cases). */
export default function HomeMapSection() {
  const [showOnMobile, setShowOnMobile] = useState(false);

  return (
    <section className="mx-auto w-full max-w-[1200px] px-6">
      <div className={showOnMobile ? "block" : "hidden sm:block"}>
        <EspressoMap />
      </div>
      {!showOnMobile && (
        <button
          onClick={() => setShowOnMobile(true)}
          className="mx-auto block min-h-[44px] rounded-[6px] border border-roast px-4 text-sm text-roast sm:hidden"
        >
          View map anyway
        </button>
      )}
    </section>
  );
}
