-- =============================================================================
-- 0027 — очередь сообщений в бота.
--
-- Владелец: «Когда тренер выдает тренировку, об этом нужно написать сообщение в
-- боте», плюс сообщения про оплату. Связка аккаунта с телеграмом появилась в
-- 0026; это вторая половина — что именно и кому отправить.
--
-- ## Почему очередь, а не отправка на месте
--
-- Соблазн: дописать HTTP-вызов в `apply_course_payment`. Три причины так не делать,
-- и каждая по отдельности решающая.
--
-- 1. **Токена бота в базе нет и не будет.** Он секрет Supabase, а репозиторий
--    публичный. Отправлять умеет только edge-функция.
-- 2. **Сеть внутри транзакции — способ потерять оплату.** Телеграм тормозит или
--    отвечает 429 — и транзакция, которая включала курс, висит или откатывается.
--    Человек заплатил, а доступа нет, потому что мессенджер был занят.
-- 3. **Получателя может ещё не быть.** Покупка живёт на почте и приходит раньше
--    регистрации (0013). Строка ждёт в очереди, пока человек войдёт и откроет
--    приложение из телеграма, — и тогда сообщение уходит.
--
-- Поэтому база только **записывает повод**. Отправляет `telegram-notify`,
-- запускаемая по расписанию из Actions.
--
-- ## Ключ — почта, а не telegram_id
--
-- По той же причине: на момент повода привязки может не быть вовсе. Очередь
-- хранит адрес, а получателя ищет отправитель, в момент отправки.
--
-- ## Сроки
--
-- `send_after` — не раньше чего слать (для «накануне вечером» и «через три дня»).
-- `expires_at` — после чего сообщение уже не новость. «Тренер выдал тренировку»,
-- доставленное через неделю, — это не уведомление, а недоумение. Просроченные
-- переходят в `skipped`, а не висят вечно.
--
-- Владелец про тех, у кого телеграма нет: «Это нормально». Такие строки тоже
-- уходят в `skipped` по истечении срока — молча.
--
-- ## Кнопки «Отписаться» здесь нет
--
-- Прямое решение владельца: «Не нужно добавлять кнопку "Отписаться" в каждом
-- сообщении. Это не нарушает закон о рекламе 152 ФЗ.» Всё, что тут рассылается, —
-- сервисные сообщения о том, что человек сам купил или получил, а не реклама.
--
-- Требует 0001_init.sql, 0005_subscriptions.sql, 0006_custom_workouts.sql,
-- 0026_telegram_link.sql. Идемпотентна.
-- =============================================================================

