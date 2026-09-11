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
# Two things are verified:
#
#   1. Left as generated, it refuses to run and creates nothing. Getting this wrong means a
#      database whose only admin is `CHANGE-ME-…@example.com`, which nobody can sign in as: the
#      admin panel is then unreachable, with no error anywhere to say why.
#   2. With real addresses filled in, it applies — followed by 0009 — and the SQL suites pass
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
if ! grep -q 'still the placeholders' "$WORK/raw.log"; then
  echo "guard: FAIL — it stopped, but not on the placeholder check:"; head -5 "$WORK/raw.log"; exit 1
fi
left=$(psql -tAq -d "$DB" -c \
  "select count(*) from information_schema.tables where table_schema='public'")
if [ "$left" != "0" ]; then
  echo "guard: FAIL — stopped, but left $left table(s) behind"; exit 1
fi
dropdb --if-exists "$DB" 2>/dev/null
echo "guard: PASS (refused, and created nothing)"

# --- 2. Edited: must apply, and the suites must pass. ------------------------------------------
# Only the two value lines are rewritten. The guard's own `like 'CHANGE-ME-%'` test is left in
# place, so this proves it passes on real input rather than proving it was removed.
python3 - "$BUNDLE" "$WORK/edited.sql" <<'PY'
import sys
src = open(sys.argv[1], encoding='utf-8').read()
out = src.replace(
    "  ('CHANGE-ME-owner@example.com'),\n  ('CHANGE-ME-coach@example.com');\n",
    "  ('owner@example.com');\n",
)
if out == src:
    sys.exit("the placeholder lines are not in the shape this script expects — has the "
             "admin block in scripts/db/bundle.mjs changed?")
open(sys.argv[2], 'w', encoding='utf-8').write(out)
PY
[ -s "$WORK/edited.sql" ] || exit 1

DB=forma_bundle
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB" || exit 1
for f in "$SHIM" "$WORK/edited.sql" "$IMPORT"; do
  if ! psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" >"$WORK/b.log" 2>&1; then
    echo "FAILED: $f"; grep -B2 -A6 ERROR "$WORK/b.log" | head -30; exit 1
  fi
  echo "applied: $(basename "$f")"
done

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
