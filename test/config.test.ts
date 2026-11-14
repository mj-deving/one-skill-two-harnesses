import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { main } from '../src/cli';
import { build, check } from '../src/core';
import { copyExample, get, put } from './helpers';

const config = (root: string, harnesses: unknown) => put(root, '.skillcast/config.json', JSON.stringify({ harnesses }));

describe('custom harnesses (ISC-20)', () => {
  test('a harness in each format is built, checked and caught when edited by hand', () => {
    const root = copyExample();
    config(root, [
      'claude',
      { id: 'gemini', rules: 'GEMINI.md', skills: '.gemini/skills/{name}/SKILL.md', format: 'skill-md' },
      { id: 'windsurf', skills: '.windsurf/rules/{name}.md', format: 'plain' },
      { id: 'other', skills: 'tools/other/{name}.mdc', format: 'mdc' },
    ]);
    build(root);
    expect(get(root, 'GEMINI.md')).toContain('Keep changes small');
    expect(get(root, '.gemini/skills/error-codes/SKILL.md')).toStartWith('---\nname: error-codes\ndescription: "');
    expect(get(root, '.windsurf/rules/test-layout.md')).toContain('# test-layout\n\nWhere and how to write tests.');
    expect(get(root, 'tools/other/test-layout.mdc')).toContain('globs: "**/*.spec.ts"');
    expect(check(root)).toEqual([]);
    put(root, '.windsurf/rules/error-codes.md', get(root, '.windsurf/rules/error-codes.md') + 'x\n');
    expect(check(root).map((p) => [p.file, p.kind])).toEqual([['.windsurf/rules/error-codes.md', 'changed']]);
  });

  test('only-blocks work for a custom harness id', () => {
    const root = copyExample();
    put(root, '.skillcast/rules.md', 'all\n<!-- only:gemini -->\ng only\n<!-- /only -->\n');
    config(root, ['claude', { id: 'gemini', rules: 'GEMINI.md', skills: '.gemini/skills/{name}/SKILL.md', format: 'skill-md' }]);
    build(root);
    expect(get(root, 'GEMINI.md')).toContain('g only');
    expect(get(root, 'CLAUDE.md')).not.toContain('g only');
  });
});

describe('harness selection (ISC-21)', () => {
  test('deselecting Cursor removes its generated files and builds no new ones', () => {
    const root = copyExample();
    config(root, ['claude', 'codex']);
    expect(check(root).filter((p) => p.kind === 'extra').map((p) => p.file)).toEqual([
      '.cursor/rules/changelog-entry.mdc',
      '.cursor/rules/error-codes.mdc',
      '.cursor/rules/test-layout.mdc',
    ]);
    build(root);
    expect(existsSync(join(root, '.cursor/rules/error-codes.mdc'))).toBe(false);
    expect(check(root)).toEqual([]);
  });

  test('without a config file the three built-ins stay active', () => {
    const root = copyExample();
    expect(check(root)).toEqual([]);
    expect(existsSync(join(root, '.cursor/rules/error-codes.mdc'))).toBe(true);
  });
});

describe('invalid config (ISC-22)', () => {
  const cases: [string, unknown, RegExp][] = [
    ['unknown built-in', ['claude', 'gemini'], /unknown harness "gemini"/],
    ['unknown format', [{ id: 'x', skills: 'x/{name}.md', format: 'yaml' }], /unknown format "yaml"/],
    ['no {name}', [{ id: 'x', skills: 'x/skill.md', format: 'plain' }], /must contain \{name\} exactly once/],
    ['{name} not after a slash', [{ id: 'x', skills: 'x-{name}.md', format: 'plain' }], /put \{name\} after a "\/"/],
    ['parent path', [{ id: 'x', skills: '../x/{name}.md', format: 'plain' }], /must be relative/],
    ['duplicate id', ['claude', { id: 'claude', skills: 'x/{name}.md', format: 'plain' }], /duplicate id claude/],
    ['duplicate rules path', ['claude', { id: 'x', rules: 'CLAUDE.md', skills: 'x/{name}.md', format: 'plain' }], /duplicate path CLAUDE.md/],
    ['empty list', [], /non-empty list/],
    ['rules outside the repo', [{ id: 'x', rules: '../../evil.md', skills: 'x/{name}.md', format: 'plain' }], /rules must be a relative path inside the repo/],
    ['absolute rules path', [{ id: 'x', rules: '/tmp/evil.md', skills: 'x/{name}.md', format: 'plain' }], /rules must be a relative path/],
    ['rules not a string', [{ id: 'x', rules: 123, skills: 'x/{name}.md', format: 'plain' }], /rules must be a relative path/],
  ];
  for (const [name, harnesses, message] of cases) {
    test(name, () => {
      const root = copyExample();
      config(root, harnesses);
      expect(() => build(root)).toThrow(message);
      expect(main(['check', '--root', root])).toBe(2);
    });
  }

  test('broken JSON', () => {
    const root = copyExample();
    put(root, '.skillcast/config.json', '{ harnesses: ');
    expect(() => check(root)).toThrow(/config.json: invalid JSON/);
  });
});

test('ISC-21: blocks for a switched-off built-in harness are dropped, not rejected', () => {
  const root = copyExample();
  config(root, ['claude']);
  build(root);
  expect(get(root, 'CLAUDE.md')).not.toContain('Codex:');
  expect(existsSync(join(root, 'AGENTS.md'))).toBe(false);
});
