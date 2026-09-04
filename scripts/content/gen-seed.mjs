#!/usr/bin/env node
/**
 * Emits supabase/migrations/0004_content_seed.sql from the validated course content.
 *
 * The backend needs to know which course ids exist (`public.courses`, the allowlist
 * `create_order()` checks) and how many points a workout may be worth
 * (`public.workouts.base_points`, the ceiling `workout_sessions_guard` clamps to).
 * Both are derived data: this script is the only writer of that migration.
 *
 * Usage:  node scripts/content/gen-seed.mjs [--check]
 *   --check  verify the committed file matches the content (exit 1 if stale)
 *
 * Re-run it (and re-apply the migration) whenever a course or a workout is added,
 * removed, renamed, or its basePoints change.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'supabase/migrations/0004_content_seed.sql');

// The registry is TypeScript; the loader used by the SEO scripts imports it directly.
process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.warn(w);
});
register('../seo/ts-loader.mjs', import.meta.url);

const { COURSES, contentIssues } = await import('@/content/registry');

const issues = contentIssues();
if (issues.length > 0) {
  console.error('Content does not validate; fix it before generating the seed:');
  for (const i of issues.slice(0, 10)) console.error(`  ${i.path}: ${i.message}`);
  process.exit(1);
}
if (COURSES.length === 0) {
  console.error('No courses found — refusing to generate an empty seed.');
  process.exit(1);
}

const ID_RE = /^[a-z0-9_]{2,40}$/;

/** `'text'` literal; ids are validated first so no escaping is ever needed. */
function id(value, what) {
  if (!ID_RE.test(value)) throw new Error(`${what} "${value}" does not match ${ID_RE}`);
  return `'${value}'`;
}

const courses = [...COURSES].sort((a, b) => a.order - b.order);
const courseRows = courses.map((c, i) => `  (${id(c.id, 'course id')}, ${i + 1})`);

/** One entry per workout: `{ key: "('start', 'w_test')", base: 80 }`. */
const workouts = [];
for (const c of courses) {
  const seen = new Set();
  for (const w of [...c.workouts].sort((a, b) => a.id.localeCompare(b.id))) {
    if (seen.has(w.id)) throw new Error(`duplicate workout id "${w.id}" in course "${c.id}"`);
    seen.add(w.id);
    if (!Number.isInteger(w.basePoints) || w.basePoints < 1 || w.basePoints > 250) {
      throw new Error(`workout "${c.id}/${w.id}" has out-of-range basePoints ${w.basePoints}`);
    }
    workouts.push({
      key: `(${id(c.id, 'course id')}, ${id(w.id, 'workout id')})`,
      base: w.basePoints,
    });
  }
}

const workoutRows = workouts.map((w) => `  ${w.key.slice(0, -1)}, ${w.base})`);
const workoutKeys = workouts.map((w) => `  ${w.key}`);
const courseIdList = courses.map((c) => id(c.id, 'course id')).join(', ');

const sql = `-- =============================================================================
-- Forma — 0004_content_seed: the course / workout catalogue the backend enforces.
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate with:  node scripts/content/gen-seed.mjs
-- Source of truth:  content/courses/*.ts (validated by src/content/registry.ts)
--
-- Requires 0001_init.sql. Idempotent: upserts every row, then deletes what content
-- no longer has. Re-apply it after every content change that touches course ids,
-- workout ids or basePoints — create_order() rejects unknown course ids and
-- workout_sessions_guard clamps points to base_points from here.
-- =============================================================================

insert into public.courses (id, sort_order) values
${courseRows.join(',\n')}
on conflict (id) do update set sort_order = excluded.sort_order;

insert into public.workouts (course_id, id, base_points) values
${workoutRows.join(',\n')}
on conflict (course_id, id) do update set base_points = excluded.base_points;

-- Rows content no longer defines (workouts first: they reference courses).
delete from public.workouts where (course_id, id) not in (
${workoutKeys.join(',\n')}
);
delete from public.courses where id not in (${courseIdList});
`;

if (process.argv.includes('--check')) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  if (current !== sql) {
    console.error(`${OUT} is stale — run: node scripts/content/gen-seed.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date`);
} else {
  await writeFile(OUT, sql, 'utf8');
  console.log(`wrote ${OUT} (${courses.length} courses, ${workoutRows.length} workouts)`);
}
