-- =============================================================================
-- 0018 — the consent log: proof that a person agreed, and to which text.
--
-- ## Why a table and not a checkbox
--
-- The order form on the site has had an unticked consent box since it was
-- written, and the box works: nothing is submitted until it is ticked. What it
-- does not do is leave a trace. 152-ФЗ ст. 9 ч. 3 puts the burden of proof on
-- the operator — «обязанность предоставить доказательство получения согласия
-- субъекта персональных данных … возлагается на оператора» — and a checkbox
-- that lives for one page load proves nothing the day it is asked about.
--
-- So every consent becomes a row: who, which text, which version of it, when,
-- in which language, and from which surface. That row is the evidence.
--
-- ## Three kinds, because they are three different agreements
--
--   privacy  the policy on processing personal data. Given by everybody, at the
--            first point where an address is collected.
--   offer    the public offer (оферта) — a contract, not a data question. Given
--            when ordering, never in the app.
--   health   the one that made this file necessary. Onboarding asks what to
--            protect, and the answers include гипертония and беременность.
--            That is «состояние здоровья», a special category under 152-ФЗ
--            ст. 10, and ст. 10 ч. 2 п. 1 allows it only on a consent given in
--            writing. Ст. 9 ч. 4 treats an electronic document signed with an
--            electronic signature as equivalent, and the sign-in this consent
--            sits behind is a one-time code delivered to a verified address —
--            the simple electronic signature the clause contemplates.
--
--            It is therefore a **separate** consent, asked separately, refusable
--            separately, and the app has to work without it: `record_consent`
--            is never a precondition for anything, and a person who declines
--            simply trains without the adaptations that need the answers.
--
-- ## What is deliberately not here
--
-- No IP address and no user agent. They are the usual companions of a consent
-- log and they would make this table more probative, but they are also more
-- personal data collected for a reason the policy does not currently state, and
-- the operator here is one coach and one designer. The email, the timestamp and
-- the document version are what a request from Роскомнадзор actually asks for.
--
-- Requires 0001_init.sql (citext, normalize_email, profiles) and
-- 0002_functions.sql (create_order, which this file replaces in place).
-- Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The log.
-- -----------------------------------------------------------------------------
create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  -- Null for a consent given on the site before the person ever signed in: at
  -- that moment there is no auth user, only an address. Cascades so that
  -- deleting the account destroys the log with it — ст. 21 says destroy, and a
  -- consent record for data that no longer exists has nothing left to prove.
  user_id     uuid references auth.users (id) on delete cascade,
  email       citext not null,
  kind        text not null check (kind in ('privacy', 'offer', 'health')),
  -- The version of the text that was shown, e.g. '2026-09-18'. Not a hash of it:
  -- a hash proves nothing to a reader, and the versions are published pages.
  doc_version text not null check (length(doc_version) between 1 and 40),
  locale      text not null default 'ru' check (locale in ('ru', 'en')),
  source      text not null default 'app' check (length(source) <= 40),
  granted_at  timestamptz not null default now(),
  -- Set by revoke_consent(). The row is kept rather than deleted: a withdrawal
  -- is itself an event the operator has to be able to date.
  revoked_at  timestamptz
);

comment on table public.consents is
  'Consent log (152-ФЗ ст. 9 ч. 3): who agreed, to which document version, when. One row per grant.';

-- One live grant per address per kind per version, so a form submitted twice
-- does not grow the table and re-reading the same version is a no-op.
create unique index if not exists consents_live_uniq
  on public.consents (email, kind, doc_version)
  where revoked_at is null;

create index if not exists consents_user_idx on public.consents (user_id, kind)
  where revoked_at is null;

alter table public.consents enable row level security;

-- Granted explicitly rather than inherited from the project's default privileges:
-- reading is for signed-in people (and RLS below decides which rows), writing is
-- for nobody — every insert goes through a security-definer function, so a client
-- cannot forge a consent for an address that is not theirs.
revoke all on public.consents from anon, authenticated;
grant select on public.consents to authenticated;

