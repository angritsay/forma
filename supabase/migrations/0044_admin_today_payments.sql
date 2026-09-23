-- =============================================================================
-- 0044 — «Сегодня» и «Платежи»: админка отвечает, что случилось и что с этим делать.
--
-- Владелец открывает админку с телефона, и первое, что ей нужно, — не список покупок за всё
-- время, а «что произошло за сутки и что ждёт меня». Сегодня для этого надо обойти пять экранов
-- и телеграм. Здесь появляется одна сводка и один журнал платежей с кнопками.
--
--   1. `payments` помнит решение администратора: привязан к человеку или разобран без выдачи.
--   2. `subscriptions.status` принимает `refunded` — возврат подписки отличается от отмены: при
--      отмене оплаченный период дослуживает, при возврате доступ закрывается сразу.
--   3. `admin_today()` — счётчики и последние события за сутки: регистрации, оплаты, вступления
--      в клуб, пруфы на проверке, непривязанные платежи, обращения, занятия сегодня.
--   4. `admin_payments()` — журнал платежей с фильтром: непривязанные / все / занятия.
--   5. `admin_bind_payment()` — «Привязать к человеку»: открывает доступ тем же путём, что вебхук
--      и `claim_payment()` (`apply_course_payment` / `apply_subscription_payment`), и помечает
--      платёж привязанным.
--   6. `admin_dismiss_payment()` — «Отметить как разобранный»: без выдачи, просто убрать из очереди.
--   7. `admin_end_subscription()` — «Закрыть доступ сейчас» и «Возврат подписки».
--   8. Триггер канала владельца о подписках различает возврат и закрытие доступа.
--   9. Триггеры о платежах и пруфах кладут id платежа и id клуба — для ссылки из телеграма прямо
--      на нужный экран админки.
--  10. `claim_payment()` не отдаёт платёж, по которому администратор уже решил.
--
-- Не деструктивна: новые колонки, расширенная проверка статуса (новое значение, старые остаются),
-- новые функции, пересозданные функции с тем же поведением плюс описанное. Данные не удаляются.
-- Требует 0005, 0011, 0014, 0020, 0027, 0038–0043. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Решение по платежу.
--
-- `applied` отвечает на вопрос «открылся ли доступ», и его смысл здесь не меняется. Решение
-- администратора — отдельно: «разобран без выдачи» не должен выглядеть как «доступ открыт», а
-- «привязан руками» полезно отличать от «привязался сам».
-- -----------------------------------------------------------------------------
alter table public.payments add column if not exists resolution   text;
alter table public.payments add column if not exists resolved_at  timestamptz;
alter table public.payments add column if not exists resolved_by  citext;
alter table public.payments add column if not exists bound_email  citext;
alter table public.payments add column if not exists resolve_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payments_resolution_check') then
    alter table public.payments add constraint payments_resolution_check
      check (resolution is null or resolution in ('bound', 'dismissed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_resolve_note_len') then
    alter table public.payments add constraint payments_resolve_note_len
      check (resolve_note is null or length(resolve_note) <= 500);
  end if;
end $$;

comment on column public.payments.resolution is
  'Admin decision (0044): bound = access opened by hand for bound_email; dismissed = looked at, nothing granted.';

-- Очередь «непривязанных» — ровно то, что читают «Сегодня» и вкладка «Платежи».
create index if not exists payments_unresolved_idx
  on public.payments (paid_at desc)
  where not applied and resolution is null;

-- -----------------------------------------------------------------------------
-- 2. Возврат подписки — свой статус.
--
-- Проверка пересоздаётся с тем же списком плюс `refunded`: ни одна существующая строка её не
-- нарушает. `subscription_live()` считает живыми только `active` и `cancelled`, так что
-- возвращённая подписка доступа не даёт — ничего больше менять не нужно.
-- -----------------------------------------------------------------------------
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'cancelled', 'refunded'));

