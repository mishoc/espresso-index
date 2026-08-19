# BUILD_PLAN.md — Income Inequality Education Site

Read `CLAUDE.md` first. It has the non-negotiable rules (especially on citation integrity and scope). This file is the ordered task backlog.

**How to work through this:** one task at a time, top to bottom within a phase. Each task has a Goal, Files, Steps, and Done-When. Do not mark a task done until every Done-When condition passes. Commit after each task. Do not start a phase until the previous phase's tasks are all done. If a task is ambiguous or requires a decision not covered in the architecture doc or CLAUDE.md, stop and ask rather than guessing — this is a public-facing site about a politically sensitive topic; silent assumptions are more costly here than on a typical app.

Two source files sit alongside this plan and are inputs, not templates to discard: `research-works.seed.json` (22 pre-verified bibliography entries) and the original architecture notes below each phase reference. If you need the fuller narrative context for a phase, it exists in the project's planning history — but this file should be self-sufficient to execute against.

---

## Phase 0 — Project Bootstrap

### P0.1 — Initialize the repo
**Goal:** A running Next.js + TypeScript + Tailwind project with linting and tests wired up.
**Steps:**
```bash
npx create-next-app@latest inequality-site --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd inequality-site
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test && npx playwright install --with-deps chromium
```
Add `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:e2e": "playwright test"` to `package.json` scripts.
Copy `CLAUDE.md`, `BUILD_PLAN.md`, and `research-works.seed.json` into the repo root.
**Done-When:** `npm run dev` serves the default Next.js page; `npm run lint`, `npm run typecheck`, `npm run build` all pass with zero errors.

### P0.2 — Folder scaffold
**Goal:** Empty directory structure matching CLAUDE.md's repo conventions.
**Files:** Create `/components`, `/content/explainers`, `/content/perspectives`, `/lib`, `/scripts`, `/public/data`, `/tests` (each with a `.gitkeep` or a placeholder `index.ts`).
**Done-When:** Directory tree matches CLAUDE.md exactly; `git status` shows the new structure.

