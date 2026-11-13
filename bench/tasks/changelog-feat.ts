import { no, ok, read, unreleased } from '../lib';
import type { Task } from '../types';

const OLD = '## 1.0.0\n\n- feat: first release\n';

export default {
  id: 'changelog-feat',
  skill: 'changelog-entry',
  heldout: true,
  prompt: 'We added CSV export to the reports page. Please note that in the changelog.',
  files: { 'CHANGELOG.md': `# Changelog\n\n## Unreleased\n\n${OLD}` },
  check: (dir) => {
    const text = read(dir, 'CHANGELOG.md') ?? '';
    if (!text.endsWith(OLD)) return no('older entries were changed');
    const entries = unreleased(text);
    if (entries.length !== 1) return no(`expected 1 entry under ## Unreleased, found ${entries.length}`);
    return /^- feat: [a-z0-9].*[^.\s]$/.test(entries[0]) ? ok() : no(`entry does not follow "- feat: <lowercase summary>": ${entries[0]}`);
  },
} satisfies Task;
