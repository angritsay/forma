-- =============================================================================
-- 0064 — creators: an account per creator, their courses, and Forma's share counted from the
-- payments themselves, month by month, closed into an invoice.
--
-- Owner, 8 Oct 2026: creators live «both, in two tiers» — Start inside the Forma app, Pro under
-- their own brand — and pay «Free 20% → Pro» (`content/site/creatorTerms.ts`). The platform this
-- needs is described in docs/PLATFORM.md; this migration is its first phase:
--
--   1. `creators` — one row per creator: a public slug, a name, the owner's address, the tier, a
--      status. A signed-in person applies (`creator_apply`), the owner opens or declines with one
--      tap (`admin_set_creator`). Forma itself is the `house` row, which is never billed.
--   2. `admin_courses.creator_id` — whose course this is. Null is Forma's own.
--   3. `creator_terms(tier)` — the shares and the fee, in SQL, equal to `creatorTerms.ts` (a test
--      reads both and compares them).
--   4. `creator_statement(...)` — per month and currency: course sales of the creator's courses
--      (the payment ↔ purchase link is `provider_ref`, 0019), Forma's share and the creator's,
--      Pro's monthly fee, and the balance — who owes whom. Start: the money went through Forma's
--      till, so Forma owes the creator their share. Pro: the money landed in the creator's own
--      account, so the creator owes Forma its share plus the fee.
--   5. `creator_invoices` + `close_creator_month(month)` — a finished month frozen into numbered
--      rows, once (unique per creator, month, currency). Called on the 1st by
--      `.github/workflows/creator-invoices.yml`, or by the owner from «Авторы».
--
-- ## What is deliberately not here yet
--
--   * A creator editing their own courses in the builder — the builder's RPCs check `is_admin()`
--     and stay that way in this phase; the owner assigns a course to a creator.
--   * Club and session money per creator: the club is one shared club and sessions belong to
--     `coaches` (0055), so neither can be told apart per creator until each creator has their
--     own (docs/PLATFORM.md, phase 2). Statements count course sales only, and say so.
--   * Tier history: a statement uses the creator's current tier; an invoice keeps the tier it was
--     closed under.
--   * The processor's fee is a per-creator percentage the owner sets (`fee_pct`), because it is
--     the creator's own tariff on Pro and Forma's on Start. 0 until set: shares are then counted
--     on the gross, which slightly favours Forma — the statement prints the percentage it used.
--
-- Money rules are 0063's (`money_payments`): payer after binding, dismissed payments out,
-- currencies never added, Moscow months.
--
-- Requires 0008, 0019, 0020, 0063. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Creators.
-- -----------------------------------------------------------------------------
create table if not exists public.creators (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  name          text not null check (length(btrim(name)) between 2 and 60),
  -- The creator's own account. Null only for the house row (Forma itself).
  owner_email   citext unique check (owner_email is null or length(owner_email::text) <= 254),
  house         boolean not null default false,
  tier          text not null default 'start' check (tier in ('start', 'pro')),
  status        text not null default 'applied'
                check (status in ('applied', 'active', 'paused', 'declined')),
  about         text check (about is null or length(about) <= 500),
  audience_url  text check (audience_url is null or (audience_url ~ '^https://' and length(audience_url) <= 200)),
  followers     int check (followers is null or followers between 0 and 100000000),
  -- The payment processor's fee, in percent, that shares are counted after (see the header).
  fee_pct       numeric(4, 2) not null default 0 check (fee_pct between 0 and 20),
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  updated_at    timestamptz not null default now(),
  constraint creators_owner_or_house check (house or owner_email is not null)
);

comment on table public.creators is
  'One row per creator on the platform (0064). RPC-only: no client reads or writes the table.';

alter table public.creators enable row level security;
-- No policies: every read and write goes through the functions below.

insert into public.creators (slug, name, house, tier, status, approved_at)
values ('forma', 'Forma', true, 'pro', 'active', now())
on conflict (slug) do nothing;

-- Whose course it is. Null is Forma's own, like every course before 0064.
alter table public.admin_courses
  add column if not exists creator_id uuid references public.creators (id) on delete set null;

create index if not exists admin_courses_creator_idx on public.admin_courses (creator_id);
create index if not exists purchases_provider_ref_idx on public.purchases (provider_ref);

