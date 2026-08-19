# Website Architecture: Income Inequality Education Site

This builds directly on `income_inequality_top_research.md` — that document becomes the seed content for the Research Library and several Learn articles. This doc covers information architecture, page templates, content model, data sources, tech stack, and a phased build plan.

A design decision up front, stated plainly rather than buried: income inequality is a politically charged topic. A site that wants to be trusted by "regular citizens, researchers, and others" simultaneously has to be visibly nonpartisan — present contested findings as contested, cite sources for every claim, and never take a policy position. That's a content-governance principle as much as an architecture one, but it shapes several structural decisions below (the "Perspectives & Debates" section exists specifically so contested claims have a designated home instead of leaking into "factual" pages).

---

## 1. Audiences and What They're Actually There For

Don't design three separate sites — design one shared content base with three different **entry doors** and **default sort orders**. The underlying pages are the same; what differs is what's surfaced first and how technical the default explanation is.

| Audience | Comes for | Bounces if... | Success looks like |
|---|---|---|---|
| **Regular citizens** | "Is inequality actually rising? Why should I care? What can I do?" | It reads like a journal abstract | They understand one concrete fact well enough to explain it to a friend |
| **Researchers / grad students** | Verified bibliography, methodology notes, contested-findings flags, data sources, citable summaries | Sourcing is sloppy or citation counts look made up | They find a paper faster than Google Scholar, and trust the summary enough to cite it as a starting point |
| **Journalists, teachers, policymakers, "others"** | Quotable facts, ready-made explainers, curricula, debate framing for balanced coverage | Content is either too shallow (no sourcing) or too dense (no summary) | They lift a chart or explainer directly into a lesson plan or article, with correct attribution |

## 2. Sitemap (see diagram above)

Three entry points feed one **Home**, which fans into three paired content tracks:

- **Understand**: Learn the Basics → Perspectives & Debates
- **Explore**: Data Explorer → Take Action & Resources
- **Verify**: Research Library → About & Methods

Full page tree:

```
/                              Home
/learn/                        Learn the Basics (hub)
  /learn/what-is-inequality
  /learn/how-its-measured        (Gini, top-income shares, SWIID methodology)
  /learn/kuznets-curve
  /learn/glossary                 (term definitions, linked from everywhere via tooltip)
  /learn/faq
/data/                          Data Explorer (hub)
  /data/us-top-income-shares      (Piketty–Saez / WID.world series)
  /data/global-inequality          (Milanovic elephant curve, updated)
  /data/mobility-map                (Chetty Opportunity Atlas embed/derivative)
  /data/country-comparison          (SWIID Gini, country picker)
  /data/wheres-my-income             ("citizen tool": enter income, see percentile — clearly labeled as illustrative)
/library/                        Research Library (hub)
  /library/papers/[slug]            one page per paper (see template below)
  /library/books/[slug]
  /library/themes/[theme]           filtered views: measurement, growth & politics, wage inequality, mobility, political science
  /library/bibliography.bib         downloadable BibTeX/RIS export
/perspectives/                    Perspectives & Debates (hub)
  /perspectives/technology-vs-politics
  /perspectives/does-inequality-hurt-growth
  /perspectives/gilens-page-debate
  /perspectives/spirit-level-critique
/resources/                       Take Action & Resources (hub)
  /resources/reading-lists          (by audience: citizen starter pack, syllabus, journalist kit)
  /resources/curricula               (downloadable lesson plans)
  /resources/organizations           (nonpartisan directory, labeled by orientation where relevant)
  /resources/glossary-download
/about/                            About & Methods
  /about/editorial-standards
  /about/how-we-verify-citations
  /about/corrections
  /about/contact
/search                            Site-wide search
```

Global elements on every page: header nav (Learn / Data / Library / Perspectives / Resources / About), audience switcher (persists as a cookie preference, not a hard fork), search, and a persistent "last verified" date + source link on any factual claim or statistic.

## 3. Page Templates

Rather than designing every page individually, define ~6 reusable templates. This keeps the site maintainable and lets the researcher and citizen audiences share infrastructure.