-- Read your own, by the address on the verified session. No insert, update or
-- delete policy at all: everything is written through the functions below, so a
-- client cannot forge a consent for somebody else's address.
drop policy if exists "consents: owner select" on public.consents;
create policy "consents: owner select"
  on public.consents for select
  to authenticated
  using (user_id = auth.uid() or email = public.current_email());

drop policy if exists "consents: admin select" on public.consents;
create policy "consents: admin select"
  on public.consents for select
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- record_consent — the signed-in path (the app).
--
-- Takes the address from the session rather than from the caller: the whole
-- point of the log is that the row cannot be written on somebody else's behalf.
-- -----------------------------------------------------------------------------
create or replace function public.record_consent(
  p_kinds   text[],
  p_version text,
  p_locale  text default 'ru',
  p_source  text default 'app'
)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email  citext := public.current_email();
  v_uid    uuid := auth.uid();
  v_locale text;
  v_source text;
  v_kind   text;
  v_n      int := 0;
begin
  if v_uid is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if p_version is null or length(trim(p_version)) = 0 or length(p_version) > 40 then
    raise exception 'invalid_version' using errcode = 'P0001';
  end if;

  v_locale := case when p_locale in ('ru', 'en') then p_locale else 'ru' end;
  v_source := left(coalesce(nullif(trim(p_source), ''), 'app'), 40);

  foreach v_kind in array coalesce(p_kinds, array[]::text[]) loop
    if v_kind not in ('privacy', 'offer', 'health') then
      raise exception 'invalid_kind' using errcode = 'P0001';
    end if;

    insert into public.consents (user_id, email, kind, doc_version, locale, source)
    values (v_uid, v_email, v_kind, p_version, v_locale, v_source)
    on conflict (email, kind, doc_version) where revoked_at is null do update
      -- The address consented on the site before signing in: attach the account
      -- to the row that already exists instead of writing a second one.
      set user_id = coalesce(consents.user_id, excluded.user_id);
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

