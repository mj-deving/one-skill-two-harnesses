import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Task } from '../bench/types';

const tasks: Task[] = await Promise.all(readdirSync(join(import.meta.dir, '../bench/tasks')).sort().map(async (f) => (await import(`../bench/tasks/${f}`)).default));

const SPEC = (fns: string[], file: string) =>
  `import { describe, expect, test } from "bun:test";\nimport * as m from "./${file}";\n` +
  fns.map((f) => `describe("${f}", () => { test("is a function", () => expect(typeof (m as any).${f}).toBe("function")); });\n`).join('');

/** A correct solution per task; the check must pass on it and fail on the untouched fixture. */
const SOLUTIONS: Record<string, Record<string, string>> = {
  'changelog-fix': { 'CHANGELOG.md': '# Changelog\n\n## Unreleased\n\n- fix: login sessions no longer expire after five minutes\n' },
  'changelog-feat': { 'CHANGELOG.md': '# Changelog\n\n## Unreleased\n\n- feat: add csv export to the reports page\n\n## 1.0.0\n\n- feat: first release\n' },
  'error-invalid': {
    'src/payments.ts': 'import { AppError } from "./errors";\nexport function charge(amount: number): string {\n  if (amount <= 0) throw new AppError("INVALID_INPUT", "amount must be positive");\n  return `charged ${amount}`;\n}\n',
  },
  'error-notfound': {
    'src/users.ts': 'import { AppError } from "./errors";\nconst users = [{ id: 1, name: "Ada" }];\nexport function getUser(id: number) {\n  const u = users.find((x) => x.id === id);\n  if (!u) throw new AppError("NOT_FOUND", `user ${id}`);\n  return u;\n}\n',
  },
  'test-math': { 'src/math.spec.ts': SPEC(['add', 'sub'], 'math') },
  'test-slug': { 'src/text/slugify.spec.ts': SPEC(['slugify'], 'slugify') },
};

/** Wrong-but-plausible answers that ignore the skill's convention; each must fail. */
const DECOYS: Record<string, Record<string, string>> = {
  'changelog-fix': { 'CHANGELOG.md': '# Changelog\n\n## Unreleased\n\n- Fixed login sessions expiring after five minutes.\n' },
  'changelog-feat': { 'CHANGELOG.md': '# Changelog\n\n## Unreleased\n\n- feat: add csv export\n\n## 1.0.0\n\n- feat: first release (initial)\n' },
  'error-invalid': { 'src/payments.ts': 'export function charge(amount: number): string {\n  if (amount <= 0) throw new Error("amount must be positive");\n  return `charged ${amount}`;\n}\n' },
  'error-notfound': { 'src/users.ts': 'import { AppError } from "./errors";\nconst users = [{ id: 1, name: "Ada" }];\nexport function getUser(id: number) {\n  const u = users.find((x) => x.id === id);\n  if (!u) throw new AppError("USER_MISSING", `user ${id}`);\n  return u;\n}\n' },
  'test-math': { 'test/math.test.ts': SPEC(['add', 'sub'], '../src/math') },
  'test-slug': { 'src/text/slugify.spec.ts': SPEC(['slug'], 'slugify').replace('describe("slug"', 'describe("slug helpers"') },
};

function fixture(task: Task, extra: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'skillcast-check-'));
  for (const [rel, text] of Object.entries({ ...task.files, ...extra })) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

describe('bench tasks (ISC-10)', () => {
  test('at least 6 tasks over 3 skills, at least 2 held out', () => {
    expect(tasks.length).toBeGreaterThanOrEqual(6);
    expect(new Set(tasks.map((t) => t.skill)).size).toBeGreaterThanOrEqual(3);
    expect(tasks.filter((t) => t.heldout).length).toBeGreaterThanOrEqual(2);
  });

  for (const task of tasks) {
    test(`${task.id}: check passes a correct solution, fails the untouched fixture and a decoy`, async () => {
      expect(await task.check(fixture(task, SOLUTIONS[task.id]))).toEqual({ pass: true, reason: 'ok' });
      expect((await task.check(fixture(task))).pass).toBe(false);
      expect((await task.check(fixture(task, DECOYS[task.id]))).pass).toBe(false);
    });
  }
});
