-- =============================================================================
-- 0043 — серверные исправления после аудита: пара, права, очки, деньги, очередь.
--
-- Мелкие правки, собранные в одну миграцию: каждая сама по себе — строчка-две, а применять их
-- владелец будет одной кнопкой. Каждая описана у себя в разделе; здесь — сводка.
--
--   1. `club_duo_leave()` — расторгнуть свою пару из приложения. Кнопка «Расторгнуть пару» звала
--      `club_duo_break(uuid)`, а та с 0034 закрыта от всех, кроме базы: кнопка отвечала отказом.
--   2. Права сервисной роли на `coach_bookings`: `google-calendar-sync` читает таблицу напрямую, и
--      без права сверка с календарём молча не находила отменённых встреч (история 0031).
--   3. `get_my_totals()` — очки за тренировки, выданные тренером лично, не считаются, как на
--      доске (0037). Иначе «мои очки» на главной и в таблице расходились.
--   3а. `get_leaderboard()` — 0037 вернула в доску удалённую в 0015 таблицу шагов, и общий
--      рейтинг падал на каждом вызове.
--   4. `get_shared_custom_workout()` отдаёт английские название и описание (0032).
--   5–6. `payments.currency` и `record_payment(…, p_currency)` — сумма без валюты в журнале
--      lava.top читалась как рубли.
--   7. Занятия с тренером — `applied = true`: открывать нечего, значит и «непривязанными» они не
--      бывают. Старые строки поправлены.
--   8. `claim_payment()` — курс без ожидающего заказа больше не «сжигает» платёж: ответ `no_order`
--      и сообщение в тему «Курсы».
--   9. Канал владельца видит валюту в «Платёж не привязан» и «Занятие оплачено».
--  10. `telegram_outbox_due()` — рассыльщик берёт сначала тех, кому есть куда писать, и очередь из
--      людей без телеграма больше не забивает пачку.
--
-- Не деструктивна: одна новая колонка, новые функции, пересозданные функции с тем же поведением
-- плюс исправление, одно обновление флага у строк-занятий. Из данных ничего не удаляется;
-- `drop function` — только у двух функций, чей список аргументов или колонок меняется, и обе
-- создаются заново тут же, с прежними правами.
-- Требует 0014, 0015, 0020, 0032, 0034, 0037, 0038, 0039, 0040. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Расторгнуть свою пару.
--
-- `club_duo_break(uuid)` принимает id команды и потому не может быть дверью наружу: кто угодно
-- вписал бы чужой id и развёл бы чужую пару. Здесь аргументов нет вовсе — команда ищется по
-- адресу звонящего в дуо-клубе, то есть разорвать можно только свою.
--
-- Коды ошибок, а не текст, как у приглашений (0034): их читает приложение.
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_leave()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid   := public.club_marathon(true);
  v_team  uuid;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;

  select m.team_id into v_team
  from public.marathon_members m
  where m.marathon_id = v_club and m.email = v_email and m.status = 'active';

  if v_team is null then
    raise exception 'no_pair' using errcode = 'P0001';
  end if;

  -- Команда удаляется целиком; у напарника `team_id` обнуляется каскадом, и в понедельник
  -- автоподбор даст обоим новых (0034). Очки остаются на сданных заданиях.
  perform public.club_duo_break(v_team);
end;
$$;

revoke execute on function public.club_duo_leave() from public, anon;
grant execute on function public.club_duo_leave() to authenticated;

comment on function public.club_duo_leave() is
  'Расторгнуть собственную пару в дуо-клубе. Команда ищется по адресу звонящего; ошибки no_club / no_pair.';

-- -----------------------------------------------------------------------------
-- 2. Права сервисной роли на брони.
--
-- `google-calendar-sync` после полного прохода по календарю читает активные брони из
-- `coach_bookings` сервисным ключом, чтобы найти пропавшие и отменить их. 0031 выдала права
-- таблицам, которые тогда трогали функции, — эту пропустила: брони пишутся через
-- `apply_coach_booking()`, а прямое чтение появилось позже. Отказ `42501` на этом шаге
-- логировался и глотался, и удалённая из календаря встреча так и висела на вкладке «Тренер».
--
-- Остальные таблицы, которые функции трогают напрямую, проверены: `telegram_outbox`,
-- `payments`, `payment_emails`, `profiles` — 0031; `admin_outbox` — 0040; `support_requests` —
-- 0042. Всё прочее идёт через функции `security definer`.
-- -----------------------------------------------------------------------------
grant select, update on public.coach_bookings to service_role;

