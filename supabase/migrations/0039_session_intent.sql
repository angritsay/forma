-- =============================================================================
-- 0039 — платёж за занятие с тренером — свой вид, а не «курс».
--
-- Владелец: «что касается онлайн-тренировок, то тут тоже нужно присылать уведомление о том, что
-- кто-то оплатил тренировку».
--
-- Отличить такой платёж сегодня нечем. `payments.intent` знает три значения — `monthly`, `annual`
-- и `course`, — и занятие записывается третьим, как всё, что не подписка. В журнале час с
-- тренером за 3 500 ₽ неотличим от курса за 3 990 ₽ ничем, кроме суммы, которую надо знать
-- наизусть.
--
-- ## И это не только про отчётность
--
-- Всё, что не подписка, уходит в `apply_course_payment()`, а тот открывает **единственный
-- ожидающий заказ на курс** этой почты. Человек, который оформил заказ на курс и потом купил час
-- с тренером, получает курс даром: оплата часа сходит за оплату курса.
--
-- Дыра живая и на русской кассе, где покупают почти все. В lava.top её закрывает отдельная ветка
-- по `product.id`; у Prodamus опознать занятие можно только суммой — как там опознаётся и тариф,
-- и по той же причине: короткая ссылка теряет параметры. Цены занятий (2 500 и 3 500) не
-- совпадают ни с одной ценой курса (2 990, 3 990, 4 990) и ни с одной ценой тарифа (1 990,
-- 7 990), так что сумма здесь различает однозначно.
--
-- `claim_payment()` получает ту же ветку: «оплатил(а) с другой почты» для занятия закрепляет
-- адрес и на этом останавливается, вместо того чтобы открыть курс.
--
-- Требует 0020_payment_emails.sql, 0038_payment_source.sql. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Журнал принимает четвёртый вид.
-- -----------------------------------------------------------------------------
alter table public.payments drop constraint if exists payments_intent_check;
alter table public.payments add constraint payments_intent_check
  check (intent in ('monthly', 'annual', 'course', 'session'));

comment on column public.payments.intent is
  'What was bought: monthly / annual (subscription), course, session (the coach time). Set by the webhook.';

-- -----------------------------------------------------------------------------
-- 2. record_payment — тот же текст, что в 0038, плюс четвёртый вид.
--
-- `create or replace`, а не drop: список аргументов тот же, что оставила 0038, — значит права и
-- выдача остаются на месте.
-- -----------------------------------------------------------------------------
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
  if p_intent is null or p_intent not in ('monthly', 'annual', 'course', 'session') then
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

-- -----------------------------------------------------------------------------
-- 3. claim_payment — занятие не открывает курс.
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

  if v_payment.intent = 'session' then
    /*
     * Занятие открывать нечем: куплено время тренера, а не доступ. Адрес закреплён выше — это и
     * есть всё, что забирание платежа может для занятия сделать, и ответ `linked` говорит ровно
     * это. Без этой ветки платёж за занятие проваливался бы в `apply_course_payment()` ниже и
     * открывал ожидающий заказ на курс: человек, оформивший заказ и купивший час, получил бы курс
     * даром.
     */
    v_result := 'linked';
  elsif v_payment.intent in ('monthly', 'annual') then
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

notify pgrst, 'reload schema';
