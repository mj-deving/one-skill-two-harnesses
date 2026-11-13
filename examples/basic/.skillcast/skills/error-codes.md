---
name: error-codes
description: "How to raise errors in this codebase. Use when adding validation, error handling or throwing errors in TypeScript code."
---
# Error codes

Never throw a plain `Error`. Throw `AppError` from `src/errors.ts` with an UPPER_SNAKE_CASE code as the first argument:

```ts
import { AppError } from "./errors";
throw new AppError("INVALID_INPUT", "amount must be positive");
```

Use `INVALID_INPUT` for bad arguments and `NOT_FOUND` for missing records.
