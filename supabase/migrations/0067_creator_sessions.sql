-- =============================================================================
-- 0067 — creator sessions and tier history: a creator's 1:1 hours count in their statement, and
-- every month is billed by the plan it was actually on.
--
-- docs/PLATFORM.md, phase 2, steps 4 and 7. 0064 counted course sales only and used the creator's
-- current plan for every month. This migration:
--
--   1. `coaches.creator_id` — whose coach this is. Null is Forma's own (Sergey, Nastia), like every
--      coach before 0067. The owner sets it in «Авторы» (`admin_assign_coach`); the list of coaches
--      with their creator comes from `admin_creator_coaches()`.
--   2. Session money per creator. A session payment reaches its coach through the booking it paid
--      for: `coach_bookings.payment_id` (0055) is written by `apply_session_payment` when the
--      webhook confirms a hold, and by the owner's `admin_book_for_payment` (0056/0058), which also
--      sets the payment's intent to `session`. It is unique per payment (`coach_bookings_payment_idx`),
--      so a payment counts once. The chain is payment → booking (payment_id) → coach (coach_id) →
--      creator (creator_id). A payment with no booking (unmatched, waiting for the owner) counts
--      nowhere until it is bound; a cancelled booking keeps its payment and still counts — there are
--      no refunds (0055), and a refund by hand is a dismissed payment, which `money_payments()`
--      (0063) leaves out.
--   3. `creator_statement` returns `session_sales` and `session_gross` next to the course sales, and
--      folds them into `forma_share` / `creator_share` / `balance` at the plan's `sessions_share`
--      (Start 10%, Pro 5%, `creator_terms`). The direction of the money is the plan's, as for
--      courses: on Start Forma owes the creator their part; on Pro the creator owes Forma its share.
--   4. `creator_tier_changes(creator_id, tier, from_month)` — the plan history. `admin_set_creator`
--      takes an optional `p_from_month`; a plan change is effective from the current Moscow month
--      unless the owner passes another one (not in the future). A change from month M replaces any
--      later rows (the new plan is the current one from M on), and the plan before it is put on
--      record from the creator's start if it was not yet. The statement takes each month's plan
--      from the latest row at or before it (before the first row: the first row's plan; no rows at
--      all: the current plan), and charges Pro's monthly fee only in Pro months. Existing creators
--      get one row at their `approved_at` month with their current plan.
--   5. `creator_invoices.session_sales` / `session_gross` (default 0 for the invoices already
--      written), filled by `close_creator_month`; the invoice's `tier` is now the month's plan.
--
-- Return types change, so `creator_statement` and the functions that pass its rows or an
-- invoice's columns through (`my_creator_statement`, `admin_creator_statement`,
-- `my_creator_invoices`, `admin_creator_invoices`) are dropped and created again;
-- `admin_set_creator` gains an argument, so its four-argument form is dropped.
-- `creator_terms` is not touched (`content/site/creatorTerms.test.ts` reads it out of 0064).
--
-- ## What is still not here
--
--   * The club per creator (phase 2, step 3): statements still leave club money out, and say so.
--   * The processor's fee (`fee_pct`) has no history: every month uses the current one.
--   * A month that straddles a plan change is billed by the plan in force from that month's 1st
--     — a change is effective per whole month, not per day.
--
-- Requires 0055, 0056, 0058, 0063, 0064. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Coaches belong to creators.
-- -----------------------------------------------------------------------------
alter table public.coaches
  add column if not exists creator_id uuid references public.creators (id) on delete set null;

create index if not exists coaches_creator_idx on public.coaches (creator_id);

comment on column public.coaches.creator_id is
  'The creator this coach works for (0067); null is Forma''s own coach. Set by admin_assign_coach.';

