-- =============================================================================
-- 0019 — первая тренировка бесплатно, и активация курса без участия тренера.
--
-- Две независимые вещи, которые попали в один файл потому, что обе про одно:
-- путь человека от «посмотрел» до «оплатил» больше нигде не упирается в
-- ожидание.
--
-- ## 1. Пробная тренировка
--
-- До сих пор курс был заперт ровно в одном настоящем месте: insert-политика
-- `workout_sessions` требовала активную покупку. Всё остальное — тусклая
-- карточка, заглушка «Этого курса у тебя пока нет» — это клиент, и клиент
-- переписывается. Тексты тренировок и так читает любой вошедший (`courses` и
-- `workouts` открыты на select), а первая тренировка курса ещё и целиком
-- напечатана на его странице сайта в блоке «Пример тренировки». То есть мы
-- ничего не раздаём заново — мы разрешаем **выполнить и записать**.
--
-- Правило: начать сессию на чужом курсе можно, **пока на нём нет ни одной
-- завершённой**. Не флаг на курсе и не отдельная таблица — вычитание из того,
-- что уже есть, как пробная неделя клуба сделана вычитанием из `activated_at`.
-- Оно не может разойтись с покупкой и не требует, чтобы кто-то его выключал.
--
-- **Чего оно намеренно не делает.** Оно не проверяет, что узел — первый.
-- Порядка узлов база не знает вовсе: `public.courses` это allowlist из одного
-- `id`, а порядок живёт в `admin_course_days` и в скомпилированном контенте.
-- Клиент предлагает только первый узел, остальные заперты; тот, кто подделает
-- запрос, получит одну запись о тренировке, текст которой и так открыт. Приз
-- не стоит связывания политики с таблицей дней.
--
-- ## 2. Активация по оплате
--
-- Раньше курс включал тренер руками в админке. Подписки при этом активировались
-- сами — `prodamus-webhook` → `apply_subscription_payment`. Асимметрия была
-- видна покупателю: за подписку доступ открывался сразу, за курс — «обычно в
-- тот же день».
--
-- `apply_course_payment()` закрывает её. Какой курс оплачен, функция решает не
-- по сумме: суммы совпадают между продуктами, а короткие ссылки Prodamus
-- теряют параметры, которые им передали (docs/SETUP.md §7.1). Вместо этого она
-- читает то, что система уже знает, — **ожидающую покупку**. И форма на сайте,
-- и шторка разблокировки в приложении пишут `pending`-строку через
-- `create_order()` до того, как отправить человека платить; платёж эту строку
-- подтверждает. Никакой карты цен, которую надо держать в синхроне, не нужно.
--
-- Неоднозначность не угадывается: если ожидающих покупок несколько, функция
-- отвечает null и строка остаётся тренеру. Молчаливая активация не того курса
-- хуже, чем задержка.
--
-- Требует 0001_init.sql и 0002_functions.sql. От 0018_consents.sql **не
-- зависит** — файлы можно применять в любом порядке. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- purchases.provider_ref — идентификатор платежа у провайдера.
--
-- Нужен для идемпотентности: Prodamus доставляет уведомление повторно, если наш
-- ответ не дошёл, и дважды доставленный платёж должен активировать один раз.
-- Подписки хранят его в своей таблице с того же дня, покупки — нет, потому что
-- до сих пор их активировал человек, а человек не нажимает «Активировать»
-- дважды по ошибке сети.
-- -----------------------------------------------------------------------------
alter table public.purchases add column if not exists provider_ref text;

alter table public.purchases drop constraint if exists purchases_provider_ref_len;
alter table public.purchases add constraint purchases_provider_ref_len
  check (provider_ref is null or length(provider_ref) <= 120)
  not valid;

comment on column public.purchases.provider_ref is
  'Payment id at the provider (Prodamus order_id). Idempotency key for apply_course_payment().';

-- Частичный, потому что null-ов здесь большинство и они не конфликтуют.
create index if not exists purchases_provider_ref_idx
  on public.purchases (provider_ref)
  where provider_ref is not null;

