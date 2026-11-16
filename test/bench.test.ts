import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Task } from '../bench/types';

const tasks: Task[] = await Promise.all(readdirSync(join(import.meta.dir, '../bench/tasks')).sort().map(async (f) => (await import(`../bench/tasks/${f}`)).default));

const SPEC = (fns: string[], file: string) =>
  `import { describe, expect, test } from "bun:test";\nimport * as m from "./${file}";\n` +
  fns.map((f) => `describe("${f}", () => { test("is a function", () => expect(typeof (m as any).${f}).toBe("function")); });\n`).join('');

/** Correct under the v1 rules in examples/basic; the v2 checks must reject every one (ISC-23). */
const V1: Record<string, Record<string, string>> = {
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

/** A correct solution per task under the v2 rules in bench/v2/.skillcast. */
const SOLUTIONS: Record<string, Record<string, string>> = {
  'changelog-fix': { 'CHANGELOG.md': V1['changelog-fix']['CHANGELOG.md'].replace('## Unreleased', '## [Unreleased]') },
  'changelog-feat': { 'CHANGELOG.md': V1['changelog-feat']['CHANGELOG.md'].replace('## Unreleased', '## [Unreleased]') },
  'error-invalid': { 'src/payments.ts': V1['error-invalid']['src/payments.ts'].replace('INVALID_INPUT', 'VALIDATION_FAILED') },
  'error-notfound': { 'src/users.ts': V1['error-notfound']['src/users.ts'].replace('"NOT_FOUND"', '"RECORD_NOT_FOUND"') },
  'test-math': { 'test/math.test.ts': SPEC(['add', 'sub'], '../src/math') },
  'test-slug': { 'test/text/slugify.test.ts': SPEC(['slugify'], '../../src/text/slugify') },
};

/** Wrong-but-plausible answers that ignore the convention altogether; each must fail. */
const DECOYS: Record<string, Record<string, string>> = {
  'changelog-fix': { 'CHANGELOG.md': '# Changelog\n\n## [Unreleased]\n\n- Fixed login sessions expiring after five minutes.\n' },
  'changelog-feat': { 'CHANGELOG.md': '# Changelog\n\n## [Unreleased]\n\n- feat: add csv export\n\n## 1.0.0\n\n- feat: first release (initial)\n' },
  'error-invalid': { 'src/payments.ts': 'export function charge(amount: number): string {\n  if (amount <= 0) throw new Error("amount must be positive");\n  return `charged ${amount}`;\n}\n' },
  'error-notfound': { 'src/users.ts': V1['error-notfound']['src/users.ts'].replace('"NOT_FOUND"', '"USER_MISSING"') },
  'test-math': { 'src/math.test.ts': SPEC(['add', 'sub'], 'math') },
  'test-slug': { 'test/text/slugify.test.ts': SPEC(['slug'], '../../src/text/slugify').replace('describe("slug"', 'describe("slug helpers"') },
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
    test(`${task.id}: check passes a correct solution, fails the fixture, a decoy and the v1 answer`, async () => {
      expect(await task.check(fixture(task, SOLUTIONS[task.id]))).toEqual({ pass: true, reason: 'ok' });
      expect((await task.check(fixture(task))).pass).toBe(false);
      expect((await task.check(fixture(task, DECOYS[task.id]))).pass).toBe(false);
      expect((await task.check(fixture(task, V1[task.id]))).pass).toBe(false);
    });
  }
  test('prompts and fixtures name none of the changed rules (ISC-26)', () => {
    for (const task of tasks) expect(JSON.stringify([task.prompt, task.files])).not.toMatch(/VALIDATION_FAILED|RECORD_NOT_FOUND|INVALID_INPUT|\.test\.ts|\.spec\.ts/);
  });
});
