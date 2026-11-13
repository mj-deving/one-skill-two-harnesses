import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { check, init } from '../src/core';
import { get, skill, tempRepo } from './helpers';

const body = (text: string) => text.slice(text.indexOf('-->') + 3).replace(/^\n+/, '');

describe('init (ISC-1)', () => {
  test('imports CLAUDE.md and Claude skills; round trip keeps the text', () => {
    const rules = '# Rules\n\n- Use tabs.\n';
    const s = skill('deploy', 'Run make deploy.\n', 'allowed-tools: Bash\n');
    const root = tempRepo({ 'CLAUDE.md': rules, '.claude/skills/deploy/SKILL.md': s });
    const { imported } = init(root);
    expect(imported).toEqual(['CLAUDE.md', '.claude/skills/deploy/SKILL.md']);
    expect(body(get(root, 'CLAUDE.md'))).toBe(rules);
    expect(body(get(root, 'AGENTS.md'))).toBe(rules);
    expect(get(root, '.agents/skills/deploy/SKILL.md')).toContain('allowed-tools: Bash\n');
    expect(body(get(root, '.claude/skills/deploy/SKILL.md'))).toBe('Run make deploy.\n');
    expect(check(root)).toEqual([]);
  });

  test('imports AGENTS.md and Codex skills when there is no CLAUDE.md', () => {
    const root = tempRepo({ 'AGENTS.md': 'codex rules\n', '.agents/skills/a/SKILL.md': skill('a') });
    init(root);
    expect(body(get(root, 'CLAUDE.md'))).toBe('codex rules\n');
    expect(existsSync(join(root, '.claude/skills/a/SKILL.md'))).toBe(true);
  });

  test('equal CLAUDE.md and AGENTS.md merge without conflict', () => {
    const root = tempRepo({ 'CLAUDE.md': 'same\r\n', 'AGENTS.md': 'same\n' });
    expect(init(root).imported).toEqual(['CLAUDE.md', 'AGENTS.md']);
  });

  test('differing CLAUDE.md and AGENTS.md stop init and write nothing', () => {
    const root = tempRepo({ 'CLAUDE.md': 'one\n', 'AGENTS.md': 'two\n' });
    expect(() => init(root)).toThrow(/init stopped, nothing was written:\n- CLAUDE.md and AGENTS.md differ/);
    expect(existsSync(join(root, '.skillcast'))).toBe(false);
    expect(get(root, 'CLAUDE.md')).toBe('one\n');
  });

  test('the same skill described differently in both harnesses is a conflict', () => {
    const root = tempRepo({ '.claude/skills/a/SKILL.md': skill('a', 'one\n'), '.agents/skills/a/SKILL.md': skill('a', 'two\n') });
    expect(() => init(root)).toThrow(/\.claude\/skills\/a\/SKILL.md and \.agents\/skills\/a\/SKILL.md describe skill "a" differently/);
  });

  test('a second init refuses to run', () => {
    const root = tempRepo({ 'CLAUDE.md': 'x\n' });
    init(root);
    expect(() => init(root)).toThrow(/already exists/);
  });
});

test('ISC-1: a build failure during init rolls back .skillcast/ so init can run again', () => {
  const root = tempRepo({ '.claude/skills/my_skill/SKILL.md': skill('my_skill'), '.cursor/rules/a.mdc': 'x' });
  expect(() => init(root)).toThrow(/init stopped, nothing was written:\n- .*name "my_skill" must be lowercase/);
  expect(existsSync(join(root, '.skillcast'))).toBe(false);
});

test('ISC-1: a hand-written Cursor rule at a target path stops init and rolls back', () => {
  const root = tempRepo({ '.claude/skills/a/SKILL.md': skill('a'), '.cursor/rules/a.mdc': 'mine\n' });
  expect(() => init(root)).toThrow(/init stopped, nothing was written:\n- \.cursor\/rules\/a\.mdc exists and was not generated/);
  expect(existsSync(join(root, '.skillcast'))).toBe(false);
  expect(get(root, '.cursor/rules/a.mdc')).toBe('mine\n');
});
