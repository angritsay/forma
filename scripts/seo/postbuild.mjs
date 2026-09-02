#!/usr/bin/env node
/**
 * Post-build hook: copies the GitHub Pages helpers into dist.
 * - .nojekyll so that files/folders starting with "_" (our _assets) are served.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) {
  console.error('[postbuild] dist/ not found — run `astro build` first');
  process.exit(1);
}
writeFileSync(join(dist, '.nojekyll'), '');
console.log('[postbuild] wrote dist/.nojekyll');
