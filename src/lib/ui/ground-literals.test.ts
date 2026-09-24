/**
 * The old ground must not come back.
 *
 * The ground moved from charcoal #1a1a1a to graphite #121212 (design/CHANGELOG.md §16), and the
 * colour is written in more places than a stylesheet can reach: the Telegram header colour, the
 * manifest, the favicon, an inline scrim on a screen. `--bg` in global.css is the source and
 * `APP_BG` in tile.ts its copy; everything else is a literal that somebody typed, and this scan
 * is what keeps a copy-paste from an old screen from quietly repainting one corner of the product
 * in the previous ground.
 *
 * What it looks for: the hex in either case, and the triplet `26, 26, 26` the glass and the
 * scrims used to be built from. A line that says the value is history — «was», «было» — is
 * allowed to name it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));

/* The roots scanned: the app and site, the generators, the email template, the design system. */
const ROOTS = ['src', 'public', 'scripts', 'supabase/templates', 'design'] as const;

/** Paths (relative to the repo, forward slashes) that may keep the old value. */
const ALLOW: readonly RegExp[] = [
  // History: migrations already applied, the changelog, the owner's prototype kits.
  /^supabase\/migrations\//,
  /^design\/CHANGELOG\.md$/,
  /^design\/ui_kits\//,
  // This file names the patterns it hunts.
  /^src\/lib\/ui\/ground-literals\.test\.ts$/,
];

/** A line that names the old value as something it *was* — or walks the palette's history with arrows. */
const HISTORY = /\b(?:was|were|было|был|была|были)\b|→/i;

/** Text files worth reading; the rest of `public/` is images, video and fonts. */
const TEXT = /\.(?:astro|tsx?|mjs|cjs|js|css|json|webmanifest|svg|html|md|txt|xml|sql)$/;

const OLD_GROUND: readonly RegExp[] = [/#1a1a1a/i, /\b26,\s*26,\s*26\b/];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (TEXT.test(name)) out.push(path);
  }
  return out;
}

interface Hit {
  file: string;
  line: number;
  text: string;
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const root of ROOTS) {
    for (const path of files(join(REPO, root))) {
      const file = relative(REPO, path).split(sep).join('/');
      if (ALLOW.some((a) => a.test(file))) continue;
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((text, i) => {
          if (OLD_GROUND.some((p) => p.test(text)) && !HISTORY.test(text)) {
            hits.push({ file, line: i + 1, text: text.trim() });
          }
        });
    }
  }
  return hits;
}

describe('the ground outside global.css', () => {
  it('scans something', () => {
    expect(files(join(REPO, 'src')).length).toBeGreaterThan(100);
  });

  it('names no charcoal #1a1a1a / 26, 26, 26 anywhere the graphite ground should be', () => {
    expect(
      scan().map((h) => `${h.file}:${h.line}  ${h.text}`),
      'the ground is #121212 / --bg-rgb 18, 18, 18 — use the token, or say the value «was»',
    ).toEqual([]);
  });
});
