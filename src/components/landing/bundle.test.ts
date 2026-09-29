/**
 * The static site's browser scripts must not reach zod. Anything that imports a *value* from
 * `@/content/schema` runs its `z.object(...)` calls, and Rollup then ships zod (~55 KB) to every
 * page — which is how `paths.ts` once put it on all of them, and how the invite rule shared with
 * the app (`src/lib/referral`, `src/lib/share`) could again.
 *
 * This walks the source import graph from the site's entry scripts — the `<script>` blocks of the
 * layout and the pages that bind the invite, and the islands — following value imports only
 * (`import type` is erased), and fails on the first path that reaches zod, `@/app` or `@/lib/api`.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const src = resolve(root, 'src');

const ASTRO_SCRIPTS = [
  'src/layouts/Landing.astro',
  'src/components/landing/StickyStart.astro',
  'src/components/landing/media/LoopVideo.astro',
  'src/pages/[...lang]/together.astro',
  'src/pages/[...lang]/subscribe.astro',
];
const ISLANDS = ['src/components/landing/ShareInvite.tsx', 'src/components/landing/StartForm.tsx'];

const FORBIDDEN = [/^zod$/, /^@\/app\//, /^@\/lib\/api\//, /\/content\/schema$/];

/** Value imports of a module's source: `import type …` and all-`type` specifier lists are skipped. */
function valueImports(code: string): string[] {
  const out: string[] = [];
  const re = /import\s+(type\s+)?([^'";]*?)\s*(?:from\s*)?['"]([^'"]+)['"]/g;
  for (const m of code.matchAll(re)) {
    const [, typeOnly, clause = '', spec = ''] = m;
    if (typeOnly) continue;
    const braces = /^\{([^}]*)\}$/.exec(clause.trim());
    if (braces) {
      const names = (braces[1] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length > 0 && names.every((n) => n.startsWith('type '))) continue;
    }
    out.push(spec);
  }
  return out;
}

function resolveSpec(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = resolve(src, spec.slice(2));
  else if (spec.startsWith('@content/')) base = resolve(root, 'content', spec.slice(9));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null; // a package
  for (const ext of ['', '.ts', '.tsx', '/index.ts']) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

function astroScript(file: string): string {
  const code = readFileSync(resolve(root, file), 'utf8');
  return [...code.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
}

/** The first chain from an entry to a forbidden import, or null. */
function reach(entry: string, code: string): string[] | null {
  const seen = new Set<string>();
  const queue: { file: string; code: string; chain: string[] }[] = [
    { file: resolve(root, entry), code, chain: [entry] },
  ];
  while (queue.length > 0) {
    const { file, code: source, chain } = queue.shift()!;
    for (const spec of valueImports(source)) {
      if (FORBIDDEN.some((re) => re.test(spec))) return [...chain, spec];
      const next = resolveSpec(spec, file);
      if (!next || seen.has(next) || !/\.(ts|tsx)$/.test(next)) continue;
      seen.add(next);
      queue.push({
        file: next,
        code: readFileSync(next, 'utf8'),
        chain: [...chain, next.slice(root.length)],
      });
    }
  }
  return null;
}

describe('site scripts stay off zod and the app', () => {
  it('reads value imports and skips type-only ones', () => {
    expect(
      valueImports(
        "import type { A } from 'a';\nimport { type B } from 'b';\nimport { type C, d } from 'c';\nimport './e';",
      ),
    ).toEqual(['c', './e']);
  });

  it.each(ASTRO_SCRIPTS)('%s', (file) => {
    expect(reach(file, astroScript(file))).toBeNull();
  });

  it.each(ISLANDS)('%s', (file) => {
    expect(reach(file, readFileSync(resolve(root, file), 'utf8'))).toBeNull();
  });
});
