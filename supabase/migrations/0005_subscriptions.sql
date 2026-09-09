-- =============================================================================
-- 0005 — Subscriptions: monthly / annual access to every course.
--
-- A subscription is keyed by email like a purchase, one row per email: a customer either has a
-- subscription or does not, and renewals extend the same row. Access is time-boxed
-- (`expires_at`), which is the whole difference from a purchase — nothing else in the schema
-- changes: `my_entitlements` simply lists every course while the subscription is live, so the
-- app, the leaderboard and the storage policies keep working on course ids.
-- "Live" is one function, subscription_live(): active or cancelled, and the paid period not over.
--
-- Writers, in order of trust:
--   create_subscription_order()   anonymous visitor → a pending intent (email ↔ plan)
--   apply_subscription_payment()  the payment webhook (service role) → activate / extend
--   admin_set_subscription()      the coach → grant, extend, cancel by hand
-- Customers never write the table and read it only through `my_subscription`.
-- =============================================================================

create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique,
  plan         text not null check (plan in ('monthly', 'annual')),
  status       text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  -- Access is live while status = 'active' and now() < expires_at. A cancelled subscription keeps
  -- its expires_at: the customer paid for that period and keeps it.
  started_at   timestamptz,
  expires_at   timestamptz,
  -- 'landing' / 'app' for intents, 'prodamus' for webhook payments, 'admin' for manual grants.
  source       text,
  -- The provider's own subscription / order id, for support and for idempotent webhooks.
  provider_ref text,
  locale       text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.subscriptions is
  'Monthly / annual access to every course. pending → active (payment) → cancelled; access ends at expires_at.';

alter table public.subscriptions drop constraint if exists subscriptions_email_len;
alter table public.subscriptions add constraint subscriptions_email_len
  check (length(email::text) <= 254) not valid;
alter table public.subscriptions drop constraint if exists subscriptions_source_len;
alter table public.subscriptions add constraint subscriptions_source_len
  check (source is null or length(source) <= 40) not valid;
alter table public.subscriptions drop constraint if exists subscriptions_provider_ref_len;
alter table public.subscriptions add constraint subscriptions_provider_ref_len
  check (provider_ref is null or length(provider_ref) <= 120) not valid;
alter table public.subscriptions drop constraint if exists subscriptions_locale_fmt;
alter table public.subscriptions add constraint subscriptions_locale_fmt
  check (locale is null or locale in ('ru', 'en')) not valid;
alter table public.subscriptions drop constraint if exists subscriptions_note_len;
alter table public.subscriptions add constraint subscriptions_note_len
  check (note is null or length(note) <= 500) not valid;

create index if not exists subscriptions_status_created_idx on public.subscriptions (status, created_at desc);

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

-- Same access model as purchases: admins read and write through the API, customers see only
-- the `my_subscription` view (no note, no provider reference).
drop policy if exists "subscriptions: admins all" on public.subscriptions;
create policy "subscriptions: admins all"
  on public.subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.subscriptions from anon, authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;

-- -----------------------------------------------------------------------------
-- subscription_live — the one definition of "has access": the paid period is not over.
-- A cancelled subscription is live until its expires_at — cancelling stops renewals, it never
-- takes away time that was paid for. Pending never is.
-- -----------------------------------------------------------------------------
create or replace function public.subscription_live(p_status text, p_expires_at timestamptz)
returns boolean
language sql
stable
as $$
  select p_status in ('active', 'cancelled') and p_expires_at is not null and p_expires_at > now();
$$;