-- -----------------------------------------------------------------------------
-- 2. The terms. Equal to content/site/creatorTerms.ts — creatorTerms.test.ts reads this function
--    out of this file and compares.
-- -----------------------------------------------------------------------------
create or replace function public.creator_terms(p_tier text)
returns table (sales_share numeric, sessions_share numeric, fee_rub numeric, fee_usd numeric)
language sql
immutable
as $$
  select t.sales_share, t.sessions_share, t.fee_rub, t.fee_usd from (values
    ('start', 0.20::numeric, 0.10::numeric, 0::numeric,    0::numeric),
    ('pro',   0.10::numeric, 0.05::numeric, 4990::numeric, 59::numeric)
  ) t(tier, sales_share, sessions_share, fee_rub, fee_usd)
  where t.tier = p_tier
$$;

-- Reserved slugs: words a creator's page address must not take.
create or replace function public.creator_slug_reserved(p_slug text)
returns boolean
language sql
immutable
as $$
  select p_slug = any (array[
    'forma', 'admin', 'app', 'api', 'www', 'creators', 'creator', 'club', 'courses', 'course',
    'guides', 'exercises', 'subscribe', 'about', 'privacy', 'terms', 'refund', 'contact', 'support'
  ])
$$;

-- -----------------------------------------------------------------------------
-- 3. Applying, and the creator's own row.
-- -----------------------------------------------------------------------------
create or replace function public.creator_apply(
  p_slug         text,
  p_name         text,
  p_about        text default null,
  p_audience_url text default null,
  p_followers    int  default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_slug  text   := lower(btrim(coalesce(p_slug, '')));
  v_name  text   := btrim(coalesce(p_name, ''));
  v_about text   := nullif(btrim(coalesce(p_about, '')), '');
  v_url   text   := nullif(btrim(coalesce(p_audience_url, '')), '');
  v_row   public.creators;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' or public.creator_slug_reserved(v_slug) then
    raise exception 'invalid_slug' using errcode = 'P0001';
  end if;
  if length(v_name) not between 2 and 60 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if v_about is not null and length(v_about) > 500 then
    raise exception 'invalid_about' using errcode = 'P0001';
  end if;
  if v_url is not null and (v_url !~ '^https://' or length(v_url) > 200) then
    raise exception 'invalid_url' using errcode = 'P0001';
  end if;
  if p_followers is not null and p_followers not between 0 and 100000000 then
    raise exception 'invalid_followers' using errcode = 'P0001';
  end if;

  select * into v_row from public.creators where owner_email = v_email;

  -- An open or paused creator edits nothing here: their page is live, and the slug is its address.
  if found and v_row.status in ('active', 'paused') then
    raise exception 'already_creator' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.creators c
    where c.slug = v_slug and c.owner_email is distinct from v_email
  ) then
    raise exception 'slug_taken' using errcode = 'P0001';
  end if;

  if found then
    -- Still applying, or declined and trying again: the application is updated and goes back
    -- to «applied».
    update public.creators
       set slug = v_slug, name = v_name, about = v_about, audience_url = v_url,
           followers = p_followers, status = 'applied', updated_at = now()
     where id = v_row.id;
    return v_row.id;
  end if;

  insert into public.creators (slug, name, owner_email, about, audience_url, followers)
  values (v_slug, v_name, v_email, v_about, v_url, p_followers)
  returning id into v_row.id;
  return v_row.id;
end;
$$;

comment on function public.creator_apply(text, text, text, text, int) is
  'A signed-in person applies to be a creator, or updates a pending / declined application (0064).';

revoke execute on function public.creator_apply(text, text, text, text, int) from public, anon;
grant execute on function public.creator_apply(text, text, text, text, int) to authenticated;

-- The creator's own row, with how many courses and buyers stand behind it. Empty for everybody
-- who never applied.
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
  buyers       int
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
         )
  from public.creators c
  where c.owner_email = public.current_email()
    and public.current_email() is not null
$$;

