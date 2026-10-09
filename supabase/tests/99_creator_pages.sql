-- =============================================================================
-- Creator pages and the «also on Forma» catalogue (0068).
-- Run on a database with every migration applied (0064 and 0068 included); it can follow the other
-- suites.
--
-- What this can get wrong:
--   * anon reads a private field — the owner's address, the tier, the fee, followers — or the
--     table itself;
--   * a creator with no page is published anyway: applied, paused, declined, the house row, or an
--     open creator whose only course is a draft;
--   * a Pro creator's opt-out does not take them out of the catalogue, or takes their page away;
--   * a Start creator (or the owner, for one) switches the listing off;
--   * somebody other than the creator or the owner flips the switch;
--   * `admin_set_creator` keeps 0067's five-argument overload next to the new one, or loses
--     0067's dated plan change (`p_from_month`, `creator_tier_changes`).
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', false);
end $$;
create or replace function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected % from: %', p_code, p_sql;
exception when others then
  if sqlerrm <> p_code and sqlstate <> p_code then
    raise exception 'expected %, got % (%) from: %', p_code, sqlerrm, sqlstate, p_sql;
  end if;
end $$;
grant execute on function pg_temp.expect_error(text, text) to public;

select pg_temp.as_super();

insert into public.admins (email) values ('cp-admin@example.com') on conflict (email) do nothing;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000066000', 'cp-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000660a1', 'cp-start@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000660b2', 'cp-pro@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000660c3', 'cp-other@example.com', '{}')
on conflict (id) do nothing;

/*
 * Seven creators, one reason each to be shown or hidden:
 *   cp-start    active, Start, a published course and a draft one   → page, catalogue
 *   cp-pro      active, Pro, a published course                     → page, catalogue (until opt-out)
 *   cp-draft    active, only a draft course                         → nothing
 *   cp-paused   paused, a published course                          → nothing
 *   cp-declined declined, a published course                        → nothing
 *   cp-applied  applied, a published course                         → nothing
 *   house row   (Forma) with a published course                     → nothing
 */
insert into public.creators (slug, name, owner_email, tier, status, about, audience_url, followers,
                             fee_pct, approved_at) values
  ('cp-start',    'Start Creator', 'cp-start@example.com', 'start', 'active',
   'Yoga for desk workers', 'https://t.me/cp_start', 12345, 3.5, now()),
  ('cp-pro',      'Pro Creator',   'cp-pro@example.com',   'pro',   'active',
   null, null, 999, 4, now()),
  ('cp-draft',    'Draft Only',    'cp-draft@example.com',    'start', 'active',   null, null, null, 0, now()),
  ('cp-paused',   'Paused',        'cp-paused@example.com',   'start', 'paused',   null, null, null, 0, now()),
  ('cp-declined', 'Declined',      'cp-declined@example.com', 'start', 'declined', null, null, null, 0, null),
  ('cp-applied',  'Applied',       'cp-applied@example.com',  'start', 'applied',  null, null, null, 0, null)
on conflict (slug) do nothing;

insert into public.admin_courses (slug_id, status, sort_order, creator_id) values
  ('cp_start_b',   'published', 2, (select id from public.creators where slug = 'cp-start')),
  ('cp_start_a',   'published', 1, (select id from public.creators where slug = 'cp-start')),
  ('cp_start_wip', 'draft',     0, (select id from public.creators where slug = 'cp-start')),
  ('cp_pro_a',     'published', 0, (select id from public.creators where slug = 'cp-pro')),
  ('cp_draft_a',   'draft',     0, (select id from public.creators where slug = 'cp-draft')),
  ('cp_paused_a',  'published', 0, (select id from public.creators where slug = 'cp-paused')),
  ('cp_decl_a',    'published', 0, (select id from public.creators where slug = 'cp-declined')),
  ('cp_appl_a',    'published', 0, (select id from public.creators where slug = 'cp-applied')),
  ('cp_house_a',   'published', 0, (select id from public.creators where house))
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 1. What anon reads.
-- -----------------------------------------------------------------------------
select pg_temp.as_user(null, null, 'anon');
do $$
declare
  r record;
  cols text[];
