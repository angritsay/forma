/**
 * The edge functions are TypeScript, and nothing else in this repository looks at them.
 *
 * `npm run check` runs `astro check` over the site's own tsconfig, which does not reach into
 * `supabase/functions` — those files import from `npm:` and read `Deno.env`, so they could not be
 * type-checked there anyway. `supabase functions deploy` bundles without type-checking. The result
 * is a hole the width of a whole runtime: a broken function deploys happily and fails when the
 * first real request arrives, which for `prodamus-webhook` means a payment that quietly does
 * nothing and a buyer who paid for silence.
 *
 * This is the cheapest possible net across it — not a type check, a **parse**. It caught the bug it
 * was written for: `let data` near the top of `prodamus-webhook` and `const { data, error } = …`
 * near the bottom, in the same scope, which is a SyntaxError in plain JavaScript. The module would
 * not have loaded at all, and subscriptions would have stopped with it.
 *
 * What it does not do: resolve imports, check types, or know anything about Deno. A file that
 * parses can still be wrong. It only promises that what we deploy is at least a program.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';
import { describe, expect, it } from 'vitest';

const HERE = fileURLToPath(new URL('.', import.meta.url));

/** Every `.ts` file under `supabase/functions`, tests excluded. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(path);
    }
  }
  return out;
}

describe('edge functions parse', () => {
  const files = sourceFiles(HERE);

  /* A renamed or moved directory would otherwise turn this suite into zero silent passes. */
  it('finds the functions at all', () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it.each(files.map((f) => [f.slice(HERE.length), f] as const))('%s', (_name, path) => {
    const source = readFileSync(path, 'utf8');
    expect(() => transformSync(source, { loader: 'ts', format: 'esm' })).not.toThrow();
  });
});
