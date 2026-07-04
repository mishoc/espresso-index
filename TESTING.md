# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast,
trust your instincts, and ship with confidence — without them, vibe coding is
just yolo coding. With tests, it's a superpower.

## Framework

- **vitest 4** (jsdom environment, `@testing-library/react` available for
  component tests)
- Test files live in `tests/**/*.test.{ts,tsx}`

## Commands

| Command | What |
|---|---|
| `npm test` | Run the full suite once (CI mode) |
| `npx vitest` | Watch mode |
| `npm run validate` | Dataset CI gate (schema, bounds, tier counts, topojson, ranks) |

## Layers

- **Unit** — pure logic: rank semantics (`tests/rank.test.ts`), flag emoji
  (`tests/flag.test.ts`).
- **Data invariants** — every Appendix B hero-stat number must recompute from
  `data/espresso.json` (`tests/hero-seeds.test.ts`). If a data update breaks a
  homepage claim, CI fails before the false stat ships.
- **Dataset validation** — `scripts/validate-data.ts`, run as `prebuild` and in CI.
- **E2E/browser** — `/qa` runs against the dev server; regression tests from QA
  fixes land in `tests/` with `ISSUE-NNN` attribution comments.

## Conventions

- `describe`/`it` with behavior-phrased names ("ties share the minimum rank").
- Assert what the code *does*, never just that it exists.
- Mock external services; never import secrets in tests.
- Bug fix → regression test in the same PR, with a comment pointing at the
  issue/report that found it.
