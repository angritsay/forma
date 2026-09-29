#!/usr/bin/env node
/**
 * The exercise ids that have a filmed clip, for the `site-loops` task in
 * .github/workflows/supabase-apply.yml.
 *
 *   node scripts/media/site-loop-ids.mjs            → one id per line on stdout
 *
 * The site shows every filmed movement as a silent four-second loop (`exerciseLoopUrl()` in
 * src/lib/api/storage.ts). The loops are cut on a runner from the clips in the private `videos`
 * bucket, so the runner needs to know which clips exist — and the content already says so: an
 * exercise with footage carries `video: { ru: 'storage:videos/shared/<id>.ru.mp4' }`.
 *
 * Read with a regular expression rather than by importing the catalogue. Importing it means a
 * TypeScript loader and zod on a runner that only has to download and cut some files, and the
 * reference is one literal string whose shape the upload script fixes. Only `shared/` Russian clips
 * count: those are the demonstrations (course-gated clips are not the coach's movements to show),
 * and an id is kept only if it is a plain `[a-z0-9_]` name, so nothing read here can reach a URL
 * or a shell as anything but a path segment.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIP =
  /\bvideo\s*:\s*\{[^}]*?\bru\s*:\s*(['"`])storage:videos\/shared\/([a-z0-9_]+)\.ru\.mp4\1/g;

/** The clip ids named in one or more exercise source files: unique, sorted. */
export function loopIds(sources) {
  const ids = new Set();
  for (const code of sources) for (const m of code.matchAll(CLIP)) ids.add(m[2]);
  return [...ids].sort();
}

/** Every `.ts` file under `dir` except tests and the barrel. */
export function readExerciseSources(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = fileURLToPath(new URL('../../content/exercises/', import.meta.url));
  const ids = loopIds(readExerciseSources(dir));
  if (ids.length === 0) {
    console.error('no filmed exercises found in content/exercises');
    process.exit(1);
  }
  process.stdout.write(ids.join('\n') + '\n');
}