create table if not exists public.telegram_outbox (
  id          uuid primary key default gen_random_uuid(),
  -- Кому — адресом. Получателя ищет отправитель, в момент отправки.
  email       citext not null check (length(email::text) <= 254),
  kind        text not null check (kind in (
                'course_paid',
                'subscription_paid',
                'workout_assigned'
              )),
  -- Что подставить в текст. Никаких готовых предложений: текст живёт в функции,
  -- и правка формулировки не должна требовать миграции.
  params      jsonb not null default '{}'::jsonb
                check (octet_length(params::text) <= 2048),
  send_after  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '3 days',
  status      text not null default 'pending'
                check (status in ('pending', 'sent', 'skipped', 'failed')),
  attempts    int not null default 0 check (attempts >= 0),
  last_error  text check (last_error is null or length(last_error) <= 500),
  /*
   * Один повод — одно сообщение.
   *
   * Prodamus доставляет уведомление повторно, админ может нажать «Активировать»
   * дважды, тренер — переназначить ту же тренировку. Уникальный ключ превращает
   * всё это в одну строку, и `on conflict do nothing` в `enqueue_telegram()`
   * делает повтор бесплатным.
   */
  dedupe_key  text not null unique check (length(dedupe_key) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.telegram_outbox is
  'Queue of bot messages to send (0027). The database only records the occasion; telegram-notify sends.';

-- Ровно тот порядок, которым ходит отправитель: свежие поводы первыми.
create index if not exists telegram_outbox_due_idx
  on public.telegram_outbox (send_after)
  where status = 'pending';

alter table public.telegram_outbox enable row level security;

-- Ни одной политики — значит, никто, кроме сервисной роли, эту таблицу не видит.
-- Здесь лежат адреса и поводы; вошедшему человеку тут нечего делать даже со своими.
revoke all on public.telegram_outbox from anon, authenticated;

drop trigger if exists set_updated_at on public.telegram_outbox;
create trigger set_updated_at
  before update on public.telegram_outbox
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- enqueue_telegram — записать повод.
-- -----------------------------------------------------------------------------
--
-- Никому не выдана: её зовут только триггеры ниже, а они и так идут от владельца
-- таблицы. Отдельной ручки «отправь сообщение» в API не появляется — иначе
-- рассылка стала бы тем, что можно вызвать.
create or replace function public.enqueue_telegram(
  p_email      text,
  p_kind       text,
  p_dedupe_key text,
  p_params     jsonb default '{}'::jsonb,
  p_send_after timestamptz default now(),
  p_ttl        interval default interval '3 days'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext;
begin
  -- Адрес мусорный — повода нет. Исключение здесь уронило бы оплату, а она
  -- важнее уведомления о ней.
  begin
    v_email := public.normalize_email(p_email);
  exception when others then
    return;
  end;
  if v_email is null or length(v_email::text) = 0 then
    return;
  end if;

  insert into public.telegram_outbox (email, kind, params, send_after, expires_at, dedupe_key)
  values (v_email, p_kind, coalesce(p_params, '{}'::jsonb), p_send_after,
          greatest(p_send_after, now()) + p_ttl, p_dedupe_key)
  on conflict (dedupe_key) do nothing;
end;
$$;

comment on function public.enqueue_telegram(text, text, text, jsonb, timestamptz, interval) is
  'Records one occasion for the bot to write about (0027). Callable by nobody: triggers only.';

revoke execute on function public.enqueue_telegram(text, text, text, jsonb, timestamptz, interval)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Поводы: оплата курса, оплата подписки, выданная тренировка.
-- -----------------------------------------------------------------------------
--
-- Триггерами, а не правкой трёх security-definer функций. Путей к «доступ
-- открылся» несколько — вебхук Prodamus, ручная выдача из админки, SQL-редактор, —
-- и дописывать вызов в каждый значит однажды забыть про один. Строка в таблице
-- поменялась — повод есть, кто её поменял, неважно.

create or replace function public.purchases_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  -- Только переход в «активна». Повторный `update` активной строки (вебхук
  -- доставил то же ещё раз) повода не создаёт.
  if new.status = 'active' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'active') then
    perform public.enqueue_telegram(
      new.email::text,
      'course_paid',
      'course_paid:' || new.id::text,
      jsonb_build_object('courseId', new.course_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists purchases_notify on public.purchases;
create trigger purchases_notify
  after insert or update of status on public.purchases
  for each row execute function public.purchases_notify();

create or replace function public.subscriptions_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  /*
   * Продление — тоже повод, и это осознанно.
   *
   * Ключ включает `expires_at`, поэтому каждый оплаченный период даёт ровно одно
   * сообщение: человек заплатил ещё раз и должен увидеть, что деньги дошли. Если
   * бы ключом был только id, второй месяц уходил бы в тишину.
   */
  if new.status = 'active'
     and (tg_op = 'INSERT'
          or coalesce(old.status, '') <> 'active'
          or old.expires_at is distinct from new.expires_at) then
    perform public.enqueue_telegram(
      new.email::text,
      'subscription_paid',
      'subscription_paid:' || new.id::text || ':' || coalesce(new.expires_at::text, 'none'),
      jsonb_build_object('plan', new.plan)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_notify on public.subscriptions;
create trigger subscriptions_notify
  after insert or update of status, expires_at on public.subscriptions
  for each row execute function public.subscriptions_notify();

create or replace function public.assigned_workouts_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_title text;
begin
  select w.title into v_title
  from public.custom_workouts w
  where w.id = new.custom_workout_id;

  perform public.enqueue_telegram(
    new.email::text,
    'workout_assigned',
    'workout_assigned:' || new.custom_workout_id::text || ':' || new.email::text,
    jsonb_build_object('title', coalesce(v_title, '')),
    now(),
    -- Сутки, а не трое: «тренер выдал тренировку», дошедшее через три дня,
    -- это уже не новость, а недоумение.
    interval '1 day'
  );
  return new;
end;
$$;

drop trigger if exists assigned_workouts_notify on public.assigned_workouts;
create trigger assigned_workouts_notify
  after insert on public.assigned_workouts
  for each row execute function public.assigned_workouts_notify();
