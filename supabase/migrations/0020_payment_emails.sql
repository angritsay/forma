-- =============================================================================
-- 0020 — оплата с одной почты, аккаунт на другой.
--
-- Всё в этой базе, что касается денег, найдено по почте: `purchases.email`,
-- `subscriptions.email`, и обе — по `current_email()`, то есть по подтверждённому
-- адресу входа. Пока покупатель платит с того же адреса, это работает и это
-- правильно: почта — единственное, что Prodamus про него сообщает.
--
-- Но адреса расходятся, и будут расходиться всегда:
--
--   * короткая ссылка Prodamus (`payform.ru/xxxxxx/`) перебрасывает на форму
--     магазина и теряет переданные ей параметры — `?customer_email=` до формы
--     не доезжает, и покупатель вбивает адрес руками;
--   * руками он вбивает тот, которым платит: рабочий, привязанный к карте, или
--     тот, что подставил браузер;
--   * платит вообще другой человек — муж, жена, компания.
--
-- Сейчас такой платёж не теряется только потому, что его находит тренер и
-- активирует руками. Уведомление приходит, подпись сходится, и дальше
-- `apply_course_payment` не находит ни одного ожидающего заказа на этот адрес и
-- возвращает null. В логе строчка, у человека — ничего.
--
-- Здесь три вещи, которые это закрывают:
--
--   1. `payments` — журнал. Каждое проверенное уведомление записывается, даже
--      (особенно) то, которое ни к чему не привязалось. Платёж перестаёт быть
--      строчкой в логе и становится строкой, к которой можно вернуться.
--   2. `payment_emails` — дополнительные адреса аккаунта. Доступ ищется уже не
--      по одному адресу, а по всем, которые аккаунт за собой закрепил.
--   3. `claim_payment(номер заказа)` — как человек закрепляет чужой адрес за
--      собой: вводит номер заказа из чека Prodamus. Номер знает только тот, кто
--      платил, — поэтому это доказательство, а не заявление.
--
-- **Почему номер заказа, а не просто «вот моя вторая почта».** Второе было бы
-- на один экран проще и открывало бы дыру: зная адрес чужого покупателя, любой
-- мог бы привязать его к себе и забрать оплаченный доступ. Номер заказа приходит
-- в чеке на почту плательщика и больше нигде не появляется.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- payments — журнал проверенных уведомлений.
--
-- Пишет только вебхук (service_role), и только после того, как сошлась подпись:
-- строка здесь означает «Prodamus подтвердил, что деньги пришли». Читать её
-- клиенту незачем и нельзя — `claim_payment` ниже сам смотрит в неё от имени
-- вызывающего и отдаёт только то, что случилось.
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  -- Адрес, который плательщик ввёл в форме Prodamus. Не обязательно адрес аккаунта.
  email        citext not null,
  amount       numeric(12, 2),
  -- Номер заказа провайдера. Он же — то, что человек вводит, чтобы забрать платёж,
  -- и то, по чему повторная доставка узнаётся как повторная.
  provider_ref text,
  paid_at      timestamptz not null default now(),
  -- За что заплатили, как это понял вебхук по сумме: план подписки или курс.
  intent       text not null default 'course' check (intent in ('monthly', 'annual', 'course')),
  -- Привязался ли платёж сразу (адрес совпал) или ждёт, пока его заберут.
  applied      boolean not null default false,
  claimed_by   uuid references auth.users (id) on delete set null,
  claimed_at   timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.payments is
  'Каждое проверенное уведомление Prodamus. applied = привязалось к заказу сразу; остальные ждут claim_payment().';

-- Один номер заказа — одна строка. Повторная доставка того же уведомления
-- (Prodamus повторяет, пока не получит 200) не создаёт второй платёж.
create unique index if not exists payments_ref_uniq
  on public.payments (provider_ref)
  where provider_ref is not null and provider_ref <> '';

create index if not exists payments_email_idx on public.payments (email);

alter table public.payments enable row level security;
-- Ни одной политики: никто, кроме service_role (он обходит RLS) и функций
-- security definer ниже, эту таблицу не видит.
revoke all on public.payments from anon, authenticated;

-- -----------------------------------------------------------------------------
-- payment_emails — адреса, с которых аккаунт платит.
--
-- `unique (email)` — глобально, а не на аккаунт: один платёжный адрес
-- принадлежит одному аккаунту. Иначе двое привязали бы один адрес и делили бы
-- один оплаченный доступ.
-- -----------------------------------------------------------------------------
create table if not exists public.payment_emails (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  email     citext not null unique,
  -- Номер заказа, которым этот адрес был доказан. Для поддержки: видно, откуда взялась привязка.
  linked_by text,
  linked_at timestamptz not null default now()
);

comment on table public.payment_emails is
  'Дополнительные адреса аккаунта: с них приходят оплаты. Привязываются через claim_payment().';

create index if not exists payment_emails_user_idx on public.payment_emails (user_id);

alter table public.payment_emails enable row level security;

drop policy if exists "payment_emails: owner reads" on public.payment_emails;
create policy "payment_emails: owner reads"
  on public.payment_emails for select
  to authenticated
  using (user_id = auth.uid());

revoke all on public.payment_emails from anon;
grant select on public.payment_emails to authenticated;