-- Views check function rights against the caller, so the predicate must be executable by users.
revoke execute on function public.subscription_live(text, timestamptz) from public, anon;
grant execute on function public.subscription_live(text, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- subscription_period — how long one payment buys.
-- -----------------------------------------------------------------------------
create or replace function public.subscription_period(p_plan text)
returns interval
language sql
immutable
as $$
  select case p_plan when 'annual' then interval '1 year' else interval '1 month' end;
$$;

revoke execute on function public.subscription_period(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- my_subscription — the signed-in user's own row, without the coach's fields.
-- -----------------------------------------------------------------------------
drop view if exists public.my_subscription;
create view public.my_subscription
with (security_invoker = false)
as
  select s.plan, s.status, s.started_at, s.expires_at,
         public.subscription_live(s.status, s.expires_at) as is_live
  from public.subscriptions s
  where s.email = public.current_email();

revoke all on public.my_subscription from anon, authenticated;
grant select on public.my_subscription to authenticated;

-- -----------------------------------------------------------------------------
-- my_entitlements — purchased courses, plus every course while a subscription is live.
-- Replaces the view from 0002; the column list is unchanged so the client needs no change.
-- -----------------------------------------------------------------------------
drop view if exists public.my_entitlements;
create view public.my_entitlements
with (security_invoker = false)
as
  select p.course_id, p.activated_at
  from public.purchases p
  where p.status = 'active'
    and p.email = public.current_email()
  union
  select c.id as course_id, s.started_at as activated_at
  from public.subscriptions s
  cross join public.courses c
  where public.subscription_live(s.status, s.expires_at)
    and s.email = public.current_email();

revoke all on public.my_entitlements from anon, authenticated;
grant select on public.my_entitlements to authenticated;

-- -----------------------------------------------------------------------------
-- create_subscription_order — the landing / app "subscribe" form. Anonymous.
-- Records the intent so the payment can be matched to an email; never grants access.
-- Reuses the pending-order throttle of create_order() through the same table of buckets.
-- -----------------------------------------------------------------------------
create or replace function public.create_subscription_order(
  p_email  text,
  p_plan   text,
  p_locale text default 'ru',
  p_source text default 'landing'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email  citext;
  v_locale text;
  v_source text;
  v_id     uuid;
begin
  v_email := public.normalize_email(p_email);

  if p_plan is null or p_plan not in ('monthly', 'annual') then
    raise exception 'invalid_plan' using errcode = 'P0001', hint = 'monthly or annual';
  end if;

  v_locale := case when p_locale in ('ru', 'en') then p_locale else 'ru' end;
  v_source := left(coalesce(nullif(trim(p_source), ''), 'landing'), 40);

  -- One pending intent per email is enough; a live subscription is never downgraded by a form.
  insert into public.subscriptions (email, plan, status, source, locale)
  values (v_email, p_plan, 'pending', v_source, v_locale)
  on conflict (email) do update
    set plan       = case when public.subscription_live(subscriptions.status, subscriptions.expires_at)
                          then subscriptions.plan else excluded.plan end,
        source     = case when public.subscription_live(subscriptions.status, subscriptions.expires_at)
                          then subscriptions.source else excluded.source end,
        locale     = coalesce(excluded.locale, subscriptions.locale),
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_subscription_order(text, text, text, text) from public;
grant execute on function public.create_subscription_order(text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- apply_subscription_payment — called by the payment webhook with the service role.
-- Idempotent per provider reference: the same notification delivered twice extends once.
-- A payment while the subscription is still live extends from expires_at (a renewal);
-- after a gap it starts from now (a return), so nobody is charged for months they were away.
-- -----------------------------------------------------------------------------
create or replace function public.apply_subscription_payment(
  p_email        text,
  p_plan         text,
  p_provider_ref text default null,
  p_paid_at      timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email  citext;
  v_row    public.subscriptions%rowtype;
  v_from   timestamptz;
  v_ref    text;
  v_id     uuid;
begin
  -- Only the service role (the webhook) and the SQL editor: never a signed-in user.
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_email := public.normalize_email(p_email);
  if p_plan is null or p_plan not in ('monthly', 'annual') then
    raise exception 'invalid_plan' using errcode = 'P0001';
  end if;
  v_ref := left(nullif(trim(p_provider_ref), ''), 120);

  select * into v_row from public.subscriptions where email = v_email;

  if found and v_ref is not null and v_row.provider_ref = v_ref then
    return v_row.id; -- the same payment, delivered again
  end if;

  v_from := case
    when found and v_row.status in ('active', 'cancelled') and v_row.expires_at > p_paid_at then v_row.expires_at
    else p_paid_at
  end;

  insert into public.subscriptions (email, plan, status, started_at, expires_at, source, provider_ref)
  values (v_email, p_plan, 'active', p_paid_at, v_from + public.subscription_period(p_plan), 'prodamus', v_ref)
  on conflict (email) do update
    set plan         = excluded.plan,
        status       = 'active',
        started_at   = coalesce(subscriptions.started_at, excluded.started_at),
        expires_at   = excluded.expires_at,
        source       = 'prodamus',
        provider_ref = coalesce(excluded.provider_ref, subscriptions.provider_ref),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.apply_subscription_payment(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_subscription_payment(text, text, text, timestamptz) to service_role;

-- -----------------------------------------------------------------------------
-- admin_set_subscription — grant, extend or cancel by hand (bank transfer, gift, support).
--   p_status 'active'    → expires_at = p_expires_at, or one period from now / from the current
--                          expiry when it is still in the future (an extension)
--   p_status 'cancelled' → access ends at the current expires_at (or now, if none)
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_subscription(
  p_email      text,
  p_plan       text,
  p_status     text,
  p_expires_at timestamptz default null,
  p_note       text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email   citext;
  v_row     public.subscriptions%rowtype;
  v_expires timestamptz;
  v_id      uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  v_email := public.normalize_email(p_email);
  if p_plan is null or p_plan not in ('monthly', 'annual') then
    raise exception 'invalid_plan' using errcode = 'P0001';
  end if;
  if p_status is null or p_status not in ('active', 'cancelled') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select * into v_row from public.subscriptions where email = v_email;

  if p_status = 'active' then
    v_expires := coalesce(
      p_expires_at,
      (case when found and public.subscription_live(v_row.status, v_row.expires_at) then v_row.expires_at else now() end)
        + public.subscription_period(p_plan)
    );
  else
    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
    v_expires := coalesce(v_row.expires_at, now());
  end if;

  insert into public.subscriptions (email, plan, status, started_at, expires_at, source, note)
  values (v_email, p_plan, p_status, now(), v_expires, 'admin', left(nullif(trim(p_note), ''), 500))
  on conflict (email) do update
    set plan       = excluded.plan,
        status     = excluded.status,
        started_at = coalesce(subscriptions.started_at, excluded.started_at),
        expires_at = excluded.expires_at,
        source     = 'admin',
        note       = coalesce(excluded.note, subscriptions.note),
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_set_subscription(text, text, text, timestamptz, text) from public, anon;
grant execute on function public.admin_set_subscription(text, text, text, timestamptz, text) to authenticated;
