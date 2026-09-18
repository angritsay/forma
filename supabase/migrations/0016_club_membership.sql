-- =============================================================================
-- 0016 — the club is a subscription, not a cohort.
--
-- The defect this fixes, in the owner's words: «У нас каждую неделю новый
-- лидерборд для всех и все. Если ты в клубе то ты участвуешь. Если нет то нет.»
--
-- What the code did instead: the club was a `marathons` row and you were in it
-- only if somebody had written your email into `marathon_members` by hand — the
-- `club-join` workflow, reading a list out of a repository secret. That is
-- inherited from the marathon this schema was built for, where the coach ran a
-- closed cohort and typed the names in. A club has no cohort. Paying IS the
-- membership.
--
-- The visible symptom: the coach opened the club tab and got «Ты в клубе» over
-- the sales screen — `gameAccess` let him past the gate (he is entitled), and
-- then `my_marathons()` found no row for his address and returned nothing, so
-- there was no task, no board and no challenge. Everything built to the Figma
-- mockups lives inside that screen, so none of it was reachable.
--
-- Three things here, and nothing is deleted:
--
--   1. `marathons.is_club` — which row IS the club. One at a time.
--   2. `days` may exceed 100, so the club does not end.
--   3. `club_access()` and `join_club()` — the gate, in the database.
--
-- **The gate is re-implemented server-side on purpose.** `gameAccess` (the
-- TypeScript) decides whether to *draw* the tab; it cannot decide who gets a row
-- in `marathon_members`, because it runs on the customer's phone. An RPC that
-- took the client's word for it would be a paywall anyone signed in could walk
-- through by calling it directly. So `club_access()` reads the same two facts
-- from the tables — a live subscription, or a course activated inside the trial
-- window — and the two definitions have to be kept in step. `GAME_TRIAL_DAYS`
-- in src/app/features/marathon/gameAccess.ts is the other half of this rule.
--
-- ## Calendar weeks without touching the scoring
--
-- The owner asked for the leaderboard to reset on calendar weeks. It already
-- resets every seven days — `marathon_week_of(day)` is `((day - 1) / 7) + 1`,
-- counted from `starts_on` — so the whole of "calendar weeks" is **starting the
-- club on a Monday**. Then day 1 is a Monday, days 1..7 are one calendar week,
-- and every bucket after it is too.
--
-- That is deliberately not a rewrite of `marathon_week_of`. Every point the club
-- has ever scored is derived through it (`marathon_scores` filters the week's
-- tasks with it, and points are computed rather than stored), so changing it
-- rewrites history for everyone. A Monday start gives the identical result for
-- the price of a date.
--
-- Requires 0011_marathon.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Which marathon is the club.
--
-- A flag rather than a magic slug: `join_club()` has to find it from inside the
-- database, and a string constant compiled into a function is the kind of thing
-- that survives a rename of the row it points at and then silently matches
-- nothing.
--
-- The partial unique index is the whole guard. Two clubs would mean a member
-- joined to one of them and scored on the other, and the failure would look like
-- an empty board rather than like a duplicate.
-- -----------------------------------------------------------------------------
alter table public.marathons
  add column if not exists is_club boolean not null default false;

comment on column public.marathons.is_club is
  'The one continuous club. Anyone whose subscription (or course trial) is live joins it by opening the tab; every other marathon is a closed cohort the coach fills by hand.';

create unique index if not exists marathons_one_club_idx
  on public.marathons (is_club) where is_club;

-- -----------------------------------------------------------------------------
-- 2. The club does not end.
--
-- `days` was capped at 100 with the comment "far past anything a daily-proof
-- format survives; it is a guard rail, not a target" — true of a marathon, and
-- exactly wrong for a club that runs for as long as people pay. Past `days` the
-- day counter stops (`my_marathons` takes `least(day_index, days)`), so a club
-- on 7 days would sit on day 7 for ever, repeating day 7's task.
--
-- The guard rail stays, ten years out. A number this size is still a typo
-- detector; it just is not a horizon any more.
-- -----------------------------------------------------------------------------
alter table public.marathons drop constraint if exists marathons_days_check;
alter table public.marathons add constraint marathons_days_check
  check (days between 1 and 3700);

-- -----------------------------------------------------------------------------
-- 3a. club_access — may the caller be in the club right now?
--
-- The same two grounds the app draws the tab on, read from the tables:
--
--   • a live subscription — `subscription_live()` is already the one definition
--     of that, and a cancelled subscription stays live until the period it paid
--     for runs out;
--   • a course activated within the trial window — `purchases.activated_at` is
--     stamped when the coach confirms the payment, so a refunded course takes
--     its trial with it and no second table can drift out of step.
--
-- Admins always pass: the coach has to be able to open the club he runs without
-- buying his own subscription, and he is the reason this bug was reported.
-- -----------------------------------------------------------------------------
create or replace function public.club_access()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.email = public.current_email()
        and public.subscription_live(s.status, s.expires_at)
    )
    or exists (
      select 1 from public.purchases p
      where p.email = public.current_email()
        and p.status = 'active'
        and p.activated_at is not null
        -- 7 days, matching GAME_TRIAL_DAYS in gameAccess.ts. The two are one rule
        -- in two places; change them together.
        and p.activated_at > now() - interval '7 days'
    );
$$;

revoke execute on function public.club_access() from public, anon;
grant execute on function public.club_access() to authenticated;

comment on function public.club_access() is
  'Server-side twin of gameAccess(): a live subscription, a course inside its 7-day trial, or an admin.';

