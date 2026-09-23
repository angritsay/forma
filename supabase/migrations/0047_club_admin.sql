-- =============================================================================
-- 0047 — управление клубом из админки: копирование недель, пары, живой клуб, очередь пруфов.
--
-- Владелец ведёт клуб с телефона, и каждое из четырёх действий ниже раньше было либо ручной работой
-- на десятки нажатий, либо вовсе невозможно без SQL:
--
--   1. `admin_copy_tasks` — «Скопировать неделю» и «Скопировать в другой клуб» одним вызовом.
--   2. `admin_duo_rematch`, `admin_duo_split`, `admin_duo_pair` — пересобрать пары сейчас, разбить
--      одну, поставить в пару двоих без пары.
--   3. `admin_set_live_club` — какой круг сейчас клуб (соло или дуо), с безопасной сменой.
--   4. `admin_proof_queue`, `admin_proofs_mark_reviewed` — «Не просмотрено» по обоим клубам.
--
-- И одна мина замедленного действия, найденная по дороге: `marathon_tasks.day_index` и
-- `marathon_adjustments.day_index` всё ещё ограничены сотней дней (0011), а клуб с 0016 идёт десять
-- лет. Клуб начался в сентябре 2026-го, и в конце декабря задание на 101-й день просто не
-- сохранилось бы. Ограничение расширяется до того же потолка, что у `marathons.days`.
--
-- Все функции — `security definer` с проверкой `is_admin()` в первой строке, явными `grant` и без
-- удаления данных, которые кто-то прислал: копирование не затирает день, где уже есть пруфы, а
-- разбитая пара теряет только саму команду — очки лежат на сданных заданиях.
--
-- Требует 0011, 0016, 0027, 0033, 0034. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. День задания и ручных очков — на весь срок клуба.
--
-- Расширение, а не сужение: каждая существующая строка проходит новую проверку, поэтому
-- `drop … add` здесь безопасен и мгновенно проверяется на месте.
-- -----------------------------------------------------------------------------
alter table public.marathon_tasks drop constraint if exists marathon_tasks_day_index_check;
alter table public.marathon_tasks add constraint marathon_tasks_day_index_check
  check (day_index between 1 and 3700);

alter table public.marathon_adjustments drop constraint if exists marathon_adjustments_day_index_check;
alter table public.marathon_adjustments add constraint marathon_adjustments_day_index_check
  check (day_index between 1 and 3700);

