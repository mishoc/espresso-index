import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  parseRef,
  parseState,
  serializeState,
} from "../src/lib/lab-state";

const parse = (qs: string) => parseState(new URLSearchParams(qs));

describe("lab URL state", () => {
  it("round-trips: parse(serialize(state)) === state (share must not drift)", () => {
    const qs =
      "type=scatter&x=wdi-gdppc.gdp_per_capita_usd&y=espresso.priceUSD&countries=all&scale=log&trend=1&year=2026";
    const state = parse(qs);
    expect(parse(serializeState(state))).toEqual(state);
  });

  it("round-trips a line chart with explicit countries and range", () => {
    const state = parse(
      "type=line&series=wdi-inflation.cpi_inflation_pct&countries=USA,DEU,JPN&from=1990&to=2026&yoy=1",
    );
    expect(state.type).toBe("line");
    expect(state.countries).toEqual(["USA", "DEU", "JPN"]);
    expect(parse(serializeState(state))).toEqual(state);
  });

  it("falls back to the default preset on garbage, silently (§4.3)", () => {
    expect(parse("type=pie&x=;DROP TABLE;&countries=<script>")).toEqual(
      DEFAULT_STATE,
    );
    expect(parse("")).toEqual(DEFAULT_STATE);
  });

  it("ignores invalid iso3 tokens but keeps valid ones", () => {
    const state = parse("type=line&series=espresso.priceUSD&countries=usa,xx,ITA,123");
    expect(state.countries).toEqual(["USA", "ITA"]);
  });

  it("disables YoY for non-time charts (§4.1)", () => {
    const state = parse("type=scatter&x=espresso.priceUSD&y=espresso.burdenPct&yoy=1");
    expect(state.yoy).toBe(false);
  });

  it("parseRef rejects malformed refs", () => {
    expect(parseRef("wdi-gdppc.gdp_per_capita_usd")).toEqual({
      dataset: "wdi-gdppc",
      indicator: "gdp_per_capita_usd",
    });
    expect(parseRef("nodot")).toBeUndefined();
    expect(parseRef("Bad Caps.x")).toBeUndefined();
    expect(parseRef(null)).toBeUndefined();
  });
});
