---
name: test-layout
description: "Where and how to write tests. Use when asked to add, write or extend tests."
cursor-globs: "test/**/*.test.ts"
---
# Test layout

- Put tests under `test/`, mirroring the path below `src/`, as `<file>.test.ts` (for `src/math.ts` that is `test/math.test.ts`, for `src/text/slugify.ts` it is `test/text/slugify.test.ts`). No test files inside `src/`.
- Import from `bun:test`.
- One `describe` block per exported function, named exactly like the function, for example `describe("add", ...)`.
