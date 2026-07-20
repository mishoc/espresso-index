# The Espresso Index — Data Lab Specification (V1.5)

**Version 1.0 · July 2, 2026 · Prepared for Claude Code (`/spec` input)**
**Prerequisite:** the read-only MVP (SPEC.md) is live at espressoindex.org. This spec extends it — same repo, same stack, same design system, same $0 architecture.

**What this adds:** a curated library of public economic datasets and a client-side tool ("The Data Lab") for users to visualize and analyze them — every dataset plottable against the Espresso Index itself.

**Hard constraints carried over:** no accounts, no database, no runtime data APIs (one existing FRED proxy excepted), $0/mo infra, 2-week sprint.

---

## 1. Product

**Pitch:** Turn the index into a destination — a free, no-login data playground where anyone can chart espresso prices against GDP, Big Mac prices, coffee production, inflation, or inequality, and share the result as a link.

**Core loop:** pick dataset(s) → pick countries → pick chart type → tweak (log/YoY/index-100) → share URL or export PNG/CSV.

**New pages:**
- `/lab` — the Data Lab (chart builder)
- `/lab/data` — dataset library (catalog of every dataset: description, source, license, coverage, download link)
- Preset chart deep-links: `/lab?preset=big-mac` etc.

**Navigation update:** Index · Rankings · **Data Lab** · Methodology · About.

**Non-goals (do not build):** user-uploaded datasets, saved workspaces/accounts, statistical modeling beyond correlation, realtime data, an embeddable widget (V2), a public API (V2).

**Success (90 days post-ship):** 20% of visitors open the Lab; 100+ shared chart URLs in the wild; at least one classroom assignment built on it.

---

## 2. Dataset Library

### 2.1 Launch set (Phase A — build the pipeline against exactly these)

| id | Name | Source & access | Indicators ingested | License |
|---|---|---|---|---|
| `espresso` | The Espresso Index | local `data/espresso.json` | priceUSD, burdenPct, tier | own data |
| `big-mac` | Big Mac Index | GitHub `TheEconomist/big-mac-data` raw CSV (`output-data/big-mac-full-index.csv`) | dollar_price, USD_raw (over/under-valuation vs USD; there is no dollar_ppp column — verified 2026-07-14) | open, attribute |
| `wdi-gdppc` | GDP per capita | World Bank API `NY.GDP.PCAP.CD` | annual, all countries, 1960– | CC-BY 4.0 |
| `wdi-inflation` | Inflation (CPI %) | World Bank API `FP.CPI.TOTL.ZG` | annual, all countries | CC-BY 4.0 |
| `coffee-prices` | Arabica & Robusta prices | World Bank Pink Sheet monthly **XLSX** (`CMO-Historical-Data-Monthly.xlsx` — no CSV exists, verified 2026-07-04; parse at build with a spreadsheet devDep, or route via DBnomics WB provider) | monthly, global, 1960– | open, attribute |
| `dbn-minwage` | Minimum wages | DBnomics, ILO dataset `EAR_4MMN_CUR_NB` (statutory nominal gross monthly minimum wage — verified live 2026-07-14). Values are local-currency: ingest the USD-converted series variant if ILO provides one, else convert at build using WDI exchange rates and say so in the manifest description | annual, by country | open, attribute |

### 2.2 Phase B (add after Lab ships — same pipeline, new manifest entries)

`faostat-production` (coffee production/yield by country, FAOSTAT API, CC-BY) · `wid-top10` (top-10% income share, WID bulk) · `wdi-ppp` (PPP conversion factor `PA.NUS.PPP`) · `oecd-hours` (avg annual hours worked, via DBnomics OECD provider).

### 2.3 DBnomics note
For anything beyond the launch set, integrate via DBnomics (`https://api.db.nomics.world/v22/series/{provider}/{dataset}/{series}?format=json`) rather than each institution's native SDMX API. SDMX (IMF/OECD/ECB/BIS native) is explicitly out of scope — the query-syntax learning curve is the difference between a 3-day and a 10-day pipeline.

---

## 3. Data Architecture

### 3.1 Tidy schema — every dataset normalizes to this
```json
{ "iso3": "ITA", "date": "2025", "indicator": "gdp_per_capita_usd", "value": 39012.4 }
```
- `date` is ISO-8601 string, precision varies by dataset ("2025", "2025-06")
- One gzipped JSON per dataset at `public/datasets/{id}.json` (target ≤300KB gzipped each; for global monthly series, trim to 1990– if needed)
- Non-country series (e.g., global arabica price) use `iso3: "WLD"`

