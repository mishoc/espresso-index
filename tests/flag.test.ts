import { describe, expect, it } from "vitest";
import { flagEmoji } from "../src/lib/data";

describe("flagEmoji", () => {
  it("maps iso3 to the regional-indicator emoji", () => {
    expect(flagEmoji("USA")).toBe("🇺🇸");
    expect(flagEmoji("ITA")).toBe("🇮🇹");
  });

  it("handles Kosovo via the user-assigned XK code", () => {
    expect(flagEmoji("XKX")).toBe("🇽🇰");
  });

  it("returns empty string for unknown codes rather than throwing", () => {
    expect(flagEmoji("ZZZ")).toBe("");
  });
});
