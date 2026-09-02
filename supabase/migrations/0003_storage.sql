-- =============================================================================
-- Forma — 0003_storage: private `videos` bucket + access policies.
-- Requires 0001_init.sql (purchases, is_admin). Idempotent.
--
-- Object naming convention (docs/SETUP.md §5):
--   videos/<course_id>/<exercise_id>.<lang>.mp4   → needs an active purchase of <course_id>
--   videos/shared/<exercise_id>.<lang>.mp4        → any signed-in user
-- Content references them as `storage:videos/<course_id>/<file>`; the app turns
-- that into a short-lived signed URL (src/lib/api/storage.ts).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

-- Read: signed-in users with an active purchase of the course in the first path
-- segment, everyone signed-in for `shared/`, and admins for everything.
drop policy if exists "videos: entitled select" on storage.objects;
create policy "videos: entitled select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'videos'
    and (
      (storage.foldername(name))[1] = 'shared'
      or exists (
        select 1
        from public.purchases p
        where p.status = 'active'
          and p.email = auth.email()::citext
          and p.course_id = (storage.foldername(name))[1]
      )
      or public.is_admin()
    )
  );

-- Write: admins only (upload from the Dashboard or a signed-in admin session).
drop policy if exists "videos: admin insert" on storage.objects;
create policy "videos: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos' and public.is_admin());

drop policy if exists "videos: admin update" on storage.objects;
create policy "videos: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'videos' and public.is_admin())
  with check (bucket_id = 'videos' and public.is_admin());

drop policy if exists "videos: admin delete" on storage.objects;
create policy "videos: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'videos' and public.is_admin());

-- No anon policies: the bucket is private and never listed publicly.
