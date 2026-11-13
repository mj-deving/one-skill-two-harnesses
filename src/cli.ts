import { resolve } from 'node:path';
import { build, check, init } from './core';
import { SourceError } from './source';

const USAGE = `skillcast: write agent skills once, project them to Claude Code, Codex and Cursor.

Usage:
  skillcast init   [--root <dir>]   import existing CLAUDE.md, AGENTS.md and skills into .skillcast/
  skillcast build  [--root <dir>]   write every harness file from .skillcast/
  skillcast check  [--root <dir>]   exit 1 if a generated file is missing, edited by hand or stale

Exit codes: 0 ok, 1 drift found, 2 usage or source error.`;

export function main(argv: string[]): number {
  const [command, ...rest] = argv;
  const rootFlag = rest.indexOf('--root');
  const root = resolve(rootFlag >= 0 ? rest[rootFlag + 1] ?? '.' : '.');
  try {
    if (command === 'build') {
      const changed = build(root);
      console.log(changed.length ? changed.map((f) => `wrote ${f}`).join('\n') : 'up to date');
      return 0;
    }
    if (command === 'check') {
      const problems = check(root);
      for (const p of problems) console.error(`${p.kind.padEnd(11)} ${p.file}: ${p.detail}`);
      if (problems.length) console.error(`\n${problems.length} problem(s). Fix the source in .skillcast/ and run: skillcast build`);
      else console.log('all projections match the source');
      return problems.length ? 1 : 0;
    }
    if (command === 'init') {
      const { imported, built } = init(root);
      console.log([...imported.map((f) => `imported ${f}`), ...built.map((f) => `wrote ${f}`)].join('\n') || 'created empty .skillcast/');
      return 0;
    }
    console.log(USAGE);
    return command === undefined || command === '--help' || command === '-h' ? 0 : 2;
  } catch (e) {
    if (e instanceof SourceError) {
      console.error(`skillcast: ${e.message}`);
      return 2;
    }
    throw e;
  }
}

