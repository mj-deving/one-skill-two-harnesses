import { ERRORS_TS, no, ok, read, runBun } from '../lib';
import type { Task } from '../types';

export default {
  id: 'error-invalid',
  skill: 'error-codes',
  heldout: false,
  prompt: 'Make charge() in src/payments.ts reject amounts that are zero or negative.',
  files: {
    'src/errors.ts': ERRORS_TS,
    'src/payments.ts': 'export function charge(amount: number): string {\n  return `charged ${amount}`;\n}\n',
  },
  check: (dir) => {
    if (/new Error\(/.test(read(dir, 'src/payments.ts') ?? '')) return no('throws a plain Error');
    const r = runBun(dir, `import { charge } from "./src/payments.ts";
for (const a of [0, -5]) { try { charge(a); console.log("no-throw"); } catch (e: any) { console.log(e.name + ":" + e.code); } }
console.log(charge(10));`);
    return r.out === 'AppError:INVALID_INPUT\nAppError:INVALID_INPUT\ncharged 10' ? ok() : no(`behaviour: ${r.out.slice(0, 200)}`);
  },
} satisfies Task;
