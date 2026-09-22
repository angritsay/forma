-- =============================================================================
-- 0028 — победитель недели.
--
-- В приветствии бота людям обещан «час с тренером тому, кто выше всех в
-- воскресенье». До сих пор это жило только в тексте: доска очков есть, а кто
-- победил — нигде не записано, и в понедельник неделя просто начиналась заново.
--
-- ## Ключ — (клуб, неделя), и это не мелочь
--
-- Клуб — **одна непрерывная строка** в `marathons`, а не новый ряд каждую
-- неделю: `marathons_one_club_idx` (0016) физически запрещает второй клуб.
-- Неделями его режет `marathon_week_of(day_index)`, и доска (`marathon_scores`)
-- принимает номер недели именно поэтому. Значит и победитель — это пара
-- (круг, неделя), а не строка на марафон. Ключ на одном `marathon_id` означал бы
-- ровно одного победителя за всю историю клуба.
--
-- ## Объявляет тренер, а не арифметика
--
-- Очки выводятся из пруфов (0011), так что верхнюю строку машина знает и сама.
-- Но победителем её делать нельзя, и это решение, а не осторожность:
--
--   * пруф можно зачеркнуть задним числом — «победитель», назначенный в
--     полночь, к утру может оказаться не победителем;
--   * ничья возможна и разрешается человеком;
--   * приз — живой час Сергея. Обещание такого размера не должно раздаваться
--     триггером.
--
-- Машина считает и показывает доску; строку сюда пишет тренер.
--
-- Требует 0011_marathon.sql, 0016_club_membership.sql. Идемпотентна.
-- =============================================================================

create table if not exists public.marathon_winners (
  marathon_id  uuid not null references public.marathons (id) on delete cascade,
  -- Номер недели от начала круга, как его считает `marathon_week_of()`.
  week         int not null check (week between 1 and 1000),
  member_id    uuid not null references public.marathon_members (id) on delete cascade,
  -- За что, словами тренера. Необязательно: «победил» само по себе — уже сообщение.
  note         text check (note is null or length(note) <= 300),
  announced_at timestamptz not null default now(),
  announced_by uuid references auth.users (id) on delete set null,
  -- Один победитель на неделю. Не правило «по бизнесу», а свойство схемы:
  -- «передумал» — это update той же строки, а не вторая запись рядом.
  primary key (marathon_id, week)
);

comment on table public.marathon_winners is
  'Who won one week of a club round. Written by the coach, never derived: proof can be voided and the prize is an hour of his time (0028).';

-- Участник принадлежит кругу; победитель из чужого круга — опечатка, а не данные.
-- Триггером, потому что составного ключа на `marathon_members` нет.
create or replace function public.marathon_winners_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if not exists (
    select 1 from public.marathon_members mem
    where mem.id = new.member_id and mem.marathon_id = new.marathon_id
  ) then
    raise exception 'member_not_in_marathon' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists marathon_winners_guard on public.marathon_winners;
create trigger marathon_winners_guard
  before insert or update on public.marathon_winners
  for each row execute function public.marathon_winners_guard();

alter table public.marathon_winners enable row level security;

-- Ни одной политики: рядом лежит `member_id`, а читают эту таблицу только
-- функции ниже, каждая под своим правилом.
revoke all on public.marathon_winners from anon, authenticated;

-- -----------------------------------------------------------------------------
-- admin_set_winner — объявить победителя недели или снять объявление.
-- -----------------------------------------------------------------------------
--
-- `p_member_id = null` снимает: тренер нажал не на ту строку, и отменить это
-- должно быть так же просто, как назначить. Иначе ошибка живёт неделю на глазах
-- у всех.
create or replace function public.admin_set_winner(
  p_marathon_id uuid,
  p_week        int,
  p_member_id   uuid default null,
  p_note        text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_week is null or p_week < 1 then
    raise exception 'invalid_week' using errcode = 'P0001';
  end if;

  if p_member_id is null then
    delete from public.marathon_winners
    where marathon_id = p_marathon_id and week = p_week;
    return;
  end if;

  insert into public.marathon_winners (marathon_id, week, member_id, note, announced_by)
  values (p_marathon_id, p_week, p_member_id,
          nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (marathon_id, week) do update
    set member_id    = excluded.member_id,
        note         = excluded.note,
        announced_at = now(),
        announced_by = excluded.announced_by;
end;
$$;

comment on function public.admin_set_winner(uuid, int, uuid, text) is
  'Announce (or withdraw) the winner of one week. Admin only (0028).';

revoke execute on function public.admin_set_winner(uuid, int, uuid, text) from public, anon;
grant execute on function public.admin_set_winner(uuid, int, uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- club_winner — кого объявили последним, для всех в клубе.
-- -----------------------------------------------------------------------------
--
-- Последнего объявленного, а не победителя текущей недели: неделя, которая идёт,
-- победителя ещё не имеет, и интересен как раз прошлый. В понедельник на экране
-- висит тот, кто выиграл в воскресенье, — ровно то, зачем это всё.
--
-- Имя берётся тем же правилом, что в `marathon_roster()`: имя, которое тренер
-- вписал участнику, потом имя из профиля, потом «Участник».
--
-- Адрес не возвращается никогда: победителя видят все участники клуба.
-- `create or replace` не меняет тип возврата, а набор колонок здесь ещё может
-- уточниться. Явный drop делает файл идемпотентным при любой правке.
drop function if exists public.club_winner();
create function public.club_winner()
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
begin
  if v_email is null then
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
  where m.is_club
    -- Только своим: победитель клуба — новость для тех, кто в нём состоит.
    and exists (
      select 1 from public.marathon_members me
      where me.marathon_id = m.id and me.email = v_email and me.status = 'active'
    )
  order by w.announced_at desc
  limit 1;
end;
$$;

comment on function public.club_winner() is
  'The most recently announced club winner, for members of the club (0028). Never returns an email.';

revoke execute on function public.club_winner() from public, anon;
grant execute on function public.club_winner() to authenticated;

-- -----------------------------------------------------------------------------
-- admin_marathon_winner — кто объявлен за эту неделю, для экрана тренера.
-- -----------------------------------------------------------------------------
--
-- Отдельно от `club_winner()`, потому что вопрос другой: тренер смотрит на
-- конкретную неделю конкретного круга, в том числе того, в котором сам не
-- состоит, и ему нужен `member_id` — чтобы подсветить строку доски.
drop function if exists public.admin_marathon_winner(uuid, int);
create function public.admin_marathon_winner(p_marathon_id uuid, p_week int)
returns table (
  member_id    uuid,
  display_name text,
  note         text,
  announced_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  select
    w.member_id,
    left(coalesce(
      nullif(trim(mem.display_name), ''),
      nullif(trim(p.display_name), ''),
      'Участник'
    ), 60),
    w.note,
    w.announced_at
  from public.marathon_winners w
  join public.marathon_members mem on mem.id = w.member_id
  left join public.profiles p on p.email = mem.email
  where w.marathon_id = p_marathon_id and w.week = p_week;
end;
$$;

comment on function public.admin_marathon_winner(uuid, int) is
  'Who is announced as the winner of one week, for the coach screen (0028). Admin only.';

revoke execute on function public.admin_marathon_winner(uuid, int) from public, anon;
grant execute on function public.admin_marathon_winner(uuid, int) to authenticated;
