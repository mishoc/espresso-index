/** Acceptance criterion #1 of issue #1: every number in every Appendix B
 *  hero seed must recompute exactly from data/espresso.json — script check,
 *  not eyeball. If a data update breaks a hero claim, this fails CI before
 *  the false stat can ship. */
import { describe, expect, it } from "vitest";
import data from "../data/espresso.json";

const price = (iso3: string) =>
  data.countries.find((c) => c.iso3 === iso3)!.priceUSD;

describe("Appendix B hero seeds recompute from the dataset", () => {
  it("a shot in Copenhagen costs 7× a shot in Algiers", () => {
    expect(Math.round(price("DNK") / price("DZA"))).toBe(7);
  });

  it("Ethiopia is $0.70 and third-cheapest on Earth", () => {
    expect(price("ETH")).toBe(0.7);
    const cheaper = data.countries.filter((c) => c.priceUSD < price("ETH"));
    expect(cheaper).toHaveLength(2);
  });

  it("Denmark $4.30, Bosnia $1.15", () => {
    expect(price("DNK")).toBe(4.3);
    expect(price("BIH")).toBe(1.15);
  });

  it("135 countries charge more than Italy", () => {
    const above = data.countries.filter((c) => c.priceUSD > price("ITA"));
    expect(above).toHaveLength(135);
  });
});