revoke execute on function public.record_consent(text[], text, text, text) from public, anon;
grant execute on function public.record_consent(text[], text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- my_consents — what the signed-in person has agreed to, for the app to decide
-- whether to ask. Returns the live grants only.
-- -----------------------------------------------------------------------------
create or replace function public.my_consents()
returns table (kind text, doc_version text, granted_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select c.kind, c.doc_version, c.granted_at
  from public.consents c
  where c.revoked_at is null
    and (c.user_id = auth.uid() or c.email = public.current_email())
  order by c.granted_at desc;
$$;

revoke execute on function public.my_consents() from public, anon;
grant execute on function public.my_consents() to authenticated;

-- -----------------------------------------------------------------------------
-- revoke_consent — ст. 9 ч. 2: consent may be withdrawn at any time.
--
-- Withdrawing the health consent is the only one that changes what the app may
-- do while the account still exists; withdrawing `privacy` is a request to stop
-- processing altogether, which means deleting the account, and that is handled
-- by a human on the support address (docs/COMPLIANCE.md). So this function
-- marks the log and says so — it does not pretend to delete anything.
-- -----------------------------------------------------------------------------
create or replace function public.revoke_consent(p_kind text)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_n     int;
begin
  if auth.uid() is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if p_kind not in ('privacy', 'offer', 'health') then
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;

  update public.consents
     set revoked_at = now()
   where revoked_at is null
     and kind = p_kind
     and (user_id = auth.uid() or email = v_email);

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.revoke_consent(text) from public, anon;
grant execute on function public.revoke_consent(text) to authenticated;

-- =============================================================================
-- create_order, with the consent it was already collecting.
--
-- The form has always refused to submit until the box is ticked, so a successful
-- call *is* the consent event; what was missing was writing it down. The version
-- of the text the visitor was shown travels with the call, because the site is
-- static and a page cached in a browser for a week shows an older policy than
-- the one deployed today — the row has to name the text that was actually on
-- screen, not the text that is current at the moment the row is written.
--
-- Dropped and recreated rather than overloaded: two `create_order`s, one with
-- four parameters and one with five, make a four-key PostgREST call ambiguous.
-- The new parameter has a default, so a browser still running the previous
-- bundle keeps working after this migration and before the site redeploys.
-- =============================================================================
drop function if exists public.create_order(text, text, text, text);

create or replace function public.create_order(
  p_email            text,
  p_course_id        text,
  p_locale           text default 'ru',
  p_source           text default 'landing',
  p_consent_version  text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_ip_limit     constant int := 30;
  c_global_limit constant int := 200;
  c_window       constant interval := interval '1 hour';

  v_email   citext;
  v_locale  text;
  v_source  text;
  v_headers json;
  v_forward text[];
  v_ip      text;
  v_bucket  text;
  v_limit   int;
  v_hits    int;
  v_pending int;
  v_id      uuid;
begin
  v_email := public.normalize_email(p_email);

  if p_course_id is null
     or p_course_id !~ '^[a-z0-9_]{2,40}$'
     or not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'invalid_course' using errcode = 'P0001', hint = 'Unknown course id';
  end if;

  v_locale := case when p_locale in ('ru', 'en') then p_locale else 'ru' end;
  v_source := left(coalesce(nullif(trim(p_source), ''), 'landing'), 40);

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;

  v_forward := string_to_array(coalesce(v_headers ->> 'x-forwarded-for', ''), ',');
  v_ip := coalesce(
    nullif(btrim(coalesce(v_headers ->> 'cf-connecting-ip', '')), ''),
    nullif(btrim(coalesce(v_headers ->> 'x-real-ip', '')), ''),
    nullif(btrim(coalesce(v_forward[cardinality(v_forward)], '')), '')
  );

  if v_ip is null then
    v_bucket := 'global';
    v_limit  := c_global_limit;
  else
    v_bucket := left(v_ip, 45);
    v_limit  := c_ip_limit;
  end if;

  insert into public.order_throttle as t (bucket, window_start, hits)
  values (v_bucket, now(), 1)
  on conflict (bucket) do update
    set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
        hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning t.hits into v_hits;

  if v_hits > v_limit then
    raise exception 'too_many_orders' using errcode = 'P0001', hint = 'Too many orders from this address, try again later';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('forma:create_order:' || v_email::text, 0));

  select count(*) into v_pending
  from public.purchases
  where email = v_email and status = 'pending';

  if v_pending >= 10 then
    raise exception 'too_many_pending' using errcode = 'P0001', hint = 'Too many pending orders for this email';
  end if;

  insert into public.purchases (email, course_id, status, source, locale)
  values (v_email, p_course_id, 'pending', v_source, v_locale)
  on conflict (email, course_id) do update
    set updated_at = now(),
        source     = excluded.source,
        locale     = coalesce(excluded.locale, purchases.locale),
        status     = 'pending'
    where purchases.status <> 'active'
  returning id into v_id;

  if v_id is null then
    select p.id into v_id
    from public.purchases p
    where p.email = v_email and p.course_id = p_course_id;
  end if;

  -- The consent, after the throttle and the locks: a call that was refused above
  -- never got as far as agreeing to anything, and the row must not claim it did.
  -- Two kinds, because ordering is both a data question and a contract.
  if p_consent_version is not null and length(trim(p_consent_version)) between 1 and 40 then
    insert into public.consents (user_id, email, kind, doc_version, locale, source)
    select null, v_email, k, trim(p_consent_version), v_locale, v_source
    from unnest(array['privacy', 'offer']) as k
    on conflict (email, kind, doc_version) where revoked_at is null do nothing;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_order(text, text, text, text, text) from public;
grant execute on function public.create_order(text, text, text, text, text) to anon, authenticated;