### 3.2 Manifest — `public/datasets/manifest.json`
```json
{
  "id": "big-mac",
  "name": "Big Mac Index",
  "description": "The Economist's burger-based PPP measure since 1986.",
  "sourceName": "The Economist",
  "sourceUrl": "https://github.com/TheEconomist/big-mac-data",
  "license": "Open — attribution required",
  "unit": "USD",
  "frequency": "biannual",
  "coverage": { "from": "2000", "to": "2026", "countries": 57 },
  "indicators": [{ "code": "dollar_price", "label": "Big Mac price (USD)" }],
  "updated": "2026-07-01",
  "bytes": 41250
}
```
The Lab UI, the `/lab/data` catalog page, and every chart's auto-footer ("Source: The Economist · CC-BY") all read from the manifest. **No source/license strings hardcoded in components.**

### 3.3 Pipeline — `scripts/fetch-datasets.ts`
- One fetcher module per dataset id; each outputs tidy JSON + its manifest entry
- **Every fetcher sends `User-Agent: espresso-index-bot/1.0 (+https://www.espressoindex.org)`** — the WB API started rejecting default client UAs with its 2026-07-13 update; assume any upstream may
- Orchestrated by a single CLI: `npm run data:refresh [-- --only=big-mac]`
- Runs monthly via GitHub Action that opens a PR (never pushes to main); CI runs `validate-datasets.ts` on the PR
- `validate-datasets.ts` checks: schema conformity, iso3 validity, value bounds per manifest, no dataset shrank >20% vs. previous version (upstream breakage detector), manifest byte counts accurate

### 3.4 No new runtime backend
The Lab is 100% client-side: lazy-load selected dataset JSONs, join on `iso3` (+ nearest-date matching when frequencies differ — document the rule: scatter joins use most recent value of each series within the selected year; the `espresso` dataset is a single dated snapshot and always matches regardless of the year slider), compute in browser. The existing `/api/macro` route is untouched.

---

## 4. The Data Lab UI

### 4.1 Layout
Desktop: left control panel (280px) + chart canvas. Mobile (≤768px): controls collapse into a top sheet; chart full-width below; canvas min-height 320px.

**Control panel, top to bottom:**
1. Chart type toggle: Line · Bar · Scatter · Map (icons: Phosphor `chart-line`, `chart-bar`, `circles-three`, `globe-hemisphere-west`)
2. Dataset picker(s): Line/Bar/Map take one dataset+indicator; Scatter takes X and Y
3. Country selector: multi-select with search, region quick-picks ("Add all Europe"), max 12 countries on line charts (readability), no cap on scatter/map
4. Transform toggles: Log scale · YoY % · Index = 100 at first year (mutually sensible combos only; disable YoY for non-time charts)
5. Time range slider (line/bar)
6. Buttons: **Share** (copies URL, toast), **PNG** (export canvas), **CSV** (current filtered selection)

### 4.2 Chart rendering
**Observable Plot** (`@observablehq/plot`) for line/bar/scatter — publication-quality defaults, ~10 lines per chart type. Map mode reuses the site's choropleth *client* component (`EspressoMap`) — note the geometry is precomputed server-side since D13 (`MapServer`), so export the projected paths once to a shared module/static JSON that the Lab lazy-loads and recolors client-side. Fonts/colors inherit the site design system; series colors: crema `#C89A5B` first, then a 6-color colorblind-safe categorical ramp; gridlines `#EDE6DB`.

**Scatter mode is the analytical heart:**
- Pearson r displayed top-right of canvas ("r = 0.81"), recomputed on every filter change; show "n = 143" beside it
- Optional trend line toggle (simple OLS)
- Point tooltips: country, both values, year
- Points colored by region; espresso-tier shape encoding when `espresso` is an axis

### 4.3 URL state (the sharing mechanism)
Entire chart state serializes to query params:
`/lab?type=scatter&x=wdi-gdppc.gdp_per_capita_usd&y=espresso.priceUSD&countries=all&scale=log&trend=1&year=2026`
- URL is the single source of truth (parse on load, replaceState on change, no history spam)
- Unknown/invalid params → fall back to default preset silently
- OG image for `/lab` links: static branded card (dynamic per-chart OG images are V2)

