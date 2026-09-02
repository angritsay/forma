#!/usr/bin/env node
/**
 * SEO audit — static checks over content (no build needed) plus the built site when dist/ exists.
 *
 *   content/guides/**.md     frontmatter fields and lengths, unique titles/h1/slugs per locale,
 *                            translation pairs, ≥ 800/900 words, H2 structure, FAQ count,
 *                            exercise:/course:/guide: links and related ids resolve, image alts
 *   content/exercises, courses   ids unique, both locales, kebab-case slugs unique per locale
 *   dist/ (when present)     every sitemap URL has an index.html; every page has one <title>,
 *                            one <h1>, canonical, hreflang alternates, meta description, no noindex
 *                            (except /app/); unique titles; robots/llms/rss present
 *
 * Usage: npm run seo:audit [-- --dist <dir>] [--base </forma/>] [--no-dist] [--json]
 * Exit 1 on errors, 0 on warnings only. The base path (--base or BASE_PATH, default "/") is
 * honoured when mapping sitemap, canonical and hreflang URLs to files in dist.
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOCALES,
  auditContentIndex,
  auditDist,
  auditGuides,
  formatIssues,
  loadContentIndex,
  loadGuideClusters,
  loadGuides,
  summarize,
} from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{ dist: string, base: string | undefined, noDist: boolean, json: boolean }} */
  const out = { dist: 'dist', base: process.env.BASE_PATH, noDist: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dist' && argv[i + 1]) out.dist = argv[++i];
    else if (a === '--base' && argv[i + 1]) out.base = argv[++i];
    else if (a === '--no-dist') out.noDist = true;
    else if (a === '--json') out.json = true;
    else if (a === '--help' || a === '-h') {
      console.log('usage: node scripts/seo/audit.mjs [--dist <dir>] [--base </path/>] [--no-dist] [--json]');
      process.exit(0);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const index = loadContentIndex(ROOT);
const guides = loadGuides(ROOT);
const clusters = loadGuideClusters(ROOT);

const issues = [...auditContentIndex(index), ...auditGuides(guides, index, clusters)];

const distDir = resolve(ROOT, args.dist);
let distChecked = false;
if (!args.noDist && existsSync(distDir)) {
  issues.push(...auditDist(distDir, { base: args.base }));
  distChecked = true;
}

const counts = summarize(issues);
if (args.json) {
  console.log(JSON.stringify({ counts, issues, distChecked }, null, 2));
} else {
  const perLocale = LOCALES.map(
    (loc) => `${loc}: ${guides.filter((g) => g.locale === loc && g.data.draft !== true).length}`,
  ).join(', ');
  console.log('SEO audit');
  console.log(`  exercises: ${index.exercises.size}  courses: ${index.courses.size}  guides: ${perLocale}`);
  console.log(
    distChecked
      ? `  built site: ${args.dist}/ checked (base path ${args.base ?? '/'})`
      : `  built site: ${args.noDist ? 'skipped (--no-dist)' : `${args.dist}/ not found — run astro build to check sitemap coverage and page tags`}`,
  );
  console.log('');
  console.log(formatIssues(issues));
  console.log('');
  console.log(`${counts.errors} error(s), ${counts.warnings} warning(s), ${counts.infos} note(s)`);
}
process.exit(counts.errors > 0 ? 1 : 0);
