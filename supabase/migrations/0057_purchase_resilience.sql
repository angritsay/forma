-- =============================================================================
-- 0057 — purchase resilience: a paid course is never left locked by guessing, a payment without
-- an address is never lost, and a refund is never silent.
--
-- The unhappy-path audit found three places where money arrived and nothing happened:
--
--   1. **Two open orders block activation.** `apply_course_payment()` (0038) gave up as soon as an
--      address had two or more `pending` orders — and an order is written every time somebody
--      opens the till, so two taps on two courses, or one abandoned order from last month, meant
--      a paid course stayed locked until the owner opened it by hand. Now:
--        * the amount picks the order: the most recent pending order whose course price equals
--          what was paid (Prodamus sends only the amount, 0019);
--        * a pending order older than 48 hours is expired — it no longer makes a fresh one
--          ambiguous, though a lone old order is still honoured (a late payment for the one thing
--          ordered is not a reason to lock it);
--        * `claim_payment()` answers `ambiguous` when several orders are open and none could be
--          chosen, instead of the `no_order` it shares with «there is no order at all». The screen
--          says the two differently, and the owner's line says which it was.
--   2. **A Prodamus payment with no email was lost.** The webhook answered 400, Prodamus retried
--      forever, and the ledger had nothing. `record_payment()` now writes such a payment with an
--      empty address and unapplied, so the owner's «Платёж не привязан» fires and the person can
--      still claim it by the order number on the receipt. The claim never links an empty address.
--   3. **Refunds and chargebacks were a log line.** `record_payment_reversal()` puts them in the
--      owner's channel (`payment_reversed`, `telegram-notify/admin.ts`). Access is not revoked:
--      that stays a decision a person makes (the owner's call, see the plan).
--
-- `admin_outbox.kind` is checked by shape (`^[a-z_]{3,40}$`, 0040), not by a list, so the new kind
-- needs only its copy.
--
-- ## Signatures
--
-- `apply_course_payment` gains `p_amount` (default null), so the old five-argument version is
-- dropped first and the grants restated exactly as 0038 had them — two overloads would make
-- PostgREST's choice ambiguous (PGRST203). `record_payment` and `claim_payment` keep their
-- signatures and are replaced in place.
--
-- Requires 0020, 0038, 0040, 0043, 0044, 0055. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Which pending order a course payment is for.
--
-- One place for the rule, read by the webhook's `apply_course_payment()` and by `claim_payment()`
-- to tell «ambiguous» from «nothing to open». Internal: granted to nobody.
--
--   * with an amount: the most recent fresh (≤ 48 h) pending order whose course costs that much
--     (`admin_courses.price_rub`, the catalogue the course import keeps in step with the site),
--     then the most recent older one at that price — the amount outranks freshness;
--   * otherwise the only fresh pending order;
--   * otherwise, when every order is old, the only pending order there is;
--   * otherwise nothing — `open_count` then says whether that was «none» or «several».
-- -----------------------------------------------------------------------------
create or replace function public.course_payment_order(p_email citext, p_amount numeric default null)
returns table (course_id text, open_count int)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_fresh constant interval := interval '48 hours';
  v_all   int;
  v_fresh int;
  v_pick  text;
begin
  select count(*), count(*) filter (where p.updated_at > now() - c_fresh)
    into v_all, v_fresh
  from public.purchases p
  where p.email = p_email and p.status = 'pending';

  if p_amount is not null and p_amount > 0 then
    select p.course_id into v_pick
    from public.purchases p
    join public.admin_courses c on c.slug_id = p.course_id
    where p.email = p_email
      and p.status = 'pending'
      and p.updated_at > now() - c_fresh
      and c.price_rub > 0
      and abs(c.price_rub - p_amount) < 0.5
    order by p.updated_at desc, p.created_at desc
    limit 1;

    -- No fresh order at that price, but an older one is: the amount is the better evidence. Without
    -- this, a fresh order for another course would be «the only fresh one» below and open instead
    -- of the course that was actually paid for.
    if v_pick is null then
      select p.course_id into v_pick
      from public.purchases p
      join public.admin_courses c on c.slug_id = p.course_id
      where p.email = p_email
        and p.status = 'pending'
        and c.price_rub > 0
        and abs(c.price_rub - p_amount) < 0.5
      order by p.updated_at desc, p.created_at desc
      limit 1;
    end if;
  end if;

  if v_pick is null and v_fresh = 1 then
    select p.course_id into v_pick
    from public.purchases p
    where p.email = p_email and p.status = 'pending' and p.updated_at > now() - c_fresh;
  elsif v_pick is null and v_fresh = 0 and v_all = 1 then
    select p.course_id into v_pick
    from public.purchases p
    where p.email = p_email and p.status = 'pending';
  end if;

  course_id := v_pick;
  open_count := v_all;
  return next;
end;
$$;

revoke execute on function public.course_payment_order(citext, numeric)
  from public, anon, authenticated;

comment on function public.course_payment_order(citext, numeric) is
  'Internal (0057): the pending order a course payment is for — by amount, then the only fresh one, then the only one; null when none or several.';

-- -----------------------------------------------------------------------------
-- 2. apply_course_payment — the amount picks the order.
-- -----------------------------------------------------------------------------
drop function if exists public.apply_course_payment(text, text, timestamptz, text, text);

create or replace function public.apply_course_payment(
  p_email        text,
  p_provider_ref text default null,
  p_paid_at      timestamptz default now(),
  p_course_id    text default null,
  p_source       text default 'prodamus',
  p_amount       numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email  citext;
  v_ref    text;
  v_course text;
  v_id     uuid;
  -- Какая касса принесла деньги. Пусто — Prodamus: так это писалось до 0038.
  v_source text := left(coalesce(nullif(btrim(p_source), ''), 'prodamus'), 40);
begin
  -- Только сервисная роль (вебхук) и SQL-редактор: никогда не вошедший пользователь.
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_email := public.normalize_email(p_email);
  v_ref := left(nullif(trim(p_provider_ref), ''), 120);

  -- Тот же платёж, доставленный повторно.
  if v_ref is not null then
    select id into v_id from public.purchases where provider_ref = v_ref limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- Сериализуем по адресу, как это делает create_order: заказ и оплата могут прийти в одну
  -- секунду, если человек платит сразу после нажатия. До выбора заказа, чтобы выбор видел его.
  perform pg_advisory_xact_lock(hashtextextended('forma:course_payment:' || v_email::text, 0));

  if p_course_id is not null then
    if p_course_id !~ '^[a-z0-9_]{2,40}$'
       or not exists (select 1 from public.courses c where c.id = p_course_id) then
      raise exception 'invalid_course' using errcode = 'P0001';
    end if;
    v_course := p_course_id;
  else
    -- Сумма выбирает заказ; не выбрала — единственный свежий; нет и его — решает человек.
    select o.course_id into v_course from public.course_payment_order(v_email, p_amount) o;
    if v_course is null then
      return null;
    end if;
  end if;

  insert into public.purchases (email, course_id, status, source, activated_at, provider_ref)
  values (v_email, v_course, 'active', v_source, p_paid_at, v_ref)
  on conflict (email, course_id) do update
    set status = 'active',
        source = v_source,
        -- Первая активация ставит дату; повторная сохраняет исходную, потому что
        -- от неё отсчитывается и возврат, и пробная неделя клуба.
        activated_at = coalesce(purchases.activated_at, excluded.activated_at),
        provider_ref = coalesce(purchases.provider_ref, excluded.provider_ref),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.apply_course_payment(text, text, timestamptz, text, text, numeric)
  from public, anon, authenticated;
grant execute on function public.apply_course_payment(text, text, timestamptz, text, text, numeric)
  to service_role;

-- -----------------------------------------------------------------------------
-- 3. record_payment — a payment without an address is written, not dropped.
--
-- The text of 0043 with one change: an empty address is stored as '' instead of returning null.
-- The row is unapplied, so the 0044 trigger tells the owner, and the order number still finds it.
-- -----------------------------------------------------------------------------
create or replace function public.record_payment(
  p_email        text,
  p_amount       numeric,
  p_provider_ref text,
  p_paid_at      timestamptz,
  p_intent       text,
  p_applied      boolean,
  p_provider     text default 'prodamus',
  p_currency     text default 'RUB'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := lower(btrim(coalesce(p_email, '')));
  v_ref   text   := nullif(btrim(coalesce(p_provider_ref, '')), '');
  v_id    uuid;
  v_prov  text   := left(coalesce(nullif(btrim(p_provider), ''), 'prodamus'), 40);
  v_cur   text   := upper(btrim(coalesce(p_currency, '')));
begin
  -- No address and no order number: nothing could ever find this row again.
  if v_email = '' and v_ref is null then
    return null;
  end if;
  if p_intent is null or p_intent not in ('monthly', 'annual', 'course', 'session') then
    raise exception 'invalid_intent' using errcode = 'P0001';
  end if;
  if v_cur !~ '^[A-Z]{3}$' then
    v_cur := null;
  end if;

  if v_ref is not null then
    select id into v_id from public.payments where provider_ref = v_ref;
    if v_id is not null then
      update public.payments
      set applied  = applied or (coalesce(p_applied, false) and v_email <> ''),
          currency = coalesce(currency, v_cur)
      where id = v_id;
      return v_id;
    end if;
  end if;

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, provider, currency)
  values (v_email, p_amount, v_ref, coalesce(p_paid_at, now()), p_intent,
          coalesce(p_applied, false) and v_email <> '', v_prov, v_cur)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function
  public.record_payment(text, numeric, text, timestamptz, text, boolean, text, text)
  from public, anon, authenticated;
grant execute on function
  public.record_payment(text, numeric, text, timestamptz, text, boolean, text, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- 4. record_payment_reversal — a refund or a chargeback reaches the owner.
--
-- Called by the webhooks for a Prodamus notification that is not a success and for a lava.top
-- event that neither grants access nor is known to be harmless. Nothing is revoked here: the
-- owner reads it and decides (0044's «Возврат» buttons do the rest). The topic follows the
-- payment it names, when the ledger has it; otherwise «Курсы», where money questions go.
-- -----------------------------------------------------------------------------
create or replace function public.record_payment_reversal(
  p_provider     text,
  p_event        text,
  p_provider_ref text,
  p_email        text default null,
  p_amount       numeric default null,
  p_currency     text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_prov    text := left(coalesce(nullif(btrim(p_provider), ''), 'prodamus'), 40);
  v_event   text := left(coalesce(nullif(btrim(p_event), ''), 'unknown'), 60);
  v_ref     text := left(nullif(btrim(coalesce(p_provider_ref, '')), ''), 120);
  v_payment public.payments%rowtype;
begin
  if v_ref is not null then
    select * into v_payment from public.payments where provider_ref = v_ref;
  end if;

  begin
    perform public.enqueue_admin(
      case
        when v_payment.intent in ('monthly', 'annual') then 'club'
        when v_payment.intent = 'session' then 'sessions'
        else 'courses'
      end,
      'payment_reversed',
      'payment_reversed:' || v_prov || ':' || coalesce(v_ref, gen_random_uuid()::text) || ':' || v_event,
      jsonb_build_object(
        'paymentId', coalesce(v_payment.id::text, ''),
        'email', coalesce(nullif(v_payment.email::text, ''), lower(btrim(coalesce(p_email, '')))),
        'event', v_event,
        'amount', coalesce(p_amount::text, v_payment.amount::text, ''),
        'currency', coalesce(nullif(upper(btrim(coalesce(p_currency, ''))), ''), v_payment.currency, ''),
        'intent', coalesce(v_payment.intent, ''),
        'provider', v_prov,
        'ref', coalesce(v_ref, '')
      )
    );
  exception when others then
    -- The webhook's answer must not depend on the queue (0040).
    null;
  end;
end;
$$;

revoke execute on function public.record_payment_reversal(text, text, text, text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.record_payment_reversal(text, text, text, text, numeric, text)
  to service_role;

comment on function public.record_payment_reversal(text, text, text, text, numeric, text) is
  'Service role only (0057): a refund, chargeback or other non-success from a till goes to the owner''s channel. Revokes nothing.';

-- -----------------------------------------------------------------------------
-- 5. claim_payment — the amount picks the order, and «several orders» is its own answer.
--
-- The text of 0055 with three changes: the course branch passes the payment's amount (roubles
-- only — the prices it is compared with are `admin_courses.price_rub`), a course payment that opened nothing
-- answers `ambiguous` when the account has several open orders, and an empty payer address
-- (a Prodamus payment without one, §3) is never linked to the account.
-- -----------------------------------------------------------------------------
create or replace function public.claim_payment(p_provider_ref text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window   constant interval := interval '1 hour';
  c_max      constant int := 10;
  v_uid      uuid := auth.uid();
  v_mine     citext := public.current_email();
  v_ref      text := nullif(btrim(coalesce(p_provider_ref, '')), '');
  v_hits     int;
  v_payment  public.payments%rowtype;
  v_owner    uuid;
  v_result   text;
  v_claims   text;
  v_mark     boolean := true;
  v_unbooked boolean := false;
  v_open     int := 0;
begin
  if v_uid is null or v_mine is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if v_ref is null or length(v_ref) > 120 then
    return 'not_found';
  end if;

  -- The same sliding window as create_order(). Counted before the lookup, so failed tries cost too.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('claim:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;

  if v_hits > c_max then
    return 'rate_limited';
  end if;

  select * into v_payment
  from public.payments
  where provider_ref = v_ref
    and claimed_by is null
    and resolution is null
  for update;

  if not found then
    return 'not_found';
  end if;

  -- Is the address already somebody's? This account's is fine; another's is a stop, said aloud.
  if v_payment.email <> '' then
    select user_id into v_owner from public.payment_emails where email = v_payment.email;
    if v_owner is not null and v_owner <> v_uid then
      return 'email_taken';
    end if;
  end if;

  if v_payment.email <> '' and v_payment.email <> v_mine and v_owner is null then
    insert into public.payment_emails (user_id, email, linked_by)
    values (v_uid, v_payment.email, v_ref);
  end if;

  -- Why the claims are cleared here, and why that is not a hole: 0020/0039/0055.
  v_claims := coalesce(current_setting('request.jwt.claims', true), '');
  perform set_config('request.jwt.claims', '', true);

  if v_payment.intent = 'session' then
    v_result := 'linked';
    if v_payment.session_option is not null
       and public.apply_session_payment(
             v_mine::text, v_payment.provider_ref, v_payment.session_option, v_payment.paid_at,
             v_payment.id) is not null then
      v_result := 'session';
    else
      v_unbooked := true;
    end if;
  elsif v_payment.intent in ('monthly', 'annual') then
    perform public.apply_subscription_payment(
      v_mine::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at,
      coalesce(v_payment.provider, 'prodamus'));
    v_result := 'subscription';
  elsif public.apply_course_payment(
          v_mine::text, v_payment.provider_ref, v_payment.paid_at, null,
          coalesce(v_payment.provider, 'prodamus'),
          case when coalesce(v_payment.currency, 'RUB') = 'RUB' then v_payment.amount end
        ) is not null then
    v_result := 'course';
  else
    -- Nothing opened. Several open orders is a different sentence from none (0057).
    select o.open_count into v_open from public.course_payment_order(v_mine, null) o;
    v_result := case when coalesce(v_open, 0) > 1 then 'ambiguous' else 'no_order' end;
    v_mark := false;
  end if;

  perform set_config('request.jwt.claims', v_claims, true);

  if v_unbooked then
    update public.payments
    set claimed_by = v_uid,
        claimed_at = now()
    where id = v_payment.id;
    begin
      perform public.enqueue_admin(
        'sessions',
        'session_unmatched',
        'session_claim_unmatched:' || v_payment.id::text,
        jsonb_build_object(
          'paymentId', v_payment.id::text,
          'email', v_mine::text,
          'payEmail', v_payment.email::text,
          'option', coalesce(v_payment.session_option, ''),
          'reason', 'claimed_no_hold',
          'amount', coalesce(v_payment.amount::text, ''),
          'currency', coalesce(v_payment.currency, ''),
          'provider', coalesce(v_payment.provider, ''),
          'ref', coalesce(v_payment.provider_ref, '')
        )
      );
    exception when others then
      null;
    end;
  elsif v_mark then
    update public.payments
    set claimed_by = v_uid,
        claimed_at = now(),
        applied    = true
    where id = v_payment.id;
  else
    begin
      perform public.enqueue_admin(
        'courses',
        'claim_no_order',
        'claim_no_order:' || v_payment.id::text,
        jsonb_build_object(
          'paymentId', v_payment.id::text,
          'email', v_mine::text,
          'payEmail', v_payment.email::text,
          'reason', v_result,
          'amount', coalesce(v_payment.amount::text, ''),
          'currency', coalesce(v_payment.currency, ''),
          'provider', coalesce(v_payment.provider, ''),
          'ref', coalesce(v_payment.provider_ref, '')
        )
      );
    exception when others then
      null;
    end;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.claim_payment(text) from public, anon;
grant execute on function public.claim_payment(text) to authenticated;

notify pgrst, 'reload schema';
