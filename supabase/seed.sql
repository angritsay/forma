-- =============================================================================
-- Forma — seed helper. Run AFTER the four migrations, in the SQL editor.
-- Nothing here is required for the app to start; it only grants admin access.
--
-- The course / workout catalogue is NOT here: it is generated from content by
-- `node scripts/content/gen-seed.mjs` into 0004_content_seed.sql, which is a
-- normal migration and must be applied (docs/SETUP.md §2.1).
-- =============================================================================

-- 1) Make the coach an admin. Use the exact email the coach signs in with
--    (case does not matter: the column is citext). Repeat for more staff.
--
--    insert into public.admins (email) values ('coach@example.com')
--    on conflict (email) do nothing;

-- 2) Remove an admin:
--
--    delete from public.admins where email = 'former-staff@example.com';

-- 3) Check who is an admin (works only when you are one, or from the SQL editor):
--
--    select email, created_at from public.admins order by created_at;

-- 4) Grant a course manually without the app (same effect as the admin screen).
--    The SQL editor runs as postgres, not as a signed-in admin, so the
--    admin_add_purchase() RPC refuses here; insert directly instead:
--
--    insert into public.purchases (email, course_id, status, source, note, activated_at)
--    values ('customer@example.com', 'start', 'active', 'manual', 'paid by bank transfer', now())
--    on conflict (email, course_id) do update
--      set status = 'active', activated_at = coalesce(public.purchases.activated_at, now());

-- 5) Test data for the leaderboard (optional; delete afterwards). Points on
--    daily_logs are recomputed by trigger from steps, so only steps matter, and
--    the date has to be within the last week:
--
--    insert into public.daily_logs (user_id, local_date, steps)
--    values ('<uuid of a test user>', current_date, 9000)
--    on conflict (user_id, local_date) do update set steps = excluded.steps;

-- 6) Clear a rate-limit bucket for an address that hit the order throttle
--    (docs/SETUP.md §9). A bucket stops blocking one hour after its window
--    started; the row itself stays until something removes it:
--
--    delete from public.order_throttle where bucket = '203.0.113.7';
--
--    Housekeeping (optional, the rows are a few bytes each):
--
--    delete from public.order_throttle where window_start < now() - interval '1 day';
