import { ERRORS_TS, no, ok, read, runBun } from '../lib';
import type { Task } from '../types';

export default {
  id: 'error-notfound',
  skill: 'error-codes',
  heldout: true,
  prompt: 'getUser() in src/users.ts silently returns undefined for unknown ids. Make it fail clearly instead.',
  files: {
    'src/errors.ts': ERRORS_TS,
    'src/users.ts': 'const users = [{ id: 1, name: "Ada" }];\n\nexport function getUser(id: number) {\n  return users.find((u) => u.id === id);\n}\n',
  },
  check: (dir) => {
    if (/new Error\(/.test(read(dir, 'src/users.ts') ?? '')) return no('throws a plain Error');
    const r = runBun(dir, `import { getUser } from "./src/users.ts";
try { getUser(99); console.log("no-throw"); } catch (e: any) { console.log(e.name + ":" + e.code); }
console.log(getUser(1)?.name);`);
    return r.out === 'AppError:NOT_FOUND\nAda' ? ok() : no(`behaviour: ${r.out.slice(0, 200)}`);
  },
} satisfies Task;
