<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Testing

- Run: `npm test` (vitest, tests in `tests/`); dataset gate: `npm run validate`. See TESTING.md.
- 100% test coverage is the goal — tests make vibe coding safe.
- New function → corresponding test. Bug fix → regression test. New error
  handling → a test that triggers the error. New conditional → tests for BOTH paths.
- Never commit code that makes existing tests fail.

## Inequality section (/inequality)

Content, data, and editorial rules for the Inequality Explained section live
under `content/inequality/` — read `content/inequality/CLAUDE.md` before
touching anything there. Its two non-negotiables: never invent or estimate a
citation count/DOI (null → "not independently verified"), and no policy
positions. Section tests are `tests/inequality-*.test.ts` + `tests/e2e/`.
Data refresh: `npm run sync:inequality` (WID via HTTP-Range zip extraction,
SWIID via GitHub CSV); `npm run data:check` fails past 120 days.
