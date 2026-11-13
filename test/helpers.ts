import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const EXAMPLE = join(import.meta.dir, '../examples/basic');

export function tempRepo(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'skillcast-'));
  for (const [rel, text] of Object.entries(files)) put(root, rel, text);
  return root;
}

export function copyExample(): string {
  const root = mkdtempSync(join(tmpdir(), 'skillcast-'));
  cpSync(EXAMPLE, root, { recursive: true });
  return root;
}

export function put(root: string, rel: string, text: string) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

export const get = (root: string, rel: string) => readFileSync(join(root, rel), 'utf8');

export const skill = (name: string, body = 'Do the thing.\n', extra = '') =>
  `---\nname: ${name}\ndescription: "Use for ${name}."\n${extra}---\n${body}`;
