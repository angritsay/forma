#!/usr/bin/env node
/**
 * Render preview PNGs of pose sets (no dev server, no browser).
 *
 *   node scripts/anim/preview.mjs air_squat burpee
 *   node scripts/anim/preview.mjs all
 *   ANIM_PREVIEW_OUT=/tmp/frames ANIM_PREVIEW_SIZE=600 node scripts/anim/preview.mjs air_squat
 *
 * TypeScript pose sets are compiled on the fly by vitest (tsx is not installed), so this is a
 * thin wrapper around src/components/anim/preview.test.ts with ANIM_PREVIEW set. Frames land in
 * /tmp/anim-preview/<id>-<t>.png (t = 0, 0.25, 0.5, 0.75) and <id>-sheet.png (8 frames).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('-'));

if (ids.length === 0) {
  console.error('usage: node scripts/anim/preview.mjs <animation_id> [more ids…] | all');
  process.exit(2);
}

const vitest = resolve(root, 'node_modules', 'vitest', 'vitest.mjs');
if (!existsSync(vitest)) {
  console.error('vitest is not installed — run npm ci first');
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  [vitest, 'run', 'src/components/anim/preview.test.ts', '--reporter=basic'],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ANIM_PREVIEW: ids.join(','),
      ANIM_PREVIEW_OUT: process.env.ANIM_PREVIEW_OUT || '/tmp/anim-preview',
    },
  },
);

process.exit(result.status ?? 1);