-- -----------------------------------------------------------------------------
-- 3. «Мои очки» — по тем же правилам, что доска.
--
-- С 0037 доска не считает тренировки, выданные тренером лично (`course_id = 'custom'`): приз
-- недели — час с тренером, и оплаченная персональная работа не должна давать в нём фору. Главная
-- показывала сумму по-старому, и человек видел у себя больше очков, чем в таблице, без
-- объяснения. Число тренировок и минуты считают всё — это объём работы, а не место в гонке.
-- -----------------------------------------------------------------------------
create or replace function public.get_my_totals()
returns table (points bigint, workouts bigint, minutes bigint)
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  select
    -- Как на доске: выданное тренером лично в очки не идёт (0037), и очки одной тренировки
    -- зажаты тем же потолком 0…375 (0015), иначе «за всё время» на доске и здесь расходились бы.
    coalesce((select sum(least(greatest(ws.points, 0), 375)) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null
                and ws.completed_at <= now()
                and ws.course_id is distinct from 'custom'), 0)::bigint as points,
    coalesce((select count(*) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint as workouts,
    coalesce((select sum(ws.duration_sec) from public.workout_sessions ws
              where ws.user_id = auth.uid() and ws.completed_at is not null), 0)::bigint / 60 as minutes;
$$;

revoke execute on function public.get_my_totals() from public, anon;
grant execute on function public.get_my_totals() to authenticated;

-- -----------------------------------------------------------------------------
-- 3а. Доска — снова без шагов.
--
-- 0037 пересоздала `get_leaderboard()` из текста 0002, а не 0015, и вернула в неё подсчёт
-- `daily_logs` — таблицы, которую 0015 удалила. На базе, где применены обе, общая доска отвечала
-- `42P01` («relation daily_logs does not exist») на каждый вызов: plpgsql разбирает запрос только
-- при выполнении, поэтому сама миграция прошла молча. Здесь — текст 0015 плюс правило 0037.
-- -----------------------------------------------------------------------------
create or replace function public.get_leaderboard(
  p_period    text default 'week',
  p_course_id text default null,
  p_limit     int  default 100
)
returns table (
  user_id      uuid,
  display_name text,
  avatar_seed  text,
  points       bigint,
  rank         bigint,
  is_me        boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  -- Defence in depth: the engine ceiling (basePoints 250 × harder 1.25 × streak 1.2).
  -- workout_sessions_guard already clamps per workout, but the board is the one place
  -- every athlete sees, so it clamps again.
  c_max_session_points constant int := 375;

  v_me      uuid := auth.uid();
  v_limit   int  := least(greatest(coalesce(p_limit, 100), 1), 500);
  v_week_ts timestamp;
  v_from    timestamptz;
begin
  if v_me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_period is null or p_period not in ('week', 'all') then
    raise exception 'invalid_period' using errcode = 'P0001';
  end if;

  if p_course_id is not null and p_course_id !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid_course' using errcode = 'P0001';
  end if;

  -- Monday 00:00 UTC of the current ISO week.
  v_week_ts := date_trunc('week', now() at time zone 'utc');
  v_from    := v_week_ts at time zone 'utc';

  return query
  with totals as (
    select ws.user_id as uid,
           sum(least(greatest(ws.points, 0), c_max_session_points))::bigint as pts
    from public.workout_sessions ws
    where ws.completed_at is not null
      and ws.completed_at <= now()
      and (p_period = 'all' or ws.completed_at >= v_from)
      and (p_course_id is null or ws.course_id = p_course_id)
      -- Выданная тренером лично тренировка доску не двигает (0037).
      and ws.course_id is distinct from 'custom'
    group by ws.user_id
  ),
  ranked as (
    select t.uid, t.pts, rank() over (order by t.pts desc, t.uid) as rnk
    from totals t
    where t.pts > 0
  ),
  top as (
    select r.uid, r.pts, r.rnk from ranked r order by r.rnk, r.uid limit v_limit
  ),
  me as (
    select r.uid, r.pts, r.rnk from ranked r where r.uid = v_me
    union all
    -- Caller without points yet: last place, 0 points.
    select v_me, 0::bigint, (select count(*) from ranked) + 1
    where not exists (select 1 from ranked r where r.uid = v_me)
  ),
  rows_out as (
    select * from top
    union
    select * from me
  )
  select
    ro.uid,
    -- Clamped again on the way out: this row is relayed to every other athlete.
    left(coalesce(nullif(trim(p.display_name), ''), 'Athlete ' || left(ro.uid::text, 4)), 60),
    left(coalesce(p.avatar_seed, left(ro.uid::text, 8)), 64),
    ro.pts,
    ro.rnk,
    ro.uid = v_me
  from rows_out ro
  left join public.profiles p on p.id = ro.uid
  order by ro.rnk, ro.uid;
end;
$$;

revoke execute on function public.get_leaderboard(text, text, int) from public, anon;
grant execute on function public.get_leaderboard(text, text, int) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Тренировка по ссылке — с английской половиной.
--
-- 0032 завела `title_en` и `description_en`, а функция, которой открывают ссылку, отдавала только
-- русские. Английский читатель, которому скинули ссылку, видел русское название там, где перевод
-- уже был. Состав возвращаемых колонок меняется — значит `drop` и заново, с теми же правами.
-- -----------------------------------------------------------------------------
drop function if exists public.get_shared_custom_workout(text);

create function public.get_shared_custom_workout(p_token text)
returns table (
  id uuid, short_id text, title text, description text, structure jsonb, est_sec int, points int,
  title_en text, description_en text
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select w.id, w.short_id, w.title, w.description, w.structure, w.est_sec, w.points,
         w.title_en, w.description_en
  from public.custom_workouts w
  where w.share_token = p_token and w.is_archived = false;
$$;

revoke execute on function public.get_shared_custom_workout(text) from public, anon;
grant execute on function public.get_shared_custom_workout(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Валюта платежа.
--
-- Prodamus берёт только рубли, и пока касса была одна, сумма без валюты читалась однозначно.
-- lava.top присылает `currency` рядом с суммой, и «19» в журнале — это доллары или евро, а не 19 ₽.
-- Старые строки остаются с `null`: какой валютой они были, по ним уже не сказать, а угадывать
-- рубли значило бы соврать про строки lava.top, пришедшие до этой миграции.
-- -----------------------------------------------------------------------------
alter table public.payments add column if not exists currency text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_currency_format'
  ) then
    alter table public.payments add constraint payments_currency_format
      check (currency is null or currency ~ '^[A-Z]{3}$') not valid;
  end if;
end $$;

comment on column public.payments.currency is
  'ISO 4217 code the amount is in: RUB from Prodamus, whatever lava.top reported. Null on rows written before 0043.';

-- -----------------------------------------------------------------------------
-- 6. record_payment — с валютой.
--
-- Новый необязательный аргумент меняет сигнатуру, поэтому старая функция удаляется, как в 0038:
-- две перегрузки рядом сделали бы вызов без валюты неоднозначным. Права выдаются заново и явно.
--
-- Вебхук, выложенный раньше этой миграции, зовёт функцию без `p_currency` — умолчание `RUB`
-- делает этот вызов верным для Prodamus. lava-webhook передаёт валюту сам.
-- -----------------------------------------------------------------------------
drop function if exists public.record_payment(text, numeric, text, timestamptz, text, boolean, text);

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
  -- Касса, принёсшая платёж. Журнал читает владелец, и «откуда» — половина ответа.
  v_prov  text   := left(coalesce(nullif(btrim(p_provider), ''), 'prodamus'), 40);
  -- Код валюты. Что-то непохожее на три буквы — не повод потерять платёж: пишется `null`.
  v_cur   text   := upper(btrim(coalesce(p_currency, '')));
begin
  if v_email = '' then
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
      -- Уже записан. Если в прошлый раз он не привязался, а теперь привязался —
      -- отметим это; валюту допишем, если её не было. Больше ничего не трогаем.
      update public.payments
      set applied  = applied or coalesce(p_applied, false),
          currency = coalesce(currency, v_cur)
      where id = v_id;
      return v_id;
    end if;
  end if;

  insert into public.payments (email, amount, provider_ref, paid_at, intent, applied, provider, currency)
  values (v_email, p_amount, v_ref, coalesce(p_paid_at, now()), p_intent,
          coalesce(p_applied, false), v_prov, v_cur)
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
-- 7. Занятия с тренером не бывают «непривязанными».
--
-- Оплата часа ничего не открывает — куплено время, а не доступ, — и оба вебхука до сих пор
-- писали её с `applied = false`. Для журнала это значило «деньги пришли, доступ не открылся», и
-- каждое занятие попадало в счётчик непривязанных платежей (`payments-check`) рядом с настоящими
-- потерянными курсами. С этой миграции вебхуки пишут `true`; здесь — строки, записанные раньше.
--
-- Триггер канала владельца висит на `insert`, так что это обновление ничего не отправляет.
-- -----------------------------------------------------------------------------
update public.payments
set applied = true
where intent = 'session' and applied = false;

-- -----------------------------------------------------------------------------
-- 8. claim_payment — курс без заказа не сжигает платёж.
--
-- Раньше платёж помечался забранным (`claimed_by`, `applied = true`) до того, как выяснялось,
-- открылось ли что-нибудь. Для курса без ожидающего заказа ответ был `linked`, а платёж — уже
-- забран: второй раз его не найти, и человек, оформивший заказ потом, упирался в «такого номера
-- нет». Деньги при этом так и лежали без курса.
--
-- Теперь для курса платёж помечается, только если курс открылся. Иначе ответ `no_order`, платёж
-- остаётся ждать — после оформления заказа его можно забрать снова, — а в тему «Курсы» уходит
-- сообщение: человек заплатил, пришёл за курсом и не получил его, и это видно сразу, а не по
-- жалобе.
--
-- Адрес при этом закрепляется, как и раньше: номер заказа из чека — доказательство, что платёж
-- его, и это не зависит от того, нашёлся ли заказ.
--
-- `for update` на строке платежа — два одновременных нажатия больше не проходят оба.
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

-- -----------------------------------------------------------------------------
-- 9. «Платёж не привязан» — с валютой.
--
-- Тот же триггер, что в 0040, плюс `currency` в параметрах: «Сумма: 19» без валюты в канале
-- читается как рубли.
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

-- -----------------------------------------------------------------------------
-- 10. Очередь бота: сначала те, кому есть куда писать.
--
-- Рассыльщик брал 50 самых ранних строк в очереди и только потом искал, у кого из адресатов есть
-- телеграм. Строки людей без телеграма (а их большинство: покупка приходит раньше привязки)
-- живут до трёх дней и всё это время занимают пачку. Стоит накопиться полусотне таких — и
-- сообщение человеку с телеграмом не уходит, пока они не истекут.
--
-- Здесь отбор делает база: только строки, у адресата которых есть `telegram_id`, вместе с ним и
-- языком. Истёкшие строки сюда не попадают — их гасит сам рассыльщик, отдельным запросом.
-- Только для сервисной роли: в ответе адреса и id чатов.
-- -----------------------------------------------------------------------------
create or replace function public.telegram_outbox_due(p_limit int default 50)
returns table (
  id          uuid,
  email       text,
  kind        text,
  params      jsonb,
  attempts    int,
  expires_at  timestamptz,
  telegram_id bigint,
  locale      text
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select o.id, o.email::text, o.kind, o.params, o.attempts, o.expires_at,
         p.telegram_id, p.locale::text
  from public.telegram_outbox o
  join lateral (
    select pr.telegram_id, pr.locale
    from public.profiles pr
    where pr.email = o.email and pr.telegram_id is not null
    limit 1
  ) p on true
  where o.status = 'pending'
    and o.send_after <= now()
    and o.expires_at >= now()
  order by o.send_after
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

revoke execute on function public.telegram_outbox_due(int) from public, anon, authenticated;
grant execute on function public.telegram_outbox_due(int) to service_role;

comment on function public.telegram_outbox_due(int) is
  'Pending, unexpired bot messages whose recipient has a linked Telegram, with chat id and locale (0043). Service role only.';

notify pgrst, 'reload schema';
