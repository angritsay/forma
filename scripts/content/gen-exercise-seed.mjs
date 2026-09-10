#!/usr/bin/env node
/**
 * Emits supabase/migrations/0007_exercise_seed.sql — the exercise library, in the database.
 *
 * The workout builder and the admin catalogue read `public.exercises`; content stays the source of
 * truth for the descriptive fields, so this seed upserts them. The markup columns the coach edits
 * by hand — video_ru, video_en, tags — are deliberately NOT in the update set, so re-running the
 * seed refreshes names and muscles from content without ever clobbering hand markup. On the very
 * first insert those columns are populated from content as a starting point.
 *
 * Usage:  node scripts/content/gen-exercise-seed.mjs [--check]
 *   --check  verify the committed file matches the content (exit 1 if stale)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'supabase/migrations/0007_exercise_seed.sql');

process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.warn(w);
});
register('../seo/ts-loader.mjs', import.meta.url);

const { EXERCISES, contentIssues } = await import('@/content/registry');

const issues = contentIssues();
if (issues.length > 0) {
  console.error('Content does not validate; fix it before generating the seed:');
  for (const i of issues.slice(0, 10)) console.error(`  ${i.path}: ${i.message}`);
  process.exit(1);
}
if (EXERCISES.length === 0) {
  console.error('No exercises found — refusing to generate an empty seed.');
  process.exit(1);
}

/** SQL string literal, or NULL for null/undefined. */
function lit(v) {
  if (v === null || v === undefined) return 'null';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function bool(v) {
  return v ? 'true' : 'false';
}
function num(v) {
  return v === null || v === undefined ? 'null' : String(v);
}
/** Postgres text[] literal. */
function arr(xs) {
  if (!xs || xs.length === 0) return `'{}'`;
  const inner = xs.map((x) => `"${String(x).replace(/(["\\])/g, '\\$1')}"`).join(',');
  return `'{${inner}}'`;
}

const rows = [...EXERCISES]
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((e, i) => {
    const cols = [
      lit(e.id),
      lit(e.name.ru),
      lit(e.name.en ?? null),
      lit(e.shortName?.ru ?? null),
      lit(e.description?.ru ?? null),
      lit(e.muscles[0] ?? null),
      arr(e.muscles),
      lit(e.pattern),
      arr(e.equipment),
      num(e.level),
      lit(e.unit),
      num(e.secondsPerRep ?? null),
      lit(e.animation),
      lit(e.video?.ru ?? null),
      lit(e.video?.en ?? null),
      arr(e.tags ?? []),
      bool(e.isTest === true),
      String(i + 1),
    ];
    return `  (${cols.join(', ')})`;
  });

const rule = '-- ' + '='.repeat(77);
const body = `${rule}
-- Forma — 0007_exercise_seed: the exercise library, in the database.
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate with:  node scripts/content/gen-exercise-seed.mjs
-- Source of truth:  content/exercises/*.ts (validated by src/content/registry.ts)
--
-- Requires 0006_custom_workouts.sql (the exercises table).
-- Upserts the descriptive fields; video_ru / video_en / tags are populated on first insert only
-- and are never overwritten, so coach markup in those columns survives a re-seed.
${rule}

insert into public.exercises (
  id, name_ru, name_en, short_name_ru, description_ru, primary_muscle, muscles, pattern,
  equipment, level, unit, seconds_per_rep, animation, video_ru, video_en, tags, is_test, sort_order
) values
${rows.join(',\n')}
on conflict (id) do update set
  name_ru = excluded.name_ru,
  name_en = excluded.name_en,
  short_name_ru = excluded.short_name_ru,
  description_ru = excluded.description_ru,
  primary_muscle = excluded.primary_muscle,
  muscles = excluded.muscles,
  pattern = excluded.pattern,
  equipment = excluded.equipment,
  level = excluded.level,
  unit = excluded.unit,
  seconds_per_rep = excluded.seconds_per_rep,
  animation = excluded.animation,
  is_test = excluded.is_test,
  sort_order = excluded.sort_order,
  updated_at = now();
`;

if (process.argv.includes('--check')) {
  const existing = await readFile(OUT, 'utf8').catch(() => '');
  if (existing.trim() !== body.trim()) {
    console.error(`${OUT} is stale. Run: node scripts/content/gen-exercise-seed.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date (${rows.length} exercises).`);
} else {
  await writeFile(OUT, body);
  console.log(`Wrote ${OUT} (${rows.length} exercises).`);
}
