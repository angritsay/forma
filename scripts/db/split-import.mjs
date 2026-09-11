#!/usr/bin/env node
/**
 * Split 0009_course_import.sql into one file per course, small enough to paste.
 *
 *   node scripts/db/split-import.mjs
 *
 * The import is 660 KB because it carries every word of five courses — descriptions, FAQ, the
 * lot. That is too big to paste into a browser text area, which leaves "import a file", and the
 * dashboard's file import is not somewhere you want to send someone who just wants their courses
 * back. Five pastes of about 130 KB each, named after the course they carry, need no explaining:
 * open, copy, run, next. The same size as setup-all.sql, which is already pasted this way.
 *
 * Splitting is safe here and would not be in general: the generated file has no dollar-quoted
 * bodies, and every statement ends with a `;` at the end of a line, so statement boundaries can
 * be found by reading lines. Both facts are asserted below rather than assumed — if the generator
 * ever emits a function body, this stops instead of cutting one in half.
 *
 * The parts are ordered and must be run in order: a course's days reference the course row.
 * Each is idempotent on its own, exactly like the file it came from.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'supabase/migrations/0009_course_import.sql';
const DEST = 'supabase/course-import';

const sql = readFileSync(SRC, 'utf8');

if (sql.includes('$$')) {
  throw new Error(
    `${SRC} now contains a dollar-quoted body; splitting it by line is no longer safe`,
  );
}

const lines = sql.split('\n');

/*
 * Sections are delimited by the generator's own banner:
 *
 *   -- ---------------------------------------------------------------------------
 *   -- start — Старт: кроссфит дома без оборудования
 *   -- 20 workouts, 28 days
 *   -- ---------------------------------------------------------------------------
 *
 * The id on the second line names the part. Everything before the first banner is the file
 * header, which is repeated into every part so each one says what it is.
 */
const RULE = '-- ' + '-'.repeat(75);
const starts = [];
for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i] === RULE && /^-- ([a-z_]+) — (.+)$/.exec(lines[i + 1] ?? '');
  if (m) starts.push({ line: i, id: m[1], title: m[2] });
}
if (starts.length === 0) throw new Error(`no course sections found in ${SRC}`);

const header = lines.slice(0, starts[0].line).join('\n').trimEnd();

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

const width = String(starts.length).length;
const written = [];

starts.forEach((s, n) => {
  const end = n + 1 < starts.length ? starts[n + 1].line : lines.length;
  const body = lines.slice(s.line, end).join('\n').trimEnd();

  // A part that ends mid-statement would fail on its own; the last non-blank, non-comment line
  // of every part must close one.
  const last = body
    .split('\n')
    .filter((l) => l.trim() && !l.trimStart().startsWith('--'))
    .pop();
  if (!last?.endsWith(';')) {
    throw new Error(`part ${s.id} does not end on a complete statement (ends with: ${last})`);
  }

  const name = `${String(n + 1).padStart(width, '0')}-${s.id}.sql`;
  const note = [
    `-- PART ${n + 1} OF ${starts.length} — ${s.title}`,
    '--',
    '-- Paste this whole file into the Supabase SQL editor and run it. Run the parts in order:',
    "-- a course's days reference the course row, so an earlier part has to go in first.",
    '--',
    '-- Safe to re-run, and safe to re-run a part on its own.',
    '--',
    `-- GENERATED from ${SRC} by scripts/db/split-import.mjs — do not edit by hand.`,
  ].join('\n');

  writeFileSync(join(DEST, name), `${note}\n\n${header}\n\n${body}\n`);
  written.push(name);
});

writeFileSync(
  join(DEST, 'README.md'),
  [
    '# The five courses, in paste-sized pieces',
    '',
    `Generated from \`${SRC}\` by \`node scripts/db/split-import.mjs\`. Do not edit these by hand.`,
    '',
    'They are the same rows as the single migration, cut one course per file so each can be',
    'pasted into the Supabase SQL editor rather than imported as a file. **Run them in order** —',
    "a course's days reference its course row.",
    '',
    ...written.map((n, i) => `${i + 1}. \`${n}\``),
    '',
    'Every part is idempotent: re-running one updates its rows in place and changes nothing else.',
    '',
    'If you have the Supabase CLI, ignore all of this and let `supabase db push` apply the',
    "migration itself — these files exist only to avoid the dashboard's file import.",
    '',
  ].join('\n'),
);

console.log(`${DEST}/  ${written.length} parts`);
for (const n of written) {
  const kb = (readFileSync(join(DEST, n), 'utf8').length / 1024).toFixed(0);
  console.log(`  ${n}  ${kb} KB`);
}
