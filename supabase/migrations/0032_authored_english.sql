-- =============================================================================
-- 0032 — вторая половина у того, что печатает тренер.
--
-- Сайт и приложение выходят на двух языках (0154), и у почти всего текста обе половины были с
-- самого начала: словари интерфейса сверяет компилятор, контент курсов лежит как `{ru, en}`.
-- Не хватало ровно там, где текст не написан заранее, а набирается в админке.
--
-- ## Что добавляется
--
-- * `custom_workouts.title_en`, `.description_en` — название тренировки из конструктора. Сама
--   структура (разделы, заметки к упражнениям) уже двуязычная: `titleEn`, `descriptionEn`,
--   `noteEn` внутри `structure` появились вместе с импортом курсов (0009) и заполнены у всего,
--   что пришло оттуда. Не было только верхнего уровня.
-- * `marathon_tasks.title_en`, `.body_en` — задание клуба.
-- * `exercises.breathing_en` — единственное поле упражнения, у которого была только русская
--   половина; `description_en`, `how_to`, `cues`, `mistakes` двуязычны с 0007.
--
-- ## Почему nullable и без значения по умолчанию
--
-- Пустая половина — это «не перевели», и так и должно читаться. Приложение подставляет русское
-- вместо отсутствующего английского (`l10n()` в src/lib/courses/draft.ts), так что английский
-- читатель видит русское название, а не пустоту. Обязательный перевод означал бы, что Сергей не
-- может выпустить день, пока не переведёт его, — а он тренер, а не переводчик.
--
-- Поэтому же ничего не копируется из русских колонок: русский текст, положенный в английскую
-- колонку, неотличим от перевода, и «что ещё не переведено» после такого не узнать никогда.
--
-- Идемпотентна.
-- =============================================================================

-- Конструктор тренировок. Длины — как у русских колонок рядом.
alter table public.custom_workouts add column if not exists title_en text;
alter table public.custom_workouts add column if not exists description_en text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'custom_workouts_title_en_len'
  ) then
    alter table public.custom_workouts
      add constraint custom_workouts_title_en_len
      check (title_en is null or length(title_en) between 1 and 120);
  end if;
end $$;

-- Задание клуба.
alter table public.marathon_tasks add column if not exists title_en text;
alter table public.marathon_tasks add column if not exists body_en text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marathon_tasks_title_en_len'
  ) then
    alter table public.marathon_tasks
      add constraint marathon_tasks_title_en_len
      check (title_en is null or length(title_en) between 1 and 120);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'marathon_tasks_body_en_len'
  ) then
    alter table public.marathon_tasks
      add constraint marathon_tasks_body_en_len
      check (body_en is null or length(body_en) <= 4000);
  end if;
end $$;

-- Дыхание в упражнении.
alter table public.exercises add column if not exists breathing_en text;

comment on column public.custom_workouts.title_en is
  'Английское название. NULL — не переведено; приложение покажет русское.';
comment on column public.marathon_tasks.title_en is
  'Английское название задания. NULL — не переведено; приложение покажет русское.';

-- Колонки меняют то, что PostgREST держит в памяти.
notify pgrst, 'reload schema';
