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
}

console.log(`\n${uploaded} uploaded, ${failed} failed, ${pending} clips still unidentified.`);
if (failed) process.exit(1);
