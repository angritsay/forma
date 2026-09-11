-- =============================================================================
-- 0010 — let the static site read a published course, so it can have a page.
--
-- A course built in the admin panel is playable in the app the moment it is published, but it had
-- nowhere to be *sold* from: the landing pages are static HTML generated at build time from
-- content/courses/*.ts, and the build has no session, so RLS showed it nothing.
--
-- What becomes readable without signing in is exactly what a sales page shows and no more:
--
--   admin_courses      of a published course — its name, description, who it is for, the outcomes,
--                      level, length, price, FAQ. This is marketing copy; it is meant to be read by
--                      someone deciding whether to buy.
--   admin_course_days  of a published course — week, day, kind and title. The shape of the
--                      programme, which the course page already shows for the compiled courses.
--
-- What stays private is the part people pay for: `custom_workouts` is untouched here, so the
-- exercises, reps and timings of a course are still readable only by an admin, by someone the
-- workout was assigned to, or by someone holding an entitlement to the course (0008).
--
-- Requires 0008_course_builder.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- admin_courses — published rows, readable by anyone.
--
-- A separate policy rather than a widening of "admin_courses: read published", because the two say
-- different things: that one lets a signed-in customer see the catalogue, this one lets an
-- anonymous visitor — and a build with no session at all — see a sales page. Postgres ORs policies
-- together, so a draft stays admin-only either way.
-- -----------------------------------------------------------------------------
drop policy if exists "admin_courses: anon reads published" on public.admin_courses;
create policy "admin_courses: anon reads published"
  on public.admin_courses for select
  to anon
  using (status = 'published');

grant select on public.admin_courses to anon;

-- -----------------------------------------------------------------------------
-- admin_course_days — the days of a published course.
-- -----------------------------------------------------------------------------
drop policy if exists "admin_course_days: anon reads published" on public.admin_course_days;
create policy "admin_course_days: anon reads published"
  on public.admin_course_days for select
  to anon
  using (
    exists (
      select 1 from public.admin_courses c
      where c.id = admin_course_days.course_id and c.status = 'published'
    )
  );

grant select on public.admin_course_days to anon;

-- -----------------------------------------------------------------------------
-- No grant on custom_workouts to anon, deliberately.
--
-- Spelled out because the omission is the security boundary and an omission is easy to "fix" by
-- accident: a course's workouts are the product. The course page shows the programme's shape from
-- the days above, and its sample workout only for the courses that live in content files, where
-- the sample was chosen by hand.
-- -----------------------------------------------------------------------------
