# Bench run 2026-11-13T20-37-42

Tasks: 6 · trials per task: 3 (control: 1) · runs: 84

- claude: 2.1.319 (Claude Code), model claude-opus-5-5
- codex: codex-cli 0.167.0, model gpt-5.6-sol

| harness | variant | all tasks | dev tasks | held-out tasks |
|---|---|---|---|---|
| claude | none | 1/6 | 0/4 | 1/2 |
| claude | copy | 18/18 | 12/12 | 6/6 |
| claude | generated | 18/18 | 12/12 | 6/6 |
| codex | none | 1/6 | 0/4 | 1/2 |
| codex | copy | 18/18 | 12/12 | 6/6 |
| codex | generated | 18/18 | 12/12 | 6/6 |

## Failures

- claude none changelog-fix #1: expected 1 entry under ## Unreleased, found 0
- codex none changelog-fix #1: expected 1 entry under ## Unreleased, found 0
- claude none error-invalid #1: behaviour: RangeError:undefined
RangeError:undefined
charged 10
- codex none error-invalid #1: behaviour: AppError:INVALID_AMOUNT
AppError:INVALID_AMOUNT
charged 10
- claude none error-notfound #1: behaviour: AppError:USER_NOT_FOUND
Ada
- codex none error-notfound #1: behaviour: AppError:USER_NOT_FOUND
Ada
- claude none test-math #1: src/math.spec.ts missing
- codex none test-math #1: src/math.spec.ts missing
- claude none test-slug #1: src/text/slugify.spec.ts missing
- codex none test-slug #1: src/text/slugify.spec.ts missing
