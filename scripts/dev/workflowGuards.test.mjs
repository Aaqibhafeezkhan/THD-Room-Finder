import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Forks (THD-AI/THD-Room-Finder) run this repo's workflows too, without its
// secrets, labels, project or Pages site, and mailed a failure every day.
// Any workflow that needs those must skip outside this repo.
const GUARD = "github.repository == 'arudaev/THD-Room-Finder'";
const NEEDS_THIS_REPO = [
  /secrets\.(?!GITHUB_TOKEN)/,
  /vars\./,
  /^\s+schedule:/m,
  /^\s+pull_request_target:/m,
  /^\s+issues:/m,
  /^\s+issue_comment:/m,
  /^\s+push:\s*\n\s+tags:/m,
  /environment:\s*\n\s+name: github-pages/m,
];

const dir = join(import.meta.dirname, '../../.github/workflows');
const workflows = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));

describe('workflows that need this repo', () => {
  it.each(workflows)('%s skips in forks', (file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    if (NEEDS_THIS_REPO.some((pattern) => pattern.test(text))) expect(text).toContain(GUARD);
  });
});