### P0.3 — Base layout and design tokens
**Goal:** A shared app layout (header nav, footer, audience-switcher stub) and a Tailwind theme config reflecting a clean, flat, accessible visual style (no dark patterns, high contrast text, minimum 16px body text).
**Files:** `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `tailwind.config.ts`.
**Steps:** Header includes nav links for Learn / Data / Library / Perspectives / Resources / About (routes don't need to exist yet — link them, they'll 404 until later phases, that's expected at this stage). Add a persistent "last verified" style convention as a reusable `<SourceStamp date="..." source="..." />` component now, since it's used everywhere from Phase 1 on.
**Done-When:** Every page renders the same header/footer; `npm run build` passes; a manual check confirms nav links are present (even if pointing to not-yet-built routes).

---

## Phase 1 — Content Migration + Skeleton

### P1.1 — Home page
**Goal:** `/` renders the three audience-entry doors (Citizens / Researchers / Educators & Media) and a brief framing of the site's purpose and editorial stance (nonpartisan, source-everything).
**Files:** `app/page.tsx`, `components/AudienceCard.tsx`.
**Done-When:** Home renders 3 audience cards linking to `/learn`, `/library`, `/resources` respectively; passes a Lighthouse accessibility score of 90+.

### P1.2 — `ResearchWork` schema + loader
**Goal:** Canonical TypeScript types matching `research-works.seed.json` exactly, plus a typed loader.
**Files:** `lib/types.ts`, `lib/research-works.ts`.
**Steps:** Define `ResearchWork`, `Theme`, and `CitationCount` (nullable) types matching the JSON schema field-for-field. Write `getAllWorks()`, `getWorkById(id)`, `getWorksByTheme(themeId)` functions that read from `content/research-works.json` (copy `research-works.seed.json` there in this task — don't leave it only at repo root).
**Done-When:** A test in `tests/research-works.test.ts` asserts all 22 works load, all have required fields, and any work with `citation_count !== null` has a non-empty `source` and `verified_date`. `npm run test` passes.

### P1.3 — Paper/Book Detail page template
**Goal:** `/library/papers/[slug]` and `/library/books/[slug]` render a single `ResearchWork` using the Paper/Book Detail template from the architecture doc: full citation, plain + technical summaries, key takeaways, citation count block (or explicit "not independently verified" state), contested flag + link to perspective page if set, related works.
**Files:** `app/library/papers/[slug]/page.tsx`, `app/library/books/[slug]/page.tsx` (or a shared dynamic route keyed on `type`), `components/ResearchWorkDetail.tsx`.
**Steps:** Use `generateStaticParams` to pre-render all 22 entries at build time. The citation count block is the most important piece of UI in the whole site — build it as its own component (`components/CitationCountBadge.tsx`) so the "verified vs. not verified" states are visually distinct and reused consistently.
**Done-When:** All 22 works render at their correct URLs with zero missing-field errors; a work with `citation_count: null` visibly shows "not independently verified" rather than blank space or a fabricated number; `npm run build` succeeds with all 22 static pages listed in the build output.

### P1.4 — Three seed Explainer articles
**Goal:** Three `/learn/*` articles adapted from the site's existing research notes: "What Is Income Inequality?", "How Is It Measured?" (covering Gini coefficients and top-income-share methodology), and "The Kuznets Curve."
**Files:** `content/explainers/what-is-inequality.mdx`, `content/explainers/how-its-measured.mdx`, `content/explainers/kuznets-curve.mdx`, `app/learn/[slug]/page.tsx`, `app/learn/page.tsx` (hub).
**Steps:** Each article must cite at least one `ResearchWork` from `research-works.json` via its `id` (link into the detail page built in P1.3), and every factual/statistical claim must have an inline source. Do not write new statistics that aren't already in `research-works.json` — if the article needs a fact not in the seed data, flag it for human review instead of inventing it (per CLAUDE.md).
**Done-When:** All three articles render at `/learn/[slug]`, each links to at least one Library detail page, `npm run lint` and `npm run build` pass.

---

## Phase 2 — Library + Search

### P2.1 — Library Index page
**Goal:** `/library` renders a filterable/sortable table of all 22 works: title, authors, year, venue, theme tags, citation-count status (verified/not), contested flag.
**Files:** `app/library/page.tsx`, `components/LibraryTable.tsx`, `components/LibraryFilters.tsx`.
**Steps:** Filters: discipline (derive from themes — economics vs. political-science-tagged themes), theme (multi-select from `themes.json`), year range (slider or min/max inputs), "has verified citation count" toggle, "contested only" toggle. Client-side filtering is fine at this content volume (22 items) — no need for a backend.
**Done-When:** All 22 works appear by default; each filter, applied individually and in combination, produces the mathematically correct subset (write a test asserting this against known fixture data); table is keyboard-navigable.

### P2.2 — Theme pages
**Goal:** `/library/themes/[theme]` shows the same table pre-filtered to one theme, with a short theme description at the top.
**Files:** `app/library/themes/[theme]/page.tsx`.
**Done-When:** All 10 theme pages render via `generateStaticParams`; each shows only works tagged with that theme; theme description matches `themes.json`.

### P2.3 — Citation export
**Goal:** Downloadable BibTeX and RIS export, both site-wide (`/library/bibliography.bib`) and per-entry (a "cite this" button on each detail page).
**Files:** `lib/citation-export.ts`, route handlers for `.bib`/`.ris` generation.
**Steps:** Generate valid BibTeX/RIS from the existing `ResearchWork` fields only — do not add fields (like a fabricated abstract) that aren't in the source data.
**Done-When:** Downloaded `.bib` file parses without errors in a standard BibTeX parser (verify with a quick script, e.g. `bibtexparser` in Python, as part of the test step); every one of the 22 works has a valid entry.

### P2.4 — Site search
**Goal:** Site-wide search across explainers, library entries, and (once built) perspectives pages, via Pagefind.
**Files:** `scripts/build-search-index.js` (or Pagefind's standard postbuild hook), `app/search/page.tsx`, `components/SearchBar.tsx` in the header.
**Steps:** Wire Pagefind into the `next build` postbuild step. Search UI is a simple input + results list; no need for autocomplete/typeahead at launch.
**Done-When:** Searching "Kuznets" returns both the Kuznets library entry and the Kuznets-curve explainer; searching a term not in any content returns a clear "no results" state, not an error.

---

## Phase 3 — Data Explorer

### P3.1 — Data sync scripts (2 datasets only for launch)
**Goal:** Scheduled scripts that fetch WID.world top-income-share data and SWIID Gini data, and write static JSON snapshots to `/public/data/`.
**Files:** `scripts/sync-wid.ts`, `scripts/sync-swiid.ts`, `lib/dataset-metadata.ts` (tracks `{dataset, last_synced}` for the "data as of" stamps required by CLAUDE.md).
**Steps:** These are one-off/cron scripts, not live API calls from the browser — the site must never call WID.world or SWIID directly from a client component. Check each source's current terms of use / bulk-download format before writing the fetch logic; do not assume the exact endpoint shape without checking, since it may have changed since this plan was written.
**Done-When:** Running `npm run sync:data` produces valid, non-empty JSON files in `/public/data/` with a `last_synced` timestamp; a stale-data check (script exits non-zero if `last_synced` is more than 120 days old) exists and is documented.

### P3.2 — US top-income-share chart
**Goal:** `/data/us-top-income-shares` renders a line chart of the top 1%/10% income share over time, sourced from the P3.1 WID.world snapshot.
**Files:** `app/data/us-top-income-shares/page.tsx`, `components/charts/TopIncomeShareChart.tsx`.
**Steps:** Above the fold: a one-sentence plain-language caption. Below the chart: methodology note, `<SourceStamp>` with the real `last_synced` date, a link to download the underlying JSON, and a text/table alternative for screen readers (per CLAUDE.md accessibility rule — this is not optional).
**Done-When:** Chart renders real synced data (not mock/placeholder data) at build time; accessible text alternative present; Lighthouse accessibility 90+.

### P3.3 — Country-comparison Gini chart
**Goal:** `/data/country-comparison` lets a user pick 2–4 countries and compares Gini coefficients over time, sourced from the P3.1 SWIID snapshot.
**Files:** `app/data/country-comparison/page.tsx`, `components/charts/CountryComparisonChart.tsx`, `components/CountryPicker.tsx`.
**Done-When:** Same accessibility/sourcing bar as P3.2; country picker defaults to a sensible starting set (e.g., US, a Nordic country, one more) rather than an empty chart on first load.

### P3.4 — Data Explorer hub page
**Goal:** `/data` lists both charts plus placeholders (clearly marked "coming later," not broken links) for the deferred mobility map and percentile tool.
**Files:** `app/data/page.tsx`.
**Done-When:** Both live charts are linked and working; deferred features are visibly marked as not-yet-available rather than silently missing or 404ing.

---

## Phase 4 — Perspectives, Resources, About, Launch Polish

### P4.1 — Debate/Perspectives template + 3 pages
**Goal:** Build the structured pro/con template and populate: `technology-vs-politics`, `does-inequality-hurt-growth`, `gilens-page-debate`. (Defer `spirit-level-critique` to v1.1 if time-constrained — it's lower-traffic than the other three.)
**Files:** `app/perspectives/[slug]/page.tsx`, `content/perspectives/*.mdx`, `components/DebateViewpoint.tsx`.
**Steps:** Each page: framing of the disagreement, viewpoint A with sources (link to real `ResearchWork` entries via `related_perspective_slug` matches in `research-works.json`), viewpoint B with sources, an explicit "where the field currently stands" note that does not pick a winner. This is the highest editorial-risk content on the site — do not let it drift into a policy recommendation; re-read the CLAUDE.md editorial rules before writing copy here.
**Done-When:** All library entries with a matching `related_perspective_slug` are cross-linked from the corresponding perspectives page (verify programmatically, not just by eye); each page has both viewpoints represented with real sources, not strawmanned.

### P4.2 — Resources hub
**Goal:** `/resources` with one reading list per audience (citizen starter pack, researcher/syllabus list, journalist/educator kit), built entirely from links to content already on the site (library entries, explainers) — no new unsourced content required.
**Files:** `app/resources/page.tsx`, `content/resources/reading-lists.json`.
**Done-When:** Each reading list has 5–10 entries, every entry links to a real page on the site.

### P4.3 — About & Methods
**Goal:** `/about/editorial-standards`, `/about/how-we-verify-citations`, `/about/corrections`, `/about/contact`.
**Files:** `app/about/*/page.tsx`.
**Steps:** `/about/how-we-verify-citations` should describe, honestly, the actual verification process used to build `research-works.json` (Semantic Scholar API cross-checks, publisher-page confirmation, explicit nulls where unverified) — this page is the credibility backbone the whole site depends on; do not write vague "we take accuracy seriously" copy, describe the real method.
**Done-When:** All four pages exist and are linked from the footer.

### P4.4 — Accessibility audit
**Goal:** WCAG 2.1 AA pass across the whole site.
**Steps:** Run automated checks (axe-core via Playwright, or Lighthouse CI) against every route built so far. Fix all critical/serious issues. Document any remaining minor issues in an `ACCESSIBILITY.md` with a remediation plan rather than silently shipping them.
**Done-When:** Automated audit shows zero critical/serious violations across all routes; manual keyboard-navigation pass confirms every interactive element (filters, search, chart controls, country picker) is reachable and usable without a mouse.

### P4.5 — Pre-launch checklist
**Goal:** Final go/no-go check before this is called "launched."
**Steps — verify each explicitly, don't assume:**
- [ ] `npm run build` succeeds with zero errors/warnings
- [ ] `npm run test` and `npm run test:e2e` pass
- [ ] No `citation_count` anywhere in the UI without a `source` and `verified_date`, or an explicit "not verified" state — grep the codebase for any hardcoded citation numbers outside of `research-works.json`
- [ ] Every chart has a working "data as of" stamp and a text/table alternative
- [ ] Every Perspectives page has both viewpoints sourced and no policy recommendation language
- [ ] 404 page exists and is on-brand
- [ ] Sitemap.xml and robots.txt generated
- [ ] Lighthouse: Performance 80+, Accessibility 90+, Best Practices 90+, SEO 90+ on Home, one Library detail page, and one Data Explorer page
**Done-When:** Every box above is checked and evidenced (link the CI run or paste the Lighthouse scores in the PR description), not just asserted.

---

## Explicitly Deferred to v1.1+ (do not build in this pass)

Mobility map (Opportunity Insights embed), "where's my income" percentile tool, `spirit-level-critique` perspectives page if not reached in P4.1, live/auto citation-count refresh (quarterly manual re-verification is the launch process instead), multi-language support, user accounts or saved articles, comments. See CLAUDE.md "What NOT to build" — if a task here seems to require one of these, stop and flag it rather than building it.
