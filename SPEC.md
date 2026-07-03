# The Espresso Index — Build Specification

**Version 1.0 · July 2, 2026 · Prepared for Claude Code (`/spec` input)**

The Big Mac Index for the espresso age: a free website that turns espresso prices in 196 economies into an intuitive lens on global purchasing power, inflation, and inequality.

**Hard constraints:** free passion project ($0/mo infra) · read-only MVP (no auth, no payments, no database) · 14-day launch deadline · builder: intermediate-to-advanced, working via Claude Code + gstack.

---

## 1. Product

**Pitch:** Every visit answers "what does a shot of espresso cost anywhere on Earth, and what does that reveal about the economy there?" in under 10 seconds.

**Personas:** (1) econ-curious professional who wants shareable, tangible macro comparisons; (2) policy/econ instructor who needs vivid teaching hooks for PPP and real exchange rates; (3) cost-of-living journalist who needs a citable, visual, methodologically transparent benchmark.

**MVP scope (the contract — nothing else ships):**
1. Homepage: hero stat + interactive D3 choropleth + top/bottom-10 strip + live macro strip
2. Rankings: sortable/searchable 196-economy table, confidence badges, Espresso Burden column, CSV download, cite-to-clipboard, reference-country pin
3. Methodology page (credibility moat — sources, conversion method, tiers, limitations, changelog)
4. About page (first-person, short) · 5. 404 ("$0.00 — the only free espresso on the site")

**V2 (do not build now):** crowdsourced submissions + accounts, country detail pages, historical tracking, newsletter, embeddable widget.

**Key risks:** Numbeo licensing → publish *derived estimates* with methodology attribution, never their raw table; modeled-data credibility → tier badges on every row; scope creep → this document is the scope.

**90-day success:** 5,000 uniques, 1 media/classroom citation, map shared organically 25+ times.

---

## 2. UX Flows

**Navigation (4 items):** Index (home) · Rankings · Methodology · About.

**New visitor:** land → hero stat → hover 2–3 map countries (tooltip: flag, price, rank, tier) → scroll extremes strip → Rankings → sort by Burden → share/bookmark. Target: core journey < 60 seconds.

**Returning reader:** checks live macro strip (must show "Updated Xh ago") → pinned reference country at top of table (localStorage, no account).

**Power user (educator/journalist):** Methodology top-to-bottom → **Download CSV** (no email gate) → "Cite this index" copies formatted citation. CSV download is the highest-leverage feature for citations; do not gate it.

**Universal edge cases (all must be designed states, not afterthoughts):**
- FRED/World Bank down → macro strip shows cached values + "as of [date]"; never a broken widget; no cache at all → strip hides
- Network failure → country table is bundled JSON, core product works with every API dead
- 375px screens → map replaced by list view by default on mobile ("View map anyway" toggle)
- Empty search → "No country matches 'X' — yet."
- Map no-data countries → gray + tooltip explaining why
- localStorage unavailable → pin works per-session, silent

---

## 3. Design System & Screens

**Direction:** editorial economics meets specialty coffee — The Economist's data confidence, a café's warmth. Not a SaaS dashboard.

**Palette:** `--espresso #2B1B12` (text/dark) · `--crema #C89A5B` (accent/CTA) · `--porcelain #FAF6F0` (bg) · `--paper #FFFFFF` (cards) · `--roast #6B4A32` (secondary/borders) · `--verified #2E7D5B` · `--caution #B8860B` · `--modeled #8A8578` · `--error #A63D2F`. Map choropleth stays sequential blues (colorblind-safe).

**Type:** Fraunces 600 for display (H1 40/48, hero stat 64 desktop / 40 mobile); Inter for body (16/26) and data (15px **tabular-nums** — price columns must align). Self-host via next/font.

**Components:** StatCard, ConfidenceBadge (×3), CountryRow, DataStrip, MapTooltip, SortHeader, SearchInput, CitationToast, Footer. Buttons: primary (crema bg, 44px min), secondary (roast border), ghost (utility). Cards: 12px radius, 1px #EDE6DB border, shadows only on tooltip. 8px grid; 1200px max width; table 960px.

**Screens:**
- **Home:** H1 + rotating hero stat ("A shot in Copenhagen costs 7× a shot in Algiers.") + one CTA "Explore the rankings →"; full-width map w/ legend + tooltip; extremes strip (5 + 5 CountryRows); DataStrip (arabica ¢/lb, US coffee CPI YoY, timestamp); footer with methodology/CSV/"Built in Chicago".
- **Rankings:** sticky header (search, reference selector, Download CSV, Cite); columns Rank · Country · Price · Burden (% of daily GDP/capita) · Confidence; pinned row gets crema left-border; mobile collapses to cards; counts line "196 economies · 40 surveyed · 60 derived · 96 modeled" reads from dataset metadata, links to Methodology.
- **Methodology:** 680px measure editorial page — Sources → Cappuccino conversion → Confidence tiers (badges rendered + defined) → Limitations (modeled = ±40%, stated plainly) → Changelog.
- **About:** short, first-person. CTA "Suggest a price correction" → mailto.
- **404:** centered "$0.00".

Icons: Phosphor. Everything must hold at 375px.

---

## 4. 14-Day Build Plan

**Week 1:**
D1–2 scaffold (Next.js, Tailwind tokens, dataset in place, deploy pipeline live with empty shell — check domain availability Day 1) · D3–4 Rankings complete · D5 burden script (World Bank pull, baked at build) · D6–7 Homepage + choropleth port + `/design-html` pass.

