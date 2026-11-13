import { no, ok, read, unreleased } from '../lib';
import type { Task } from '../types';

export default {
  id: 'changelog-fix',
  skill: 'changelog-entry',
  heldout: false,
  prompt: 'We just fixed the bug where login sessions expired after five minutes. Record this change.',
  files: { 'README.md': '# Demo app\n' },
  check: (dir) => {
    const text = read(dir, 'CHANGELOG.md');
    if (!text) return no('CHANGELOG.md missing');
    const entries = unreleased(text);
    if (entries.length !== 1) return no(`expected 1 entry under ## Unreleased, found ${entries.length}`);
    return /^- fix: [a-z0-9].*[^.\s]$/.test(entries[0]) ? ok() : no(`entry does not follow "- fix: <lowercase summary>": ${entries[0]}`);
  },
} satisfies Task;
