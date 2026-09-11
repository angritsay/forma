#!/bin/bash
#
# Check supabase/setup-all.sql against a real Postgres.
#
#   scripts/db/verify-bundle.sh
#
# The bundle is generated (npm run db:bundle) but it is not just a concatenation: it adds the admin
# block, and it leaves 0009_course_import.sql out. So it can be wrong in ways the migrations are
# not, and it is the file the owner actually runs — worth its own check.
#
# Three things are verified:
#
#   1. Left as generated, it refuses to run and creates nothing. Getting this wrong means a
#      database whose only admin is `CHANGE-ME-…@example.com`, which nobody can sign in as: the
#      admin panel is then unreachable, with no error anywhere to say why.
#   2. With one of the two lines filled in and the other left as a placeholder, it applies and
#      adds exactly the one address. That is the common case — the other person was made an admin
#      by hand long ago — and it must not be mistaken for "unedited".
#   3. With real addresses filled in, it applies — followed by 0009 — and the SQL suites pass
#      against the result, which is how "the bundle builds the same schema as the migrations"
#      gets said.
#
# Needs a local Postgres 16 and the usual PG* environment (PGHOST/PGPORT/PGUSER). It creates and
# drops two throwaway databases and never touches a remote project.
set -u
cd "$(dirname "$0")/../.." || exit 1
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

BUNDLE=supabase/setup-all.sql
SHIM=supabase/tests/00_shim.sql
IMPORT=supabase/migrations/0009_course_import.sql

# --- 1. Unedited: must refuse, and must not create anything. -----------------------------------
DB=forma_bundle_raw
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB" || exit 1
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$SHIM" >/dev/null 2>&1

if psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$BUNDLE" >"$WORK/raw.log" 2>&1; then
  echo "guard: FAIL — the unedited bundle applied instead of stopping"; exit 1
fi
if ! grep -q 'no admin addresses were filled in' "$WORK/raw.log"; then
  echo "guard: FAIL — it stopped, but not on the placeholder check:"; head -5 "$WORK/raw.log"; exit 1
fi
left=$(psql -tAq -d "$DB" -c \
  "select count(*) from information_schema.tables where table_schema='public'")
if [ "$left" != "0" ]; then
  echo "guard: FAIL — stopped, but left $left table(s) behind"; exit 1
fi
dropdb --if-exists "$DB" 2>/dev/null
echo "guard: PASS (refused, and created nothing)"

# Rewrite the value lines the way a person would. The guard's own `like 'CHANGE-ME-%'` test is
# left in place throughout, so these prove it passes on real input rather than that it was deleted.
edit() {  # edit <owner-replacement-or-KEEP> <coach-replacement-or-KEEP> <outfile>
  python3 - "$BUNDLE" "$1" "$2" "$3" <<'PY'
import sys
src, owner, coach, dest = open(sys.argv[1], encoding='utf-8').read(), *sys.argv[2:]
out = src
if owner != 'KEEP':
    out = out.replace("('CHANGE-ME-owner@example.com')", "(%r)" % owner)
if coach != 'KEEP':
    out = out.replace("('CHANGE-ME-coach@example.com')", "(%r)" % coach)
if out == src:
    sys.exit('nothing was replaced — has the admin block in scripts/db/bundle.mjs changed?')
open(dest, 'w', encoding='utf-8').write(out)
PY
}

# --- 2. One line filled in, one left alone: must apply, adding exactly that one address. --------
DB=forma_bundle_one
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB" || exit 1
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$SHIM" >/dev/null 2>&1
edit 'solo@example.com' KEEP "$WORK/one.sql" || exit 1
if ! psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$WORK/one.sql" >"$WORK/one.log" 2>&1; then
  echo "partial: FAIL — one real address was treated as unedited"
  grep -B2 -A6 ERROR "$WORK/one.log" | head -20; exit 1
