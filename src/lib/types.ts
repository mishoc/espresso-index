export type Tier = "surveyed" | "derived" | "modeled";

export interface Country {
  iso3: string;
  name: string;
  region: string;
  priceUSD: number;
  priceLow: number;
  priceHigh: number;
  tier: Tier;
  source: string;
  gdpPerCapitaUSD: number | null;
  gdpYear: number | null;
  burdenPct: number | null;
  rank: number | null;
  updated: string;
}

export interface Dataset {
  version: string;
  generated: string;
  counts: Record<Tier, number>;
  total: number;
  notes: string;
  countries: Country[];
}
