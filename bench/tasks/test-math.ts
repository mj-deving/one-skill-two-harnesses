import { no, ok, read } from '../lib';
import type { Task } from '../types';

export default {
  id: 'test-math',
  skill: 'test-layout',
  heldout: false,
  prompt: 'Add tests for src/math.ts.',
  files: { 'src/math.ts': 'export const add = (a: number, b: number) => a + b;\nexport const sub = (a: number, b: number) => a - b;\n' },
  check: (dir) => {
    if (read(dir, 'src/math.spec.ts')) return no('test placed inside src/');
    const spec = read(dir, 'test/math.test.ts');
    if (!spec) return no('test/math.test.ts missing');
    if (!spec.includes('bun:test')) return no('does not import bun:test');
    for (const fn of ['add', 'sub']) if (!new RegExp(`describe\\(\\s*["'\`]${fn}["'\`]`).test(spec)) return no(`no describe("${fn}")`);
    const r = Bun.spawnSync(['bun', 'test', './test/math.test.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe', timeout: 60_000 });
    return r.exitCode === 0 ? ok() : no('bun test fails');
  },
} satisfies Task;