-- -----------------------------------------------------------------------------
-- 3b. join_club — put the caller in the club, if they are entitled to be.
--
-- Idempotent, and safe to call on every open of the tab: it either does nothing
-- or reactivates a row. Returns the club's id so the caller can tell "you are in"
-- from "there is no club" without a second round trip.
--
-- `team_id` is null and stays null. The club is `team_size = 1` — «каждый сам за
-- себя» — and `marathon_members_check_team` refuses a member pointing at a team
-- in that mode, so a row carrying one would not insert at all.
--
-- `display_name` is left null on purpose: the board then reads the name off the
-- person's own profile, which is the name they chose for themselves.
--
-- A member the coach removed by hand is **not** silently let back in. `status`
-- is only lifted back to 'active' for a row this function could have written —
-- one with no note and no display name the coach set. Anything he touched is his
-- decision, and a self-join that undoes a removal would be the product arguing
-- with its own admin.
-- -----------------------------------------------------------------------------
create or replace function public.join_club()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_club  uuid;
  v_email citext := public.current_email();
begin
  if v_email is null or not public.club_access() then
    return null;
  end if;

  select id into v_club
  from public.marathons
  where is_club and status = 'active'
  limit 1;

  if v_club is null then
    return null;
  end if;

  insert into public.marathon_members (marathon_id, email, team_id, status)
  values (v_club, v_email, null, 'active')
  on conflict (marathon_id, email) do update
    set status = case
      when public.marathon_members.status = 'removed'
       and public.marathon_members.note is null
       and public.marathon_members.display_name is null
      then 'active'
      else public.marathon_members.status
    end
  returning marathon_id into v_club;

  return v_club;
end;
$$;

revoke execute on function public.join_club() from public, anon;
grant execute on function public.join_club() to authenticated;

comment on function public.join_club() is
  'Self-join the club on the strength of a live subscription or a course trial. Idempotent; returns the club id, or null when there is no club or no entitlement.';

-- -----------------------------------------------------------------------------
-- 4. The club itself.
--
-- A row of its own rather than promoting `klub_test`, and that is the whole
-- reason it is here: the test week is seeded with seven fictional members on
-- `@example.test`, and promoting it would put them on the leaderboard of every
-- paying member. The test week is left exactly as it is — still running, still
-- the owner's to play with, archived by hand whenever she is done with it.
--
-- `starts_on` is **this week's Monday**, which is the entire implementation of
-- "the leaderboard resets on calendar weeks": `marathon_week_of` buckets seven
-- days from the start, so a Monday start makes every bucket a Monday-to-Sunday
-- week. `date_trunc('week', …)` is ISO — Monday — in every locale, unlike
-- `extract(dow …)`, which counts from Sunday.
--
-- Ten years of `days`, so the club does not end. No tasks: the coach writes the
-- day's task in the admin, and a club seeded with invented ones would be putting
-- words in his mouth on a screen members pay to read.
--
-- Idempotent on the slug, and it deliberately does **not** rewrite `starts_on`
-- on a re-run. Moving the start would shift every task's day index and rewrite
-- which week every point was earned in.
-- -----------------------------------------------------------------------------
insert into public.marathons (
  slug, title, description, status, starts_on, days, team_size, timezone, due_time, prize, is_club
)
values (
  'club',
  'Клуб маленьких шагов',
  'Одно небольшое задание в день и общая таблица. Каждую неделю таблица начинается заново.',
  'active',
  date_trunc('week', current_date)::date,
  3650,
  1,                      -- каждый сам за себя
  'Europe/Moscow',
  '22:00',
  'Час с тренером и создателем Forma',
  true
)
on conflict (slug) do update set
  status   = 'active',
  days     = greatest(public.marathons.days, 3650),
  is_club  = true;

-- -----------------------------------------------------------------------------
-- 5. my_marathons carries is_club.
--
-- Two marathons can be running at once — the club, and a closed round the coach
-- is putting people into by hand — and the app has to know which is which. It
-- used to take "the first active one", ordered by start date, which would hand a
-- member the test week simply because it started later.
--
-- Same body as 0011 with one column added; replacing the function is the only
-- way Postgres allows a change to its return type, so the drop is required and
-- carries no data.
-- -----------------------------------------------------------------------------
drop function if exists public.my_marathons();

create or replace function public.my_marathons()
returns table (
  id          uuid,
  slug        text,
  title       text,
  description text,
  status      text,
  starts_on   date,
  days        int,
  team_size   int,
  prize       text,
  day_index   int,
  week        int,
  total_weeks int,
  member_id   uuid,
  team_id     uuid,
  team_name   text,
  is_club     boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    m.id, m.slug, m.title, m.description, m.status, m.starts_on, m.days, m.team_size, m.prize,
    least(public.marathon_day_index(m.id), m.days) as day_index,
    public.marathon_week_of(least(public.marathon_day_index(m.id), m.days)) as week,
    public.marathon_week_of(m.days) as total_weeks,
    mem.id, mem.team_id, t.name, m.is_club
  from public.marathons m
  join public.marathon_members mem
    on mem.marathon_id = m.id
   and mem.status = 'active'
   and mem.email = public.current_email()
  left join public.marathon_teams t on t.id = mem.team_id
  where m.status in ('active', 'finished')
  order by m.is_club desc, m.starts_on desc;
$$;

revoke execute on function public.my_marathons() from public, anon;
grant execute on function public.my_marathons() to authenticated;
