-- =============================================================================
-- 0066 — creator pages and the «also on Forma» catalogue: what anybody may read about a creator.
--
-- docs/PLATFORM.md, phase 2, steps 2 and 6:
--
--   2. **Public creator pages.** `forma-app.co/c/<slug>/` shows the creator's name, their line
--      about themselves, a link to their audience and their published courses. The site is static,
--      so the pages are built from `public_creators()`, read with the anon key at build time
--      (`src/content/creators.ts`, the same way `src/content/published.ts` reads the courses).
--   6. **The catalogue.** Inside the app, «Также в Forma» lists other creators' published courses,
--      from `catalogue_creators()`. A Pro creator can switch their listing off (`creators.listed`),
--      since the point of Pro is their own brand; a Start creator is always listed, because on
--      Start the network is what Forma gives them for its share.
--
-- ## Who appears
--
-- Both functions answer only for creators who are **active** (not applied, paused or declined),
-- **not the house row** (Forma's own courses are the site itself), and have **at least one
-- published course** — a page or a catalogue entry with nothing in it is a promise with no
-- product behind it. The catalogue adds the listing rule: `tier = 'start' or listed`. A creator's
-- own page does not depend on the listing: it is their address, the one «Кабинет автора» links to
-- and they share themselves.
--
-- ## What is readable, and what is not
--
-- Five fields: `slug`, `name`, `about`, `audience_url`, and the published courses' ids
-- (`admin_courses.slug_id`, the id the site and the app already know every course by). Never the
-- owner's address, the tier, the processor's fee, the follower count, dates, statements or
-- invoices. The table itself stays closed (0064: RLS on, no policies); these are `security
-- definer` functions with an explicit column list, so a column added to `creators` later is not
-- published by accident.
--
-- ## The listing switch
--
--   * `creators.listed boolean not null default true`.
--   * `creator_set_listed(p_listed)` — the creator's own switch in «Кабинет автора». Pro only:
--     a Start creator gets `start_always_listed`.
--   * `admin_set_creator(..., p_listed)` — the owner's, in «Авторы». The signature grows by one
--     defaulted argument, so the old one is dropped explicitly first (0038 explains why
--     `create or replace` would leave two overloads and PostgREST would answer `PGRST203`); the
--     grants are made again. Turning a Start creator's listing off is refused the same way.
--     Moving an unlisted Pro creator to Start keeps the stored `false`, and the catalogue's rule
--     lists them anyway; back on Pro, their earlier choice holds.
--   * `my_creator()` and `admin_creators()` gain `listed` and `published` (how many of their
--     courses are published — the cabinet links the page address once it is above zero). A table
--     function's columns cannot change in place, so both are dropped and created again, with
--     their grants.
--
-- Requires 0008, 0064. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The listing flag.
-- -----------------------------------------------------------------------------
alter table public.creators
  add column if not exists listed boolean not null default true;

comment on column public.creators.listed is
  'Pro creators may opt out of the in-app «Также в Forma» catalogue (0066). Start is listed whatever this says.';

-- -----------------------------------------------------------------------------
-- 2. What anybody may read: creators with a page, and the ones the catalogue lists.
-- -----------------------------------------------------------------------------
create or replace function public.public_creators()
returns table (
  slug         text,
  name         text,
  about        text,
  audience_url text,
  courses      text[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select c.slug, c.name, c.about, c.audience_url, p.courses
  from public.creators c
  cross join lateral (
    select array_agg(ac.slug_id order by ac.sort_order, ac.slug_id) as courses
    from public.admin_courses ac
    where ac.creator_id = c.id and ac.status = 'published'
  ) p
  where c.status = 'active'
    and not c.house
    and p.courses is not null
  order by c.approved_at nulls last, c.slug
$$;

comment on function public.public_creators() is
  'Active, non-house creators with a published course: slug, name, about, audience link, course ids. Anon-callable; built into /c/<slug>/ (0066).';

revoke execute on function public.public_creators() from public;
grant execute on function public.public_creators() to anon, authenticated;

create or replace function public.catalogue_creators()
returns table (
  slug         text,
  name         text,
  about        text,
  audience_url text,
  courses      text[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select pc.slug, pc.name, pc.about, pc.audience_url, pc.courses
  from public.public_creators() pc
  join public.creators c on c.slug = pc.slug
  where c.tier = 'start' or c.listed
$$;

comment on function public.catalogue_creators() is
  'public_creators() minus Pro creators who switched their listing off: the app''s «Также в Forma» (0066).';

revoke execute on function public.catalogue_creators() from public;
grant execute on function public.catalogue_creators() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. The creator's own switch.
-- -----------------------------------------------------------------------------
create or replace function public.creator_set_listed(p_listed boolean)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_c public.creators;
begin
  if public.current_email() is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  select * into v_c from public.creators
  where owner_email = public.current_email() for update;
  if not found then
    raise exception 'not_creator' using errcode = 'P0001';
  end if;
  if p_listed is null then
    raise exception 'invalid_listed' using errcode = 'P0001';
  end if;
  if v_c.tier <> 'pro' and not p_listed then
    raise exception 'start_always_listed' using errcode = 'P0001';
  end if;
  update public.creators set listed = p_listed, updated_at = now() where id = v_c.id;
end;
$$;

comment on function public.creator_set_listed(boolean) is
  'A Pro creator switches their «Также в Forma» listing on or off; Start is always listed (0066).';

revoke execute on function public.creator_set_listed(boolean) from public, anon;
grant execute on function public.creator_set_listed(boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. The owner's switch: admin_set_creator grows `p_listed`.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_set_creator(uuid, text, text, numeric);

create or replace function public.admin_set_creator(
  p_id      uuid,
  p_status  text default null,
  p_tier    text default null,
  p_fee_pct numeric default null,
  p_listed  boolean default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_c public.creators;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select * into v_c from public.creators where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_c.house then
    raise exception 'house_creator' using errcode = 'P0001';
  end if;
  if p_status is not null and p_status not in ('applied', 'active', 'paused', 'declined') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  if p_tier is not null and p_tier not in ('start', 'pro') then
    raise exception 'invalid_tier' using errcode = 'P0001';
  end if;
  if p_fee_pct is not null and p_fee_pct not between 0 and 20 then
    raise exception 'invalid_fee' using errcode = 'P0001';
  end if;
  if p_listed is not null and not p_listed and coalesce(p_tier, v_c.tier) <> 'pro' then
    raise exception 'start_always_listed' using errcode = 'P0001';
  end if;

  update public.creators
     set status      = coalesce(p_status, status),
         tier        = coalesce(p_tier, tier),
         fee_pct     = coalesce(p_fee_pct, fee_pct),
         listed      = coalesce(p_listed, listed),
         -- The first opening starts the statements; pausing and reopening keeps that date.
         approved_at = case when coalesce(p_status, status) = 'active' and approved_at is null
                            then now() else approved_at end,
         updated_at  = now()
   where id = p_id;
end;
$$;

revoke execute on function public.admin_set_creator(uuid, text, text, numeric, boolean) from public, anon;
grant execute on function public.admin_set_creator(uuid, text, text, numeric, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. my_creator() and admin_creators() answer `listed` and `published` too.
-- -----------------------------------------------------------------------------
drop function if exists public.my_creator();

create or replace function public.my_creator()
returns table (
  id           uuid,
  slug         text,
  name         text,
  tier         text,
  status       text,
  about        text,
  audience_url text,
  followers    int,
  fee_pct      numeric,
  created_at   timestamptz,
  approved_at  timestamptz,
  courses      int,
  buyers       int,
  listed       boolean,
  published    int
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select c.id, c.slug, c.name, c.tier, c.status, c.about, c.audience_url, c.followers, c.fee_pct,
         c.created_at, c.approved_at,
         (select count(*)::int from public.admin_courses ac where ac.creator_id = c.id),
         (
           select count(distinct pu.email)::int
           from public.purchases pu
           where pu.status = 'active'
             and pu.course_id in (select ac.slug_id from public.admin_courses ac where ac.creator_id = c.id)
         ),
         c.listed,
         (
           select count(*)::int from public.admin_courses ac
           where ac.creator_id = c.id and ac.status = 'published'
         )
  from public.creators c
  where c.owner_email = public.current_email()
    and public.current_email() is not null
$$;

revoke execute on function public.my_creator() from public, anon;
grant execute on function public.my_creator() to authenticated;

drop function if exists public.admin_creators();

create or replace function public.admin_creators()
returns table (
  id uuid, slug text, name text, owner_email citext, house boolean, tier text, status text,
  about text, audience_url text, followers int, fee_pct numeric, created_at timestamptz,
  approved_at timestamptz, courses int, open_balance numeric, listed boolean, published int
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
  select c.id, c.slug, c.name, c.owner_email, c.house, c.tier, c.status, c.about, c.audience_url,
         c.followers, c.fee_pct, c.created_at, c.approved_at,
         (select count(*)::int from public.admin_courses ac where ac.creator_id = c.id),
         -- Unsettled invoices in roubles: what is still open between Forma and this creator.
         coalesce((
           select sum(i.balance) from public.creator_invoices i
           where i.creator_id = c.id and i.settled_at is null and i.currency = 'RUB'
         ), 0),
         c.listed,
         (
           select count(*)::int from public.admin_courses ac
           where ac.creator_id = c.id and ac.status = 'published'
         )
  from public.creators c
  order by (c.status = 'applied') desc, c.house, c.created_at desc;
end;
$$;

revoke execute on function public.admin_creators() from public, anon;
grant execute on function public.admin_creators() to authenticated;
