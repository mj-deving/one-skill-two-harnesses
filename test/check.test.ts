import { describe, expect, test } from 'bun:test';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { check } from '../src/core';
import { main } from '../src/cli';
import { copyExample, get, put, skill } from './helpers';

describe('check (ISC-5)', () => {
  test('clean example passes with exit 0', () => {
    expect(check(copyExample())).toEqual([]);
    expect(main(['check', '--root', copyExample()])).toBe(0);
  });

  test('source changed but not rebuilt: changed, with line and diff excerpt', () => {
    const root = copyExample();
    put(root, '.skillcast/rules.md', get(root, '.skillcast/rules.md').replace('Keep changes small', 'Keep changes tiny'));
    const problems = check(root);
    expect(problems.map((p) => [p.file, p.kind])).toEqual([['AGENTS.md', 'changed'], ['CLAUDE.md', 'changed']]);
    expect(problems[0].detail).toMatch(/^line 6: expected "- Keep changes tiny/);
    expect(main(['check', '--root', root])).toBe(1);
  });

  test('projection edited by hand: changed', () => {
    const root = copyExample();
    const f = '.agents/skills/test-layout/SKILL.md';
    put(root, f, get(root, f) + 'extra line\n');
    expect(check(root)).toEqual([{ file: f, kind: 'changed', detail: expect.stringContaining('extra line') }]);
  });

  test('projection deleted: missing', () => {
    const root = copyExample();
    rmSync(join(root, '.cursor/rules/error-codes.mdc'));
    expect(check(root).map((p) => p.kind)).toEqual(['missing']);
  });

  test('generated file without source: extra', () => {
    const root = copyExample();
    const stale = get(root, '.claude/skills/error-codes/SKILL.md').replaceAll('error-codes', 'old-skill');
    put(root, '.claude/skills/old-skill/SKILL.md', stale);
    expect(check(root)).toEqual([{ file: '.claude/skills/old-skill/SKILL.md', kind: 'extra', detail: expect.any(String) }]);
  });

  test('marker removed by hand: handwritten', () => {
    const root = copyExample();
    put(root, 'CLAUDE.md', '# my rules\n');
    expect(check(root).map((p) => [p.file, p.kind])).toEqual([['CLAUDE.md', 'handwritten']]);
  });

  test('a new source skill that was never built: missing in all three harnesses', () => {
    const root = copyExample();
    put(root, '.skillcast/skills/new-one.md', skill('new-one'));
    expect(check(root).map((p) => p.file)).toEqual(['.agents/skills/new-one/SKILL.md', '.claude/skills/new-one/SKILL.md', '.cursor/rules/new-one.mdc']);
  });
});
