import { expect, test } from 'bun:test';
import { DEFAULT_ADAPTERS, type Adapter } from '../src/adapters';
import { build, check } from '../src/core';
import { get, put, skill, tempRepo } from './helpers';

test('ISC-8: a fourth harness plugs in through the Adapter interface without core changes', () => {
  const gemini: Adapter = {
    id: 'gemini',
    rules: { path: 'GEMINI.md' },
    skillPath: (n) => `.gemini/skills/${n}.md`,
    skillGlob: { dir: '.gemini/skills', file: null, suffix: '.md' },
    renderSkill: (s, body, mark) => `${mark}\n# ${s.name}\n${body}`,
  };
  const adapters = [...DEFAULT_ADAPTERS, gemini];
  const root = tempRepo({ '.skillcast/rules.md': 'all\n<!-- only:gemini -->\ng\n<!-- /only -->\n', '.skillcast/skills/s.md': skill('s') });
  build(root, adapters);
  expect(get(root, 'GEMINI.md')).toContain('all\ng\n');
  expect(get(root, 'CLAUDE.md')).not.toContain('\ng\n');
  expect(get(root, '.gemini/skills/s.md')).toContain('# s\nDo the thing.');
  expect(check(root, adapters)).toEqual([]);
  put(root, '.gemini/skills/s.md', get(root, '.gemini/skills/s.md') + 'edited\n');
  expect(check(root, adapters).map((p) => p.kind)).toEqual(['changed']);
});
