# The five courses, in paste-sized pieces

Generated from `supabase/migrations/0009_course_import.sql` by `node scripts/db/split-import.mjs`. Do not edit these by hand.

They are the same rows as the single migration, cut one course per file so each can be
pasted into the Supabase SQL editor rather than imported as a file. **Run them in order** —
a course's days reference its course row.

1. `1-start.sql`
2. `2-engine.sql`
3. `3-dumbbells.sql`
4. `4-kettlebell.sql`
5. `5-athlete.sql`

Every part is idempotent: re-running one updates its rows in place and changes nothing else.

If you have the Supabase CLI, ignore all of this and let `supabase db push` apply the
migration itself — these files exist only to avoid the dashboard's file import.
