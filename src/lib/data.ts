import { iso31661 } from "iso-3166";
import raw from "../../data/espresso.json";
import type { Dataset } from "./types";

// Bundled at build time — the core product works with every API dead (SPEC §2).
export const dataset = raw as Dataset;

const A3_TO_A2 = new Map(iso31661.map((c) => [c.alpha3, c.alpha2]));
A3_TO_A2.set("XKX", "XK"); // Kosovo: user-assigned code, not in ISO list

export function flagEmoji(iso3: string): string {
  const alpha2 = A3_TO_A2.get(iso3);
  if (!alpha2) return "";
  return [...alpha2]
    .map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65))
    .join("");
}