-- =============================================================================
-- can_try_course — есть ли у вызывающего право на пробную тренировку здесь.
--
-- Security definer: `workout_sessions` читается по своей политике и так, но
-- функция вызывается **изнутри** политики этой же таблицы, и рекурсии там быть
-- не должно.
-- =============================================================================
create or replace function public.can_try_course(p_course_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select auth.uid() is not null
     and p_course_id is not null
     and p_course_id <> 'custom'
     and exists (select 1 from public.courses c where c.id = p_course_id)
     and not exists (
       select 1
       from public.workout_sessions s
       where s.user_id = auth.uid()
         and s.course_id = p_course_id
         and s.completed_at is not null
     );
$$;

comment on function public.can_try_course(text) is
  'True while the caller has no completed session in this course: the one free workout (0019).';

revoke execute on function public.can_try_course(text) from public, anon;
grant execute on function public.can_try_course(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Политика вставки сессий. Ветка `custom` не тронута — она про персональную
-- тренировку, назначенную тренером, и к покупкам курса отношения не имеет.
-- -----------------------------------------------------------------------------
drop policy if exists "workout_sessions: owner insert" on public.workout_sessions;
create policy "workout_sessions: owner insert"
  on public.workout_sessions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      (
        course_id <> 'custom'
        and (public.has_entitlement(course_id) or public.can_try_course(course_id))
      )
      or (course_id = 'custom' and public.can_play_custom(node_id))
    )
  );

-- =============================================================================
-- my_trained_courses — курсы, где у вызывающего есть хотя бы одна завершённая
-- тренировка. Один вызов вместо одного на курс.
--
-- Клиенту это нужно, чтобы не обещать бесплатную тренировку там, где она уже
-- потрачена. Считать это по `recentSessions` нельзя: там окно из двадцати
-- последних записей, и человек, сделавший пробу месяц назад и с тех пор много
-- тренировавшийся, выпал бы из него — экран предложил бы «Попробовать», а
-- политика отказала бы во вставке. Кнопка есть, нажатие отказано — худшее, что
-- можно показать.
--
-- Security definer, потому что ответ — это агрегат по своим же строкам, и
-- политика select на `workout_sessions` его и так разрешает; definer здесь
-- только ради того, чтобы план был один и тот же независимо от RLS.
-- =============================================================================
create or replace function public.my_trained_courses()
returns text[]
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(array_agg(distinct s.course_id), array[]::text[])
  from public.workout_sessions s
  where s.user_id = auth.uid()
    and s.completed_at is not null;
$$;

revoke execute on function public.my_trained_courses() from public, anon;
grant execute on function public.my_trained_courses() to authenticated;

-- =============================================================================
-- apply_course_payment — включить курс по оплате.
--
-- Возвращает id покупки, либо **null**, когда решить однозначно нельзя: вызвавший
-- (вебхук) тогда отвечает 200 и пишет в лог, а строка остаётся тренеру. Null —
-- это ответ, а не ошибка: исключение заставило бы Prodamus повторять доставку
-- вечно из-за того, что человек оплатил, не оформив заказ.
-- =============================================================================
create or replace function public.apply_course_payment(
  p_email        text,
  p_provider_ref text default null,
  p_paid_at      timestamptz default now(),
  p_course_id    text default null
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
  values (v_email, v_course, 'active', 'prodamus', p_paid_at, v_ref)
  on conflict (email, course_id) do update
    set status = 'active',
        source = 'prodamus',
        -- Первая активация ставит дату; повторная сохраняет исходную, потому что
        -- от неё отсчитывается и возврат, и пробная неделя клуба.
        activated_at = coalesce(purchases.activated_at, excluded.activated_at),
        provider_ref = coalesce(purchases.provider_ref, excluded.provider_ref),
        updated_at   = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.apply_course_payment(text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.apply_course_payment(text, text, timestamptz, text)
  to service_role;
