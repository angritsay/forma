-- =============================================================================
-- 0063 — where people come from, and what the money does month by month.
--
-- Owner: the business has to be readable by the person running ads, by creators and by an
-- investor: what one paying person costs per channel, what comes in each month, how many members
-- pay right now and how many stop. Until now the admin answered none of it:
--
--   * **The source died in the browser.** The site and the app both remember the first touch
--     (`forma.src`: `utm_source-utm_campaign`, `?src=`, or the landing page), but only the site's
--     order form ever sent it anywhere. The app's unlock sheet sent `'app'`, a club payment in the
--     app sends nothing at all (it is a till link, matched by amount), and the profile had no
--     column for it. A person found by an ad and paying in the app looked exactly like a person
--     who typed the address.
--   * **Money had a ledger and no report.** `payments` (0020) keeps every payment with its amount,
--     currency (0043) and intent (0039), but the analytics screen (0025) counts people, never
--     roubles.
--
-- ## What changes
--
--   1. `profiles.first_source` — the first-touch label, written once by the person's own app
--      through `set_my_first_source()` and never overwritten (first touch is the channel that
--      found them; later ones are the way back). Same shape the site and the app already use:
--      `^[a-z0-9_-]{1,40}$`.
--   2. `admin_money_months(p_months)` — payments per month × currency × intent, with how many of
--      them were the payer's first payment ever. Revenue, its mix, and new payers.
--   3. `admin_members_months(p_months)` — paying club members at each month's end, monthly vs
--      annual, their monthly recurring revenue, and how many who paid at the previous month's
--      end no longer do. Built from plan **payments**, not from `subscriptions`: that table keeps
--      one row per address with only the current period, and it also holds the coach's free
--      grants, which are not revenue.
--   4. `admin_sources(p_days)` — per channel, for the people who signed up in the last `p_days`:
--      how many signed up, trained, paid, and what they paid. A referred person is `referral`
--      whatever page they landed on: the friend found them, not the page.
--
-- ## Rules shared by the three reports
--
--   * The payer is `coalesce(bound_email, email)`: an admin who bound a payment to the right
--     person (0044) moved its money to that person.
--   * A payment the owner dismissed (`resolution = 'dismissed'`, 0044) is not money: that is how
--     a test payment or a duplicate is taken out of the books.
--   * Refunds are not subtracted. `record_payment_reversal()` (0057) tells the owner and changes no
--     row; dismissing the refunded payment is how it leaves the report.
--   * Currencies are never added together. Prodamus rows written before 0043 carry no currency
--     and are roubles (Prodamus takes nothing else); a null currency on a lava.top row cannot be
--     told apart and is reported as `???`.
--   * Months are Moscow calendar months, like the funnel's weeks (0025).
--   * A monthly payment covers one month, an annual one a year (`subscription_period`, 0005).
--
-- All admin-only through `is_admin()`; none of the reports writes.
-- Requires 0005, 0020, 0025, 0038, 0039, 0043, 0044, 0051. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The first touch on the profile.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists first_source text;

alter table public.profiles drop constraint if exists profiles_first_source_shape;
alter table public.profiles add constraint profiles_first_source_shape
  check (first_source is null or first_source ~ '^[a-z0-9_-]{1,40}$');

comment on column public.profiles.first_source is
  'First-touch channel (utm_source-utm_campaign, ?src=, or the landing page), written once by set_my_first_source() (0063).';