-- A coach to a creator, or back to Forma (null).
create or replace function public.admin_assign_coach(p_coach text, p_creator uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_creator is not null and not exists (
    select 1 from public.creators where id = p_creator and not house
  ) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  update public.coaches set creator_id = p_creator where id = p_coach;
  if not found then
    raise exception 'coach_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_assign_coach(text, uuid) from public, anon;
grant execute on function public.admin_assign_coach(text, uuid) to authenticated;

-- Every coach with whose they are, for «Авторы». The private columns stay in admin_coaches().
create or replace function public.admin_creator_coaches()
returns table (id text, name text, name_en text, active boolean, creator_id uuid)
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
  select c.id, c.name, c.name_en, c.active, c.creator_id
  from public.coaches c
  order by c.sort_order, c.id;
end;
$$;

revoke execute on function public.admin_creator_coaches() from public, anon;
grant execute on function public.admin_creator_coaches() to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Plan history.
-- -----------------------------------------------------------------------------
create table if not exists public.creator_tier_changes (
  creator_id uuid not null references public.creators (id) on delete cascade,
  tier       text not null check (tier in ('start', 'pro')),
  -- The first Moscow month the plan applies to.
  from_month date not null check (from_month = date_trunc('month', from_month)::date),
  created_at timestamptz not null default now(),
  primary key (creator_id, from_month)
);

comment on table public.creator_tier_changes is
  'A creator''s plan history, one row per month a plan starts (0067). Written by admin_set_creator. RPC-only.';

alter table public.creator_tier_changes enable row level security;
-- No policies: read through creator_statement(), written by admin_set_creator().

-- Existing creators: their current plan from the month they were opened.
insert into public.creator_tier_changes (creator_id, tier, from_month)
select c.id, c.tier, date_trunc('month', c.approved_at at time zone 'Europe/Moscow')::date
from public.creators c
where not c.house
  and c.approved_at is not null
  and not exists (select 1 from public.creator_tier_changes t where t.creator_id = c.id)
on conflict (creator_id, from_month) do nothing;

-- The plan a creator was on in a month.
create or replace function public.creator_tier_at(p_creator uuid, p_month date)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(
    (select t.tier from public.creator_tier_changes t
     where t.creator_id = p_creator and t.from_month <= p_month
     order by t.from_month desc limit 1),
    (select t.tier from public.creator_tier_changes t
     where t.creator_id = p_creator
     order by t.from_month limit 1),
    (select c.tier from public.creators c where c.id = p_creator)
  )
$$;

comment on function public.creator_tier_at(uuid, date) is
  'Internal: the plan in force for a creator in a Moscow month (0067).';

revoke execute on function public.creator_tier_at(uuid, date) from public, anon, authenticated;

drop function if exists public.admin_set_creator(uuid, text, text, numeric);

create or replace function public.admin_set_creator(
  p_id         uuid,
  p_status     text default null,
  p_tier       text default null,
  p_fee_pct    numeric default null,
  p_from_month date default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_c     public.creators;
  v_this  date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
  v_from  date;
  v_start date;
  v_base  date;
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
  v_from := date_trunc('month', coalesce(p_from_month, v_this))::date;
  if v_from > v_this then
    raise exception 'invalid_month' using errcode = 'P0001';
  end if;

  if p_tier is not null and p_tier <> v_c.tier then
    v_start := date_trunc('month', coalesce(v_c.approved_at, v_c.created_at) at time zone 'Europe/Moscow')::date;
    v_base  := least(v_start, v_from);
    -- The plan before this change, on record from the creator's start.
    if not exists (select 1 from public.creator_tier_changes t where t.creator_id = p_id) then
      insert into public.creator_tier_changes (creator_id, tier, from_month)
      values (p_id, v_c.tier, v_base);
    else
      update public.creator_tier_changes t
         set from_month = v_base
       where t.creator_id = p_id
         and t.from_month > v_base
         and t.from_month = (select min(x.from_month) from public.creator_tier_changes x
                             where x.creator_id = p_id);
    end if;
    -- From v_from on the new plan is the current one: later rows no longer hold.
    delete from public.creator_tier_changes t where t.creator_id = p_id and t.from_month > v_from;
    insert into public.creator_tier_changes (creator_id, tier, from_month)
    values (p_id, p_tier, v_from)
    on conflict (creator_id, from_month) do update set tier = excluded.tier, created_at = now();
  end if;

  update public.creators
     set status      = coalesce(p_status, status),
         tier        = coalesce(p_tier, tier),
         fee_pct     = coalesce(p_fee_pct, fee_pct),
         -- The first opening starts the statements; pausing and reopening keeps that date.
         approved_at = case when coalesce(p_status, status) = 'active' and approved_at is null
                            then now() else approved_at end,
         updated_at  = now()
   where id = p_id;
end;
$$;

comment on function public.admin_set_creator(uuid, text, text, numeric, date) is
  'Owner: status, plan (from a Moscow month, default the current one), processor fee (0064, 0067).';

revoke execute on function public.admin_set_creator(uuid, text, text, numeric, date) from public, anon;
grant execute on function public.admin_set_creator(uuid, text, text, numeric, date) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. The statement: course sales and sessions, each month by its own plan.
-- -----------------------------------------------------------------------------
drop function if exists public.my_creator_statement(int);
drop function if exists public.admin_creator_statement(uuid, int);
drop function if exists public.creator_statement(uuid, int);

create function public.creator_statement(p_creator uuid, p_months int default 12)
returns table (
  month         date,
  currency      text,
  tier          text,
  fee_pct       numeric,
  sales         int,
  gross         numeric,
  session_sales int,
  session_gross numeric,
  forma_share   numeric,
  creator_share numeric,
  monthly_fee   numeric,
  -- Positive: the creator owes Forma (Pro). Negative: Forma owes the creator (Start).
  balance       numeric
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
#variable_conflict use_column
declare
  v_c      public.creators;
  v_months int := least(greatest(coalesce(p_months, 12), 1), 60);
  v_this   date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
  v_first  date;
  v_open   boolean;
begin
  select * into v_c from public.creators c where c.id = p_creator;
  if not found or v_c.house then
    return;
  end if;
  v_open := v_c.status in ('active', 'paused');

  v_first := greatest(
    v_this - make_interval(months => v_months - 1),
    date_trunc('month', coalesce(v_c.approved_at, v_c.created_at) at time zone 'Europe/Moscow')::date
  );

  return query
  with months as (
    select g::date as m, public.creator_tier_at(v_c.id, g::date) as t
    from generate_series(v_first, v_this, interval '1 month') g
  ),
  course_sales as (
    select
      date_trunc('month', mp.paid_at at time zone 'Europe/Moscow')::date as m,
      mp.currency as cur,
      count(*)::int as n,
      sum(mp.amount) as g
    from public.money_payments() mp
    join public.payments p on p.id = mp.id
    where mp.intent = 'course'
      and p.provider_ref is not null
      and exists (
        select 1
        from public.purchases pu
        join public.admin_courses ac on ac.slug_id = pu.course_id
        where pu.provider_ref = p.provider_ref
          and ac.creator_id = v_c.id
      )
      and mp.paid_at >= (v_first::timestamp at time zone 'Europe/Moscow')
    group by 1, 2
  ),
  -- payment → booking (payment_id, unique) → coach → creator. See the header.
  session_paid as (
    select
      date_trunc('month', mp.paid_at at time zone 'Europe/Moscow')::date as m,
      mp.currency as cur,
      count(*)::int as n,
      sum(mp.amount) as g
    from public.money_payments() mp
    join public.coach_bookings b on b.payment_id = mp.id
    join public.coaches co on co.id = b.coach_id
    where mp.intent = 'session'
      and co.creator_id = v_c.id
      and mp.paid_at >= (v_first::timestamp at time zone 'Europe/Moscow')
    group by 1, 2
  ),
  keys as (
    select s.m, s.cur from course_sales s
    union
    select s.m, s.cur from session_paid s
    -- Pro's fee is a rouble line in every Pro month the creator was open, sold or not.
    union
    select mo.m, 'RUB' from months mo where mo.t = 'pro' and v_open
  ),
  rows_ as (
    select
      k.m,
      k.cur,
      mo.t,
      coalesce(cs.n, 0) as cn,
      coalesce(cs.g, 0) as cg,
      coalesce(ss.n, 0) as sn,
      coalesce(ss.g, 0) as sg,
      tt.sales_share,
      tt.sessions_share,
      case when k.cur = 'RUB' and mo.t = 'pro' and v_open then tt.fee_rub else 0 end as fee,
      (1 - v_c.fee_pct / 100) as net
    from keys k
    join months mo on mo.m = k.m
    left join course_sales cs on cs.m = k.m and cs.cur = k.cur
    left join session_paid ss on ss.m = k.m and ss.cur = k.cur
    cross join lateral public.creator_terms(mo.t) tt
  ),
  shares as (
    select
      r.*,
      round(r.cg * r.net * r.sales_share + r.sg * r.net * r.sessions_share, 2) as f_share,
      round(r.cg * r.net * (1 - r.sales_share) + r.sg * r.net * (1 - r.sessions_share), 2) as c_share
    from rows_ r
  )
  select
    s.m,
    s.cur,
    s.t,
    v_c.fee_pct,
    s.cn,
    s.cg,
    s.sn,
    s.sg,
    s.f_share,
    s.c_share,
    s.fee,
    case when s.t = 'start' then -s.c_share else s.f_share + s.fee end
  from shares s
  order by s.m desc, s.cur;
end;
$$;

comment on function public.creator_statement(uuid, int) is
  'Internal: a creator''s course and session sales per Moscow month and currency, by that month''s plan: the shares, Pro''s fee and the balance (0064, 0067).';

revoke execute on function public.creator_statement(uuid, int) from public, anon, authenticated;

create function public.my_creator_statement(p_months int default 12)
returns table (
  month date, currency text, tier text, fee_pct numeric, sales int, gross numeric,
  session_sales int, session_gross numeric,
  forma_share numeric, creator_share numeric, monthly_fee numeric, balance numeric
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_id uuid;
begin
  select c.id into v_id from public.creators c
  where c.owner_email = public.current_email() and public.current_email() is not null;
  if v_id is null then
    raise exception 'not_creator' using errcode = 'P0001';
  end if;
  return query select * from public.creator_statement(v_id, p_months);
end;
$$;

revoke execute on function public.my_creator_statement(int) from public, anon;
grant execute on function public.my_creator_statement(int) to authenticated;

create function public.admin_creator_statement(p_id uuid, p_months int default 12)
returns table (
  month date, currency text, tier text, fee_pct numeric, sales int, gross numeric,
  session_sales int, session_gross numeric,
  forma_share numeric, creator_share numeric, monthly_fee numeric, balance numeric
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
  return query select * from public.creator_statement(p_id, p_months);
end;
$$;

revoke execute on function public.admin_creator_statement(uuid, int) from public, anon;
grant execute on function public.admin_creator_statement(uuid, int) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Invoices carry the sessions.
-- -----------------------------------------------------------------------------
alter table public.creator_invoices
  add column if not exists session_sales int not null default 0;
alter table public.creator_invoices
  add column if not exists session_gross numeric(14, 2) not null default 0;

create or replace function public.close_creator_month(p_month date default null)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_this  date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
  v_month date := date_trunc('month', coalesce(p_month, v_this - interval '1 month'))::date;
  v_n     int  := 0;
  v_add   int;
  v_c     public.creators;
begin
  if v_month >= v_this then
    raise exception 'month_not_over' using errcode = 'P0001';
  end if;

  for v_c in
    select * from public.creators
    where not house and status in ('active', 'paused')
      and date_trunc('month', approved_at at time zone 'Europe/Moscow')::date <= v_month
  loop
    insert into public.creator_invoices (
      number, creator_id, month, currency, tier, fee_pct, sales, gross,
      session_sales, session_gross, forma_share, creator_share, monthly_fee, balance
    )
    select
      format('F-%s-%s-%s', to_char(s.month, 'YYYYMM'), v_c.slug, s.currency),
      v_c.id, s.month, s.currency, s.tier, s.fee_pct, s.sales, s.gross,
      s.session_sales, s.session_gross, s.forma_share, s.creator_share, s.monthly_fee, s.balance
    from public.creator_statement(v_c.id, 60) s
    where s.month = v_month
      and (s.sales > 0 or s.session_sales > 0 or s.monthly_fee > 0)
    on conflict (creator_id, month, currency) do nothing;
    get diagnostics v_add = row_count;
    v_n := v_n + v_add;
  end loop;
  return v_n;
end;
$$;

revoke execute on function public.close_creator_month(date) from public, anon, authenticated;
grant execute on function public.close_creator_month(date) to service_role;

drop function if exists public.my_creator_invoices();

create function public.my_creator_invoices()
returns table (
  id uuid, number text, month date, currency text, tier text, sales int, gross numeric,
  session_sales int, session_gross numeric,
  forma_share numeric, creator_share numeric, monthly_fee numeric, balance numeric,
  settled_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select i.id, i.number, i.month, i.currency, i.tier, i.sales, i.gross,
         i.session_sales, i.session_gross, i.forma_share,
         i.creator_share, i.monthly_fee, i.balance, i.settled_at
  from public.creator_invoices i
  join public.creators c on c.id = i.creator_id
  where c.owner_email = public.current_email() and public.current_email() is not null
  order by i.month desc, i.currency
$$;

revoke execute on function public.my_creator_invoices() from public, anon;
grant execute on function public.my_creator_invoices() to authenticated;

drop function if exists public.admin_creator_invoices(uuid);

create function public.admin_creator_invoices(p_id uuid)
returns table (
  id uuid, number text, month date, currency text, tier text, sales int, gross numeric,
  session_sales int, session_gross numeric,
  forma_share numeric, creator_share numeric, monthly_fee numeric, balance numeric,
  settled_at timestamptz
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
  select i.id, i.number, i.month, i.currency, i.tier, i.sales, i.gross,
         i.session_sales, i.session_gross, i.forma_share,
         i.creator_share, i.monthly_fee, i.balance, i.settled_at
  from public.creator_invoices i
  where i.creator_id = p_id
  order by i.month desc, i.currency;
end;
$$;

revoke execute on function public.admin_creator_invoices(uuid) from public, anon;
grant execute on function public.admin_creator_invoices(uuid) to authenticated;
