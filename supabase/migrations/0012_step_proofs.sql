-- =============================================================================
-- 0012 — a screenshot attached to a day's steps.
--
-- Steps are typed in by hand (docs/SPEC.md §7), which is the honest arrangement — no phone health
-- API is reachable from a Mini App — and it is also the one place in the product where the number
-- that earns points is the athlete's own word. A screenshot of the phone's own step counter is
-- what turns that word into something the coach can look at, and for the athlete it is faster than
-- typing: open Здоровье, screenshot, attach.
--
-- Nothing here scores it and nothing verifies it. The points still come from `steps` through the
-- same trigger; the image is evidence a person can read, filed next to the number.
--
-- Safe to re-run: every policy is dropped first and every function is `create or replace`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- daily_logs.proof_path — an object in the private `proofs` bucket, never a URL.
-- -----------------------------------------------------------------------------
alter table public.daily_logs add column if not exists proof_path text;

alter table public.daily_logs drop constraint if exists daily_logs_proof_path_len;
alter table public.daily_logs add constraint daily_logs_proof_path_len
  check (proof_path is null or length(proof_path) between 1 and 400)
  not valid;

comment on column public.daily_logs.proof_path is
  'storage:proofs/steps/<user_id>/<local_date>.<ext> — the athlete''s own screenshot of their step counter. Never a URL: the app mints a signed one.';

-- -----------------------------------------------------------------------------
-- The bucket. Declared here as well as in 0011 so step proofs do not depend on the marathon
-- migration having been run; `on conflict do nothing` makes the second declaration a no-op.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

/*
 * Is this object inside the caller's own steps folder?
 *
 * The path is `steps/<user_id>/<anything>`, so the check is the second folder against the caller.
 * Security definer only to keep it callable without a grant on anything it reads; it reads nothing
 * but the JWT.
 */
create or replace function public.owns_step_proof_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_parts text[] := storage.foldername(p_name);
  v_owner uuid;
begin
  if array_length(v_parts, 1) is null or array_length(v_parts, 1) < 2 then
    return false;
  end if;
  if v_parts[1] <> 'steps' then
    return false;
  end if;
  begin
    v_owner := v_parts[2]::uuid;
  exception when others then
    return false;
  end;
  return v_owner = auth.uid();
end;
$$;

revoke execute on function public.owns_step_proof_path(text) from public, anon;
grant execute on function public.owns_step_proof_path(text) to authenticated;

/*
 * The athlete owns their screenshots outright: upload, replace, look at, delete. The coach reads
 * everything in this bucket already (the "proofs: admin all" policy from 0011, restated here so
 * the two migrations are independent) — that is the point of a proof.
 */
drop policy if exists "proofs: admin all" on storage.objects;
create policy "proofs: admin all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'proofs' and public.is_admin())
  with check (bucket_id = 'proofs' and public.is_admin());

drop policy if exists "proofs: steps own read" on storage.objects;
create policy "proofs: steps own read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'proofs' and public.owns_step_proof_path(name));

drop policy if exists "proofs: steps own insert" on storage.objects;
create policy "proofs: steps own insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'proofs' and public.owns_step_proof_path(name));

drop policy if exists "proofs: steps own update" on storage.objects;
create policy "proofs: steps own update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'proofs' and public.owns_step_proof_path(name))
  with check (bucket_id = 'proofs' and public.owns_step_proof_path(name));

drop policy if exists "proofs: steps own delete" on storage.objects;
create policy "proofs: steps own delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'proofs' and public.owns_step_proof_path(name));
