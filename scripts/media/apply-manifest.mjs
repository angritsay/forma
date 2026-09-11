#!/usr/bin/env node
/**
 * Write `video:` references onto the exercises named in the clip manifest.
 *
 *   node scripts/media/apply-manifest.mjs [--manifest media/manifest.json] [--check]
 *
 * Turns each identified clip into the storage reference the app resolves at runtime:
 *
 *   { key: 'IMG_0909', exerciseId: 'db_front_squat' }
 *     → video: { ru: 'storage:videos/shared/db_front_squat.ru.mp4' }
 *
 * The field is inserted directly after `animation:`, which every exercise has, so the edit lands
 * in a predictable place and the diff stays readable. Exercises already carrying a `video:` are
 * rewritten in place rather than duplicated.
 *
 * `--check` reports what would change and exits non-zero if anything would — for CI, so a
 * manifest that drifts from the content files is caught rather than silently ignored.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const manifestPath = flag('manifest', 'media/manifest.json');
const check = args.includes('--check');
const CONTENT = 'content/exercises';

if (!existsSync(manifestPath)) {
  console.error(`no manifest at ${manifestPath} — run prepare-videos.mjs first`);
  process.exit(1);
}
const wanted = new Map(
  JSON.parse(readFileSync(manifestPath, 'utf8'))
    .filter((c) => c.exerciseId)
    .map((c) => [c.exerciseId, `storage:videos/shared/${c.exerciseId}.ru.mp4`]),
);

if (wanted.size === 0) {
  console.error('nothing identified yet — fill in exerciseId from the contact sheets.');
  process.exit(1);
}

const files = readdirSync(CONTENT).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
const changes = [];
const seen = new Set();

for (const file of files) {
  const path = join(CONTENT, file);
  const before = readFileSync(path, 'utf8');
  let after = before;

  for (const [exerciseId, ref] of wanted) {
    // Anchor on the id, then act on the `animation:` line inside that same object literal.
    const idAt = after.indexOf(`id: '${exerciseId}',`);
    if (idAt === -1) continue;
    seen.add(exerciseId);

    const animAt = after.indexOf('animation:', idAt);
    if (animAt === -1) {
      console.error(`  ${exerciseId}: no animation: line found — skipped`);
      continue;
    }
    const lineEnd = after.indexOf('\n', animAt);
    const indent = /^(\s*)/.exec(after.slice(after.lastIndexOf('\n', animAt) + 1))[1];
    const videoLine = `${indent}video: { ru: '${ref}' },`;

    // Replace an existing video: line if the next one belongs to this exercise, else insert.
    const nextVideo = after.indexOf('video:', lineEnd);
    const nextId = after.indexOf("id: '", lineEnd);
    if (nextVideo !== -1 && (nextId === -1 || nextVideo < nextId)) {
      const vEnd = after.indexOf('\n', nextVideo);
      const vStart = after.lastIndexOf('\n', nextVideo) + 1;
      if (after.slice(vStart, vEnd) !== videoLine) {
        after = after.slice(0, vStart) + videoLine + after.slice(vEnd);
        changes.push(`${exerciseId} (updated)`);
      }
    } else {
      after = `${after.slice(0, lineEnd)}\n${videoLine}${after.slice(lineEnd)}`;
      changes.push(`${exerciseId} (added)`);
    }
  }

  /*
   * Drop `video:` from any exercise the manifest no longer claims.
   *
   * The manifest decides which exercises have footage, so applying it has to be able to take a
   * reference away as well as put one in — otherwise retiring a clip leaves content pointing at a
   * storage object that is not there. The app survives that (the signed-URL fetch fails and the
   * drawn figure keeps playing), which is exactly why it would go unnoticed: the file would claim
   * a video for months with nothing behind it.
   *
   * Walked last-to-first so each removal cannot shift the offsets of the ones still to come.
   */
  for (const m of [...after.matchAll(/^[ \t]*video: \{.*\n/gm)].reverse()) {
    const idAt = after.lastIndexOf("id: '", m.index);
    const exerciseId = idAt === -1 ? null : /id: '([^']+)'/.exec(after.slice(idAt))?.[1];
    if (exerciseId && !wanted.has(exerciseId)) {
      after = after.slice(0, m.index) + after.slice(m.index + m[0].length);
      changes.push(`${exerciseId} (removed — no longer in the manifest)`);
    }
  }

  if (after !== before && !check) writeFileSync(path, after);
}

for (const id of wanted.keys()) {
  if (!seen.has(id))
    console.error(`  no exercise with id "${id}" in ${CONTENT}/ — check the manifest`);
}

if (changes.length === 0) {
  console.log(`up to date: ${wanted.size} clips already referenced.`);
  process.exit(0);
}
console.log(changes.map((c) => `  ${c}`).join('\n'));
console.log(`\n${changes.length} exercise(s) ${check ? 'would change' : 'updated'}.`);
if (check) process.exit(1);
console.log('Run prettier and the tests, then commit.');
