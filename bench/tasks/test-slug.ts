import { no, ok, read } from '../lib';
import type { Task } from '../types';

export default {
  id: 'test-slug',
  skill: 'test-layout',
  heldout: false,
  prompt: 'Write tests for the slugify function.',
  files: {
    'src/text/slugify.ts': 'export function slugify(s: string): string {\n  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");\n}\n',
  },
  check: (dir) => {
    if (read(dir, 'src/text/slugify.spec.ts')) return no('test placed inside src/');
    const spec = read(dir, 'test/text/slugify.test.ts');
    if (!spec) return no('test/text/slugify.test.ts missing');
    if (!spec.includes('bun:test')) return no('does not import bun:test');
    if (!/describe\(\s*["'`]slugify["'`]/.test(spec)) return no('no describe("slugify")');
    const r = Bun.spawnSync(['bun', 'test', './test/text/slugify.test.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe', timeout: 60_000 });
    return r.exitCode === 0 ? ok() : no('bun test fails');
  },
} satisfies Task;