-- -----------------------------------------------------------------------------
-- 3. admin_today — что случилось за сутки и что ждёт решения.
--
-- Один вызов, один jsonb: на телефоне каждый запрос — это полсекунды, а на главной их семь.
-- В каждом разделе — `count` и до трёх последних строк (`latest`).
--
-- «Обращения без ответа» зависят от 0045 (колонка `status` у `support_requests`). Если её ещё
-- нет — считаются обращения за сутки, и `supportMode` говорит приложению, какую подпись ставить.
-- Проверка через каталог и `execute`: иначе функция не создалась бы на базе без 0045.
-- -----------------------------------------------------------------------------
create or replace function public.admin_today()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_since   timestamptz := now() - interval '24 hours';
  -- Тренер и владелец живут по Москве: «сегодня» — это московский день.
  v_today   date := (now() at time zone 'Europe/Moscow')::date;
  v_support int := 0;
  v_mode    text := 'none';
  v_out     jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if to_regclass('public.support_requests') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'support_requests' and column_name = 'status'
    ) then
      execute 'select count(*)::int from public.support_requests where accepted and status = ''new'''
        into v_support;
      v_mode := 'unanswered';
    else
      select count(*)::int into v_support
      from public.support_requests r
      where r.accepted and r.created_at > v_since;
      v_mode := 'recent';
    end if;
  end if;

  select jsonb_build_object(
    'signups', jsonb_build_object(
      'count', (select count(*) from public.profiles p where p.created_at > v_since),
      'latest', coalesce((
        select jsonb_agg(x order by x.at desc)
        from (
          select p.email::text as email, p.display_name as name, p.created_at as at
          from public.profiles p
          where p.created_at > v_since
          order by p.created_at desc
          limit 3
        ) x
      ), '[]'::jsonb)
    ),
    'payments', jsonb_build_object(
      'count', (select count(*) from public.payments y where y.paid_at > v_since),
      'latest', coalesce((
        select jsonb_agg(x order by x.at desc)
        from (
          select y.id, y.email::text as email, y.amount, y.currency, y.intent, y.provider,
                 y.applied, y.paid_at as at
          from public.payments y
          where y.paid_at > v_since
          order by y.paid_at desc
          limit 3
        ) x
      ), '[]'::jsonb)
    ),
    'clubJoins', jsonb_build_object(
      'count', (
        select count(*)
        from public.marathon_members m
        join public.marathons k on k.id = m.marathon_id
        where k.is_club and m.status = 'active' and m.created_at > v_since
      ),
      'latest', coalesce((
        select jsonb_agg(x order by x.at desc)
        from (
          select m.email::text as email,
                 coalesce(m.display_name, pr.display_name) as name,
                 m.marathon_id as "marathonId",
                 (k.team_size > 1) as duo,
                 m.created_at as at
          from public.marathon_members m
          join public.marathons k on k.id = m.marathon_id
          left join public.profiles pr on pr.email = m.email
          where k.is_club and m.status = 'active' and m.created_at > v_since
          order by m.created_at desc
          limit 3
        ) x
      ), '[]'::jsonb)
    ),
    -- Та же очередь, что у фильтра «ждут проверки» в админке клуба (0027).
    'proofs', (
      select jsonb_build_object(
        'count', count(*),
        'marathonId', case when count(distinct s.marathon_id) = 1
                           then (array_agg(s.marathon_id))[1] end,
        'latest', coalesce((
          select jsonb_agg(x order by x.at desc)
          from (
            select m.email::text as email, s2.marathon_id as "marathonId",
                   s2.day_index as day, s2.attempt, s2.submitted_at as at
            from public.marathon_submissions s2
            join public.marathon_members m on m.id = s2.member_id
            where s2.voided_at is null and s2.reviewed_at is null and s2.attempt > 1
            order by s2.submitted_at desc
            limit 3
          ) x
        ), '[]'::jsonb)
      )
      from public.marathon_submissions s
      where s.voided_at is null and s.reviewed_at is null and s.attempt > 1
    ),
    'unclaimed', jsonb_build_object(
      'count', (
        select count(*) from public.payments y
        where not y.applied and y.resolution is null and y.intent <> 'session'
      ),
      'latest', coalesce((
        select jsonb_agg(x order by x.at desc)
        from (
          select y.id, y.email::text as email, y.amount, y.currency, y.intent, y.provider,
                 y.paid_at as at
          from public.payments y
          where not y.applied and y.resolution is null and y.intent <> 'session'
          order by y.paid_at desc
          limit 3
        ) x
      ), '[]'::jsonb)
    ),
    'support', jsonb_build_object('count', v_support, 'mode', v_mode),
    'bookings', jsonb_build_object(
      'count', (
        select count(*) from public.coach_bookings b
        where b.status = 'active'
          and (b.starts_at at time zone 'Europe/Moscow')::date = v_today
      ),
      'latest', coalesce((
        select jsonb_agg(x order by x.at)
        from (
          select b.email::text as email, b.starts_at as at, b.event_name as name
          from public.coach_bookings b
          where b.status = 'active'
            and (b.starts_at at time zone 'Europe/Moscow')::date = v_today
          order by b.starts_at
          limit 3
        ) x
      ), '[]'::jsonb)
    )
  ) into v_out;

  return v_out;