begin
  -- Only the creators with a page, whatever else other suites left in the table.
  assert (select array_agg(slug order by slug) from public.public_creators() where slug like 'cp-%')
         = array['cp-pro', 'cp-start'],
    format('pages: %s', (select array_agg(slug) from public.public_creators()));
  assert (select array_agg(slug order by slug) from public.catalogue_creators() where slug like 'cp-%')
         = array['cp-pro', 'cp-start'], 'catalogue before the opt-out';
  assert not exists (select 1 from public.public_creators() where slug = 'forma'), 'no house row';

  select * into r from public.public_creators() where slug = 'cp-start';
  assert r.name = 'Start Creator' and r.about = 'Yoga for desk workers'
     and r.audience_url = 'https://t.me/cp_start'
     and r.courses = array['cp_start_a', 'cp_start_b'],
    format('cp-start, published only and in order: %s', r);

  -- Exactly five columns, none of them private.
  select array_agg(a.attname::text order by a.n) into cols
  from pg_proc p
  cross join lateral unnest(p.proargnames, p.proargmodes) with ordinality as a(attname, mode, n)
  where p.proname in ('public_creators') and p.pronamespace = 'public'::regnamespace
    and a.mode = 't'
  group by p.oid;
  assert cols = array['slug', 'name', 'about', 'audience_url', 'courses'], format('columns: %s', cols);
  select array_agg(a.attname::text order by a.n) into cols
  from pg_proc p
  cross join lateral unnest(p.proargnames, p.proargmodes) with ordinality as a(attname, mode, n)
  where p.proname in ('catalogue_creators') and p.pronamespace = 'public'::regnamespace
    and a.mode = 't'
  group by p.oid;
  assert cols = array['slug', 'name', 'about', 'audience_url', 'courses'], format('columns: %s', cols);
end $$;
-- The table itself stays closed, and the rest of the creator API too.
select pg_temp.expect_error($$select owner_email from public.creators$$, '42501');
select pg_temp.expect_error($$select * from public.my_creator()$$, '42501');
select pg_temp.expect_error($$select public.creator_set_listed(false)$$, '42501');
select pg_temp.expect_error($$select * from public.admin_creators()$$, '42501');

-- -----------------------------------------------------------------------------
-- 2. The creator's own switch.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000660a1', 'cp-start@example.com');
select pg_temp.expect_error($$select public.creator_set_listed(false)$$, 'start_always_listed');
select public.creator_set_listed(true);
do $$
declare r record;
begin
  select * into r from public.my_creator();
  assert r.listed and r.published = 2 and r.courses = 3, format('Start in the cabinet: %s', r);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000660c3', 'cp-other@example.com');
select pg_temp.expect_error($$select public.creator_set_listed(false)$$, 'not_creator');

select pg_temp.as_user('00000000-0000-0000-0000-0000000660b2', 'cp-pro@example.com');
select public.creator_set_listed(false);
do $$
begin
  assert not (select listed from public.my_creator()), 'Pro switched off';
  assert (select published from public.my_creator()) = 1, 'one published';
end $$;

select pg_temp.as_user(null, null, 'anon');
do $$
begin
  assert exists (select 1 from public.public_creators() where slug = 'cp-pro'),
    'an unlisted Pro creator keeps their page';
  assert not exists (select 1 from public.catalogue_creators() where slug = 'cp-pro'),
    'an unlisted Pro creator leaves the catalogue';
  assert exists (select 1 from public.catalogue_creators() where slug = 'cp-start'), 'Start stays';
end $$;

-- -----------------------------------------------------------------------------
-- 3. The owner's switch, and the tier moving under it.
-- -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000660a1', 'cp-start@example.com');
select pg_temp.expect_error(
  $$select public.admin_set_creator(gen_random_uuid(), p_listed => false)$$,
  'not_admin');

