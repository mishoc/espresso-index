# CLAUDE.md — Income Inequality Education Site

This file is read automatically by Claude Code at the start of every session in this repo. Follow it. If any instruction here conflicts with a request in a prompt, follow this file unless the human explicitly overrides it in that session.

## What this project is

A public-interest content and data-visualization website explaining income inequality research to three audiences: regular citizens, researchers, and journalists/educators. It is **not** an application — no user accounts, no payments, no auth, no database of user-generated content at launch. It is a content site with some client-side interactivity for charts and search.

Read these two files before doing anything else, in this order:
1. `BUILD_PLAN.md` — the ordered task backlog. Work through it top to bottom, task by task. Do not skip ahead or batch multiple tasks into one commit.
2. `research-works.seed.json` — the pre-verified bibliography content. This is real, human-checked data. **Do not regenerate, paraphrase away, or "improve" the facts in this file.** It is source-of-truth content, not a placeholder.

## The one rule that matters more than any other

This site's entire value proposition is that it can be trusted more than a random blog post. That trust rests on one mechanic: **every factual claim and every citation count is traceable to a source, and every citation count carries a `{value, source, verified_date}` — never a bare number.**

Concretely, this means:
- Never invent a citation count. If `research-works.seed.json` has `citation_count: null`, the UI must render "citation count not independently verified" (or similar), not a placeholder number, not "~1,000+", not an omission that looks like zero.
- Never invent a DOI, ISBN, or URL. If a field is `null` in the seed data, leave it null in the UI (hide the field or show "not available") rather than fabricating a plausible-looking one.
- When adding new content (new papers, new explainer text, new chart captions), the same standard applies: source it or don't ship it. If you (the agent) are not sure a fact is correct, say so in a code comment and flag it for human review rather than writing it into a published page with confident phrasing.
- Any statistic on a `/data/*` page must show a "data as of [date]" stamp sourced from the actual dataset's last-updated metadata, not the page's build date.

If a task in BUILD_PLAN.md would require you to invent facts to complete it (e.g., "add 5 more research works" with no source data provided), stop and flag it instead of inventing entries.

## Tech stack (already decided — do not re-litigate without a strong reason)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Content | MDX files in-repo for explainers/perspectives; JSON for structured research-works data (see `research-works.seed.json`) |
| Styling | Tailwind CSS |
| Data viz | Observable Plot or Recharts — pick one in Phase 3 and use it consistently, don't mix libraries |
| Search | Pagefind (static, build-time index) |
| Hosting target | Vercel (assume Vercel-compatible config: `next.config.js`, no custom server) |
| Testing | Vitest for unit tests, Playwright for a small smoke-test suite (home page loads, library filters work, one data page renders a chart) |

No auth libraries, no payment SDKs, no database ORM should appear in `package.json` unless a future BUILD_PLAN phase explicitly adds one.

## Repo conventions

```
/app                    Next.js App Router pages
  /learn/...
  /data/...
  /library/...
  /perspectives/...
  /resources/...
  /about/...
/components              Shared UI components
/content
  /explainers/*.mdx
  /perspectives/*.mdx
  research-works.json    <- copied/synced from research-works.seed.json (see Phase 1)
  themes.json
/lib                      Data loading, schema types, dataset sync scripts
/scripts                  Scheduled sync scripts (WID.world, SWIID, citation re-verification)
/public/data               Static JSON snapshots consumed by chart components
/tests
```

- TypeScript strict mode on.
- Component files: PascalCase. Route files follow Next.js App Router conventions.
- Every `ResearchWork` type in code must match the schema in `research-works.seed.json` exactly — see Phase 1, Task 1.3 for where to define the canonical TypeScript type.
- Commit messages: one BUILD_PLAN task per commit where practical, referencing the task ID (e.g., `[P1.3] Define ResearchWork TypeScript type and loader`).

## Commands

```bash
npm run dev          # local dev server
npm run build         # production build (must pass before marking any phase complete)
npm run lint            # eslint
npm run typecheck        # tsc --noEmit
npm run test              # vitest
npm run test:e2e           # playwright
npm run sync:data           # runs /scripts data-sync jobs (Phase 3+)
```

Before marking any BUILD_PLAN task complete, `npm run build`, `npm run lint`, and `npm run typecheck` must all pass with zero errors.

## Content and editorial rules (apply to every page you write or generate)

- **No policy positions.** Never write copy that recommends a specific policy (a tax rate, a specific redistribution scheme) as "the answer." Present contested empirical questions as contested — this is enforced structurally by the `is_contested` / `related_perspective_slug` fields in the research-works schema; use them.
- **Plain-language first, technical detail available.** Every explainer needs a plain-language summary a non-economist can follow, with technical depth available via a toggle or a linked "technical summary," not the only version.
- **Every chart needs a methodology note and a source link.** No exceptions, including placeholder/demo charts built during development — if a chart ships to `main`, it ships with its sourcing.
- **Accessibility is not optional.** WCAG 2.1 AA. Every chart needs a text alternative (a data table or plain-language description) for screen readers; this is a launch blocker, not a nice-to-have (see BUILD_PLAN Phase 4).

## What NOT to build (explicitly out of scope — do not add proactively)

- User accounts, login, saved articles
- Comments or any user-generated content / moderation queue
- Payments or donations processing
- A general-purpose CMS admin UI (content is managed via MDX/JSON files in-repo for launch)
- Multi-language/i18n support
- Live (non-cached) third-party API calls on every pageview — all external data must be synced to static JSON on a schedule, never fetched live per-request

If a task seems to require one of these, stop and flag it rather than building it — it's very likely scope creep, not a missed requirement.
