#!/usr/bin/env node
/**
 * Emits supabase/migrations/0009_course_import.sql: the courses written as files, as rows the
 * admin panel can edit.
 *
 * Anastasia asked to be able to open what Sergey wrote and change it — a set count here, the order
 * of two days there — without a code change. That means the five compiled courses have to exist as
 * `admin_courses` + `admin_course_days` + `custom_workouts` rows.
 *
 * The conversion itself is `workoutToStructure()` in src/lib/courses/draft.ts, and it is lossless:
 * draft.test.ts takes every workout of every course through it and back and requires the result to
 * equal what went in, block for block. This script only spells the rows out as SQL.
 *
 * Usage:  node scripts/content/gen-course-import.mjs [--check]
 *   --check  verify the committed file matches the content (exit 1 if stale)
 *
 * Applying the migration is safe to repeat and safe to skip: it writes nothing the app reads until
 * a course is published from the admin panel, and the compiled files keep winning until then (see
 * setCatalogueOverlay in src/content/catalogue.ts). That is deliberate — it gives the imported
 * copy somewhere to be checked before it replaces anything.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'supabase/migrations/0009_course_import.sql');

process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.warn(w);
});
register('../seo/ts-loader.mjs', import.meta.url);

const { COURSES, contentIssues } = await import('@/content/registry');
const { workoutToStructure } = await import('@/lib/courses/draft');

const issues = contentIssues();
if (issues.length > 0) {
  console.error('Content does not validate; fix it before generating the import:');
  for (const i of issues.slice(0, 10)) console.error(`  ${i.path}: ${i.message}`);
  process.exit(1);
}
if (COURSES.length === 0) {
  console.error('No courses found — refusing to generate an empty import.');
  process.exit(1);
}

/** A SQL string literal. */
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replaceAll("'", "''")}'`);
/** A SQL jsonb literal. */
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
/** A SQL text[] literal. */
const arr = (xs) =>
  `'{${xs.map((x) => `"${String(x).replaceAll('"', '\\"')}"`).join(',')}}'::text[]`;

/**
 * The short id a workout gets as a `custom_workouts` row.
 *
 * Prefixed with the course, because the two id spaces do not agree. Workout ids are unique *inside
 * a course* — `public.workouts` is keyed on (course_id, id) and the comment in 0001 says so — while
 * `custom_workouts.short_id` is unique globally. Eighteen of the 83 workouts share a name across
 * courses (`w_test` alone appears four times), so importing them under their own ids silently made
 * four courses share one workout row, each overwriting the last.
 *
 * The cost is that a session recorded against an imported course names `start_w_s01_emom` where one
 * recorded against the compiled course named `w_s01_emom`. That is safe: progress is keyed on the
 * node id, which is preserved, and the points ceiling is looked up by (course_id, workout_id) —
 * both sides of which this migration writes together.
 *
 * Longest result is 32 characters, inside the 40 the column allows.
 */
const shortIdFor = (course, workout) => `${course.id}_${workout.id}`;

const lines = [];
const push = (s = '') => lines.push(s);

push('-- =============================================================================');
push('-- 0009 — the compiled courses, as rows the admin panel can edit.');
push('--');
push('-- GENERATED FILE — do not edit by hand.');
push('-- Regenerate with:  node scripts/content/gen-course-import.mjs');
push('-- Source of truth:  content/courses/*.ts (validated by src/content/registry.ts)');
push('--');
push('-- Requires 0008_course_builder.sql. Idempotent: re-running updates the rows in place.');
push('--');
push('-- These arrive as DRAFTS. Nothing changes for anyone until a course is published from the');
push(
  '-- admin panel, and even then the compiled file keeps winning while it exists — the catalogue',
);
push(
  '-- prefers compiled content on an id collision. Delete the course file to hand a course over.',
);
push('--');
push('-- Ids are preserved throughout: a course keeps its slug_id, a workout keeps its id as');
push(
  '-- short_id, a day keeps its node id. Purchases, sessions and progress all key off those, so',
);
push('-- the imported copy scores and resumes exactly as the original.');
push('-- =============================================================================');
push();

