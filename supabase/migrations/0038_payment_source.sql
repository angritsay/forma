-- =============================================================================
-- 0038 — записывать, какая касса принесла деньги.
--
-- Владелец: «нужно писать, какой курс и как была совершена покупка, потому что у нас разные
-- платформы есть».
--
-- Сегодня это невозможно, и не потому, что некуда писать. Колонка `source` есть у `purchases` с
-- 0001 и у `subscriptions` с 0005, и в обеих применяющих функциях в неё **жёстко вписано**
-- `'prodamus'` — всегда, кем бы функция ни была позвана. То есть покупка через lava.top уже
-- сейчас лежит в базе как покупка через Prodamus, и никакое уведомление не смогло бы сказать
-- правду: её просто нет в данных.
--
-- ## Что меняется
--
-- У трёх функций появляется последний аргумент со значением по умолчанию `'prodamus'`, и литерал
-- внутри заменяется на него. Умолчание не для красоты: оно означает, что **до** обновления
-- вебхуков ничего не ломается, и порядок выкладки перестаёт иметь значение. Старый вызов без
-- аргумента ведёт себя ровно как вчера.
--
-- У `payments` появляется колонка `provider` — по той же причине, что и всё остальное здесь.
-- Журнал платежей читает владелец, и «откуда пришли деньги» — половина ответа на вопрос, который
-- он к этому журналу приходит задать.
--
-- `claim_payment()` («оплатил(а) с другой почты») теперь передаёт кассу из записанного платежа
-- дальше, вместо того чтобы молча звать умолчание. Иначе платёж lava.top, забранный руками,
-- превращался бы в Prodamus на последнем шаге — ровно та ложь, ради которой всё это и делается.
--
-- ## Почему drop, а не create or replace
--
-- `create or replace` не умеет менять список аргументов: он создал бы **вторую** функцию рядом с
-- первой. Две перегрузки с одинаковыми именами параметров — это `PGRST203`, и вебхук перестал бы
-- открывать доступ с ошибкой, которая выглядит как что угодно, кроме миграции. Поэтому старая
-- сигнатура сносится явно, и сразу за ней создаётся новая.
--
-- Права выдаются заново и явно, включая `record_payment`, у которой явной выдачи не было: новая
-- функция — это новый объект, и умолчания платформы на неё не распространяются. Ровно та дыра,
-- через которую 0031 уже один раз провалилась в проде.
--
-- Требует 0005_subscriptions.sql, 0019_free_first_workout.sql, 0020_payment_emails.sql.
-- Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Журнал платежей помнит кассу.
-- -----------------------------------------------------------------------------
alter table public.payments
  add column if not exists provider text;

alter table public.payments drop constraint if exists payments_provider_len;
alter table public.payments add constraint payments_provider_len
  check (provider is null or length(provider) <= 40);

comment on column public.payments.provider is
  'Which till the money came through: prodamus, lava. Null on rows written before 0038.';

-- -----------------------------------------------------------------------------
-- 2. record_payment — та же функция, плюс касса.
-- -----------------------------------------------------------------------------
drop function if exists public.record_payment(text, numeric, text, timestamptz, text, boolean);

create or replace function public.record_payment(
  p_email        text,
  p_amount       numeric,
  p_provider_ref text,
  p_paid_at      timestamptz,
  p_intent       text,
  p_applied      boolean,
  p_provider     text default 'prodamus'
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
  -- Касса, принёсшая платёж. Журнал читает владелец, и «откуда» — половина ответа.
  v_prov  text   := left(coalesce(nullif(btrim(p_provider), ''), 'prodamus'), 40);
begin
  if v_email = '' then
    return null;
  end if;
  if p_intent is null or p_intent not in ('monthly', 'annual', 'course') then
    raise exception 'invalid_intent' using errcode = 'P0001';
  end if;

  if v_ref is not null then
    select id into v_id from public.payments where provider_ref = v_ref;
    if v_id is not null then
      -- Уже записан. Если в прошлый раз он не привязался, а теперь привязался —
      -- отметим это; больше ничего трогать не нужно.
      update public.payments
      set applied = applied or p_applied
      where id = v_id;
      return v_id;
    end if;
  end if;

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, provider)
  values (v_email, p_amount, v_ref, coalesce(p_paid_at, now()), p_intent, coalesce(p_applied, false), v_prov)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function
  public.record_payment(text, numeric, text, timestamptz, text, boolean, text)
  from public, anon, authenticated;
