#!/usr/bin/env node
/**
 * Branch previews: a `preview/<name>` branch is built with BASE_PATH=/preview/<slug>/ and published
 * into that folder of the `gh-pages` branch, next to production (.github/workflows/preview.yml,
 * docs/DEPLOY.md "Preview links").
 *
 *   node scripts/preview/preview.mjs slug <branch>    → prints the folder name, or exits 1
 *   node scripts/preview/preview.mjs noindex <dir>    → marks every HTML page under <dir> noindex
 *
 * The slug becomes a path on the production domain and a `rm -rf` target in the workflow, so it
 * is only ever lowercase letters, digits and single dashes, never empty, at most 40 characters.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SLUG_MAX = 40;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The preview folder for a branch: `preview/Workout Cards` → `workout-cards`.
 * Takes the branch with or without `refs/heads/` and the `preview/` prefix; `null` when nothing
 * usable is left.
 * @param {string} branch
 * @returns {string | null}
 */
export function previewSlug(branch) {
  const name = String(branch ?? '')
    .trim()
    .replace(/^refs\/heads\//, '')
    .replace(/^preview\//, '');
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '');
  return SLUG_RE.test(slug) ? slug : null;
}

const ROBOTS = '<meta name="robots" content="noindex, nofollow">';
const ROBOTS_RE = /<meta\s+name=["']?robots["']?[^>]*>/gi;

/**
 * One page with every robots meta replaced by a single `noindex, nofollow`, inserted right after
 * `<head>` when the page had none. A page without a head is returned as it was.
 * @param {string} html
 * @returns {string}
 */
export function noindexHtml(html) {
  const stripped = html.replace(ROBOTS_RE, '');
  const head = /<head(\s[^>]*)?>/i.exec(stripped);
  if (!head) return html;
  const at = head.index + head[0].length;
  return stripped.slice(0, at) + ROBOTS + stripped.slice(at);
}

/**
 * Applies `noindexHtml` to every .html file under `dir`.
 * @param {string} dir
 * @returns {number} the number of pages written
 */
export function noindexDir(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = join(entry.parentPath, entry.name);
    const html = readFileSync(file, 'utf8');
    const next = noindexHtml(html);
    if (next !== html) {
      writeFileSync(file, next);
      count += 1;
    }
  }
  return count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, arg] = process.argv.slice(2);
  if (command === 'slug') {
    const slug = previewSlug(arg ?? '');
    if (!slug) {
      console.error(`[preview] no usable preview name in "${arg ?? ''}"`);
      process.exit(1);
    }
    console.log(slug);
  } else if (command === 'noindex') {
    console.log(`[preview] marked ${noindexDir(arg || 'dist')} pages noindex`);
  } else {
    console.error('usage: preview.mjs slug <branch> | noindex <dir>');
    process.exit(2);
  }
}
