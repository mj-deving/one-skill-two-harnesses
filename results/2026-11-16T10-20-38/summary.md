# Bench run 2026-11-16T10-20-38

Tasks: 6 · trials per task: 3 (control: 1) · runs: 84

- claude: 2.1.325 (Claude Code), model claude-opus-5-5
- codex: codex-cli 0.169.0, model gpt-5.6-sol

| harness | variant | all tasks | dev tasks | held-out tasks |
|---|---|---|---|---|
| claude | none | 1/6 | 0/4 | 1/2 |
| claude | stale | 3/18 | 0/12 | 3/6 |
| claude | generated | 18/18 | 12/12 | 6/6 |
| codex | none | 1/6 | 0/4 | 1/2 |
| codex | stale | 3/18 | 0/12 | 3/6 |
| codex | generated | 18/18 | 12/12 | 6/6 |

## Failures

- claude none changelog-fix #1: expected 1 entry under ## [Unreleased], found 0
- claude stale changelog-fix #1: expected 1 entry under ## [Unreleased], found 0
- claude stale changelog-fix #2: expected 1 entry under ## [Unreleased], found 0
- claude stale changelog-fix #3: expected 1 entry under ## [Unreleased], found 0
- codex none changelog-fix #1: expected 1 entry under ## [Unreleased], found 0
- codex stale changelog-fix #1: expected 1 entry under ## [Unreleased], found 0
- codex stale changelog-fix #2: expected 1 entry under ## [Unreleased], found 0
- codex stale changelog-fix #3: expected 1 entry under ## [Unreleased], found 0
- claude none error-invalid #1: behaviour: RangeError:undefined
RangeError:undefined
charged 10
- claude stale error-invalid #1: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- claude stale error-invalid #2: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- claude stale error-invalid #3: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- codex none error-invalid #1: behaviour: AppError:INVALID_AMOUNT
AppError:INVALID_AMOUNT
charged 10
- codex stale error-invalid #1: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- codex stale error-invalid #2: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- codex stale error-invalid #3: behaviour: AppError:INVALID_INPUT
AppError:INVALID_INPUT
charged 10
- claude none error-notfound #1: behaviour: AppError:USER_NOT_FOUND
Ada
- claude stale error-notfound #1: behaviour: AppError:NOT_FOUND
Ada
- claude stale error-notfound #2: behaviour: AppError:NOT_FOUND
Ada
- claude stale error-notfound #3: behaviour: AppError:NOT_FOUND
Ada
- codex none error-notfound #1: behaviour: AppError:USER_NOT_FOUND
Ada
- codex stale error-notfound #1: behaviour: AppError:NOT_FOUND
Ada
- codex stale error-notfound #2: behaviour: AppError:NOT_FOUND
Ada
- codex stale error-notfound #3: behaviour: AppError:NOT_FOUND
Ada
- claude none test-math #1: test/math.test.ts missing
- claude stale test-math #1: test placed inside src/
- claude stale test-math #2: test placed inside src/
- claude stale test-math #3: test placed inside src/
- codex none test-math #1: test/math.test.ts missing
- codex stale test-math #1: test placed inside src/
- codex stale test-math #2: test placed inside src/
- codex stale test-math #3: test placed inside src/
- claude none test-slug #1: test/text/slugify.test.ts missing
- claude stale test-slug #1: test placed inside src/
- claude stale test-slug #2: test placed inside src/
- claude stale test-slug #3: test placed inside src/
- codex none test-slug #1: test/text/slugify.test.ts missing
- codex stale test-slug #1: test placed inside src/
- codex stale test-slug #2: test placed inside src/
- codex stale test-slug #3: test placed inside src/
