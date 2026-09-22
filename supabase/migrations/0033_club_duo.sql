-- =============================================================================
-- 0033 — клуб в двух вариантах: соло и дуо.
--
-- «Я хочу, чтобы у нас клуб существовал только в двух вариациях. Первое — это
-- самостоятельное, то есть типа соло. Второе — это дуо.»
--
-- ## Почему два круга, а не один с режимом внутри
--
-- Марафон — это правила, задания и участники, и у соло с дуо все три разные:
-- задания соло одинаковые для всех, задания дуо адресуются паре или одному из
-- двоих; доска соло — люди, доска дуо — пары; победитель у каждого свой. Это два
-- разных круга, и попытка уместить их в одну строку кончилась бы флагом, который
-- надо не забыть проверить в каждой функции.
--
-- Режим и так записан: `team_size`. Соло — 1, дуо — 2, и `marathon_is_solo()`
-- читает именно его (0011: «a separate mode flag beside a size would let the two
-- disagree»). Новой колонки здесь поэтому нет — меняется только уникальность:
-- раньше клуб был один, теперь один **на режим**.
--
-- ## Подписка одна
--
-- «Подписка единая на оба клуба, поэтому все пользователи могут участвовать как
-- в соло-режиме, так и дуо.» `join_club()` поэтому кладёт человека сразу в оба
-- круга: право на клуб одно (`club_access()`), а кругов два.
--
-- В дуо человек попадает **без пары**: `team_id` остаётся null, пока пару не
-- составит приглашение по ссылке или автоподбор (0034). Незапаренный участник
-- дуо-клуба — нормальное состояние, а не поломка: именно ему показывается
-- баннер «дуо пока нет».
--
-- Требует 0011_marathon.sql, 0016_club_membership.sql, 0028_weekly_winner.sql.
-- Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Клуб — один на режим, а не один на всё.
--
-- Индекс по выражению `team_size > 1`: два значения, значит ровно два клуба —
-- соло и дуо. Третьего размера команды у клуба быть не может, и это не
-- ограничение реализации, а решение владельца: «только в двух вариациях».
-- -----------------------------------------------------------------------------
drop index if exists public.marathons_one_club_idx;
create unique index if not exists marathons_one_club_per_mode_idx
  on public.marathons ((team_size > 1)) where is_club;

comment on index public.marathons_one_club_per_mode_idx is
  'Ровно один клуб каждого режима: соло (team_size = 1) и дуо (team_size = 2).';

-- -----------------------------------------------------------------------------
-- 2. Дуо-клуб.
--
-- Всё как у соло из 0016 и по тем же причинам: старт — понедельник этой недели
-- (`marathon_week_of` от него нарезает календарные недели), десять лет `days`,
-- никаких заданий — их пишет тренер.
--
-- Приз назван во множественном числе намеренно. Владелец: «по часу каждому» —
-- выигрывает пара, но встреча у каждого своя. Обещание на экране должно
-- совпадать с тем, что тренер потом отдаёт.
--
-- Идемпотентна по slug и **не** переписывает `starts_on`: сдвиг старта сдвинул
-- бы день у каждого задания и неделю у каждого очка.
-- -----------------------------------------------------------------------------
insert into public.marathons (
  slug, title, description, status, starts_on, days, team_size, timezone, due_time, prize, is_club
)
values (
  'club_duo',
  'Клуб вдвоём',
  'То же, что клуб, только вдвоём: задание на пару или на кого-то одного, и общая таблица пар.',
  'active',
  date_trunc('week', current_date)::date,
  3650,
  2,                      -- пара
  'Europe/Moscow',
  '22:00',
  'Час с тренером — каждому из пары',
  true
)
on conflict (slug) do update set
  status  = 'active',
  days    = greatest(public.marathons.days, 3650),
  is_club = true;

-- -----------------------------------------------------------------------------
-- 3. Найти клуб нужного режима.
--
-- Одной функцией, потому что «клуб» перестал быть единственным числом, и каждое
-- место, которое раньше писало `where is_club limit 1`, теперь обязано сказать,
-- какой именно. Без этого выбор был бы «какой попадётся», а попадаться стало бы
-- по-разному в зависимости от порядка строк.
-- -----------------------------------------------------------------------------
create or replace function public.club_marathon(p_duo boolean default false)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select m.id
  from public.marathons m
  where m.is_club
    and m.status = 'active'
    and (m.team_size > 1) = coalesce(p_duo, false)
  limit 1;
