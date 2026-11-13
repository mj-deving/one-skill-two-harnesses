import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Verdict } from './types';

export const ok = (reason = 'ok'): Verdict => ({ pass: true, reason });
export const no = (reason: string): Verdict => ({ pass: false, reason });
export const read = (dir: string, rel: string) => (existsSync(join(dir, rel)) ? readFileSync(join(dir, rel), 'utf8') : null);

/** Lines directly below "## Unreleased" up to the next heading, blank lines dropped. */
export function unreleased(text: string): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Unreleased');
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('#'));
  return (end < 0 ? rest : rest.slice(0, end)).filter((l) => l.trim());
}

/** Runs a snippet with bun inside the task dir and returns stdout or the error text. */
export function runBun(dir: string, code: string): { ok: boolean; out: string } {
  const r = Bun.spawnSync(['bun', '-e', code], { cwd: dir, stdout: 'pipe', stderr: 'pipe', timeout: 60_000 });
  return { ok: r.exitCode === 0, out: (r.stdout.toString() + r.stderr.toString()).trim() };
}

export const ERRORS_TS = `export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}
`;
