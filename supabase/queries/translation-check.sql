-- Сколько из того, что напечатал тренер, ещё не имеет английской половины.
--
-- Всё, что написано заранее, двуязычно и сверяется компилятором: словари интерфейса, курсы в
-- `content/`, гайды. Двуязычие может отстать только там, где текст набирают в админке, — и узнать
-- об этом иначе можно, только открыв приложение по-английски и наткнувшись на русское слово.
--
-- Возвращает **одни счётчики**: сколько строк есть и у скольких из них половина пустая. Ни одной
-- строки текста, ни одного адреса. Страница запуска публичного репозитория видна всем и остаётся
-- навсегда (docs/SETUP.md §7.8).
--
-- Пустая половина считается непереведённой, и строка из одних пробелов — тоже: она приходит из
-- формы, а не от переводчика. `nullif(btrim(...), '')` — то же правило, что в `pick_l10n()` (0035),
-- поэтому счётчик и продукт не могут разойтись в том, что считать переводом.

with counts as (
  select 'Клуб: название'      as what,
         count(*)              as total,
         count(*) filter (where nullif(btrim(title_en), '') is null) as missing
  from public.marathons where status in ('active', 'finished')
  union all
  select 'Клуб: приз',
         count(*) filter (where nullif(btrim(prize), '') is not null),
         count(*) filter (where nullif(btrim(prize), '') is not null
                            and nullif(btrim(prize_en), '') is null)
  from public.marathons where status in ('active', 'finished')
  union all
  select 'Клуб: задание дня',
         count(*),
         count(*) filter (where nullif(btrim(title_en), '') is null)
  from public.marathon_tasks
  union all
  select 'Тренировка: название',
         count(*),
         count(*) filter (where nullif(btrim(title_en), '') is null)
  from public.custom_workouts
  union all
  select 'Упражнение: название',
         count(*),
         count(*) filter (where nullif(btrim(name_en), '') is null)
  from public.exercises
  union all
  select 'Упражнение: короткое имя',
         count(*) filter (where nullif(btrim(short_name_ru), '') is not null),
         count(*) filter (where nullif(btrim(short_name_ru), '') is not null
                            and nullif(btrim(short_name_en), '') is null)
  from public.exercises
  union all
  select 'Упражнение: дыхание',
         count(*) filter (where nullif(btrim(breathing_ru), '') is not null),
         count(*) filter (where nullif(btrim(breathing_ru), '') is not null
                            and nullif(btrim(breathing_en), '') is null)
  from public.exercises
  union all
  -- Курс и его дни лежат как `{ru, en}` внутри jsonb, а не колонками, поэтому половина
  -- достаётся стрелкой. Считаются только опубликованные: черновик читателю не показывают.
  select 'Курс: название',
         count(*),
         count(*) filter (where nullif(btrim(content -> 'name' ->> 'en'), '') is null)
  from public.admin_courses where status = 'published'
  union all
  select 'День курса: заголовок',
         count(*),
         count(*) filter (where nullif(btrim(d.content -> 'title' ->> 'en'), '') is null)
  from public.admin_course_days d
  join public.admin_courses c on c.id = d.course_id and c.status = 'published'
)
select
  what,
  total,
  missing,
  total - missing as done
from counts
where total > 0
order by missing desc, what;
