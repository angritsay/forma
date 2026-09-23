-- =============================================================================
-- 0040 — канал владельца: очередь сообщений в темы телеграм-группы.
--
-- Владелец: «давай заведем канал в телеграмме в котором будет несколько обсуждений: регистрации,
-- курсы, клуб соло, клуб дуо, онлайн-тренировки, обращения… хочется просто иметь визибилити над
-- всеми покупками, возвратами и так далее, ну то есть всеми транзакциями».
--
-- Сегодня о деньгах не узнаёт никто. Вебхук открывает доступ и пишет строку в журнал, и это
-- видно только тому, кто зашёл в админку и посмотрел. То есть узнать о покупке можно, а **заметить**
-- её нельзя.
--
-- ## Клуб один, а не два
--
-- Тем пять, а не шесть, и это решение владельца после вопроса. Подписка на клуб **единая на оба
-- режима** — так записано в 0033 её же словами: «Подписка единая на оба клуба, поэтому все
-- пользователи могут участвовать как в соло-режиме, так и дуо». Значит отдельных покупок «соло» и
-- «дуо» не бывает: транзакция одна, а кругов два, и две темы под деньги разошлись бы с
-- действительностью на первой же оплате. Пары дуо — событие, а не покупка, и живут в той же теме.
--
-- ## Почему не `telegram_outbox`
--
-- Очередь сообщений людям уже есть (0027), и соблазн дописать в неё колонку большой. Три отличия,
-- и каждого хватает.
--
--   1. **Получатель.** Там — человек, которого ещё надо найти по почте, и он может не найтись
--      никогда. Здесь — чат с темой, известный заранее и всегда один.
--   2. **Срок.** Там `expires_at` обязателен: «тренер выдал тренировку», доставленное через
--      неделю, — недоумение. Здесь срока нет вовсе: покупка трёхдневной давности всё так же
--      требует, чтобы её увидели. Поэтому здесь нет и статуса `skipped` — пропускать нечего.
--   3. **Язык.** Там он берётся у получателя. Здесь читателя два, оба русские, и выбирать не из
--      чего.
--
-- Общая у них ровно одна вещь — отправщик: `telegram-notify` разгребает обе очереди за один
-- запуск, потому что расписание, токен и дверь у них и правда одни.
--
-- ## Зеркало не ломает то, что отражает
--
-- Каждый триггер здесь обёрнут в `exception when others then null`, и это главное отличие от
-- 0027. Уведомление — зеркало; если зеркало треснуло, комната не обязана исчезнуть. Строка в
-- `admin_outbox` не должна стоить покупки, а на регистрации это прямо опасно: `handle_new_user()`
-- выполняется внутри транзакции, которой заводится аккаунт, и исключение в ней означает человека,
-- который не смог зарегистрироваться, потому что не записалось уведомление.
--
-- 0027 так не делает, и это осознанно не трогается здесь: те триггеры давно в проде, менять их
-- заодно значит проверять заодно.
--
-- Требует 0001_init.sql, 0005_subscriptions.sql, 0014_coach_bookings.sql, 0020_payment_emails.sql,
-- 0034_club_pairs.sql, 0039_session_intent.sql. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Очередь.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_outbox (
  id         uuid primary key default gen_random_uuid(),
  -- Тема группы. Имена наши, а не телеграмные: числовой id темы живёт секретом, потому что
  -- заводится руками и меняется вместе с группой.
  topic      text not null check (topic in ('signups', 'courses', 'club', 'sessions', 'support')),
  kind       text not null check (kind ~ '^[a-z_]{3,40}$'),
  -- Что подставить в текст. Текст живёт в функции: правка формулировки не должна быть миграцией.
  params     jsonb not null default '{}'::jsonb
               check (octet_length(params::text) <= 4096),
  status     text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts   int not null default 0 check (attempts >= 0),
  last_error text check (last_error is null or length(last_error) <= 500),
  -- Один повод — одно сообщение. Вебхук доставляет повторно, админ нажимает дважды.
  dedupe_key text not null unique check (length(dedupe_key) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_outbox is
  'Queue of messages to the owner''s Telegram topics (0040). The database records the occasion; telegram-notify sends.';

-- Ровно тот порядок, которым ходит отправитель.
create index if not exists admin_outbox_due_idx
  on public.admin_outbox (created_at)
  where status = 'pending';

alter table public.admin_outbox enable row level security;

-- Ни одной политики: здесь чужие адреса и суммы. Даже администратору продукта незачем читать это
-- через API — он читает это в телеграме.
revoke all on public.admin_outbox from anon, authenticated;
grant select, insert, update, delete on public.admin_outbox to service_role;

drop trigger if exists set_updated_at on public.admin_outbox;
create trigger set_updated_at
  before update on public.admin_outbox
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. enqueue_admin — записать повод.
--
-- Никому не выдана: зовут только триггеры ниже. Отдельной ручки «напиши в канал» в API не
-- появляется — иначе канал стал бы тем, что можно вызвать снаружи.
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_admin(
  p_topic      text,
  p_kind       text,
  p_dedupe_key text,
  p_params     jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  insert into public.admin_outbox (topic, kind, params, dedupe_key)
  values (p_topic, p_kind, coalesce(p_params, '{}'::jsonb), left(p_dedupe_key, 200))
  on conflict (dedupe_key) do nothing;
end;
$$;

revoke execute on function public.enqueue_admin(text, text, text, jsonb)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Регистрации.
--
-- Повод — строка в `profiles`, а не в `auth.users`: она создаётся тем же триггером и в той же
-- транзакции, а читать `auth.users` триггером своей схемы — лишнее право на чужую таблицу.
-- -----------------------------------------------------------------------------
create or replace function public.profiles_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  begin
    perform public.enqueue_admin(
      'signups',
      'signup',
      'signup:' || new.id::text,
      jsonb_build_object('email', new.email::text, 'locale', new.locale)
    );
  exception when others then
    -- Регистрация человека не стоит уведомления о ней. См. «Зеркало» в шапке.
    null;
  end;
  return new;
end;
$$;

drop trigger if exists profiles_notify_admin on public.profiles;
create trigger profiles_notify_admin
  after insert on public.profiles
  for each row execute function public.profiles_notify_admin();

-- -----------------------------------------------------------------------------
-- 4. Курсы: оплата и возврат.
--
-- `source` в параметрах — та самая «как была совершена покупка»: с 0038 там настоящая касса, а не
-- вписанная константа.
-- -----------------------------------------------------------------------------
create or replace function public.purchases_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind text;
begin
  begin
    if new.status = 'active' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'active') then
      v_kind := 'course_paid';
    elsif new.status = 'refunded' and coalesce(old.status, '') <> 'refunded' then
      v_kind := 'course_refunded';
    end if;

    if v_kind is not null then
      perform public.enqueue_admin(
        'courses',
        v_kind,
        v_kind || ':' || new.id::text,
        jsonb_build_object(
          'email', new.email::text,
          'courseId', new.course_id,
          'source', coalesce(new.source, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists purchases_notify_admin on public.purchases;
create trigger purchases_notify_admin
  after insert or update of status on public.purchases
  for each row execute function public.purchases_notify_admin();

-- -----------------------------------------------------------------------------
-- 5. Клуб: оплата, продление, отмена.
--
-- Продление — отдельный повод, и ключ включает `expires_at`: каждый оплаченный период даёт ровно
-- одно сообщение. Ключом по одному id второй месяц уходил бы в тишину, и «подписки не
-- продлеваются» выглядело бы точно так же, как «продлеваются молча».
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
    if new.status = 'active' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'active') then
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

drop trigger if exists subscriptions_notify_admin on public.subscriptions;
create trigger subscriptions_notify_admin
  after insert or update of status, expires_at on public.subscriptions
  for each row execute function public.subscriptions_notify_admin();

-- -----------------------------------------------------------------------------
-- 6. Клуб: пара дуо собралась.
--
-- Не покупка, а событие — и единственное, что в дуо вообще происходит отдельно от соло. Поэтому
-- оно и есть весь вклад дуо в эту тему.
-- -----------------------------------------------------------------------------
create or replace function public.duo_invites_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  begin
    if new.redeemed_at is not null and old.redeemed_at is null then
      perform public.enqueue_admin(
        'club',
        'duo_paired',
        'duo_paired:' || new.token,
        jsonb_build_object(
          'inviter', new.inviter_email::text,
          'partner', coalesce(new.redeemed_by::text, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists duo_invites_notify_admin on public.club_duo_invites;
create trigger duo_invites_notify_admin
  after update of redeemed_at on public.club_duo_invites
  for each row execute function public.duo_invites_notify_admin();

-- -----------------------------------------------------------------------------
-- 7. Онлайн-тренировки: выбрали время, перенесли, отменили.
--
-- Владелец: «присылать, что кто-то выбрал время». Строка в `coach_bookings` — это и есть
-- выбранное время, откуда бы оно ни приехало (0014 провайдер-нейтральна).
--
-- Перенос — свой повод, и ключ включает новое время: иначе перенесённая встреча выглядела бы в
-- канале как та же самая, и тренер пришёл бы к старому часу.
-- -----------------------------------------------------------------------------
create or replace function public.coach_bookings_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind text;
begin
  begin
    if tg_op = 'INSERT' then
      v_kind := 'session_booked';
    elsif new.status = 'cancelled' and coalesce(old.status, '') <> 'cancelled' then
      v_kind := 'session_cancelled';
    elsif old.starts_at is distinct from new.starts_at then
      v_kind := 'session_moved';
    end if;

    if v_kind is not null then
      perform public.enqueue_admin(
        'sessions',
        v_kind,
        v_kind || ':' || new.external_id || ':' || new.starts_at::text,
        jsonb_build_object(
          'email', new.email::text,
          'startsAt', new.starts_at::text,
          'minutes', greatest(1, round(extract(epoch from (new.ends_at - new.starts_at)) / 60)::int),
          'timezone', coalesce(new.timezone, ''),
          'eventName', coalesce(new.event_name, '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists coach_bookings_notify_admin on public.coach_bookings;
create trigger coach_bookings_notify_admin
  after insert or update of status, starts_at on public.coach_bookings
  for each row execute function public.coach_bookings_notify_admin();

-- -----------------------------------------------------------------------------
-- 8. Клуб: пруф прислали заново после отказа.
--
-- Владелец: «я не хочу заходить в админку, я хочу получать уведомления сразу в телеге».
--
-- Пруфы — единственное в админке, что нельзя вынести целиком, и это стоит сказать прямо.
-- Доказательство присылает каждый участник клуба каждый день; сообщение на каждое превратило бы
-- канал в ленту, которую отключат на второй день, и вместе с ней отключат покупки.
--
-- Поэтому сюда уходит не всякий пруф, а тот, который **ждёт решения человека**: присланный
-- заново после отказа тренера (`attempt` вырос — 0027). Такой пруф уже стоил кому-то отказа,
-- вернулся в очередь и висит там, пока тренер не посмотрит. Обычный первый пруф не ждёт ничего:
-- он сразу засчитан, и просмотр — это сверка, а не ответ.
--
-- Сводку «сколько пруфов ждут» лучше слать раз в день одной строкой, а не поштучно; для этого
-- нужен свой повод по расписанию, и он тут намеренно не сделан.
-- -----------------------------------------------------------------------------
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

drop trigger if exists submissions_notify_admin on public.marathon_submissions;
create trigger submissions_notify_admin
  after update of attempt on public.marathon_submissions
  for each row execute function public.submissions_notify_admin();

-- -----------------------------------------------------------------------------
-- 9. Деньги, которые ничего не открыли.
--
-- Два повода из одной таблицы, и оба про то, чего не видно нигде больше.
--
-- **Занятие.** Оплата часа с тренером не создаёт ни покупки, ни подписки: куплено время, а не
-- доступ. Значит ни один триггер выше её не увидит, и без этой строки «кто-то оплатил тренировку»
-- не наступало бы никогда. Вид платежа отличает 0039.
--
-- **Непривязанный платёж.** `applied = false` означает: деньги пришли, а доступ не открылся —
-- заказа не было, или их было несколько, или почта в кассе другая. Сегодня это видно только тому,
-- кто листает журнал. Это ровно тот случай, когда человек заплатил и сидит без курса, и чем позже
-- это заметят, тем дороже.
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

drop trigger if exists payments_notify_admin on public.payments;
create trigger payments_notify_admin
  after insert on public.payments
  for each row execute function public.payments_notify_admin();

notify pgrst, 'reload schema';
