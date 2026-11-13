import { MARKER, selectBlocks, type Skill, type Source } from './source';

/** One harness. `rules` says whether this harness gets its own project-rules file. */
export type Adapter = {
  id: string;
  rules?: { path: string };
  skillPath: (name: string) => string;
  /** Directory and suffix the core scans for stale generated skill files. */
  skillGlob: { dir: string; file: string | null; suffix: string };
  renderSkill: (skill: Skill, body: string, marker: string) => string;
};

export const marker = (file: string) => `<!-- ${MARKER} ${file}. Edit the source, then run: skillcast build -->`;

const q = (s: string) => JSON.stringify(s);

/** SKILL.md with name and description, the shape Claude Code and Codex both document. */
function skillMd(skill: Skill, body: string, mark: string): string {
  const extra = [...skill.extra].filter(([k]) => !k.startsWith("cursor-")).map(([k, v]) => `${k}: ${v}`);
  return ['---', `name: ${skill.name}`, `description: ${q(skill.description)}`, ...extra, '---', mark, '', body].join('\n');
}

export const claude: Adapter = {
  id: 'claude',
  rules: { path: 'CLAUDE.md' },
  skillPath: (n) => `.claude/skills/${n}/SKILL.md`,
  skillGlob: { dir: '.claude/skills', file: 'SKILL.md', suffix: '' },
  renderSkill: skillMd,
};

export const codex: Adapter = {
  id: 'codex',
  rules: { path: 'AGENTS.md' },
  skillPath: (n) => `.agents/skills/${n}/SKILL.md`,
  skillGlob: { dir: '.agents/skills', file: 'SKILL.md', suffix: '' },
  renderSkill: skillMd,
};

/** Cursor reads AGENTS.md for project rules; skills become agent-requested .mdc rules. */
export const cursor: Adapter = {
  id: 'cursor',
  skillPath: (n) => `.cursor/rules/${n}.mdc`,
  skillGlob: { dir: '.cursor/rules', file: null, suffix: '.mdc' },
  renderSkill: (skill, body, mark) =>
    [
      '---',
      `description: ${q(skill.description)}`,
      `globs: ${skill.extra.get('cursor-globs') ?? ''}`.trimEnd(),
      `alwaysApply: ${skill.extra.get('cursor-alwaysApply') ?? 'false'}`,
      '---',
      mark,
      '',
      body,
    ].join('\n'),
};

export const DEFAULT_ADAPTERS = [claude, codex, cursor];

/** Every file the source projects to, keyed by repo-relative path. */
export function plan(source: Source, adapters: Adapter[] = DEFAULT_ADAPTERS): Map<string, string> {
  const ids = adapters.map((a) => a.id);
  const ruleIds = adapters.filter((a) => a.rules).map((a) => a.id);
  const out = new Map<string, string>();
  for (const a of adapters) {
    if (a.rules && source.rules) {
      const body = selectBlocks(source.rules.body, a.id, ruleIds, source.rules.file);
      out.set(a.rules.path, `${marker(source.rules.file)}\n\n${body}`);
    }
    for (const s of source.skills) out.set(a.skillPath(s.name), a.renderSkill(s, selectBlocks(s.body, a.id, ids, s.file), marker(s.file)));
  }
  return new Map([...out].sort(([x], [y]) => (x < y ? -1 : 1)));
}
