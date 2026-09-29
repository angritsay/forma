#!/usr/bin/env node
/**
 * Adds the private page to a built site: `node scripts/private/publish.mjs [--dist dist]`.
 * Runs in the deploy workflow after the SEO audit, so the audit, the sitemap, llms.txt and
 * IndexNow never see it — nothing on the site links to it.
 *
 * Environment (see lib.mjs for the scheme):
 *   PRIVATE_PAGE_KEY       secret   — opens private/pitch.enc
 *   PRIVATE_PAGE_PASSWORD  secret   — what a visitor types
 *   PRIVATE_PAGE_PATH      variable — the page's one-segment path, e.g. "k7r2x9mq4t"
 *   PRIVATE_PAGE_SOURCE    optional — the sealed file, default private/pitch.enc
 *
 * With any of the first three unset the page is skipped and the deploy goes on without it.
 * Actions logs of a public repository are public, so nothing here ever prints the path.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PATH_RE, reseal, unlockPage, unseal } from './lib.mjs';

/**
 * @param {{ dist: string, env: Record<string, string | undefined>, log?: (m: string) => void }} o
 * @returns {string | null} the written file, or null when skipped
 */
export function publish({ dist, env, log = console.log }) {
  const key = env.PRIVATE_PAGE_KEY?.trim();
  const password = env.PRIVATE_PAGE_PASSWORD ?? '';
  const path = env.PRIVATE_PAGE_PATH?.trim() ?? '';
  const source = env.PRIVATE_PAGE_SOURCE || 'private/pitch.enc';

  if (!key || !password || !path) {
    log(
      '[private] skipped: set secrets PRIVATE_PAGE_KEY and PRIVATE_PAGE_PASSWORD and variable PRIVATE_PAGE_PATH to publish the private page',
    );
    return null;
  }
  if (!PATH_RE.test(path)) {
    throw new Error(
      'PRIVATE_PAGE_PATH must be one path segment of 8–64 lowercase letters, digits or dashes',
    );
  }
  if (!existsSync(dist)) throw new Error(`${dist} not found — build the site first`);
  const dir = join(dist, path);
  if (existsSync(dir)) throw new Error('PRIVATE_PAGE_PATH collides with a site page');
  if (password.length < 12) {
    log('::warning::PRIVATE_PAGE_PASSWORD is short; use a long passphrase (docs/SETUP.md §7.15)');
  }

  const html = unseal(readFileSync(source, 'utf8'), key);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'index.html');
  writeFileSync(file, unlockPage(reseal(html, password)));
  log(`[private] published the private page (${Math.round(html.length / 1024)} KB)`);
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--dist');
  const dist = i > -1 && process.argv[i + 1] ? process.argv[i + 1] : 'dist';
  try {
    publish({ dist, env: process.env });
  } catch (err) {
    console.error(`::error::${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
