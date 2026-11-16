---
name: error-codes
description: "How to raise errors in this codebase. Use when adding validation, error handling or throwing errors in TypeScript code."
---
# Error codes

Never throw a plain `Error`. Throw `AppError` from `src/errors.ts` with an UPPER_SNAKE_CASE code as the first argument:

```ts
import { AppError } from "./errors";
throw new AppError("VALIDATION_FAILED", "amount must be positive");
```

Use `VALIDATION_FAILED` for bad arguments and `RECORD_NOT_FOUND` for missing records. The older codes `INVALID_INPUT` and `NOT_FOUND` are retired; do not use them.
