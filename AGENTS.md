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
