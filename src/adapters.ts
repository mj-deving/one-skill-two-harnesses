import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MARKER, selectBlocks, SOURCE_DIR, type Skill, type Source } from './source';

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

/** How a harness is described, both for the built-ins and in .skillcast/config.json. */
export type HarnessSpec = { id: string; rules?: string; skills: string; format: Format };
export const FORMATS = ['skill-md', 'mdc', 'plain'] as const;
export type Format = (typeof FORMATS)[number];

const RENDER: Record<Format, Adapter['renderSkill']> = {
  'skill-md': skillMd,
  /** Cursor-style rule: description, globs, alwaysApply. */
  mdc: (skill, body, mark) =>
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
  /** No frontmatter: for harnesses that read plain markdown. */
  plain: (skill, body, mark) => [mark, '', `# ${skill.name}`, '', skill.description, '', body].join('\n'),
};

export class ConfigError extends Error {}

/** Turns a spec into an adapter. The skills path holds {name} once, as a folder or as the file stem. */
export function fromSpec(spec: HarnessSpec, where = 'harness'): Adapter {
  const parts = spec.skills.split('{name}');
  if (parts.length !== 2) throw new ConfigError(`${where} "${spec.id}": skills path must contain {name} exactly once`);
  if (!FORMATS.includes(spec.format)) throw new ConfigError(`${where} "${spec.id}": unknown format "${spec.format}" (use ${FORMATS.join(', ')})`);
  const unsafe = (p: string) => p.startsWith('/') || /^[A-Za-z]:/.test(p) || p.split(/[\\/]/).includes('..');
  if (spec.rules !== undefined && (typeof spec.rules !== 'string' || !spec.rules || unsafe(spec.rules))) {
    throw new ConfigError(`${where} "${spec.id}": rules must be a relative path inside the repo`);
  }
  const [before, after] = parts;
  if (!before.endsWith('/') || unsafe(spec.skills)) throw new ConfigError(`${where} "${spec.id}": skills path must be relative and put {name} after a "/"`);
  const dir = before.slice(0, -1);
  let glob: Adapter['skillGlob'];
  if (after.startsWith('/') && after.split('/').length === 2 && after.length > 1) glob = { dir, file: after.slice(1), suffix: '' };
  else if (after.startsWith('.') && !after.includes('/')) glob = { dir, file: null, suffix: after };
  else throw new ConfigError(`${where} "${spec.id}": skills path must end in {name}/<file> or {name}.<ext>`);
  return {
    id: spec.id,
    rules: spec.rules ? { path: spec.rules } : undefined,
    skillPath: (n) => `${before}${n}${after}`,
    skillGlob: glob,
    renderSkill: RENDER[spec.format],
  };
}

export const BUILT_IN: HarnessSpec[] = [
  { id: 'claude', rules: 'CLAUDE.md', skills: '.claude/skills/{name}/SKILL.md', format: 'skill-md' },
  { id: 'codex', rules: 'AGENTS.md', skills: '.agents/skills/{name}/SKILL.md', format: 'skill-md' },
  /** Cursor reads AGENTS.md for project rules; skills become agent-requested .mdc rules. */
  { id: 'cursor', skills: '.cursor/rules/{name}.mdc', format: 'mdc' },
];
export const [claude, codex, cursor] = BUILT_IN.map((h) => fromSpec(h));
export const DEFAULT_ADAPTERS = [claude, codex, cursor];

/**
 * Reads .skillcast/config.json: { "harnesses": ["claude", "codex", { "id", "rules", "skills", "format" }] }.
 * Without the file, the three built-in harnesses are active.
 */
export function adaptersFor(root: string): Adapter[] {
  const path = join(root, SOURCE_DIR, 'config.json');
  if (!existsSync(path)) return DEFAULT_ADAPTERS;
  const where = `${SOURCE_DIR}/config.json`;
  let config: { harnesses?: unknown };
  try {
    config = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new ConfigError(`${where}: invalid JSON (${(e as Error).message})`);
  }
  if (!Array.isArray(config.harnesses) || config.harnesses.length === 0) throw new ConfigError(`${where}: "harnesses" must be a non-empty list`);
  const adapters = config.harnesses.map((h) => {
    if (typeof h === 'string') {
      const spec = BUILT_IN.find((b) => b.id === h);
      if (!spec) throw new ConfigError(`${where}: unknown harness "${h}" (built in: ${BUILT_IN.map((b) => b.id).join(', ')}; add others as objects)`);
      return fromSpec(spec);
    }
    const spec = h as HarnessSpec;
    if (!spec || typeof spec.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(spec.id) || typeof spec.skills !== 'string') {
      throw new ConfigError(`${where}: each custom harness needs "id" (lowercase) and "skills"`);
    }
    return fromSpec(spec, where);
  });
  const seen = new Set<string>();
  for (const a of adapters) {
    for (const key of [`id ${a.id}`, a.rules && `path ${a.rules.path}`, `path ${a.skillPath('x')}`]) {
      if (!key) continue;
      if (seen.has(key)) throw new ConfigError(`${where}: duplicate ${key}`);
      seen.add(key);
    }
  }
  return adapters;
}

/** Every file the source projects to, keyed by repo-relative path. */
export function plan(source: Source, adapters: Adapter[] = DEFAULT_ADAPTERS): Map<string, string> {
  // Blocks for a built-in harness stay valid when it is switched off; they are just dropped.
  const ids = [...new Set([...adapters.map((a) => a.id), ...BUILT_IN.map((b) => b.id)])];
  const ruleIds = [...new Set([...adapters.filter((a) => a.rules).map((a) => a.id), ...BUILT_IN.filter((b) => b.rules).map((b) => b.id)])];
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
