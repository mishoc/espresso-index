"use client";

import { useEffect, useState } from "react";

/* Appendix B rotation seeds — every number here must recompute exactly from
   data/espresso.json (checked by the corrected SPEC's acceptance criteria). */
const SEEDS = [
  "A shot in Copenhagen costs 7× a shot in Algiers.",
  "Ethiopia gave the world coffee. A shot there costs $0.70 — third-cheapest on Earth.",
  "In Denmark, an espresso costs $4.30. In Bosnia, $1.15.",
  "Italy invented espresso — and 135 countries charge more for it.",
];

export default function HeroStat() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((n) => (n + 1) % SEEDS.length);
        setVisible(true);
      }, 400);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      aria-live="polite"
      className={`font-display mx-auto max-w-4xl text-[40px] leading-[1.15] font-semibold text-balance transition-opacity duration-400 sm:text-[56px] ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {SEEDS[i]}
    </p>
  );
}