**Explainer Article** (`/learn/*`, `/perspectives/*`)
Title, one-sentence summary, reading-level toggle (plain-language / detailed), body content with inline glossary tooltips, "sources for this page" box at the bottom (every claim traceable), related articles, related library entries.

**Paper/Book Detail** (`/library/papers/[slug]`, `/library/books/[slug]`)
Full citation (author, year, venue, DOI/ISBN), one-paragraph plain-language summary, one-paragraph technical summary, key takeaways (bulleted, technical audience), citation count **with source and verification date** (never an unsourced number — this is the single most important integrity rule in the whole site, learned directly from building the bibliography this site launches with), "contested?" flag with link to the relevant Perspectives page if applicable, related works, downloadable citation (BibTeX/RIS/APA).

**Data Explorer Page** (`/data/*`)
Chart(s) with a plain-language caption above the fold, methodology note (what's the source dataset, how often updated, known limitations), download-the-data link, embed code for journalists/teachers, "how to read this chart" collapsible for citizen audience.

**Debate/Perspectives Page** (`/perspectives/*`)
Structured pro/con or multi-viewpoint format: framing of the disagreement, viewpoint A with its strongest evidence and sourcing, viewpoint B with its strongest evidence and sourcing, where the field currently stands (with explicit "this is contested, not settled" framing), further reading.

**Library Index / Filtered List** (`/library/themes/*`, `/library/`)
Filterable/sortable table: title, authors, year, venue, theme tags, citation count (sourced), contested flag. Filters: discipline (economics/political science), theme, year range, "has verified citation count" toggle.

**Resource/Download Page** (`/resources/*`)
Short framing paragraph, resource cards (reading list, curriculum, org directory entry) each with a one-line description and a download or external link.

## 4. Content Model (what a CMS or data layer needs to hold)

```
ResearchWork
  id, type (paper | book), title, authors[], year,
  venue (journal/publisher), doi_or_isbn, url,
  summary_plain, summary_technical, key_takeaways[],
  citation_count { value, source, verified_date } | null,
  is_contested (bool), contested_note, related_perspective_slug,
  themes[] (fk -> Theme), audience_level (intro | intermediate | advanced),
  related_works[] (fk -> ResearchWork)

Theme
  id, name, description, parent_theme (optional, for nesting)

Dataset
  id, name, source_org, url, coverage (countries/years),
  update_frequency, last_synced, license

Explainer
  id, slug, title, audience_level, body (MDX), sources[] (fk -> ResearchWork | Dataset),
  glossary_terms_used[]

GlossaryTerm
  id, term, plain_definition, technical_definition, related_terms[]

DebatePage
  id, slug, title, framing, viewpoints[] { label, summary, sources[] },
  field_status_note

Resource
  id, type (reading_list | curriculum | org_directory_entry),
  title, description, audience[], file_url | external_url
```

This is exactly the shape of the bibliography already built for you — `ResearchWork` maps almost one-to-one onto the entries in `income_inequality_top_research.md`. Migrating that document into this schema is most of the Research Library's launch content.

## 5. Data Sources (real, existing, citable — not to be built from scratch)

| Source | What it powers | Access |
|---|---|---|
| **WID.world / Piketty–Saez–Zucman World Inequality Database** | US and global top-income-share charts | Public API + bulk CSV |
| **Frederick Solt's SWIID** | Cross-country Gini comparison tool | Public download (Harvard Dataverse), versioned |
| **Opportunity Insights (Chetty et al.)** | Mobility map, place-based mobility data | Public data + published maps; check current embed/reuse terms before embedding |
| **Lakner–Milanovic global income distribution data** (World Bank / WID) | Elephant curve visualization | Public replication data |
| **Semantic Scholar API** | Citation counts + verification dates on Library pages | Free public API, rate-limited — cache results, don't call live per-pageview |

Two integrity rules that follow directly from lessons in building the underlying bibliography: (1) citation counts drift and different databases disagree — store `{value, source, verified_date}` per work and re-verify on a schedule (quarterly is reasonable), never hardcode a number without provenance; (2) several datasets above are updated on their own cadence (SWIID especially) — the Data Explorer needs a visible "data as of [date]" stamp, not a silent live feed that could go stale without anyone noticing.

## 6. Tech Stack Recommendation

This is a **content and data-visualization site, not an application** — no user accounts, no payments, no real-time multi-user features are required for launch. That materially simplifies the stack versus a typical app build.

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Next.js** (or Astro if the team wants less JS by default) | Static generation for content pages = fast + good SEO; server/edge functions only where needed (search API, citation re-verification cron) |
| Content | **MDX files in-repo**, or a lightweight headless CMS (Sanity/Contentful) if non-engineers will edit content directly | The bibliography is already structured JSON/Markdown-shaped; don't over-engineer a CMS for launch |
| Data viz | **Observable Plot or Recharts**, fed by static JSON snapshots synced from WID.world / SWIID / Opportunity Insights via a scheduled job | No need for a live database; periodic sync jobs (weekly/monthly) into static JSON is simpler and more reliable than live API calls per pageview |
| Search | **Pagefind** (static, no backend) for launch; upgrade to Algolia only if content volume or query complexity grows | Site is content-moderate in size; a static search index avoids a whole backend service |
| Hosting | **Vercel or Netlify** | Matches Next.js/Astro, handles static + edge functions, generous free tier for a public-interest site |
| Accounts/payments | **None at launch** | Nothing in the stated scope needs them; adding a newsletter signup (e.g., Buttondown/ConvertKit embed) is the only "account-like" feature worth considering |
| Accessibility | **WCAG 2.1 AA** as a hard requirement, not an aspiration | Public civic-education site; also directly serves the "regular citizens" audience, many of whom will land via search rather than a technical referral |

What to avoid: a full headless-CMS-plus-database-plus-auth stack (Bubble/Xano-style) — that's overhead this project doesn't need, and it exists in this framework's checklist mainly for apps with accounts and transactions, neither of which apply here.

## 7. Phased Build Plan

**Phase 1 (weeks 1–2): Content migration + skeleton**
Stand up Next.js/Astro project. Migrate the verified bibliography into the `ResearchWork` schema. Build Home, Learn hub, and 3–4 seed Explainer articles from the research doc's "Cross-Cutting Lessons" section. Build the Paper/Book Detail template and populate all 19 entries from the bibliography.

**Phase 2 (weeks 3–4): Library + search**
Build the filterable Library Index, theme pages, BibTeX/RIS export. Add Pagefind search. Add the citation-count verification metadata display (value/source/date) on every entry — this is the site's core trust mechanic, don't ship without it.

**Phase 3 (weeks 5–6): Data Explorer**
Build data-sync scripts for WID.world and SWIID (start with 2 charts: US top-1% share over time, and a country-comparison Gini chart). Add "data as of" stamps and methodology notes. Defer the mobility map (Opportunity Insights) and the "where's my income" percentile tool to Phase 4+ — they're higher-effort and not required for a credible launch.

**Phase 4 (weeks 7–8): Perspectives, Resources, About, polish**
Build the 3–4 highest-value Debate pages (technology-vs-politics, inequality-and-growth, Gilens-Page). Build Resources hub with one reading list per audience. Write About/Methods pages — critically, "How We Verify Citations," since that's the credibility backbone the whole site depends on. Accessibility audit. Launch.

**Deferred to v2 (explicitly out of scope for launch):** mobility map embed, live citation-count auto-refresh (start with quarterly manual re-verification instead), multi-language support, user accounts/saved-articles, comments/community features (high moderation burden on a politically sensitive topic — think hard before adding).

---

## Next Steps

I can turn any single piece of this into something concrete right now: a working HTML/React prototype of the Home page and one Explainer article, the actual `ResearchWork` JSON migrated from the bibliography doc, or a first data-viz page wired to real WID.world data. Tell me which one and I'll build it rather than keep planning.