-- The profile's own row is writable by its owner (0001), so a direct update would also work — but
-- it would also let the label change on every visit. The function is the only writer and it
-- writes once.
create or replace function public.set_my_first_source(p_source text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_src text := btrim(coalesce(p_source, ''));
  v_n   int;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  -- Not our shape: nothing written, and no error either — a label is not worth a failed launch.
  if v_src !~ '^[a-z0-9_-]{1,40}$' then
    return false;
  end if;
  update public.profiles
     set first_source = v_src
   where id = auth.uid()
     and first_source is null;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

comment on function public.set_my_first_source(text) is
  'Writes the caller''s first-touch channel once; later calls change nothing (0063).';

revoke execute on function public.set_my_first_source(text) from public, anon;
grant execute on function public.set_my_first_source(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. The money a report may count.
--
-- One place for the rules above, so the three reports cannot drift apart on what a payment is.
-- -----------------------------------------------------------------------------
create or replace function public.money_payments()
returns table (
  id       uuid,
  payer    citext,
  amount   numeric,
  currency text,
  intent   text,
  paid_at  timestamptz,
  claimed_by uuid
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    p.id,
    coalesce(p.bound_email, p.email) as payer,
    p.amount,
    coalesce(
      p.currency,
      case when coalesce(p.provider, 'prodamus') = 'prodamus' then 'RUB' else '???' end
    ) as currency,
    p.intent,
    p.paid_at,
    p.claimed_by
  from public.payments p
  where p.amount is not null
    and p.amount > 0
    and p.resolution is distinct from 'dismissed';
$$;

comment on function public.money_payments() is
  'The payments a money report counts: payer after binding, currency filled in, dismissed ones out (0063). Internal.';

-- Internal: only the admin reports below call it (they run as definer). Nobody else gets it.
revoke execute on function public.money_payments() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. admin_money_months — what came in, month by month.
-- -----------------------------------------------------------------------------
create or replace function public.admin_money_months(p_months int default 12)
returns table (
  month          date,
  currency       text,
  intent         text,
  payments       int,
  amount         numeric,
  first_payments int
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_months int := least(greatest(coalesce(p_months, 12), 1), 60);
  v_from   timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  v_from := (date_trunc('month', now() at time zone 'Europe/Moscow')
             - make_interval(months => v_months - 1)) at time zone 'Europe/Moscow';

  return query
  with mp as (
    select m.*,
           -- The payer's first payment ever, over the whole ledger and not only the window: a
           -- person who first paid last year is not a new payer this month.
           row_number() over (partition by m.payer order by m.paid_at, m.id) = 1 as is_first
    from public.money_payments() m
  )
  select
    date_trunc('month', mp.paid_at at time zone 'Europe/Moscow')::date,
    mp.currency,
    mp.intent,
    count(*)::int,
    sum(mp.amount),
    count(*) filter (where mp.is_first)::int
  from mp
  where mp.paid_at >= v_from
  group by 1, 2, 3
  order by 1 desc, 2, 3;
end;
$$;

comment on function public.admin_money_months(int) is
  'Admin-only: payments per Moscow month × currency × intent, with first-ever payments counted (0063).';

revoke execute on function public.admin_money_months(int) from public, anon;
grant execute on function public.admin_money_months(int) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. admin_members_months — who pays for the club at each month's end.
--
-- A member at a moment is a payer with a plan payment whose period covers that moment. The period
-- runs from the payment, not from the old expiry: an early renewal then overlaps its predecessor
-- for a few days, which counts the person once (it is per payer) and costs nothing in accuracy at
-- a month's end. The current month is measured at `now()`, since its end has not happened yet.
--
-- `lost` are payers covered at the previous measure and not at this one. A member who skipped a
-- month and came back is lost once and won back once — which is what happened to the money.
-- -----------------------------------------------------------------------------
create or replace function public.admin_members_months(p_months int default 12)
returns table (
  month    date,
  currency text,
  members  int,
  monthly  int,
  annual   int,
  mrr      numeric,
  lost     int
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_months int := least(greatest(coalesce(p_months, 12), 1), 60);
  v_this   date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with months as (
    -- One more month than asked: the oldest month's `lost` needs the month before it.
    select g::date as m
    from generate_series(v_this - make_interval(months => v_months), v_this, interval '1 month') g
  ),
  at as (
    select
      months.m,
      least(((months.m + interval '1 month') at time zone 'Europe/Moscow'), now()) as t
    from months
  ),
  plan_pay as (
    select mp.payer, mp.amount, mp.currency, mp.intent, mp.paid_at,
           mp.paid_at + public.subscription_period(mp.intent) as ends_at
    from public.money_payments() mp
    where mp.intent in ('monthly', 'annual')
  ),
  covered as (
    -- At each measure, the latest plan payment of each payer that covers it.
    select distinct on (at.m, pp.payer)
      at.m, pp.payer, pp.currency, pp.intent, pp.amount
    from at
    join plan_pay pp on pp.paid_at <= at.t and pp.ends_at > at.t
    order by at.m, pp.payer, pp.paid_at desc
  ),
  per_month as (
    select
      c.m,
      c.currency,
      count(*)::int as members,
      count(*) filter (where c.intent = 'monthly')::int as monthly,
      count(*) filter (where c.intent = 'annual')::int as annual,
      sum(case when c.intent = 'annual' then c.amount / 12 else c.amount end) as mrr
    from covered c
    group by c.m, c.currency
  ),
  lost as (
    select cur.m, prev.currency, count(*)::int as lost
    from at cur
    join covered prev on prev.m = (cur.m - interval '1 month')::date
    where not exists (
      select 1 from covered now_c where now_c.m = cur.m and now_c.payer = prev.payer
    )
    group by cur.m, prev.currency
  )
  select
    k.m,
    k.currency,
    coalesce(pm.members, 0),
    coalesce(pm.monthly, 0),
    coalesce(pm.annual, 0),
    round(coalesce(pm.mrr, 0), 2),
    coalesce(l.lost, 0)
  from (
    select pm2.m, pm2.currency from per_month pm2
    union
    select l2.m, l2.currency from lost l2
  ) k
  left join per_month pm on pm.m = k.m and pm.currency = k.currency
  left join lost l on l.m = k.m and l.currency = k.currency
  where k.m > v_this - make_interval(months => v_months)
  order by k.m desc, k.currency;
end;
$$;

comment on function public.admin_members_months(int) is
  'Admin-only: paying club members at each Moscow month''s end (now for the current month), monthly/annual, MRR and members lost since the previous month (0063).';

revoke execute on function public.admin_members_months(int) from public, anon;
grant execute on function public.admin_members_months(int) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. admin_sources — which channel brings people who pay.
--
-- A cohort report like the funnel (0025): the people who signed up in the last `p_days`, each in
-- exactly one channel, and their payments whenever they happened. A person's payments are the
-- ones paid from their address, bound to it, or claimed by them (0020).
-- -----------------------------------------------------------------------------
create or replace function public.admin_sources(p_days int default 90)
returns table (
  source   text,
  people   int,
  trained  int,
  paid     int,
  currency text,
  amount   numeric
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_days int := least(greatest(coalesce(p_days, 90), 1), 730);
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with cohort as (
    select
      p.id,
      p.email,
      case
        when exists (select 1 from public.referrals r where r.referred_email = p.email)
          then 'referral'
        else coalesce(p.first_source, 'unknown')
      end as src,
      exists (
        select 1 from public.workout_sessions ws
        where ws.user_id = p.id and ws.completed_at is not null
      ) as did_train
    from public.profiles p
    where p.created_at > now() - make_interval(days => v_days)
  ),
  money as (
    select c.id, mp.currency, sum(mp.amount) as amount
    from cohort c
    join public.money_payments() mp
      on mp.payer = c.email or mp.claimed_by = c.id
    group by c.id, mp.currency
  ),
  per_source as (
    select
      c.src,
      count(*)::int as people,
      count(*) filter (where c.did_train)::int as trained,
      count(*) filter (where exists (select 1 from money m where m.id = c.id))::int as paid
    from cohort c
    group by c.src
  )
  -- One row per channel and currency; a channel nobody paid in yet still gets its row.
  select ps.src, ps.people, ps.trained, ps.paid, m.currency, coalesce(sum(m.amount), 0)
  from per_source ps
  left join cohort c on c.src = ps.src
  left join money m on m.id = c.id
  group by ps.src, ps.people, ps.trained, ps.paid, m.currency
  having m.currency is not null
      or not exists (
        select 1 from cohort c2 join money m2 on m2.id = c2.id where c2.src = ps.src
      )
  order by ps.people desc, ps.src, m.currency;
end;
$$;

comment on function public.admin_sources(int) is
  'Admin-only: per first-touch channel (referral wins), the people who signed up in the last p_days — signed up, trained, paid, and their payments per currency (0063).';

revoke execute on function public.admin_sources(int) from public, anon;
grant execute on function public.admin_sources(int) to authenticated;
