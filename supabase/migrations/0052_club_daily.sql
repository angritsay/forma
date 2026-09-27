-- =============================================================================
-- 0052 — ежедневные касания клуба: утро, вечер, воскресенье.
--
-- Владелец: человека надо возвращать в клуб каждый день — «регулярная подпитка дофамином».
-- Экран недели (#230) отвечает тому, кто уже открыл приложение. Эта миграция — тому, кто не
-- открыл: три сообщения бота, каждое в свой час по часовому поясу круга.
--
--   08:00  `club_task`      задание дня: название и баллы. Повод открыть приложение с утра.
--   20:00  `club_reminder`  только тем, у кого серия есть и сегодня ещё не отмечено: «серия
--                           сгорит в полночь». Кто отметил — молчим; у кого серии нет — нечего
--                           спасать, и напоминание читалось бы как упрёк.
--   21:00  `club_recap`     по воскресеньям: место, баллы, сделано из скольких, серия. Закрытие
--                           недели и причина вернуться в понедельник. Кто за неделю не сделал
--                           ничего и ничего не набрал — без итогов: «0 баллов, 0 из 5» — не итог.
--
-- ## Одна функция, три вида, час решает она
--
-- `club_enqueue_daily(p_kind)` зовётся из Actions раз в час (`.github/workflows/club-daily.yml`)
-- с каждым из трёх видов, а сама смотрит на **местное время круга** (`marathons.timezone`) и
-- решает, пора ли. Так у расписания в UTC нет знания о поясах, а у круга в другом поясе —
-- свой час. pg_cron в проекте не включён (довод 0027 и telegram-notify.yml: лишняя движущаяся
-- часть там, где лежат оплаты), и Actions уже будит рассылку каждые десять минут.
--
-- Окно — два часа (8–9, 20–21, 21–22), а не ровно один: cron в Actions неточный и в загруженный
-- час опаздывает на десятки минут, иногда за час. Ключ дедупликации — по дате, так что второй
-- запуск в окне повторного сообщения не даёт, а первый, опоздавший, сообщение не теряет.
--
-- ## Один человек — одно сообщение в день, сколько бы кругов ни было
--
-- `join_club()` кладёт в оба круга (соло и дуо, 0033). Утром это два одинаковых задания от
-- одного бота. Поэтому, кроме ключа по кругу, есть второе правило: у кого за последние двадцать
-- часов уже лежит строка этого вида — пропускается. Круги обходятся соло-первым: это вкладка
-- по умолчанию в приложении (`clubFor`), и итоги недели считаются по ней же.
--
-- ## Кому не пишем
--
--   * Кто не в клубе прямо сейчас — `club_member_reachable(email)`: близнец `club_access()` с
--     адресом вместо `current_email()`, потому что сервисная роль — не человек.
--   * Кто выключил — флаг `club_quiet` (0049). Человек ставит его себе сам через
--     `set_my_feature_flag`: единственный флаг, который человек вправе трогать (список в
--     функции), остальные по-прежнему включает только админ. Переключатель — в аккаунте.
--   * У кого нет телеграма — этим занимается очередь: строка ждёт и истекает молча (0027).
--
-- ## Серия и итоги — те же цифры, что на экране
--
-- Серия считается по правилу `streak.ts` (0023): через границы кругов, до сегодня, если сегодня
-- сделано, иначе до вчера. Итоги недели — вызовом тех же `marathon_scores` и `marathon_my_points`,
-- которые рисуют доску: на время вызова в `request.jwt.claims` подставляется `sub` участника, как
-- 0020/0044 подставляют пустые claims, чтобы дойти до сервисных функций. Второй копии подсчёта
-- очков нет — она разошлась бы с доской в первый же день, когда правило поменяют.
--
-- ## Ничего не роняет пачку
--
-- Каждый участник — в своём `exception when others then null`: битая строка, неожиданное
-- исключение из подсчёта, что угодно — теряется одно сообщение, а не утро всего клуба.
--
-- Требует 0011, 0016, 0027, 0033, 0034, 0035, 0045, 0049. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Виды сообщений. Список дописывается к действующему (0045).
-- -----------------------------------------------------------------------------
do $$
declare
  v_def   text;
  v_kinds text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
  from pg_constraint c
  where c.conrelid = 'public.telegram_outbox'::regclass
    and c.conname = 'telegram_outbox_kind_check';

  select coalesce(array_agg(distinct k), '{}')
    into v_kinds
  from regexp_matches(coalesce(v_def, ''), '''([^'']*)''', 'g') as m,
       lateral unnest(string_to_array(btrim(m[1], '{}'), ',')) as k
  where k ~ '^[a-z][a-z0-9_]*$';

  v_kinds := v_kinds || array['course_paid', 'subscription_paid', 'workout_assigned',
                              'weekly_winner', 'support_reply', 'referral_reward', 'duo_nudge',
                              'club_task', 'club_reminder', 'club_recap'];
  select array_agg(distinct k order by k) into v_kinds from unnest(v_kinds) as k;

  execute 'alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check';
  execute format(
    'alter table public.telegram_outbox add constraint telegram_outbox_kind_check check (kind = any (%L::text[]))',
    v_kinds
  );
end $$;

-- -----------------------------------------------------------------------------
-- 2. Кому можно писать: близнец `club_access()` (0016) с адресом вместо звонящего.
--
-- Те же три основания и в том же порядке: админ, живая подписка, курс в пробной неделе. Правило
-- одно в трёх местах (`gameAccess.ts`, `club_access()`, здесь) — менять вместе.
-- -----------------------------------------------------------------------------
create or replace function public.club_member_reachable(p_email citext)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select p_email is not null and (
    exists (select 1 from public.admins a where a.email = p_email)
    or exists (
      select 1 from public.subscriptions s
      where s.email = p_email
        and public.subscription_live(s.status, s.expires_at)
    )
    or exists (
      select 1 from public.purchases p
      where p.email = p_email
        and p.status = 'active'
        and p.activated_at is not null
        and p.activated_at > now() - interval '7 days'
    )
  );
$$;

revoke execute on function public.club_member_reachable(citext) from public, anon, authenticated;

comment on function public.club_member_reachable(citext) is
  'club_access() for a given address (0052): admin, live subscription or a course in its trial week. Service-side only.';

-- -----------------------------------------------------------------------------
-- 3. Кому адресовано задание: близнец `marathon_task_is_for_me()` (0011) с участником в параметре.
-- -----------------------------------------------------------------------------
create or replace function public.club_task_for_member(p_task_id uuid, p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1
    from public.marathon_tasks t
    join public.marathon_members mem
      on mem.marathon_id = t.marathon_id
     and mem.status = 'active'
     and mem.id = p_member_id
    where t.id = p_task_id
      and (
        not exists (select 1 from public.marathon_task_targets g where g.task_id = t.id)
        or exists (
          select 1 from public.marathon_task_targets g
          where g.task_id = t.id
            and (
              g.member_id = mem.id
              or (g.team_id is not null and g.team_id = mem.team_id
                  and not public.marathon_is_solo(t.marathon_id))
            )
        )
      )
  );
$$;

revoke execute on function public.club_task_for_member(uuid, uuid) from public, anon, authenticated;

comment on function public.club_task_for_member(uuid, uuid) is
  'marathon_task_is_for_me() for a given member (0052): no targets means everyone; otherwise named, or their team. Service-side only.';

-- -----------------------------------------------------------------------------
-- 4. Дни с незачёркнутым пруфом — `my_club_days()` (0023) для адреса; и серия по ним.
--
-- Серия — правило `src/app/features/marathon/streak.ts`, слово в слово: дни подряд, которые
-- упираются в сегодня (если сегодня сделано) или во вчера; иначе ноль. Считается через границы
-- кругов — «воскресенье и конец недели не ругают серию». Горизонт тот же, 400 дней.
-- -----------------------------------------------------------------------------
create or replace function public.club_days_of(p_email citext, p_today date)
returns setof date
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select distinct (m.starts_on + (s.day_index - 1))::date as d
  from public.marathon_submissions s
  join public.marathon_members mm on mm.id = s.member_id
  join public.marathons m on m.id = s.marathon_id
  where mm.email = p_email
    and s.voided_at is null
    and (m.starts_on + (s.day_index - 1))::date <= p_today
    and (m.starts_on + (s.day_index - 1))::date > p_today - 400
  order by d desc;
$$;

revoke execute on function public.club_days_of(citext, date) from public, anon, authenticated;

comment on function public.club_days_of(citext, date) is
  'my_club_days() for a given address (0052): dates with an un-voided proof, across every round. Service-side only.';

create or replace function public.club_streak_of(p_email citext, p_today date)
returns int
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_end date;
  v_n   int;
begin
  -- Где серия кончается: сегодня, если сегодня сделано, иначе вчера (правило 2 в streak.ts).
  select max(d) into v_end
  from public.club_days_of(p_email, p_today) d
  where d in (p_today, p_today - 1);
  if v_end is null then
    return 0;
  end if;

  -- Острова: у дня, стоящего n-м с конца, `d + n` одно и то же, пока нет пропуска.
  select count(*)::int into v_n
  from (
    select d, row_number() over (order by d desc)::int as rn
    from public.club_days_of(p_email, v_end) d
  ) x
  where x.d + x.rn = v_end + 1;

  return coalesce(v_n, 0);
end;
$$;

revoke execute on function public.club_streak_of(citext, date) from public, anon, authenticated;

comment on function public.club_streak_of(citext, date) is
  'The club streak of this address on this day, by the rule of streak.ts (0052): ending today or yesterday, across rounds. Service-side only.';

-- -----------------------------------------------------------------------------
-- 5. Поставить в очередь то, чему пришёл час.
--
-- Только сервисная роль (Actions через Management API — пустые claims, как у
-- `club_duo_rematch`; вебхук — `service_role`). Возвращает, сколько строк легло в очередь, — это
-- единственное, что печатает workflow.
--
-- `p_at` — «который сейчас час» для проверки часа и даты; по умолчанию настоящий. Нужен тестам
-- (`supabase/tests/98_club_daily.sql`), которым иначе пришлось бы ждать восьми утра по Москве, и
-- ручному прогону «как будто сейчас воскресенье». Дедупликация и «уже получил сегодня» смотрят
-- на настоящее время: подставленный час не даёт отправить одно и то же дважды.
-- -----------------------------------------------------------------------------
drop function if exists public.club_enqueue_daily(text);

create or replace function public.club_enqueue_daily(p_kind text, p_at timestamptz default now())
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind   text := btrim(coalesce(p_kind, ''));
  v_queued int  := 0;
  v_round  record;
  v_member record;
  v_task   record;
  v_local  timestamp;
  v_date   date;
  v_hour   int;
  v_day    int;
  v_week   int;
  v_key    text;
  v_ttl    interval;
  v_params jsonb;
  v_streak int;
  v_uid    uuid;
  v_claims text;
  v_place  bigint;
  v_points bigint;
  v_done   int;
  v_total  int;
begin
  -- Как у `apply_subscription_payment` (0005): сессия человека — нет; SQL-редактор и Management
  -- API, у которых claims пустые, и сервисная роль — да.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
     not in ('', 'service_role') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_kind not in ('club_task', 'club_reminder', 'club_recap') then
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;

  for v_round in
    select m.id, m.starts_on, m.days, m.timezone
    from public.marathons m
    where m.is_club and m.status = 'active'
    -- Соло первым: вкладка по умолчанию; итоги недели идут по нему, второй круг пропускается.
    order by m.team_size, m.starts_on desc
  loop
    v_local := coalesce(p_at, now()) at time zone v_round.timezone;
    v_date  := v_local::date;
    v_hour  := extract(hour from v_local)::int;
    v_day   := (v_date - v_round.starts_on) + 1;
    if v_day < 1 or v_day > v_round.days then
      continue;
    end if;
    v_week := public.marathon_week_of(v_day);

    -- Час круга. Окно в два часа — см. шапку: cron в Actions опаздывает, ключ по дате не даёт
    -- второго сообщения.
    if v_kind = 'club_task' and v_hour not in (8, 9) then
      continue;
    end if;
    if v_kind = 'club_reminder' and v_hour not in (20, 21) then
      continue;
    end if;
    if v_kind = 'club_recap' and (extract(isodow from v_date) <> 7 or v_hour not in (21, 22)) then
      continue;
    end if;

    for v_member in
      select mem.id, mem.email
      from public.marathon_members mem
      where mem.marathon_id = v_round.id
        and mem.status = 'active'
        and public.club_member_reachable(mem.email)
        -- Выключил у себя в аккаунте.
        and not exists (
          select 1
          from public.feature_flags f
          join public.profiles p on p.id = f.user_id
          where f.flag = 'club_quiet' and p.email = mem.email
        )
        -- Сегодня этого вида уже получил — от другого круга или от предыдущего запуска в окне.
        and not exists (
          select 1 from public.telegram_outbox o
          where o.email = mem.email
            and o.kind = v_kind
            and o.created_at > now() - interval '20 hours'
        )
      order by mem.created_at
    loop
      begin
        v_key := null;

        if v_kind = 'club_task' then
          -- Одно задание на сообщение: сначала то, что приносит баллы, потом по порядку тренера.
          -- День без задания для этого человека — без сообщения: сказать нечего.
          select t.title, t.title_en, t.rule, t.points
            into v_task
          from public.marathon_tasks t
          where t.marathon_id = v_round.id
            and t.day_index = v_day
            and public.club_task_for_member(t.id, v_member.id)
          order by (t.rule = 'none'), t.sort_order, t.created_at
          limit 1;
          if v_task.title is null then
            continue;
          end if;
          v_key := 'club_task:' || v_round.id::text || ':' || v_member.id::text || ':' || v_date::text;
          v_ttl := interval '12 hours';
          v_params := jsonb_build_object(
            'title', v_task.title,
            'title_en', v_task.title_en,
            'points', case when v_task.rule = 'none' then 0 else v_task.points end,
            'day', v_day
          );

        elsif v_kind = 'club_reminder' then
          -- Сегодня уже отмечено — молчим. Серии нет — нечего спасать.
          if exists (select 1 from public.club_days_of(v_member.email, v_date) d where d = v_date) then
            continue;
          end if;
          v_streak := public.club_streak_of(v_member.email, v_date);
          if v_streak < 1 then
            continue;
          end if;
          v_key := 'club_reminder:' || v_round.id::text || ':' || v_member.id::text || ':' || v_date::text;
          v_ttl := interval '4 hours';
          v_params := jsonb_build_object('streak', v_streak);

        else
          -- Итоги — теми же функциями, что рисуют доску, от лица участника (см. шапку).
          select p.id into v_uid from public.profiles p where p.email = v_member.email limit 1;
          if v_uid is null then
            continue;
          end if;
          v_claims := coalesce(current_setting('request.jwt.claims', true), '');
          perform set_config('request.jwt.claims',
            json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
          begin
            select s.rank, s.points into v_place, v_points
            from public.marathon_scores(v_round.id, v_week) s
            where s.is_mine
            limit 1;
            select coalesce(sum(p.tasks_done), 0)::int, coalesce(sum(p.tasks_total), 0)::int
              into v_done, v_total
            from public.marathon_my_points(v_round.id) p
            where p.week = v_week;
          exception when others then
            perform set_config('request.jwt.claims', v_claims, true);
            raise;
          end;
          perform set_config('request.jwt.claims', v_claims, true);

          if coalesce(v_points, 0) = 0 and coalesce(v_total, 0) = 0 then
            continue;
          end if;
          v_key := 'club_recap:' || v_round.id::text || ':' || v_member.id::text || ':' || v_week::text;
          v_ttl := interval '24 hours';
          v_params := jsonb_build_object(
            'week', v_week,
            'place', v_place,
            'points', coalesce(v_points, 0),
            'done', coalesce(v_done, 0),
            'total', coalesce(v_total, 0),
            'streak', public.club_streak_of(v_member.email, v_date)
          );
        end if;

        perform public.enqueue_telegram(v_member.email::text, v_kind, v_key, v_params, now(), v_ttl);
        -- `on conflict do nothing` в enqueue_telegram молчит о повторе; строка этого запуска
        -- узнаётся по `created_at = now()` — в транзакции это одно и то же мгновение.
        if exists (
          select 1 from public.telegram_outbox o
          where o.dedupe_key = v_key and o.created_at = now()
        ) then
          v_queued := v_queued + 1;
        end if;
      exception when others then
        -- Один человек — одно потерянное сообщение, а не утро всего клуба.
        null;
      end;
    end loop;
  end loop;

  return v_queued;
end;
$$;

revoke execute on function public.club_enqueue_daily(text, timestamptz) from public, anon, authenticated;
grant execute on function public.club_enqueue_daily(text, timestamptz) to service_role;

comment on function public.club_enqueue_daily(text, timestamptz) is
  'Queue the club''s daily bot message of this kind (club_task 08:00, club_reminder 20:00, club_recap Sunday 21:00, local to each round) for every reachable member without club_quiet (0052). Service role only; returns how many rows were queued.';

-- -----------------------------------------------------------------------------
-- 6. Свой флаг — только `club_quiet`.
--
-- 0049 запрещает человеку включать флаги себе: флаг открывает что-то новое, и решает админ. Этот
-- флаг ничего не открывает — он закрывает рот боту, и решать тут может только сам человек.
-- Список разрешённых — в функции, а не в параметре: второй флаг сюда добавляется правкой этой
-- строки, и только ею.
-- -----------------------------------------------------------------------------
create or replace function public.set_my_feature_flag(p_flag text, p_on boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_uid  uuid := auth.uid();
  v_flag text := btrim(coalesce(p_flag, ''));
begin
  if v_uid is null or public.current_email() is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if v_flag not in ('club_quiet') then
    raise exception 'invalid_flag' using errcode = '22023';
  end if;

  if coalesce(p_on, false) then
    insert into public.feature_flags (flag, user_id)
    values (v_flag, v_uid)
    on conflict (flag, user_id) do nothing;
  else
    delete from public.feature_flags f where f.flag = v_flag and f.user_id = v_uid;
  end if;

  return exists (
    select 1 from public.feature_flags f where f.flag = v_flag and f.user_id = v_uid
  );
end;
$$;

revoke execute on function public.set_my_feature_flag(text, boolean) from public, anon;
grant execute on function public.set_my_feature_flag(text, boolean) to authenticated;

comment on function public.set_my_feature_flag(text, boolean) is
  'Switch one of the caller''s own flags on or off (0052). Only club_quiet is allowed; returns the new state.';

notify pgrst, 'reload schema';