grant execute on function
  public.record_payment(text, numeric, text, timestamptz, text, boolean, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- 3. apply_subscription_payment — source больше не константа.
-- -----------------------------------------------------------------------------
drop function if exists public.apply_subscription_payment(text, text, text, timestamptz);

create or replace function public.apply_subscription_payment(
  p_email        text,
  p_plan         text,
  p_provider_ref text default null,
  p_paid_at      timestamptz default now(),
  p_source       text default 'prodamus'
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
  -- Какая касса принесла деньги. Пусто — Prodamus: так это писалось до 0038.
  v_source text := left(coalesce(nullif(btrim(p_source), ''), 'prodamus'), 40);
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
  values (v_email, p_plan, 'active', p_paid_at, v_from + public.subscription_period(p_plan), v_source, v_ref)
  on conflict (email) do update
    set plan         = excluded.plan,
        status       = 'active',
        started_at   = coalesce(subscriptions.started_at, excluded.started_at),
        expires_at   = excluded.expires_at,
        source       = v_source,
        provider_ref = coalesce(excluded.provider_ref, subscriptions.provider_ref),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.apply_subscription_payment(text, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.apply_subscription_payment(text, text, text, timestamptz, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- 4. apply_course_payment — то же самое.
-- -----------------------------------------------------------------------------
drop function if exists public.apply_course_payment(text, text, timestamptz, text);

create or replace function public.apply_course_payment(
  p_email        text,
  p_provider_ref text default null,
  p_paid_at      timestamptz default now(),
  p_course_id    text default null,
  p_source       text default 'prodamus'
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
  v_count  int;
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

  -- Какой курс. Либо сказали прямо, либо это единственная ожидающая покупка.
  if p_course_id is not null then
    if p_course_id !~ '^[a-z0-9_]{2,40}$'
       or not exists (select 1 from public.courses c where c.id = p_course_id) then
      raise exception 'invalid_course' using errcode = 'P0001';
    end if;
    v_course := p_course_id;
  else
    select count(*), min(p.course_id)
      into v_count, v_course
    from public.purchases p
    where p.email = v_email and p.status = 'pending';

    -- Ноль — платёж без заказа; больше одного — неизвестно, за какой из них.
    -- В обоих случаях решает человек.
    if v_count <> 1 then
      return null;
    end if;
  end if;

  -- Сериализуем по адресу, как это делает create_order: заказ и оплата могут
  -- прийти в одну секунду, если человек платит сразу после нажатия.
  perform pg_advisory_xact_lock(hashtextextended('forma:course_payment:' || v_email::text, 0));

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

revoke execute on function public.apply_course_payment(text, text, timestamptz, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_course_payment(text, text, timestamptz, text, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- 5. claim_payment — передаёт кассу дальше.
--
-- Сигнатура не меняется, поэтому `create or replace`: права и выдача остаются на месте. Меняются
-- два вызова внутри, и оба одинаково — касса берётся из строки платежа, а не из умолчания.
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
begin
  if v_uid is null or v_mine is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if v_ref is null or length(v_ref) > 120 then
    return 'not_found';
  end if;

  -- Скользящее окно, то же, что у create_order(). Считается до поиска платежа,
  -- чтобы неудачные попытки тоже стоили: иначе перебор ничего не стоил бы.
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
    and claimed_by is null;

  if not found then
    return 'not_found';
  end if;

  -- Адрес уже за кем-то закреплён? Если за этим же аккаунтом — всё в порядке,
  -- идём дальше; если за чужим — стоп, и не молча.
  select user_id into v_owner from public.payment_emails where email = v_payment.email;
  if v_owner is not null and v_owner <> v_uid then
    return 'email_taken';
  end if;

  if v_payment.email <> v_mine and v_owner is null then
    insert into public.payment_emails (user_id, email, linked_by)
    values (v_uid, v_payment.email, v_ref);
  end if;

  update public.payments
  set claimed_by = v_uid,
      claimed_at = now(),
      applied    = true
  where id = v_payment.id;

  /*
   * И применяем — на собственный адрес аккаунта, потому что именно на него
   * оформлен ожидающий заказ и именно его увидит `my_entitlements`.
   *
   * `apply_subscription_payment` и `apply_course_payment` отказываются работать,
   * если их зовут с пользовательским JWT: «никогда не вошедший пользователь».
   * Это правильная защита — она держит дверь, за которой кто угодно выписал бы
   * себе год подписки, — и здесь её приходится на два вызова снять.
   *
   * Почему это не дыра. Защита запрещает вызывать эти функции с произвольными
   * аргументами. Здесь произвольного нет ни одного: план, номер заказа и дата
   * прочитаны из строки `payments`, которую записал вебхук после сошедшейся
   * подписи Prodamus, а адрес — собственный подтверждённый адрес вызывающего.
   * Единственное, что пришло от человека, — номер заказа, и он уже проверен
   * выше: без настоящего неоплаченного платежа сюда не доходят.
   *
   * `set_config(..., true)` — на транзакцию, и значение возвращается на место
   * сразу после вызовов, чтобы ничто ниже по коду не выполнялось без клеймов.
   */
  v_claims := coalesce(current_setting('request.jwt.claims', true), '');
  perform set_config('request.jwt.claims', '', true);

  if v_payment.intent in ('monthly', 'annual') then
    perform public.apply_subscription_payment(
      v_mine::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at,
      coalesce(v_payment.provider, 'prodamus'));
    v_result := 'subscription';
  else
    if public.apply_course_payment(
         v_mine::text, v_payment.provider_ref, v_payment.paid_at, null,
         coalesce(v_payment.provider, 'prodamus')) is not null then
      v_result := 'course';
    else
      v_result := 'linked';
    end if;
  end if;

  perform set_config('request.jwt.claims', v_claims, true);

  return v_result;
end;
$$;

revoke execute on function public.claim_payment(text) from public, anon;
grant execute on function public.claim_payment(text) to authenticated;

-- Сигнатуры изменились — без этого PostgREST продолжит искать старые.
notify pgrst, 'reload schema';
