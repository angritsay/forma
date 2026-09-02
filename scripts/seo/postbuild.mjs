#!/usr/bin/env node
/**
 * Post-build hook for the static output in dist/:
 * - writes .nojekyll so that files/folders starting with "_" (our _assets) are served by GitHub Pages;
 * - removes Astro content-layer artefacts that the build emits at the output root
 *   (they are build-time metadata, not site content).
 */
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), process.argv[2] ?? 'dist');
if (!existsSync(dist)) {
  console.error(`[postbuild] ${dist} not found — run \`astro build\` first`);
  process.exit(1);
}

writeFileSync(join(dist, '.nojekyll'), '');
console.log('[postbuild] wrote .nojekyll');

const ARTEFACTS = ['collections', 'content-assets.mjs', 'content-modules.mjs', 'data-store.json'];
for (const name of ARTEFACTS) {
  const p = join(dist, name);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`[postbuild] removed build artefact ${name}`);
  }
}