$$;

revoke execute on function public.club_marathon(boolean) from public, anon;
grant execute on function public.club_marathon(boolean) to authenticated;

comment on function public.club_marathon(boolean) is
  'Id клуба нужного режима: соло по умолчанию, дуо при p_duo. NULL, если такого клуба нет.';

-- -----------------------------------------------------------------------------
-- 4. join_club — в оба круга сразу.
--
-- Право на клуб одно, кругов два, и человек, оплативший подписку, участвует в
-- обоих. Возвращает id соло-клуба — как и раньше, чтобы вызывающий отличал «ты
-- внутри» от «клуба нет»; дуо при этом тоже заведён.
--
-- Всё остальное — как в 0016 и по тем же причинам: идемпотентно, безопасно
-- звать на каждое открытие вкладки, и участника, которого тренер убрал руками,
-- обратно не пускает.
-- -----------------------------------------------------------------------------
create or replace function public.join_club()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid;
  v_id    uuid;
begin
  if v_email is null or not public.club_access() then
    return null;
  end if;

  -- Оба круга, в одном цикле: разойтись они не могут по устройству.
  foreach v_id in array array[
    public.club_marathon(false),
    public.club_marathon(true)
  ] loop
    continue when v_id is null;

    /*
     * `team_id` не трогается вовсе — ни при вставке, ни при возврате из
     * «removed». В соло его и не может быть (`marathon_members_check_team`), а в
     * дуо он уже может указывать на пару, которую человек выбрал сам: затереть
     * его здесь значило бы разбивать пару при каждом открытии вкладки.
     */
    insert into public.marathon_members (marathon_id, email, status)
    values (v_id, v_email, 'active')
    on conflict (marathon_id, email) do update
      set status = case
        when public.marathon_members.status = 'removed'
         and public.marathon_members.note is null
         and public.marathon_members.display_name is null
        then 'active'
        else public.marathon_members.status
      end;
  end loop;

  v_club := public.club_marathon(false);
  return v_club;
end;
$$;

revoke execute on function public.join_club() from public, anon;
grant execute on function public.join_club() to authenticated;

comment on function public.join_club() is
  'Самозапись в оба клуба (соло и дуо) по живой подписке или пробному доступу. Идемпотентна; возвращает id соло-клуба или null.';

-- -----------------------------------------------------------------------------
-- 5. club_winner — у каждого клуба свой.
--
-- Раньше функция брала последнего объявленного «в клубе», потому что клуб был
-- один. Теперь их два, и без режима она отдавала бы то соло-победителя, то
-- дуо — в зависимости от того, кого объявили последним.
--
-- Тип возврата не меняется, но `create or replace` не умеет менять сигнатуру:
-- появился аргумент, значит это другая функция. Старую убираем явно.
-- -----------------------------------------------------------------------------
drop function if exists public.club_winner();

create or replace function public.club_winner(p_duo boolean default false)
returns table (
  marathon_id  uuid,
  week         int,
  display_name text,
  avatar_seed  text,
  note         text,
  prize        text,
  announced_at timestamptz,
  is_me        boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid   := public.club_marathon(p_duo);
begin
  if v_email is null or v_club is null then
    return;
  end if;

  return query
  select
    m.id,
    w.week,
    left(coalesce(
      nullif(trim(mem.display_name), ''),
      nullif(trim(p.display_name), ''),
      'Участник'
    ), 60),
    coalesce(p.avatar_seed, ''),
    w.note,
    m.prize,
    w.announced_at,
    mem.email = v_email
  from public.marathon_winners w
  join public.marathons m on m.id = w.marathon_id
  join public.marathon_members mem on mem.id = w.member_id
  left join public.profiles p on p.email = mem.email
  where m.id = v_club
    -- Только своим: победитель клуба — новость для тех, кто в нём состоит.
    and exists (
      select 1 from public.marathon_members me
      where me.marathon_id = m.id and me.email = v_email and me.status = 'active'
    )
  order by w.announced_at desc
  limit 1;
end;
$$;

revoke execute on function public.club_winner(boolean) from public, anon;
grant execute on function public.club_winner(boolean) to authenticated;

comment on function public.club_winner(boolean) is
  'Последний объявленный победитель клуба нужного режима, для его участников (0028/0033). Почту не возвращает никогда.';

notify pgrst, 'reload schema';
