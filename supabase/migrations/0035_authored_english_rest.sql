-- =============================================================================
-- 0035 — последние две дыры во второй половине.
--
-- 0032 добавил английскую половину тому, что печатает тренер: название тренировки, задание клуба,
-- дыхание в упражнении. Проверка всего, что вообще доходит до читателя, нашла ещё две — и обе
-- видны не в редких местах, а на главных экранах.
--
-- ## `marathons.title_en`, `.description_en`, `.prize_en`
--
-- **Приз виден всем.** `clubPrize()` подставляет переведённую строку по умолчанию только когда
-- поле пустое; как только Сергей вписал «Час с тренером», её видит и английский читатель — на
-- экране клуба, на доске и в плашке победителя. Название круга и описание — там же.
--
-- ## `exercises.short_name_en`
--
-- Короткое имя движения — то, что стоит в полоске упражнений на карточке дня. Английской половины
-- у него не было вовсе, и `catalogue.ts` выходил из положения так:
--
--     shortName: { ru: r.shortNameRu, en: r.shortNameRu }
--
-- То есть клал русскую строку в английскую половину. Это хуже, чем отсутствие перевода: пустое
-- поле видно и в интерфейсе, и в проверке, а русский текст, лежащий в колонке `en`, неотличим от
-- перевода — после такого «что ещё не переведено» не узнать никогда. Та строка уходит вместе с
-- этой миграцией.
--
-- ## Почему снова nullable и снова ничего не копируется
--
-- По тем же причинам, что в 0032, и они не изменились. Пустая половина читается как «не
-- перевели»; `l10n()` подставит русское, так что английский читатель увидит русское название, а
-- не пустоту. Обязательный перевод означал бы, что Сергей не может объявить приз, пока не
-- переведёт его, — а он тренер, а не переводчик.
--
-- Идемпотентна.
-- =============================================================================

-- Круг клуба: название, описание и приз.
alter table public.marathons add column if not exists title_en text;
alter table public.marathons add column if not exists description_en text;
alter table public.marathons add column if not exists prize_en text;

do $$
begin
  -- Длины — как у русских колонок рядом (0011).
  if not exists (select 1 from pg_constraint where conname = 'marathons_title_en_len') then
    alter table public.marathons
      add constraint marathons_title_en_len
      check (title_en is null or length(title_en) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'marathons_description_en_len') then
    alter table public.marathons
      add constraint marathons_description_en_len
      check (description_en is null or length(description_en) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'marathons_prize_en_len') then
    alter table public.marathons
      add constraint marathons_prize_en_len
      check (prize_en is null or length(prize_en) <= 200);
  end if;
end $$;

-- Короткое имя движения.
alter table public.exercises add column if not exists short_name_en text;

-- Англоязычному читателю у заведённых кругов уже есть что показать: обе строки написаны здесь, а
-- не набраны в админке, и это те же слова, что стоят в русских колонках с 0033. Условие `is null`
-- обязательно: если Сергей успел вписать свой перевод, повторный прогон миграции его не затрёт.
update public.marathons
set title_en = 'Solo club'
where slug = 'club' and title_en is null;

update public.marathons
set title_en = 'Club in pairs'
where slug = 'club_duo' and title_en is null;

update public.marathons
set prize_en = 'An hour with the coach'
where slug = 'club' and prize_en is null and prize is not null;

update public.marathons
set prize_en = 'An hour with the coach — for each of the pair'
where slug = 'club_duo' and prize_en is null and prize is not null;

-- =============================================================================
-- Кто выбирает половину
--
-- У круга клуба это решается **в базе, а не в приложении**, и это не каприз. Название, описание и
-- приз доходят до экрана не колонками, а через `my_marathons()` и `club_winner()` — функции
-- возвращают по одной строке на поле. Отдать наружу обе половины значило бы расширить возвращаемый
-- тип двух функций, провести `titleEn`/`prizeEn` через типы, мапперы строк, демо-слой и четыре
-- экрана — и всё это чтобы в конце вызвать `l()`, который выберет то же самое.
--
-- Язык читателя базе известен: `profiles.locale` стоит с 0001 и с 0154 им управляет само
-- приложение. Значит выбрать можно там же, где берётся строка, и ниже по течению ничего не знает,
-- что выбор вообще был.
--
-- Это не общий приём, а решение для этих двух функций. Там, где текст правит тренер в админке
-- (`custom_workouts`, `marathon_tasks`, упражнения), наружу по-прежнему уходят обе половины: их
-- надо не только показать, но и отредактировать, а редактору нужны обе.
-- =============================================================================

/*
 * Язык текущего читателя. `stable`, поэтому в пределах одного запроса вычисляется раз, а не на
 * каждую строку. `'ru'` — ответ и для анонима, и для того, у кого профиля ещё нет: язык по
 * умолчанию задан в `profiles.locale` с самого начала, и менять его здесь было бы вторым местом,
 * где написано, какой язык родной.
 */
