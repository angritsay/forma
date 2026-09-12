#!/usr/bin/env node
/**
 * Push identified exercise clips into the private `videos` bucket.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     node scripts/media/upload-videos.mjs [--dir media/clips] [--lang ru] [--dry-run]
 *
 * `--dir` is where the mp4s are (gitignored); the identifications come from `media/manifest.json`,
 * which is version controlled. They are separate on purpose — see media/README.md.
 *
 * Paths follow supabase/migrations/0003_storage.sql:
 *   videos/shared/<exercise_id>.<lang>.mp4     any signed-in user
 *   videos/<course_id>/<exercise_id>.<lang>.mp4 needs an active purchase of that course
 *
 * The poster frame prepare-videos.mjs cut from each clip goes up too, into the **public** bucket:
 *   images/exercises/<exercise_id>.jpg
 * That is what the workout preview shows for each movement («За тренировку»). Public on purpose —
 * it is one frame of a demonstration, the app draws it in a grid with no session in hand on the
 * landing side, and `exerciseStillUrl()` in src/lib/api/storage.ts derives exactly this path. A
 * missing poster is not an error: the app falls back to the drawn figure.
 *
 * Exercise demos go to `shared/`: the same movement appears in several courses, so gating a
 * demo behind one of them would hide it from someone who bought a different one. The bucket is
 * private either way — nothing here is reachable without a signed-in session and a signed URL.
 *
 * Requires the **service role** key, not the anon key: the insert policy is admin-only, and the
 * service role bypasses RLS. That key must never reach the browser or the repo — pass it in the
 * environment for the length of this one command.
 *
 * Idempotent: re-running upserts, so a re-encoded clip replaces the old object in place.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const dir = flag('dir', 'media/clips');
const posterDir = flag('posters', join(flag('dir', 'media/clips'), 'posters'));
const manifestPath = flag('manifest', 'media/manifest.json');
const lang = flag('lang', 'ru');
const dryRun = args.includes('--dry-run');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!url || !key)) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (service role, not anon)');
  process.exit(1);
}

if (!existsSync(manifestPath)) {
  console.error(`no manifest at ${manifestPath} — run prepare-videos.mjs first`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const ready = manifest.filter((c) => c.exerciseId);
const pending = manifest.length - ready.length;

if (ready.length === 0) {
  console.error(`nothing identified yet: 0 of ${manifest.length} clips have an exerciseId.`);
  console.error('Fill them in from the contact sheets — see docs/VIDEO.md.');
  process.exit(1);
}

// Two clips claiming the same exercise silently overwrite each other; say so instead.
const byExercise = new Map();
for (const c of ready) {
  const seen = byExercise.get(c.exerciseId);
  if (seen) {
    console.error(`both ${seen.key} and ${c.key} are marked as "${c.exerciseId}" — pick one`);
    process.exit(1);
  }
  byExercise.set(c.exerciseId, c);
}

const client = dryRun ? null : createClient(url, key, { auth: { persistSession: false } });
let uploaded = 0;
let failed = 0;
let posters = 0;

for (const clip of ready) {
  const path = `shared/${clip.exerciseId}.${lang}.mp4`;
  const file = join(dir, clip.file);
  if (!existsSync(file)) {
    console.error(`  MISSING  ${clip.file}`);
    failed++;
    continue;
  }
  if (dryRun) {
    console.log(`  would upload  ${clip.file}  →  videos/${path}`);
    uploaded++;
    continue;
  }
  const { error } = await client.storage
    .from('videos')
    .upload(path, readFileSync(file), { contentType: 'video/mp4', upsert: true });
  if (error) {
    console.error(`  FAILED   ${path}: ${error.message}`);
    failed++;
  } else {
    console.log(`  ok       videos/${path}`);
    uploaded++;
  }

  /*
   * The still, into the public bucket. Language-independent — it is a picture of a body, not of
   * any words — so there is one per exercise however many languages the clip has.
   */
  const posterFile = join(posterDir, `${clip.key}.jpg`);
  if (!existsSync(posterFile)) continue;
  const posterPath = `exercises/${clip.exerciseId}.jpg`;
  if (dryRun) {
    console.log(`  would upload  ${clip.key}.jpg  →  images/${posterPath}`);
    posters++;
    continue;
  }
  const still = await client.storage
    .from('images')
    .upload(posterPath, readFileSync(posterFile), { contentType: 'image/jpeg', upsert: true });
  if (still.error) {
    // Not fatal: the clip is up, and without a still the app shows the drawn figure.
    console.error(`  no still ${posterPath}: ${still.error.message}`);
  } else {
    console.log(`  ok       images/${posterPath}`);
    posters++;
  }
}

console.log(
  `\n${uploaded} uploaded, ${posters} stills, ${failed} failed, ${pending} clips still unidentified.`,
);
if (failed) process.exit(1);