revoke execute on function public.my_creator() from public, anon;
grant execute on function public.my_creator() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. The statement: per month and currency, what the creator's courses sold and who owes whom.
-- -----------------------------------------------------------------------------
create or replace function public.creator_statement(p_creator uuid, p_months int default 12)
returns table (
  month         date,
  currency      text,
  tier          text,
  fee_pct       numeric,
  sales         int,
  gross         numeric,
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
declare
  v_c      public.creators;
  v_terms  record;
  v_months int := least(greatest(coalesce(p_months, 12), 1), 60);
  v_this   date := date_trunc('month', now() at time zone 'Europe/Moscow')::date;
  v_first  date;
begin
  select * into v_c from public.creators where id = p_creator;
  if not found or v_c.house then
    return;
  end if;
  select * into v_terms from public.creator_terms(v_c.tier);

  v_first := greatest(
    v_this - make_interval(months => v_months - 1),
    date_trunc('month', coalesce(v_c.approved_at, v_c.created_at) at time zone 'Europe/Moscow')::date
  );

  return query
  with sales as (
    select
      date_trunc('month', mp.paid_at at time zone 'Europe/Moscow')::date as m,
      mp.currency as cur,
      count(*)::int as n,
      sum(mp.amount) as gross
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
  -- Pro's fee is a rouble line in every month the creator was open, sold or not.
  fee_months as (
    select g::date as m
    from generate_series(v_first, v_this, interval '1 month') g
    where v_c.tier = 'pro' and v_c.status in ('active', 'paused')
  ),
  rows_ as (
    select s.m, s.cur, s.n, s.gross from sales s
    union all
    select f.m, 'RUB', 0, 0 from fee_months f
    where not exists (select 1 from sales s where s.m = f.m and s.cur = 'RUB')
  )
  select
    r.m,
    r.cur,
    v_c.tier,
    v_c.fee_pct,
    r.n,
    r.gross,
    round(r.gross * (1 - v_c.fee_pct / 100) * v_terms.sales_share, 2),
    round(r.gross * (1 - v_c.fee_pct / 100) * (1 - v_terms.sales_share), 2),
    case when r.cur = 'RUB' and v_c.tier = 'pro' and v_c.status in ('active', 'paused')
         then v_terms.fee_rub else 0 end,
    case
      when v_c.tier = 'start'
        then -round(r.gross * (1 - v_c.fee_pct / 100) * (1 - v_terms.sales_share), 2)
      else round(r.gross * (1 - v_c.fee_pct / 100) * v_terms.sales_share, 2)
         + case when r.cur = 'RUB' and v_c.status in ('active', 'paused') then v_terms.fee_rub else 0 end
    end
  from rows_ r
  order by r.m desc, r.cur;
end;
$$;

comment on function public.creator_statement(uuid, int) is
  'Internal: a creator''s course sales per Moscow month and currency, the shares, Pro''s fee and the balance (0064).';

revoke execute on function public.creator_statement(uuid, int) from public, anon, authenticated;

create or replace function public.my_creator_statement(p_months int default 12)
returns table (
  month date, currency text, tier text, fee_pct numeric, sales int, gross numeric,
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

-- -----------------------------------------------------------------------------
-- 5. Invoices: a finished month, frozen.
-- -----------------------------------------------------------------------------
create table if not exists public.creator_invoices (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique,
  creator_id    uuid not null references public.creators (id) on delete cascade,
  month         date not null,
  currency      text not null check (currency ~ '^[A-Z?]{3}$'),
  tier          text not null check (tier in ('start', 'pro')),
  fee_pct       numeric(4, 2) not null,
  sales         int not null,
  gross         numeric(14, 2) not null,
  forma_share   numeric(14, 2) not null,
  creator_share numeric(14, 2) not null,
  monthly_fee   numeric(14, 2) not null,
  balance       numeric(14, 2) not null,
  created_at    timestamptz not null default now(),
  settled_at    timestamptz,
  unique (creator_id, month, currency)
);

comment on table public.creator_invoices is
  'A creator''s finished month, frozen by close_creator_month() (0064). RPC-only.';

alter table public.creator_invoices enable row level security;

-- Close one finished month for every open creator. Returns how many invoices were written; a
-- second call for the same month writes none. The current month cannot be closed: it is not over.
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
      forma_share, creator_share, monthly_fee, balance
    )
    select
      format('F-%s-%s-%s', to_char(s.month, 'YYYYMM'), v_c.slug, s.currency),
      v_c.id, s.month, s.currency, s.tier, s.fee_pct, s.sales, s.gross,
      s.forma_share, s.creator_share, s.monthly_fee, s.balance
    from public.creator_statement(v_c.id, 60) s
    where s.month = v_month
      and (s.sales > 0 or s.monthly_fee > 0)
    on conflict (creator_id, month, currency) do nothing;
    get diagnostics v_add = row_count;
    v_n := v_n + v_add;
  end loop;
  return v_n;
end;
$$;

comment on function public.close_creator_month(date) is
  'Freezes a finished Moscow month into creator_invoices for every open creator; idempotent (0064). Service role and admins.';

revoke execute on function public.close_creator_month(date) from public, anon, authenticated;
grant execute on function public.close_creator_month(date) to service_role;

create or replace function public.my_creator_invoices()
returns table (
  id uuid, number text, month date, currency text, tier text, sales int, gross numeric,
  forma_share numeric, creator_share numeric, monthly_fee numeric, balance numeric,
  settled_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select i.id, i.number, i.month, i.currency, i.tier, i.sales, i.gross, i.forma_share,
         i.creator_share, i.monthly_fee, i.balance, i.settled_at
  from public.creator_invoices i
  join public.creators c on c.id = i.creator_id
  where c.owner_email = public.current_email() and public.current_email() is not null
  order by i.month desc, i.currency
$$;

revoke execute on function public.my_creator_invoices() from public, anon;
grant execute on function public.my_creator_invoices() to authenticated;

-- -----------------------------------------------------------------------------
-- 6. The owner's side: «Авторы».
-- -----------------------------------------------------------------------------
create or replace function public.admin_creators()
returns table (
  id uuid, slug text, name text, owner_email citext, house boolean, tier text, status text,
  about text, audience_url text, followers int, fee_pct numeric, created_at timestamptz,
  approved_at timestamptz, courses int, open_balance numeric
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
         ), 0)
  from public.creators c
  order by (c.status = 'applied') desc, c.house, c.created_at desc;
end;
$$;

revoke execute on function public.admin_creators() from public, anon;
grant execute on function public.admin_creators() to authenticated;

create or replace function public.admin_set_creator(
  p_id      uuid,
  p_status  text default null,
  p_tier    text default null,
  p_fee_pct numeric default null
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

revoke execute on function public.admin_set_creator(uuid, text, text, numeric) from public, anon;
grant execute on function public.admin_set_creator(uuid, text, text, numeric) to authenticated;

-- A course to a creator, or back to Forma (null).
create or replace function public.admin_assign_course(p_course text, p_creator uuid)
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
  update public.admin_courses set creator_id = p_creator where slug_id = p_course;
  if not found then
    raise exception 'course_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_assign_course(text, uuid) from public, anon;
grant execute on function public.admin_assign_course(text, uuid) to authenticated;

create or replace function public.admin_creator_statement(p_id uuid, p_months int default 12)
returns table (
  month date, currency text, tier text, fee_pct numeric, sales int, gross numeric,
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

create or replace function public.admin_creator_invoices(p_id uuid)
returns table (
  id uuid, number text, month date, currency text, tier text, sales int, gross numeric,
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
  select i.id, i.number, i.month, i.currency, i.tier, i.sales, i.gross, i.forma_share,
         i.creator_share, i.monthly_fee, i.balance, i.settled_at
  from public.creator_invoices i
  where i.creator_id = p_id
  order by i.month desc, i.currency;
end;
$$;

revoke execute on function public.admin_creator_invoices(uuid) from public, anon;
grant execute on function public.admin_creator_invoices(uuid) to authenticated;

-- Settled (the money moved) or back to open.
create or replace function public.admin_settle_invoice(p_id uuid, p_settled boolean default true)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.creator_invoices
     set settled_at = case when p_settled then coalesce(settled_at, now()) else null end
   where id = p_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_settle_invoice(uuid, boolean) from public, anon;
grant execute on function public.admin_settle_invoice(uuid, boolean) to authenticated;

-- The owner can close a month by hand too (the workflow does it on the 1st).
create or replace function public.admin_close_creator_month(p_month date default null)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return public.close_creator_month(p_month);
end;
$$;

revoke execute on function public.admin_close_creator_month(date) from public, anon;
grant execute on function public.admin_close_creator_month(date) to authenticated;
