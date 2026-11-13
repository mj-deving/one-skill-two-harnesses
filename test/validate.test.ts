import { describe, expect, test } from 'bun:test';
import { build } from '../src/core';
import { main } from '../src/cli';
import { skill, tempRepo } from './helpers';

const fails = (files: Record<string, string>, message: RegExp) => expect(() => build(tempRepo(files))).toThrow(message);

describe('invalid source (ISC-7)', () => {
  test('no source directory', () => fails({}, /\.skillcast\/ not found; run "skillcast init"/));
  test('missing frontmatter', () => fails({ '.skillcast/skills/a.md': 'just text\n' }, /\.skillcast\/skills\/a\.md: missing frontmatter/));
  test('missing description', () => fails({ '.skillcast/skills/a.md': '---\nname: a\n---\nx\n' }, /a\.md: frontmatter field "description" is missing/));
  test('missing name', () => fails({ '.skillcast/skills/a.md': '---\ndescription: d\n---\nx\n' }, /a\.md: frontmatter field "name" is missing/));
  test('unclosed frontmatter', () => fails({ '.skillcast/skills/a.md': '---\nname: a\n' }, /a\.md: frontmatter is not closed/));
  test('duplicate skill name', () => fails({ '.skillcast/skills/a.md': skill('a'), '.skillcast/skills/b.md': skill('a') }, /b\.md: duplicate skill name "a"/));
  test('name differs from file name', () => fails({ '.skillcast/skills/a.md': skill('b') }, /a\.md: name "b" must match the file name/));
  test('bad name', () => fails({ '.skillcast/skills/A.md': skill('A') }, /A\.md: name "A" must be lowercase/));
  test('unknown harness block, with line', () => fails({ '.skillcast/rules.md': 'x\n<!-- only:gemini -->\ny\n<!-- /only -->\n' }, /rules\.md:2: unknown harness "gemini"/));
  test('cursor block in rules is rejected because Cursor reads AGENTS.md', () => fails({ '.skillcast/rules.md': '<!-- only:cursor -->\ny\n<!-- /only -->\n' }, /rules\.md:1: unknown harness "cursor" \(known: claude, codex\)/));
  test('unclosed block, with line', () => fails({ '.skillcast/rules.md': 'a\n<!-- only:claude -->\nb\n' }, /rules\.md:2: only:claude block is never closed/));
  test('stray close', () => fails({ '.skillcast/rules.md': '<!-- /only -->\n' }, /rules\.md:1: <!-- \/only --> without an opening block/));
  test('CLI turns source errors into exit 2', () => expect(main(['build', '--root', tempRepo()])).toBe(2));
});
