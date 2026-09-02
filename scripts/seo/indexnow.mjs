#!/usr/bin/env node
/**
 * IndexNow submission (Yandex, Bing, Seznam, Naver share the same protocol/endpoint).
 *
 * Reads URLs from dist/sitemap.xml (or --urls) and POSTs them to https://api.indexnow.org/indexnow
 * as { host, key, keyLocation, urlList } in chunks of ≤ 10 000.
 *
 * Env:   INDEXNOW_KEY  — the key also served at /<key>.txt (required; exits 0 with a notice if unset)
 *        SITE_URL      — canonical origin (+ base path) e.g. https://user.github.io/forma
 * Flags: --sitemap <path>       default dist/sitemap.xml
 *        --urls a,b,c           submit these instead of the sitemap
 *        --changed-since <iso>  keep only entries whose <lastmod> ≥ date (entries without lastmod stay)
 *        --dry-run              print the payload, do not send
 *
 * Note: Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1 (Node ≥ 22.21).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSitemap } from './lib.mjs';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const CHUNK = 10_000;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{ sitemap: string, urls: string[], changedSince: string, dryRun: boolean }} */
  const out = { sitemap: 'dist/sitemap.xml', urls: [], changedSince: '', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sitemap' && argv[i + 1]) out.sitemap = argv[++i];
    else if (a === '--urls' && argv[i + 1]) out.urls = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--changed-since' && argv[i + 1]) out.changedSince = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = (process.env.INDEXNOW_KEY ?? '').trim();
  if (!key) {
    console.log('[indexnow] INDEXNOW_KEY is not set — skipping submission (nothing to do)');
    return 0;
  }
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.error('[indexnow] INDEXNOW_KEY must be 8–128 alphanumeric characters');
    return 1;
  }

  /** @type {{ loc: string, lastmod?: string }[]} */
  let entries;
  if (args.urls.length) entries = args.urls.map((loc) => ({ loc }));
  else {
    const file = resolve(ROOT, args.sitemap);
    if (!existsSync(file)) {
      console.error(`[indexnow] sitemap not found: ${args.sitemap} (build the site first or pass --urls)`);
      return 1;
    }
    entries = parseSitemap(readFileSync(file, 'utf8'));
  }
  if (args.changedSince) {
    const since = new Date(args.changedSince);
    if (Number.isNaN(since.getTime())) {
      console.error(`[indexnow] --changed-since must be an ISO date, got "${args.changedSince}"`);
      return 1;
    }
    entries = entries.filter((e) => !e.lastmod || new Date(e.lastmod).getTime() >= since.getTime());
  }
  const urlList = [...new Set(entries.map((e) => e.loc))];
  if (urlList.length === 0) {
    console.log('[indexnow] no URLs to submit');
    return 0;
  }

  let siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  if (!siteUrl) {
    const first = new URL(urlList[0]);
    siteUrl = first.origin;
    console.log(`[indexnow] SITE_URL not set — using ${siteUrl} from the first URL`);
  }
  const host = new URL(siteUrl).host;
  const keyLocation = `${siteUrl}/${key}.txt`;
  const foreign = urlList.filter((u) => new URL(u).host !== host);
  if (foreign.length) {
    console.error(`[indexnow] ${foreign.length} URL(s) do not belong to ${host}, e.g. ${foreign[0]}`);
    return 1;
  }

  let failed = false;
  for (let i = 0; i < urlList.length; i += CHUNK) {
    const chunk = urlList.slice(i, i + CHUNK);
    const payload = { host, key, keyLocation, urlList: chunk };
    console.log(`[indexnow] submitting ${chunk.length} URL(s) for ${host} (key file ${keyLocation})`);
    if (args.dryRun) {
      console.log(JSON.stringify({ ...payload, key: '***', urlList: chunk.slice(0, 10) }, null, 2));
      if (chunk.length > 10) console.log(`  … and ${chunk.length - 10} more`);
      continue;
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const body = (await res.text()).trim();
      console.log(`[indexnow] response: ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`);
      if (res.status === 200 || res.status === 202) continue;
      const hints = {
        400: 'invalid request format',
        403: 'key not valid — check /<key>.txt is served at keyLocation',
        422: 'URLs do not belong to the host or key mismatch',
        429: 'too many requests — retry later',
      };
      console.error(`[indexnow] ${hints[res.status] ?? 'unexpected status'}`);
      failed = true;
    } catch (err) {
      console.error(`[indexnow] request failed: ${err instanceof Error ? err.message : String(err)}`);
      failed = true;
    }
  }
  return failed ? 1 : 0;
}

main().then((code) => process.exit(code));
