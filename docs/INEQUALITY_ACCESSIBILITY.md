# Accessibility

Target: WCAG 2.1 AA (CLAUDE.md — launch blocker, not a nice-to-have).

## Automated audit (P4.4) — 2026-08-19

`npm run test:e2e` runs axe-core (tags wcag2a/2aa/21a/21aa) against 17 routes
covering every template: home, learn hub + article, library index, paper +
book detail, theme page, data hub + both charts, perspectives hub + page,
resources, about hub + methods page, search, 404.

Result: **0 serious or critical violations** on all 17 routes.
Lighthouse accessibility: 100 on home, library detail, and data page.

One real defect was found and fixed during the audit: `aria-sort` was on the
sort `<button>` instead of the `<th>` (axe `aria-allowed-attr`, critical).

## Manual keyboard pass

- Skip link → main content. Header nav, all filters (search, discipline,
  year inputs, checkboxes, theme checkboxes), sort headers, country picker
  (chips, add-input, suggestion list), chart `<details>` toggles, and
  search input are all reachable and operable by keyboard; focus ring is a
  3px accent outline.
- Charts are `aria-hidden`; the accessible alternative is the adjacent data
  table (`<details>` "Data table (text alternative)") and the plain-language
  caption above the fold.

## Known minor items (remediation plan)

- Country-picker suggestion list is a plain `<ul role=listbox>` of buttons;
  arrow-key navigation between suggestions is not implemented (Tab works).
  Plan: add roving tabindex + Up/Down handling in v1.1.
- Pagefind result excerpts are injected HTML from the index (`<mark>` tags
  only). Plan: keep; excerpts contain no interactive content.