-- -----------------------------------------------------------------------------
-- 1. Скопировать задания диапазона дней — в ту же программу или в другую.
--
-- Один вызов покрывает оба сценария владельца:
--   * «Скопировать неделю» — из недели W того же круга в неделю W+1 (или в выбранную);
--   * «Скопировать в другой клуб» — те же дни из соло в дуо и обратно. Какие дни «те же», решает
--     экран (по датам: у двух клубов может быть разный `starts_on`), сюда приходит готовый день.
--
-- Правила, ради которых это функция, а не цикл вставок на телефоне:
--   * День назначения, где уже есть задания, пропускается. С `p_overwrite` его задания заменяются —
--     но **только если по ним ещё никто ничего не прислал**. Удаление задания каскадом удалило бы
--     чужие пруфы и очки, а это не то, что можно сделать галочкой.
--   * Кому адресовано задание, копируется только внутри того же круга: в другом клубе другие люди
--     и другие пары, и чужой id там ничего не значит — там задание уходит всем.
--   * `p_dry_run` считает то же самое и ничего не пишет: экран показывает «скопируется столько-то»
--     до нажатия, и это число не может разойтись с тем, что потом случится.
--
-- Ответ — одна строка счётчиков, без содержимого.
-- -----------------------------------------------------------------------------
create or replace function public.admin_copy_tasks(
  p_from_marathon uuid,
  p_from_day      int,
  p_day_count     int,
  p_to_marathon   uuid,
  p_to_day        int,
  p_overwrite     boolean default false,
  p_dry_run       boolean default false
)
returns table (
  days_copied    int,
  days_skipped   int,
  days_locked    int,
  tasks_copied   int,
  tasks_replaced int
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_from     public.marathons%rowtype;
  v_to       public.marathons%rowtype;
  v_same     boolean;
  v_i        int;
  v_src      int;
  v_dst      int;
  v_src_n    int;
  v_dst_n    int;
  v_task     record;
  v_new      uuid;
  v_copied   int := 0;
  v_skipped  int := 0;
  v_locked   int := 0;
  v_tasks    int := 0;
  v_replaced int := 0;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into v_from from public.marathons where id = p_from_marathon;
  select * into v_to   from public.marathons where id = p_to_marathon;
  if v_from.id is null or v_to.id is null then
    raise exception 'marathon_not_found' using errcode = 'P0001';
  end if;
  -- Два месяца за раз — с запасом на «весь следующий месяц», и не больше: это телефон и одна кнопка.
  if p_day_count is null or p_day_count < 1 or p_day_count > 62 then
    raise exception 'invalid_range' using errcode = 'P0001';
  end if;
  if p_from_day is null or p_from_day < 1 or p_from_day + p_day_count - 1 > v_from.days
     or p_to_day is null or p_to_day < 1 or p_to_day + p_day_count - 1 > v_to.days then
    raise exception 'out_of_range' using errcode = 'P0001';
  end if;

  v_same := v_from.id = v_to.id;
  -- Копия поверх самой себя: неделя, скопированная в пересекающуюся, читала бы свои же новые строки.
  if v_same and p_to_day < p_from_day + p_day_count and p_from_day < p_to_day + p_day_count then
    raise exception 'overlap' using errcode = 'P0001';
  end if;

  for v_i in 0 .. p_day_count - 1 loop
    v_src := p_from_day + v_i;
    v_dst := p_to_day + v_i;

    select count(*) into v_src_n
    from public.marathon_tasks where marathon_id = v_from.id and day_index = v_src;
    -- Пустой день источника — нечего копировать, и это не «пропуск».
    continue when v_src_n = 0;

    select count(*) into v_dst_n
    from public.marathon_tasks where marathon_id = v_to.id and day_index = v_dst;

    if v_dst_n > 0 then
      if not coalesce(p_overwrite, false) then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      if exists (
        select 1 from public.marathon_submissions s
        join public.marathon_tasks t on t.id = s.task_id
        where t.marathon_id = v_to.id and t.day_index = v_dst
      ) then
        v_locked := v_locked + 1;
        continue;
      end if;
      v_replaced := v_replaced + v_dst_n;
      if not coalesce(p_dry_run, false) then
        delete from public.marathon_tasks where marathon_id = v_to.id and day_index = v_dst;
      end if;
    end if;

    v_copied := v_copied + 1;
    v_tasks := v_tasks + v_src_n;
    continue when coalesce(p_dry_run, false);

    for v_task in
      select * from public.marathon_tasks
      where marathon_id = v_from.id and day_index = v_src
      order by sort_order, created_at
    loop
      insert into public.marathon_tasks (
        marathon_id, day_index, sort_order, title, title_en, body, body_en, media_url,
        proof_kind, unit, target_num, rule, points, cap, proof_visibility, due_time, late_counts
      ) values (
        v_to.id, v_dst, v_task.sort_order, v_task.title, v_task.title_en, v_task.body,
        v_task.body_en, v_task.media_url, v_task.proof_kind, v_task.unit, v_task.target_num,
        v_task.rule, v_task.points, v_task.cap, v_task.proof_visibility, v_task.due_time,
        v_task.late_counts
      )
      returning id into v_new;

      if v_same then
        insert into public.marathon_task_targets (task_id, team_id, member_id)
        select v_new, g.team_id, g.member_id
        from public.marathon_task_targets g
        where g.task_id = v_task.id;
      end if;
    end loop;
  end loop;

  return query select v_copied, v_skipped, v_locked, v_tasks, v_replaced;
end;
$$;

revoke execute on function public.admin_copy_tasks(uuid, int, int, uuid, int, boolean, boolean)
  from public, anon;
grant execute on function public.admin_copy_tasks(uuid, int, int, uuid, int, boolean, boolean)
  to authenticated;

comment on function public.admin_copy_tasks(uuid, int, int, uuid, int, boolean, boolean) is
  'Скопировать задания диапазона дней в тот же или другой круг. Занятые дни пропускает; с p_overwrite заменяет, но не дни с пруфами. p_dry_run только считает. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 2a. Пересобрать пары сейчас.
--
-- Ровно та же функция, что зовёт понедельничное расписание (`club-rematch.yml` →
-- `club_duo_rematch()`): автоматические пары расходятся и собираются заново жеребьёвкой, выбранные
-- не трогаются, нечётный остаётся без пары. Отдельной логики здесь нет и не должно быть — иначе
-- кнопка и понедельник однажды разошлись бы.
--
-- `club_duo_rematch()` закрыта для `authenticated` (0034), и так и остаётся: дверь наружу — эта
-- обёртка с проверкой админа.
-- -----------------------------------------------------------------------------
create or replace function public.admin_duo_rematch()
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if public.club_marathon(true) is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;
  return public.club_duo_rematch();
end;
$$;

revoke execute on function public.admin_duo_rematch() from public, anon;
grant execute on function public.admin_duo_rematch() to authenticated;

comment on function public.admin_duo_rematch() is
  'Пересобрать автоматические пары дуо-клуба сейчас — то же, что по понедельникам. Возвращает число пар. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 2b. Разбить пару.
--
-- Только в живом дуо-клубе: у закрытых кругов команды тренер собирал сам и по другим правилам, и
-- кнопка «разбить» там означала бы другое. Команда удаляется целиком, `team_id` у обоих обнуляется
-- каскадом — как при `club_duo_leave()` (0043). Очки остаются на сданных заданиях.
-- -----------------------------------------------------------------------------
create or replace function public.admin_duo_split(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_club uuid := public.club_marathon(true);
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.marathon_teams where id = p_team_id and marathon_id = v_club
  ) then
    raise exception 'team_not_found' using errcode = 'P0001';
  end if;

  perform public.club_duo_break(p_team_id);
end;
$$;

revoke execute on function public.admin_duo_split(uuid) from public, anon;
grant execute on function public.admin_duo_split(uuid) to authenticated;

comment on function public.admin_duo_split(uuid) is
  'Разбить пару живого дуо-клуба. Оба остаются в клубе без пары. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 2c. Поставить двоих в пару.
--
-- Для тех, кто остался без пары: пришёл во вторник, нечётный после жеребьёвки. Обе должны быть
-- активными участницами живого дуо-клуба и **обе без пары** — разбить чужую пару можно, но только
-- отдельным явным действием, а не побочным эффектом этого.
--
-- По умолчанию пара автоматическая: доживёт до понедельника и уйдёт в общую жеребьёвку, как все —
-- «каждую неделю мы будем менять тебе дуо». С `p_keep` она постоянная, как пара по приглашению.
-- -----------------------------------------------------------------------------
create or replace function public.admin_duo_pair(
  p_email_a text,
  p_email_b text,
  p_keep    boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_club uuid := public.club_marathon(true);
  v_a    record;
  v_b    record;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;
  if p_email_a is null or p_email_b is null
     or lower(trim(p_email_a)) = lower(trim(p_email_b)) then
    raise exception 'need_two_members' using errcode = 'P0001';
  end if;

  select id, team_id into v_a from public.marathon_members
   where marathon_id = v_club and email = trim(p_email_a)::citext and status = 'active';
  select id, team_id into v_b from public.marathon_members
   where marathon_id = v_club and email = trim(p_email_b)::citext and status = 'active';

  if v_a.id is null or v_b.id is null then
    raise exception 'member_not_in_club' using errcode = 'P0001';
  end if;
  if v_a.team_id is not null or v_b.team_id is not null then
    raise exception 'already_paired' using errcode = 'P0001';
  end if;

  return public.club_duo_pair(v_club, v_a.id, v_b.id, not coalesce(p_keep, false));
end;
$$;

revoke execute on function public.admin_duo_pair(text, text, boolean) from public, anon;
grant execute on function public.admin_duo_pair(text, text, boolean) to authenticated;

comment on function public.admin_duo_pair(text, text, boolean) is
  'Поставить в пару двоих без пары в живом дуо-клубе. По умолчанию до понедельника; p_keep — постоянно. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 3. Какой круг сейчас клуб.
--
-- Клуб — один на режим (`marathons_one_club_per_mode_idx`, 0033), и переключить его раньше можно
-- было только SQL-ом в двух шагах: снять флаг со старого, поставить новому. Здесь это одно действие
-- в одной транзакции, под блокировкой, чтобы два одновременных нажатия не упёрлись в индекс.
--
--   * Режим круга должен совпадать с тем, клубом какого режима его делают: соло-круг не станет
--     дуо-клубом от того, что так нажали. Режим — это `team_size`, и меняется он в настройках.
--   * Новый клуб становится `active`: клуб, который не идёт, `club_marathon()` не видит, и участники
--     получили бы пустую вкладку.
--   * Прежний клуб этого режима становится `finished`, если шёл. Он остаётся читаемым — доска, пруфы,
--     победители, — но перестаёт быть вторым «идущим» кругом у тех же людей.
--   * Участники в новый клуб записываются сами, при следующем открытии вкладки (`join_club()`);
--     пары в новом дуо соберёт понедельник или «Пересобрать пары сейчас».
--
-- Возвращает id прежнего клуба этого режима (или null), чтобы экран мог сказать, что сменилось.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_live_club(p_marathon_id uuid, p_duo boolean)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_row  public.marathons%rowtype;
  v_prev uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_duo is null then
    raise exception 'mode_required' using errcode = 'P0001';
  end if;

  -- Одна смена клуба за раз: второй вызов ждёт первого, а не падает на уникальном индексе.
  perform pg_advisory_xact_lock(hashtext('admin_set_live_club'));

  select * into v_row from public.marathons where id = p_marathon_id for update;
  if v_row.id is null then
    raise exception 'marathon_not_found' using errcode = 'P0001';
  end if;
  if (v_row.team_size > 1) <> p_duo then
    raise exception 'mode_mismatch' using errcode = 'P0001';
  end if;

  select id into v_prev
  from public.marathons
  where is_club and (team_size > 1) = p_duo and id <> p_marathon_id
  for update;

  if v_prev is not null then
    update public.marathons
       set is_club = false,
           status  = case when status = 'active' then 'finished' else status end
     where id = v_prev;
  end if;

  update public.marathons
     set is_club = true,
         status  = 'active'
   where id = p_marathon_id;

  return v_prev;
end;
$$;

revoke execute on function public.admin_set_live_club(uuid, boolean) from public, anon;
grant execute on function public.admin_set_live_club(uuid, boolean) to authenticated;

comment on function public.admin_set_live_club(uuid, boolean) is
  'Сделать круг живым клубом своего режима (соло или дуо). Прежний клуб этого режима завершается. Возвращает id прежнего. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 4a. «Не просмотрено» — пруфы обоих живых клубов, на которые тренер ещё не смотрел.
--
-- «Не просмотрено» — это `reviewed_at is null` при не отклонённом пруфе: `acceptProof()` и
-- `voidProof()` ставят `reviewed_at`, повторная сдача его стирает (0027). Значит, в очереди и
-- первые попытки, и пересланные после отказа, и одно правило описывает обе.
--
-- Сначала новые — по моменту последней отправки, а не первой: пересланный вчера пруф к задаче
-- прошлой недели — это вчерашняя новость.
--
-- `p_proof_id` открывает один конкретный пруф в любом состоянии и в любом круге: по ссылке из
-- телеграма («Пруф прислали заново») тренер может прийти, когда его уже кто-то посмотрел, и должен
-- увидеть пруф, а не пустоту.
--
-- `total` — сколько всего в очереди, до `p_limit`: экран пишет «ещё 40», не загружая их.
-- -----------------------------------------------------------------------------
create index if not exists marathon_submissions_unreviewed_idx
  on public.marathon_submissions (marathon_id, (coalesce(resubmitted_at, submitted_at)) desc)
  where voided_at is null and reviewed_at is null;

create or replace function public.admin_proof_queue(
  p_limit    int default 50,
  p_proof_id uuid default null
)
returns table (
  id             uuid,
  marathon_id    uuid,
  marathon_title text,
  duo            boolean,
  member_id      uuid,
  member_name    text,
  email          text,
  team_name      text,
  task_id        uuid,
  task_title     text,
  proof_kind     text,
  unit           text,
  day_index      int,
  value_text     text,
  value_num      numeric,
  media_path     text,
  submitted_at   timestamptz,
  attempt        int,
  resubmitted_at timestamptz,
  reviewed_at    timestamptz,
  voided_at      timestamptz,
  void_reason    text,
  total          bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_solo uuid := public.club_marathon(false);
  v_duo  uuid := public.club_marathon(true);
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  select
    s.id,
    s.marathon_id,
    m.title,
    m.team_size > 1,
    s.member_id,
    left(coalesce(
      nullif(trim(mem.display_name), ''),
      nullif(trim(p.display_name), ''),
      mem.email::text
    ), 80),
    mem.email::text,
    team.name,
    s.task_id,
    t.title,
    t.proof_kind,
    t.unit,
    s.day_index,
    s.value_text,
    s.value_num,
    s.media_path,
    s.submitted_at,
    s.attempt,
    s.resubmitted_at,
    s.reviewed_at,
    s.voided_at,
    s.void_reason,
    count(*) over ()
  from public.marathon_submissions s
  join public.marathons m on m.id = s.marathon_id
  join public.marathon_tasks t on t.id = s.task_id
  join public.marathon_members mem on mem.id = s.member_id
  left join public.profiles p on p.email = mem.email
  left join public.marathon_teams team on team.id = mem.team_id
  where case
    when p_proof_id is not null then s.id = p_proof_id
    else s.marathon_id in (v_solo, v_duo)
         and s.voided_at is null
         and s.reviewed_at is null
  end
  order by coalesce(s.resubmitted_at, s.submitted_at) desc, s.id
  limit greatest(least(coalesce(p_limit, 50), 200), 1);
end;
$$;

revoke execute on function public.admin_proof_queue(int, uuid) from public, anon;
grant execute on function public.admin_proof_queue(int, uuid) to authenticated;

comment on function public.admin_proof_queue(int, uuid) is
  'Пруфы обоих живых клубов без просмотра тренера, новые сначала; с p_proof_id — один пруф в любом состоянии. Только админ (0047).';

-- -----------------------------------------------------------------------------
-- 4b. Отметить просмотренными — пачкой.
--
-- На первом открытии в очереди окажется всё, что прислали с запуска клуба: до этой миграции
-- «просмотрено» ставилось только на пересланные. Листать сотни старых пруфов по одному никто не
-- будет, поэтому «Всё просмотрено» — одним действием по тем id, что тренер видит на экране.
-- Отклонённые и уже просмотренные не трогаются.
-- -----------------------------------------------------------------------------
create or replace function public.admin_proofs_mark_reviewed(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_n int;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  if cardinality(p_ids) > 500 then
    raise exception 'too_many' using errcode = 'P0001';
  end if;

  update public.marathon_submissions
     set reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = any (p_ids)
     and voided_at is null
     and reviewed_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.admin_proofs_mark_reviewed(uuid[]) from public, anon;
grant execute on function public.admin_proofs_mark_reviewed(uuid[]) to authenticated;

comment on function public.admin_proofs_mark_reviewed(uuid[]) is
  'Отметить пруфы просмотренными (кроме отклонённых и уже просмотренных). Возвращает число. Только админ (0047).';

notify pgrst, 'reload schema';