### 4.4 Presets (the empty state)
`/lab` with no params loads preset #1. A "Gallery" strip above the canvas shows all presets as thumbnails:
1. **Espresso vs. Big Mac** — scatter, the signature chart
2. **Espresso vs. GDP per capita** — scatter, log X (Balassa-Samuelson, live)
3. **Do coffee growers pay less?** — bar, espresso price, producer countries highlighted
4. **Arabica's wild ride** — line, Pink Sheet arabica 1990–, log toggle on
5. **The inflation century** — line, CPI % for 8 major economies
6. **Minimum wage vs. espresso burden** — scatter
Presets are data, not code: `data/presets.json` with `{id, title, params, blurb, highlight?}` — `highlight` is an iso3 array (preset 3 uses a hardcoded top-20 coffee-producer list stored in the preset itself; FAOSTAT-derived highlighting is Phase B).

### 4.5 States & edge cases
- Dataset loading: skeleton chart + progress; failed fetch → inline retry card, never blank canvas
- Join produces <3 points (sparse overlap) → "Not enough overlapping data for this combination — try a different year" with the year auto-suggested
- Empty country search → same voice as Rankings ("No country matches 'X' — yet.")
- Mobile scatter: tooltips on tap, pinch-zoom disabled (page scroll wins)
- All controls keyboard-accessible; chart canvas has an aria-label summarizing current config

---

## 5. Build Plan (14 days)

**Week 1 — pipeline + skeleton**
D1: tidy schema, manifest types, `validate-datasets.ts` · D2–3: six Phase-A fetchers + `data:refresh` CLI + GitHub Action · D4: `/lab/data` catalog page (reads manifest) · D5–7: Lab shell — layout, URL-state module (build this FIRST, everything hangs off it), dataset lazy-loader, Line chart working end-to-end.

**Week 2 — charts + analysis + polish**
D8: Bar + Map modes · D9: Scatter with r, n, trend line, join logic · D10: transforms (log/YoY/index-100) + exports (PNG via canvas serialization, CSV) · D11: presets + gallery + empty states · D12: mobile pass + accessibility · D13: `/qa` — every preset URL loads correctly cold; kill network after first load and verify cached datasets still chart · D14: `/review`, Lighthouse, ship. JS budget — measured 2026-07-24: the sitewide Next 16 framework baseline is ~195KB gz (loaded by every page incl. the homepage, which still scores 98); the Lab's **marginal** cost is ~98KB gz (Observable Plot + lab code, fully code-split — verified absent from the homepage chunk set). Total /lab: 293KB gz before datasets. The §6-9 requirement (Lab must not bloat the main bundle) is the enforced invariant; regressions = Plot chunks appearing in non-lab routes.

**Definition of done:** all 6 presets load from cold URLs; share→paste→identical chart round-trips; r-value verified against a hand calculation for one preset; every chart shows auto-attribution footer; site works with GitHub/World Bank unreachable (datasets are static); 375px usable; no new env vars, no new runtime routes.

---

## 6. Mistakes to avoid (Data Lab edition)
1. Building against native SDMX APIs — DBnomics or direct CSV only
2. Runtime dataset fetching from institutions — build-time pipeline only
3. Hardcoding source/license text in components — manifest-driven
4. Chart state in React state alone — URL is the source of truth or sharing dies
5. Loading all datasets upfront — lazy per selection, or the page weighs 2MB
6. Uncapped line-chart series — 12 max or every chart becomes spaghetti
7. Silent bad joins — mismatched frequencies must use the documented nearest-date rule and show n
8. Skipping the shrink-detector in validation — upstream CSVs change shape without warning; this is how data sites silently break
9. Letting the Lab bloat the main bundle — code-split `/lab` entirely
10. Presets as code — presets.json, so adding one is a data PR

## Appendix — attribution strings (footer templates)
World Bank: "Source: World Bank Open Data (CC-BY 4.0)" · The Economist: "Source: The Economist Big Mac Index" · Pink Sheet: "Source: World Bank Commodity Price Data (Pink Sheet)" · DBnomics-routed: "Source: {provider} via DBnomics" · Own: "Source: The Espresso Index (espressoindex.org)"