fi
got=$(psql -tAq -d "$DB" -c "select string_agg(email, ',' order by email) from public.admins")
if [ "$got" != "solo@example.com" ]; then
  echo "partial: FAIL — admins is '$got', expected only solo@example.com"; exit 1
fi
dropdb --if-exists "$DB" 2>/dev/null
echo "partial: PASS (one address in, placeholder ignored)"

# --- 3. Both filled in: must apply, and the suites must pass. -----------------------------------
# The suites seed their own admin and assert there is exactly one, so only one address goes in
# here; the second line stays a placeholder and is dropped.
edit 'owner@example.com' KEEP "$WORK/edited.sql" || exit 1

DB=forma_bundle
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB" || exit 1
for f in "$SHIM" "$WORK/edited.sql" "$IMPORT"; do
  if ! psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" >"$WORK/b.log" 2>&1; then
    echo "FAILED: $f"; grep -B2 -A6 ERROR "$WORK/b.log" | head -30; exit 1
  fi
  echo "applied: $(basename "$f")"
done

# --- 4. The split parts must produce exactly what the single import does. -----------------------
# supabase/course-import/*.sql is the same migration cut one course per file, so it can be pasted
# instead of imported. That is only true if it loads the same rows — a part cut mid-statement, or
# a course dropped by a bad boundary, would otherwise go unnoticed until a course was missing.
# Keyed on slug_id, never on admin_courses.id: that is a generated uuid, so it differs between
# any two databases and would make this comparison fail no matter what the parts contained.
snapshot() {  # snapshot <db> — every imported row, ordered, as one hash
  psql -tAq -d "$1" <<'SQL'
select md5(string_agg(t, E'\n' order by t)) from (
  select 'c|' || slug_id || '|' || status || '|' || sort_order || '|' || content::text as t
    from public.admin_courses
  union all
  select 'd|' || c.slug_id || '|' || d.node_id || '|' || d.week || '|' || d.day || '|' || d.kind
         || '|' || coalesce(d.content::text, '')
    from public.admin_course_days d join public.admin_courses c on c.id = d.course_id
  union all
  select 'w|' || short_id || '|' || coalesce(title, '') || '|' || structure::text
    from public.custom_workouts
) s;
SQL
}
whole=$(snapshot "$DB")

DBS=forma_bundle_split
dropdb --if-exists "$DBS" 2>/dev/null; createdb "$DBS" || exit 1
for f in "$SHIM" "$WORK/edited.sql" supabase/course-import/[0-9]*.sql; do
  if ! psql -v ON_ERROR_STOP=1 -q -d "$DBS" -f "$f" >"$WORK/s.log" 2>&1; then
    echo "split: FAIL — $(basename "$f") did not apply"
    grep -B2 -A6 ERROR "$WORK/s.log" | head -30; exit 1
  fi
done
split=$(snapshot "$DBS")
dropdb --if-exists "$DBS" 2>/dev/null

if [ -z "$whole" ] || [ "$whole" != "$split" ]; then
  echo "split: FAIL — the parts do not load the same rows as $IMPORT"
  echo "  whole: ${whole:-<empty>}"; echo "  split: ${split:-<empty>}"; exit 1
fi
echo "split: PASS (5 parts load exactly what the single import does)"

# The suites seed their own admin and assert there is exactly one, so the row the bundle inserted
# has to go first. A fixture collision, not a defect.
psql -q -d "$DB" -c "delete from public.admins;" >/dev/null

fail=0
for t in supabase/tests/*.sql; do
  case "$t" in *00_shim.sql) continue;; esac
  if psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$t" >"$WORK/t.log" 2>&1; then
    echo "$(basename "$t"): PASS"
  else
    echo "$(basename "$t"): FAIL"; grep -B2 -A6 ERROR "$WORK/t.log" | head -40; fail=1
  fi
done
dropdb --if-exists "$DB" 2>/dev/null
exit $fail