end;
$$;

comment on function public.admin_today() is
  'Admin-only: the last 24 hours and what waits for a decision, as one jsonb (0044). Read-only.';

revoke execute on function public.admin_today() from public, anon;
grant execute on function public.admin_today() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. admin_payments — журнал платежей.
--
-- Фильтры: `unclaimed` — деньги пришли, доступ не открылся и решения ещё нет; `sessions` —
-- занятия с тренером; `all` — всё. `p_id` — одна строка по id: так открывается ссылка из
-- телеграма, какой бы давности ни был платёж.
--
-- `course_id` — какой курс открыл этот платёж (по номеру заказа в `purchases`), `account_email` —
-- чей аккаунт его забрал через «оплатил(а) с другой почты». `total` — сколько строк под фильтром,
-- для «показать ещё».
-- -----------------------------------------------------------------------------
create or replace function public.admin_payments(
  p_filter text default 'unclaimed',
  p_limit  int  default 50,
  p_offset int  default 0,
  p_id     uuid default null
)
returns table (
  id            uuid,
  email         text,
  amount        numeric,
  currency      text,
  intent        text,
  provider      text,
  provider_ref  text,
  paid_at       timestamptz,
  applied       boolean,
  claimed_at    timestamptz,
  account_email text,
  resolution    text,
  resolved_at   timestamptz,
  bound_email   text,
  resolve_note  text,
  course_id     text,
  has_account   boolean,
  total         bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_filter text := coalesce(nullif(btrim(p_filter), ''), 'unclaimed');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_filter not in ('unclaimed', 'all', 'sessions') then
    raise exception 'invalid_filter' using errcode = 'P0001';
  end if;

  return query
  select y.id, y.email::text, y.amount, y.currency, y.intent, y.provider, y.provider_ref,
         y.paid_at, y.applied, y.claimed_at,
         (select pr.email::text from public.profiles pr where pr.id = y.claimed_by),
         y.resolution, y.resolved_at, y.bound_email::text, y.resolve_note,
         (select pu.course_id from public.purchases pu
           where y.provider_ref is not null and pu.provider_ref = y.provider_ref
           limit 1),
         exists (select 1 from public.profiles pr where pr.email = y.email),
         count(*) over ()
  from public.payments y
  where case
          when p_id is not null then y.id = p_id
          when v_filter = 'unclaimed' then
            not y.applied and y.resolution is null and y.intent <> 'session'
          when v_filter = 'sessions' then y.intent = 'session'
          else true
        end
  order by y.paid_at desc, y.id
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.admin_payments(text, int, int, uuid) is
  'Admin-only: the payments journal, filtered unclaimed / all / sessions, or one row by id (0044).';

revoke execute on function public.admin_payments(text, int, int, uuid) from public, anon;
grant execute on function public.admin_payments(text, int, int, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. admin_bind_payment — «Привязать к человеку».
--
-- Логика выдачи не повторяется здесь, а зовётся — ровно те функции, что открывают доступ после
-- вебхука и после `claim_payment()`. Касса передаётся из строки платежа, как в `claim_payment()`
-- (0038): деньги пришли через Prodamus или lava.top, и журнал должен говорить правду; то, что
-- привязал человек, записано в самом платеже (`resolution = 'bound'`, `resolved_by`).
--
-- Почему здесь снимаются клеймы. `apply_*` отказываются работать с пользовательским JWT — это
-- дверь, за которой кто угодно выписал бы себе год подписки. Здесь звонящий проверен
-- `is_admin()`, а план, номер заказа и дата прочитаны из строки `payments`, которую записал
-- вебхук после сошедшейся подписи. Произвольный здесь только адрес — и выбирает его администратор.
-- `set_config(..., true)` — на транзакцию, и значение возвращается сразу после вызова.
--
-- Курс. Если у человека ровно один ожидающий заказ, курс берётся из него; иначе администратор
-- называет курс (`p_course_id`). Без курса и без заказа — `no_order`: ничего не записано.
--
-- Если у человека есть аккаунт, а почта в кассе другая, адрес кассы закрепляется за ним
-- (`payment_emails`), как это делает `claim_payment()`: следующее продление с той же почты
-- откроется само. Чужой уже закреплённый адрес не трогается.
--
-- Ответ: `subscription` или `course`.
-- -----------------------------------------------------------------------------
create or replace function public.admin_bind_payment(
  p_payment_id uuid,
  p_email      text,
  p_course_id  text default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_admin   citext := public.current_email();
  v_email   citext;
  v_payment public.payments%rowtype;
  v_user    uuid;
  v_claims  text;
  v_result  text;
  v_course  text := nullif(btrim(coalesce(p_course_id, '')), '');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  v_email := public.normalize_email(p_email);

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_payment.applied then
    raise exception 'already_applied' using errcode = 'P0001';
  end if;
  if v_payment.intent = 'session' then
    -- Занятие ничего не открывает (0039): привязывать нечего.
    raise exception 'session_payment' using errcode = 'P0001';
  end if;

  v_claims := coalesce(current_setting('request.jwt.claims', true), '');
  perform set_config('request.jwt.claims', '', true);

  if v_payment.intent in ('monthly', 'annual') then
    perform public.apply_subscription_payment(
      v_email::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at,
      coalesce(v_payment.provider, 'prodamus'));
    v_result := 'subscription';
  elsif public.apply_course_payment(
          v_email::text, v_payment.provider_ref, v_payment.paid_at, v_course,
          coalesce(v_payment.provider, 'prodamus')) is not null then
    v_result := 'course';
  end if;

  perform set_config('request.jwt.claims', v_claims, true);

  if v_result is null then
    raise exception 'no_order' using errcode = 'P0001';
  end if;

  select pr.id into v_user from public.profiles pr where pr.email = v_email limit 1;

  if v_user is not null and v_payment.email <> v_email
     and not exists (select 1 from public.payment_emails e where e.email = v_payment.email) then
    insert into public.payment_emails (user_id, email, linked_by)
    values (v_user, v_payment.email, coalesce(v_payment.provider_ref, 'admin'));
  end if;

  update public.payments
  set applied     = true,
      resolution  = 'bound',
      resolved_at = now(),
      resolved_by = v_admin,
      bound_email = v_email,
      claimed_by  = coalesce(claimed_by, v_user),
      claimed_at  = coalesce(claimed_at, case when v_user is not null then now() end)
  where id = v_payment.id;

  return v_result;
end;
$$;

comment on function public.admin_bind_payment(uuid, text, text) is
  'Admin-only: open access for an unapplied payment to the given email via apply_* and mark it bound (0044).';

revoke execute on function public.admin_bind_payment(uuid, text, text) from public, anon;
grant execute on function public.admin_bind_payment(uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. admin_dismiss_payment — «Отметить как разобранный».
--
-- Ничего не выдаёт. Платёж уходит из очереди непривязанных и из счётчика «Сегодня»: дубль,
-- возврат, сделанный в кассе, тестовая оплата. Привязать его потом всё ещё можно из «Все».
-- -----------------------------------------------------------------------------
create or replace function public.admin_dismiss_payment(p_payment_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  update public.payments
  set resolution   = 'dismissed',
      resolved_at  = now(),
      resolved_by  = public.current_email(),
      resolve_note = left(nullif(btrim(coalesce(p_note, '')), ''), 500)
  where id = p_payment_id
    and not applied;

  if not found then
    if exists (select 1 from public.payments where id = p_payment_id) then
      raise exception 'already_applied' using errcode = 'P0001';
    end if;
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_dismiss_payment(uuid, text) from public, anon;
grant execute on function public.admin_dismiss_payment(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. admin_end_subscription — «Закрыть доступ сейчас» и «Возврат подписки».
--
-- Оба закрывают доступ в эту же секунду (`expires_at = now()`), в отличие от «Отменить»
-- (`admin_set_subscription(…, 'cancelled')`), где оплаченный период дослуживает.
--
--   * `p_refund = false` → статус `cancelled`: доступ закрыт, продлений не ждём.
--   * `p_refund = true`  → статус `refunded`: то же плюс отметка, что деньги вернули.
--
-- Сами деньги эта функция не возвращает и не может: возврат делается руками в кассе (Prodamus
-- или lava.top). Канал владельца узнаёт о закрытии триггером ниже.
-- -----------------------------------------------------------------------------
create or replace function public.admin_end_subscription(p_email text, p_refund boolean default false)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- Подписка одна на адрес (`unique (email)`, 0005), поэтому адрес и есть ключ: так её закрывают
  -- и из списка подписок, и со страницы человека.
  v_email := public.normalize_email(p_email);

  update public.subscriptions
  set status     = case when coalesce(p_refund, false) then 'refunded' else 'cancelled' end,
      expires_at = least(coalesce(expires_at, now()), now()),
      updated_at = now()
  where email = v_email;

  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.admin_end_subscription(text, boolean) is
  'Admin-only: end the subscription of this email now; p_refund marks it refunded (0044). Money goes back by hand in the till.';

revoke execute on function public.admin_end_subscription(text, boolean) from public, anon;
grant execute on function public.admin_end_subscription(text, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Канал владельца: возврат и закрытие доступа — свои поводы.
--
-- Тот же триггер, что в 0040, плюс две первые ветки. Без них «Закрыть доступ сейчас» у
-- отменённой подписки не дал бы сообщения вовсе (статус не менялся), а у активной выглядел бы
-- как «Клуб отменён» с датой «доступ до» — которая уже наступила.
-- -----------------------------------------------------------------------------
create or replace function public.subscriptions_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind text;
begin
  begin
    if new.status = 'refunded' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'refunded') then
      v_kind := 'club_refunded';
    elsif tg_op = 'UPDATE'
          and new.status = 'cancelled'
          and new.expires_at is not null and new.expires_at <= now()
          and old.status in ('active', 'cancelled')
          and old.expires_at is not null and old.expires_at > now() then
      v_kind := 'club_closed';
    elsif new.status = 'active' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'active') then
      v_kind := 'club_paid';
    elsif new.status = 'active' and old.expires_at is distinct from new.expires_at then
      v_kind := 'club_renewed';
    elsif new.status = 'cancelled' and coalesce(old.status, '') <> 'cancelled' then
      v_kind := 'club_cancelled';
    end if;

    if v_kind is not null then
      perform public.enqueue_admin(
        'club',
        v_kind,
        v_kind || ':' || new.id::text || ':' || coalesce(new.expires_at::text, 'none'),
        jsonb_build_object(
          'email', new.email::text,
          'plan', new.plan,
          'source', coalesce(new.source, ''),
          'expiresAt', coalesce(new.expires_at::text, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. id для ссылок из телеграма.
--
-- Тексты 0043 (платежи) и 0040 (пруфы) плюс одно поле: `paymentId` и `marathonId`. По ним
-- `telegram-notify` собирает ссылку прямо на платёж или на отчёты нужного клуба.
-- -----------------------------------------------------------------------------
create or replace function public.payments_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  begin
    if new.intent = 'session' then
      perform public.enqueue_admin(
        'sessions',
        'session_paid',
        'session_paid:' || new.id::text,
        jsonb_build_object(
          'paymentId', new.id::text,
          'email', new.email::text,
          'amount', coalesce(new.amount::text, ''),
          'currency', coalesce(new.currency, ''),
          'provider', coalesce(new.provider, ''),
          'ref', coalesce(new.provider_ref, '')
        )
      );
    elsif not new.applied then
      perform public.enqueue_admin(
        case when new.intent in ('monthly', 'annual') then 'club' else 'courses' end,
        'payment_unclaimed',
        'payment_unclaimed:' || new.id::text,
        jsonb_build_object(
          'paymentId', new.id::text,
          'email', new.email::text,
          'amount', coalesce(new.amount::text, ''),
          'currency', coalesce(new.currency, ''),
          'intent', new.intent,
          'provider', coalesce(new.provider, ''),
          'ref', coalesce(new.provider_ref, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

create or replace function public.submissions_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email text;
begin
  begin
    if new.attempt > coalesce(old.attempt, 0) and new.attempt > 1 then
      select m.email::text into v_email
      from public.marathon_members m
      where m.id = new.member_id;

      perform public.enqueue_admin(
        'club',
        'proof_resubmitted',
        'proof_resubmitted:' || new.id::text || ':' || new.attempt::text,
        jsonb_build_object(
          'email', coalesce(v_email, ''),
          'marathonId', new.marathon_id::text,
          'attempt', new.attempt,
          'day', new.day_index,
          'reason', coalesce(new.void_reason, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 10. claim_payment — не отдаёт платёж, по которому уже решили.
--
-- Текст 0043 плюс одно условие в поиске платежа: `resolution is null`. Без него платёж,
-- привязанный администратором к человеку без аккаунта (`claimed_by` пуст), мог бы забрать ещё
-- кто-то по номеру из чека и получить второй период подписки за те же деньги. Разобранный без
-- выдачи — туда же: это решение, и пересматривает его администратор, а не номер заказа.
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
    and claimed_by is null
    and resolution is null
  for update;

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

  /*
   * Применяем — на собственный адрес аккаунта. Почему здесь снимаются клеймы и почему это не
   * дыра — подробно в 0020/0039: план, номер заказа и дата прочитаны из строки `payments`,
   * записанной вебхуком после сошедшейся подписи, а адрес — подтверждённый адрес звонящего.
   */
  v_claims := coalesce(current_setting('request.jwt.claims', true), '');
  perform set_config('request.jwt.claims', '', true);

  if v_payment.intent = 'session' then
    -- Занятие открывать нечем (0039): адрес закреплён выше, и это всё, что здесь можно сделать.
    v_result := 'linked';
  elsif v_payment.intent in ('monthly', 'annual') then
    perform public.apply_subscription_payment(
      v_mine::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at,
      coalesce(v_payment.provider, 'prodamus'));
    v_result := 'subscription';
  elsif public.apply_course_payment(
          v_mine::text, v_payment.provider_ref, v_payment.paid_at, null,
          coalesce(v_payment.provider, 'prodamus')) is not null then
    v_result := 'course';
  else
    -- Ни одного ожидающего заказа (или несколько). Платёж не трогаем — его заберут снова.
    v_result := 'no_order';
    v_mark := false;
  end if;

  perform set_config('request.jwt.claims', v_claims, true);

  if v_mark then
    update public.payments
    set claimed_by = v_uid,
        claimed_at = now(),
        applied    = true
    where id = v_payment.id;
  else
    -- Зеркало, а не условие: сбой очереди не должен стоить человеку ответа (0040).
    begin
      perform public.enqueue_admin(
        'courses',
        'claim_no_order',
        'claim_no_order:' || v_payment.id::text,
        jsonb_build_object(
          'paymentId', v_payment.id::text,
          'email', v_mine::text,
          'payEmail', v_payment.email::text,
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
