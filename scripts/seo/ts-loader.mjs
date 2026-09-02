/**
 * Node module hooks that let build scripts import the project's TypeScript sources directly,
 * without a compile step or extra dependencies:
 *   - "@/…" → src/…, "@content/…" → content/…  (the tsconfig path aliases)
 *   - extensionless relative imports → .ts / .tsx / index.ts
 *   - .ts sources are type-stripped with node:module.stripTypeScriptTypes (Node ≥ 22.13)
 * Registered by og.mjs: `register('./ts-loader.mjs', import.meta.url)`.
 * Limits: no JSX (.tsx) and no `import.meta.env` — only plain data/logic modules are importable.
 */
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '../..');
const CANDIDATES = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.mjs',
  '/index.ts',
  '/index.tsx',
  '/index.js',
];

/** @param {string} base */
function findFile(base) {
  for (const ext of CANDIDATES) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

/**
 * @param {string} specifier
 * @param {{ parentURL?: string }} context
 * @param {(specifier: string, context: unknown) => Promise<unknown>} nextResolve
 */
export async function resolve(specifier, context, nextResolve) {
  let target = null;
  if (specifier.startsWith('@/')) target = resolvePath(ROOT, 'src', specifier.slice(2));
  else if (specifier.startsWith('@content/'))
    target = resolvePath(ROOT, 'content', specifier.slice('@content/'.length));
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith('file:'))
    target = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  if (target) {
    const file = findFile(target);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

/**
 * @param {string} url
 * @param {unknown} context
 * @param {(url: string, context: unknown) => Promise<unknown>} nextLoad
 */
export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && /\.(ts|mts|tsx)$/.test(url)) {
    if (typeof stripTypeScriptTypes !== 'function') {
      throw new Error('Node ≥ 22.13 is required to import TypeScript sources from scripts');
    }
    const source = await readFile(fileURLToPath(url), 'utf8');
    const code = stripTypeScriptTypes(source, { mode: 'transform', sourceUrl: url });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
