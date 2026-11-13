import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { main } from '../src/cli';
import { check } from '../src/core';

test('ISC-17: the deliberately drifted example fails the check', () => {
  const root = join(import.meta.dir, '../examples/drifted');
  expect(check(root).map((p) => [p.file, p.kind])).toEqual([['.agents/skills/error-codes/SKILL.md', 'changed']]);
  expect(main(['check', '--root', root])).toBe(1);
});