-- -----------------------------------------------------------------------------
-- my_billing_emails() — все адреса, по которым у этого аккаунта может быть оплата.
--
-- Подтверждённый адрес входа плюс привязанные платёжные. Заменяет `current_email()`
-- ровно в тех местах, где ищутся деньги, — и только там. Членство в клубе,
-- бронь, согласия, марафон остаются на `current_email()`: это вопрос «кто ты»,
-- а не «чем ты платил», и расширять его было бы ошибкой.
-- -----------------------------------------------------------------------------
create or replace function public.my_billing_emails()
returns setof citext
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.current_email()
  where public.current_email() is not null
  union
  select e.email
  from public.payment_emails e
  where e.user_id = auth.uid();
$$;

revoke execute on function public.my_billing_emails() from public, anon;
grant execute on function public.my_billing_emails() to authenticated;

-- -----------------------------------------------------------------------------
-- Те самые места, где ищутся деньги. Четыре: доступ к курсу, представление
-- покупок, представление подписки и доступ в клуб.
-- -----------------------------------------------------------------------------
create or replace function public.has_entitlement(p_course_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.is_admin() or exists (
    select 1
    from public.purchases p
    where p.status = 'active'
      and p.course_id = p_course_id
      and p.email in (select public.my_billing_emails())
  );
$$;

revoke execute on function public.has_entitlement(text) from public, anon;
grant execute on function public.has_entitlement(text) to authenticated;

drop view if exists public.my_entitlements;
create view public.my_entitlements
with (security_invoker = false)
as
  select p.course_id, p.activated_at
  from public.purchases p
  where p.status = 'active'
    and p.email in (select public.my_billing_emails())
  union
  select c.id as course_id, s.started_at as activated_at
  from public.subscriptions s
  cross join public.courses c
  where public.subscription_live(s.status, s.expires_at)
    and s.email in (select public.my_billing_emails());

revoke all on public.my_entitlements from anon, authenticated;
grant select on public.my_entitlements to authenticated;

drop view if exists public.my_subscription;
create view public.my_subscription
with (security_invoker = false)
as
  select s.plan, s.status, s.started_at, s.expires_at,
         public.subscription_live(s.status, s.expires_at) as is_live
  from public.subscriptions s
  where s.email in (select public.my_billing_emails());

revoke all on public.my_subscription from anon, authenticated;
grant select on public.my_subscription to authenticated;

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
      where s.email in (select public.my_billing_emails())
        and public.subscription_live(s.status, s.expires_at)
    )
    or exists (
      select 1 from public.purchases p
      where p.email in (select public.my_billing_emails())
        and p.status = 'active'
        and p.activated_at is not null
        -- 7 дней, как GAME_TRIAL_DAYS в gameAccess.ts. Это одно правило в двух
        -- местах; меняются вместе.
        and p.activated_at > now() - interval '7 days'
    );
$$;

revoke execute on function public.club_access() from public, anon;
grant execute on function public.club_access() to authenticated;

-- -----------------------------------------------------------------------------
-- record_payment — вебхук записывает проверенное уведомление.
--
-- Только service_role. Идемпотентна по номеру заказа: повторная доставка
-- возвращает ту же строку и ничего не меняет.
-- -----------------------------------------------------------------------------
create or replace function public.record_payment(
  p_email        text,
  p_amount       numeric,
  p_provider_ref text,
  p_paid_at      timestamptz,
  p_intent       text,
  p_applied      boolean
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

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied)
  values (v_email, p_amount, v_ref, coalesce(p_paid_at, now()), p_intent, coalesce(p_applied, false))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.record_payment(text, numeric, text, timestamptz, text, boolean)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- claim_payment — «я оплатил(а) с другой почты».
--
-- Человек вводит номер заказа из чека Prodamus. Если такой платёж есть и его
-- ещё никто не забрал, его адрес закрепляется за этим аккаунтом, и оплата
-- применяется так, как применилась бы сразу: план — подпиской, всё остальное —
-- единственным ожидающим заказом на курс.
--
-- Возвращает, что получилось: 'subscription', 'course' или 'linked' (адрес
-- привязан, но активировать было нечего — например, заказ на курс не был
-- оформлен заранее; тогда доступ откроется, как только тренер подтвердит, и
-- дальше этот адрес уже свой).
--
-- И три ответа про неудачу, тоже строкой: 'not_found' — такого номера нет или
-- платёж уже забран; 'email_taken' — адрес закреплён за другим аккаунтом;
-- 'rate_limited' — слишком много попыток.
--
-- **Почему неудача — это `return`, а не `raise`.** Ограничение на перебор
-- считается здесь же, в `order_throttle`, и исключение в plpgsql откатывает всё,
-- что функция успела сделать, — в том числе этот счётчик. То есть на `raise`
-- неудачная попытка обнуляла бы собственную цену, и перебор номеров был бы
-- бесплатным: ровно та дыра, ради которой счётчик и заведён. Первый вариант
-- этой функции так и падал, и тест в supabase/tests/90 это поймал.
--
-- Лимит — десять попыток в час на аккаунт, в том же ведре, что и заказы с
-- лендинга. Неудачная стоит столько же, сколько удачная.
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
      v_mine::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at);
    v_result := 'subscription';
  else
    if public.apply_course_payment(
         v_mine::text, v_payment.provider_ref, v_payment.paid_at) is not null then
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