select pg_temp.as_user('00000000-0000-0000-0000-000000066000', 'cp-admin@example.com');
do $$
declare
  v_start uuid := (select id from public.admin_creators() where slug = 'cp-start');
  v_pro   uuid := (select id from public.admin_creators() where slug = 'cp-pro');
begin
  assert not (select listed from public.admin_creators() where id = v_pro), 'owner sees the opt-out';
  assert (select published from public.admin_creators() where id = v_start) = 2, 'published count';

  perform pg_temp.expect_error(
    format('select public.admin_set_creator(%L, p_listed => false)', v_start),
    'start_always_listed');
  -- Moving to Pro and switching off in one call is allowed (0067's plan history is checked below,
  -- as the table owner: the table is closed to clients).
  perform public.admin_set_creator(v_start, null, 'pro', p_listed => false);
  assert not (select listed from public.admin_creators() where id = v_start), 'owner switched off';
  perform pg_temp.expect_error(
    format('select public.admin_set_creator(%L, null, ''start'', null, %L)', v_start,
           (date_trunc('month', now() at time zone 'Europe/Moscow') + interval '1 month')::date),
    'invalid_month');
  -- Back to Start: the stored choice stays, but Start is listed whatever it says.
  perform public.admin_set_creator(v_start, null, 'start');
  assert (select tier from public.admin_creators() where id = v_start) = 'start', 'back on Start';

  -- A positional four-argument call still resolves (defaulted p_from_month, p_listed).
  perform public.admin_set_creator(v_pro, null, null, 4);
  assert (select fee_pct from public.admin_creators() where id = v_pro) = 4, 'fee kept';
  assert not (select listed from public.admin_creators() where id = v_pro), 'listing kept';
  perform public.admin_set_creator(v_pro, p_listed => true);
  assert (select listed from public.admin_creators() where id = v_pro), 'owner switched back on';
end $$;

select pg_temp.as_user(null, null, 'anon');
do $$
begin
  assert exists (select 1 from public.catalogue_creators() where slug = 'cp-start'),
    'a Start creator with a stored false is listed anyway';
  assert exists (select 1 from public.catalogue_creators() where slug = 'cp-pro'), 'Pro back on';
end $$;

select pg_temp.as_super();
do $$
declare
  v_start uuid := (select id from public.creators where slug = 'cp-start');
  this_m  date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
begin
  -- Pro then Start again in the same month: one row for this month, holding the latest plan, and
  -- the Start it began on recorded from its start (0067's rules, kept by 0068's rebuild).
  assert (select tier from public.creator_tier_changes
          where creator_id = v_start and from_month = this_m) = 'start',
    format('dated plan history: %s', (select array_agg(t) from public.creator_tier_changes t
                                      where creator_id = v_start));
end $$;

-- Pausing takes the page and the listing away; a course going back to draft does the same.
select pg_temp.as_user('00000000-0000-0000-0000-000000066000', 'cp-admin@example.com');
select public.admin_set_creator((select id from public.admin_creators() where slug = 'cp-pro'), 'paused');
select pg_temp.as_super();
update public.admin_courses set status = 'draft' where slug_id in ('cp_start_a', 'cp_start_b');
select pg_temp.as_user(null, null, 'anon');
do $$
begin
  assert not exists (select 1 from public.public_creators() where slug in ('cp-pro', 'cp-start')),
    'paused, and no published course left: no pages';
  assert not exists (select 1 from public.catalogue_creators() where slug in ('cp-pro', 'cp-start')),
    'and nothing in the catalogue';
end $$;

-- -----------------------------------------------------------------------------
-- 4. One admin_set_creator, not two.
-- -----------------------------------------------------------------------------
select pg_temp.as_super();
do $$
begin
  assert (select count(*) from pg_proc
          where proname = 'admin_set_creator' and pronamespace = 'public'::regnamespace) = 1,
    'a single overload';
  assert (select count(*) from pg_proc
          where proname = 'my_creator' and pronamespace = 'public'::regnamespace) = 1,
    'a single my_creator';
end $$;

delete from public.admin_courses where slug_id like 'cp\_%';
delete from public.creators where slug like 'cp-%';
select 'ok 99_creator_pages';