**Week 2:**
D8 macro strip + FRED proxy w/ 6h cache · D9 Methodology/About/404 copy · D10 mobile pass at 375px · D11 `/qa` against checklist · D12 fixes (bonus feature only if clean by noon) · D13 `/review` + Lighthouse + OG images (the map screenshot is the marketing asset) · D14 `/land-and-deploy` + soft launch.

**Definition of done:** all 196 economies on map + table with correct tiers; burden computed everywhere GDP exists (null-GDP rows render "—", never crash sort); site fully functional with all external APIs blocked; 375px clean; CSV + cite work; methodology answers every "where's this from?"; deployed on custom domain with OG cards.

---

## 5. Stack

- **Next.js 14+ (App Router, TypeScript) on Vercel Hobby** — static-first generation, one route handler, $0/mo. Runs fine on Bun if gstack prefers it.
- **Tailwind** with §3 tokens in config · **D3 v7 + topojson-client**; `world-atlas@2` topology **self-hosted in /public** (never hot-link CDN in prod) · **Fraunces + Inter** via next/font
- **Analytics:** Vercel Analytics or Plausible — no Google Analytics (off-brand for a trust-first data site)
- **Env vars:** `FRED_API_KEY` only. Total secrets footprint: one key.
- Cost: $0/mo + ~$12/yr domain.

---

## 6. Data Architecture

### 6.1 Dataset — `data/espresso.json` (seed file ships with this spec)
Single source of truth, versioned in git, edited only via PR. Record schema:

```json
{
  "iso3": "ITA", "name": "Italy", "region": "Europe",
  "priceUSD": 1.45, "priceLow": 1.30, "priceHigh": 1.60,
  "tier": "surveyed", "source": "...",
  "gdpPerCapitaUSD": null, "burdenPct": null, "rank": null,
  "updated": "2026-07-02"
}
```

Rules: `tier` ∈ `surveyed | derived | modeled`, required · `iso3` is the universal join key (World Bank, topojson, flags) · `burdenPct = priceUSD / (gdpPerCapitaUSD/365) × 100` · missing GDP → `burdenPct: null` → render "—" with tooltip · `rank`, `gdpPerCapitaUSD`, `burdenPct` are **script-owned** — never hand-edited · top-level metadata `{version, generated, counts, total}` feeds the Rankings counts line so it can never drift.

### 6.2 Build scripts (`scripts/`)
- **build-burden.ts** — World Bank `NY.GDP.PCAP.CD` via `api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&mrnev=1&per_page=400`; computes burden, recomputes rank, rewrites JSON. Run quarterly via PR.
- **validate-data.ts** — CI on every commit: schema, unique iso3, price bounds $0.25–$8, tier counts match metadata, every iso3 exists in bundled topojson.
- **build-csv.ts** — generates `public/espresso-index.csv` at build; the download button serves a static file.

### 6.3 API route — `app/api/macro/route.ts` (the only runtime backend)
```
GET /api/macro → 200 {
  coffeeCpiYoY, coffeeCpiDate,      // FRED series CUSR0000SEFP01, YoY computed server-side
  arabicaUSDlb, arabicaDate,        // World Bank Pink Sheet monthly CSV
  fetchedAt, stale
}
```
`revalidate: 21600` (6h ISR) → ≤4 upstream calls/day at any traffic. Upstream failure → last cached payload with `stale: true` (DataStrip shows "as of" timestamp). No cache ever + failure → `204`, strip hides. Never 5xx to the client.

### 6.4 Caching
Pages: static at build (redeploy = data update) · `/api/macro`: ISR 6h, stale-on-error · topojson + CSV: /public, immutable headers · reference pin: localStorage only.

### 6.5 Admin
None. "Admin" = git commit + CI validation + deploy. Full audit history of every price change from day one is a feature for a credibility-first index.

### 6.6 V2 migration sketch (context only — do not build)
Supabase free tier: `submissions` (id, iso3, city, price_local, currency, venue_type, photo_url, submitted_at, status) + `price_history` (iso3, priceUSD, effective_date, source). Magic-link auth. Approved submissions feed quarterly recompute → JSON. The database feeds the build; it never serves the site.

### 6.7 Backend mistakes to avoid (top 10)
1. Client-side FRED calls (key leak, rate limits) — proxy only
2. Runtime dataset fetching — bake it; site must survive total API death
3. Hot-linking world-atlas CDN — self-host
4. Browser-computed rank/burden — build-time only
5. Broken widget on failed macro fetch — stale-with-timestamp, always
6. Hand-editing script-owned fields
7. No CI data validation — one typo'd price destroys credibility screenshots forever
8. CSV from an API route — static file
9. Unhandled null-GDP path (~8 economies) in burden sort
10. Adding a database "just in case" — premature state is the 2-week-deadline killer

---

## Appendix A — Methodology copy points (for the page draft)
- Tier definitions: **surveyed** = espresso surveys and price-index-backed data (40); **derived** = cappuccino-index conversion at ~65%, reflecting that espresso prices run 60–75% of cappuccino in milk-drink markets and independently lower in Southern European counter-service cultures (60); **modeled** = regional anchors + cost-of-living relationships, ±40% (96).
- Honest caveats to state plainly: no global body tracks espresso prices; crowdsourced sources skew urban; modeled tier is an estimate, not a measurement; Argentina-style currency swings can move rankings quickly.
- The count is 196 *economies*, not 195 UN states: includes Taiwan, Hong Kong, Kosovo, Vatican City; excludes North Korea (no market pricing).

## Appendix B — Hero stat rotation seeds
"A shot in Copenhagen costs 7× a shot in Algiers." · "Ethiopia gave the world coffee. It charges the least for it." · "In Denmark, an espresso costs $4.30. In Bosnia, $1.15." · "Italy invented espresso — and ranks 73rd of 196 on price."
