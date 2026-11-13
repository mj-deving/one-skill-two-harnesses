import { expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

test('ISC-16: every number in the Results section appears in a file under results/', () => {
  const section = readme.split('## Results')[1].split('\n## ')[0].replace(/```[\s\S]*?```/g, '');
  const numbers = section.match(/\d+(?:[./]\d+)*%?/g) ?? [];
  const dir = join(ROOT, 'results');
  const corpus = existsSync(dir)
    ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => readFileSync(join(e.parentPath, e.name), 'utf8')).join('\n')
    : '';
  for (const n of numbers) expect({ n, found: corpus.includes(n) }).toEqual({ n, found: true });
});

test('ISC-19: README has the required sections', () => {
  for (const h of ['Five-minute start', 'Source format', 'Generated files per harness', 'CI', 'Migrating an existing repo', 'Results', 'What it does not do']) {
    expect(readme).toContain(`\n## ${h}\n`);
  }
});