create or replace function public.my_locale()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(
    (select p.locale from public.profiles p where p.email = public.current_email()),
    'ru'
  );
$$;

revoke execute on function public.my_locale() from public, anon;
grant execute on function public.my_locale() to authenticated;

/*
 * Половина на языке читателя. Пустая английская половина — это «не перевели», и тогда ответ
 * русский: читатель видит слова тренера, а не пустоту. `btrim` потому, что строка из одних
 * пробелов приходит от формы, а не от переводчика.
 */
create or replace function public.pick_l10n(p_ru text, p_en text)
returns text
language sql
stable
set search_path = pg_catalog, public, extensions
as $$
  select case
    when public.my_locale() = 'en' then coalesce(nullif(btrim(p_en), ''), p_ru)
    else p_ru
  end;
$$;

revoke execute on function public.pick_l10n(text, text) from public, anon;
grant execute on function public.pick_l10n(text, text) to authenticated;

-- Круги, в которых состоит читатель. Тип возвращаемого значения не меняется — меняются три
-- выражения в списке выборки.
create or replace function public.my_marathons()
returns table (
  id          uuid,
  slug        text,
  title       text,
  description text,
  status      text,
  starts_on   date,
  days        int,
  team_size   int,
  prize       text,
  day_index   int,
  week        int,
  total_weeks int,
  member_id   uuid,
  team_id     uuid,
  team_name   text,
  is_club     boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    m.id,
    m.slug,
    public.pick_l10n(m.title, m.title_en),
    public.pick_l10n(m.description, m.description_en),
    m.status,
    m.starts_on,
    m.days,
    m.team_size,
    public.pick_l10n(m.prize, m.prize_en),
    least(public.marathon_day_index(m.id), m.days) as day_index,
    public.marathon_week_of(least(public.marathon_day_index(m.id), m.days)) as week,
    public.marathon_week_of(m.days) as total_weeks,
    mem.id, mem.team_id, t.name, m.is_club
  from public.marathons m
  join public.marathon_members mem
    on mem.marathon_id = m.id
   and mem.status = 'active'
   and mem.email = public.current_email()
  left join public.marathon_teams t on t.id = mem.team_id
  where m.status in ('active', 'finished')
  order by m.is_club desc, m.starts_on desc;
$$;

revoke execute on function public.my_marathons() from public, anon;
grant execute on function public.my_marathons() to authenticated;

-- Победитель недели. Тот же приз, та же подмена; остальное — как в 0033.
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
      -- Безымянному участнику подпись ставит база, и на языке того, кто её читает.
      case when public.my_locale() = 'en' then 'Member' else 'Участник' end
    ), 60),
    coalesce(p.avatar_seed, ''),
    w.note,
    public.pick_l10n(m.prize, m.prize_en),
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

/*
 * Сообщение победителю в бота.
 *
 * Здесь `pick_l10n()` не годится: очередь наполняет триггер от имени того, кто объявил победителя,
 * то есть тренера, а прочитает сообщение победитель. Язык у них разный, и берётся он в момент
 * отправки — `telegram-notify` уже читает `profiles.locale` получателя (0154).
 *
 * Поэтому в полезную нагрузку кладутся **обе половины**, а выбор делает отправщик. `prize` остаётся
 * на месте и остаётся русским: письма, уже лежащие в очереди, разбираются старым кодом, и отнимать
 * у них поле значило бы разослать «ты выиграл(а) » без приза.
 */
create or replace function public.marathon_winners_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email    citext;
  v_prize    text;
  v_prize_en text;
begin
  -- Адрес участника — единственное, что связывает победителя с очередью: она
  -- вся живёт на почтах, потому что получателя ищет отправитель (0027).
  select mem.email into v_email
  from public.marathon_members mem
  where mem.id = new.member_id;

  if v_email is null then
    return new;
  end if;

  select m.prize, m.prize_en into v_prize, v_prize_en
  from public.marathons m where m.id = new.marathon_id;

  perform public.enqueue_telegram(
    v_email::text,
    'weekly_winner',
    'weekly_winner:' || new.marathon_id::text || ':' || new.week::text
      || ':' || new.member_id::text,
    jsonb_build_object(
      'prize', coalesce(v_prize, ''),
      'prize_en', coalesce(v_prize_en, ''),
      'note', coalesce(new.note, '')
    ),
    now(),
    interval '1 day'
  );
  return new;
end;
$$;

/*
 * Триггер не пересоздаётся: `create or replace function` сохраняет привязку, и он продолжает
 * указывать сюда. Первая версия этой миграции его всё-таки пересоздавала — и потеряла половину
 * условия: у 0029 он стоит на `insert or update of member_id`, потому что тренер может сменить
 * победителя, и тогда сообщение должно уйти новому. Написанное заново `after insert` это молча
 * отменило; поймал 85_weekly_winner.sql. Меняется тело — трогать надо только тело.
 */

notify pgrst, 'reload schema';