for (const course of COURSES) {
  const content = {
    slug: course.slug,
    name: course.name,
    tagline: course.tagline,
    description: course.description,
    longDescription: course.longDescription,
    forWhom: course.forWhom,
    outcomes: course.outcomes,
    faq: course.faq,
    ...(course.introVideo ? { introVideo: course.introVideo } : {}),
    ...(course.paymentUrl ? { paymentUrl: course.paymentUrl } : {}),
  };

  push(`-- ${'-'.repeat(75)}`);
  push(`-- ${course.id} — ${course.name.ru}`);
  push(`-- ${course.workouts.length} workouts, ${course.nodes.length} days`);
  push(`-- ${'-'.repeat(75)}`);
  push('insert into public.admin_courses (');
  push('  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,');
  push('  equipment, tile, price_rub, price_usd, content');
  push(') values (');
  push(
    `  ${q(course.id)}, 'draft', ${course.order}, ${course.level}, ${course.weeks}, ` +
      `${course.sessionsPerWeek}, ${course.avgSessionMin},`,
  );
  push(`  ${arr(course.equipment)}, ${q(course.tile)}, ${course.price.rub}, ${course.price.usd},`);
  push(`  ${j(content)}`);
  push(')');
  push('on conflict (slug_id) do update set');
  push('  sort_order = excluded.sort_order,');
  push('  level = excluded.level,');
  push('  weeks = excluded.weeks,');
  push('  sessions_per_week = excluded.sessions_per_week,');
  push('  avg_session_min = excluded.avg_session_min,');
  push('  equipment = excluded.equipment,');
  push('  tile = excluded.tile,');
  push('  price_rub = excluded.price_rub,');
  push('  price_usd = excluded.price_usd,');
  push('  content = excluded.content,');
  push('  updated_at = now();');
  push();

  // The workouts this course plays. `short_id` is the workout's own id, so re-running finds them.
  for (const workout of course.workouts) {
    const structure = workoutToStructure(workout);
    push('insert into public.custom_workouts (short_id, title, description, structure, points)');
    push(
      `values (${q(shortIdFor(course, workout))}, ${q(workout.name.ru)}, ` +
        `${q(workout.description.ru)},`,
    );
    push(`  ${j(structure)}, ${workout.basePoints})`);
    push('on conflict (short_id) do update set');
    push('  title = excluded.title,');
    push('  description = excluded.description,');
    push('  structure = excluded.structure,');
    push('  points = excluded.points,');
    push('  updated_at = now();');
    push();
  }

  // The days, in order, each pointing at the workout row by its short id.
  push('-- days');
  for (const [i, node] of course.nodes.entries()) {
    const dayContent = {
      title: node.title,
      ...(node.subtitle ? { subtitle: node.subtitle } : {}),
      body: [],
    };
    const workoutRef = node.workoutId
      ? `(select id from public.custom_workouts where short_id = ${q(`${course.id}_${node.workoutId}`)})`
      : 'null';
    push('insert into public.admin_course_days (');
    push('  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,');
    push('  sort_order');
    push(') values (');
    push(`  (select id from public.admin_courses where slug_id = ${q(course.id)}),`);
    push(`  ${q(node.id)}, ${node.week}, ${node.day}, ${q(node.kind)}, ${workoutRef},`);
    push(`  ${j(dayContent)}, ${node.deload === true}, ${node.stepsGoal ?? 'null'}, ${i}`);
    push(')');
    push('on conflict (course_id, node_id) do update set');
    push('  week = excluded.week,');
    push('  day = excluded.day,');
    push('  kind = excluded.kind,');
    push('  custom_workout_id = excluded.custom_workout_id,');
    push('  content = excluded.content,');
    push('  deload = excluded.deload,');
    push('  steps_goal = excluded.steps_goal,');
    push('  sort_order = excluded.sort_order,');
    push('  updated_at = now();');
    push();
  }
}

const body = `${lines.join('\n')}\n`;

if (process.argv.includes('--check')) {
  const existing = await readFile(OUT, 'utf8').catch(() => '');
  if (existing.trim() !== body.trim()) {
    console.error(`${OUT} is stale; run node scripts/content/gen-course-import.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date (${COURSES.length} courses).`);
} else {
  await writeFile(OUT, body, 'utf8');
  const workouts = COURSES.reduce((n, c) => n + c.workouts.length, 0);
  const days = COURSES.reduce((n, c) => n + c.nodes.length, 0);
  console.log(`Wrote ${OUT} (${COURSES.length} courses, ${workouts} workouts, ${days} days).`);
}
