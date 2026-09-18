-- =============================================================================
-- 0017 — the club's first three weeks of tasks.
--
-- A one-off fill, so the club is not an empty screen on the day people are let
-- into it. **Everything after this is written in the admin**, one task a
-- morning, by the coach — this file is a runway, not a schedule, and nothing
-- here should ever be edited to change next week.
--
-- ## What is written, and what is deliberately not
--
-- Twenty-one tasks, one a day, keyed to `day_index` 1..21 — the club started on
-- a Monday, so those are exactly three calendar weeks. Only days from **today
-- onwards** are inserted: a task on a day that has already passed is a row
-- nobody could have delivered, and it would sit in the week's scoring as points
-- everybody missed.
--
-- They are small on purpose, and none of them is a maximum. «Не выжимай
-- максимум» is the instruction the onboarding gives in the coach's voice, and a
-- club task that contradicted it on day two would be the product arguing with
-- itself. So: a walk, a stretch, a glass of water, a number of squats spread
-- across a day — things anyone can do in the clothes they are wearing, and
-- things a person with a bad knee can scale without being told to.
--
-- No `media_url` on any of them. The card draws the coach's picture above the
-- title, and the honest answer to "which picture" is that he has not taken them
-- yet; the same stock frame twenty-one times would read as a fault rather than
-- as a photograph. The field is in the admin and the day he attaches one it
-- appears.
--
-- Nothing here claims a benefit. No «сожжёшь N калорий», no «за две недели
-- уйдёт», no percentages — `docs/SPEC.md` forbids invented statistics, and the
-- screen this text lands on is one people pay to read.
--
-- ## The shape
--
--   rule = 'per_member'   the club is team_size = 1: you deliver, you score.
--   proof_kind mostly 'done'; a few numbers where a figure is the point, one
--   photograph for the coach only, and a line of text at the end of each week.
--   points 8..15, heavier where the task costs more of the day.
--
-- Idempotent: the range is cleared first, but only of tasks **nobody has
-- delivered against** — a task with proof on it belongs to the people who did
-- it, and deleting it would cascade their submissions away.
--
-- Requires 0016_club_membership.sql.
-- =============================================================================

do $$
declare
  v_club  uuid;
  v_today int;
begin
  select id into v_club from public.marathons where is_club limit 1;
  if v_club is null then
    raise exception 'no_club' using hint = 'Run 0016_club_membership.sql first.';
  end if;

  v_today := greatest(public.marathon_day_index(v_club), 1);

  delete from public.marathon_tasks t
  where t.marathon_id = v_club
    and t.day_index between v_today and 21
    and not exists (
      select 1 from public.marathon_submissions s where s.task_id = t.id
    );

  insert into public.marathon_tasks
    (marathon_id, day_index, sort_order, title, body, proof_kind, unit, target_num, rule, points,
     proof_visibility)
  select
    v_club, v.day, 0, v.title, v.body, v.proof_kind, v.unit, v.target_num, 'per_member', v.points,
    /*
     * A photograph goes to the coach and to nobody else, and it is derived here rather than typed
     * per row so the two can never disagree: day 13's body says «видит только тренер», and a row
     * that left the default 'team' on it would make the screen lie about who is looking. Everything
     * else is a fact and a figure, which the board shows anyway.
     */
    case when v.proof_kind = 'media' then 'coach' else 'team' end
  from (values
    -- --- week 1 -------------------------------------------------------------
    (1,  'Двадцать приседаний до завтрака',
         'Не на скорость и не на счёт до отказа. Двадцать спокойных, с прямой спиной — просто чтобы тело проснулось раньше телефона.',
         'done', null::text, null::numeric, 10),
    (2,  'Стакан воды до кофе',
         'Ровно один стакан и ровно до, а не вместо. Кофе никто не отменял.',
         'done', null, null, 8),
    (3,  'Десять минут пешком',
         'Где угодно: до магазина подальше, круг вокруг дома, одна остановка ногами. Считается всё, что не диван.',
         'done', null, null, 10),
    (4,  'Пешком по лестнице',
         'Сегодня лифт мимо. Если живёшь на двенадцатом — хотя бы половину, остальное лифтом, это честно.',
         'done', null, null, 12),
    (5,  'Планка — сколько держится',
         'Без рекордов. Встал, подержал с прямой спиной, записал секунды. Спина округлилась — значит уже всё, это и есть твоё число.',
         'number', 'сек', null, 10),
    (6,  'Сорок минут на улице',
         'Не тренировка — просто время снаружи. Пешком, с собакой, с коляской, с наушниками. Сорок минут подряд или двумя заходами.',
         'number', 'мин', 40, 12),
    (7,  'Итог недели одной строкой',
         'Что получилось, что нет и что мешало. Одно предложение, честное — оно не для отчёта, а чтобы самому увидеть неделю целиком.',
         'text', null, null, 10),
    -- --- week 2 -------------------------------------------------------------
    (8,  'Десять минут растяжки',
         'Спина, задняя поверхность бедра, грудной отдел. Тянем до «тянет», а не до «больно» — это разные ощущения и путать их не надо.',
         'done', null, null, 10),
    (9,  'Сто приседаний за день',
         'Можно разбить как угодно: пять по двадцать между делами считаются так же, как сто подряд. Важно, чтобы к вечеру их было сто.',
         'done', null, null, 15),
    (10, 'День без сахара',
         'Без добавленного: конфеты, газировка, сахар в кофе. Фрукты — это фрукты, их никто не трогает.',
         'done', null, null, 12),
    (11, 'Отжимания, три подхода',
         'Сколько получается за подход — столько и делай. С колен или от стола — тоже отжимания, техника важнее высоты.',
         'done', null, null, 12),
    (12, 'Двадцать минут пешком после ужина',
         'Самая недооценённая привычка из всех. Спокойным шагом, сразу после еды.',
         'number', 'мин', 20, 10),
    (13, 'Фото тарелки',
         'Один обычный приём пищи, без подготовки к съёмке. Видит только тренер — это не лента, а разговор про еду с человеком, который в ней разбирается.',
         'media', null, null, 10),
    (14, 'Итог недели одной строкой',
         'Та же строка, что и в прошлое воскресенье. Через неделю их будет интересно сравнить.',
         'text', null, null, 10),
    -- --- week 3 -------------------------------------------------------------
    (15, 'Зарядка десять минут',
         'Любая, какая нравится. Суставы, немного пульса, и всё — это разогрев дня, а не тренировка.',
         'done', null, null, 10),
    (16, 'Час на улице',
         'Набирается за день по кускам: дорога, обед, вечерняя прогулка. Считаем суммарно.',
         'number', 'мин', 60, 12),
    (17, 'Планка — сколько держится',
         'То же, что в первую неделю. Сравни с тем числом, но не гонись за ним: сегодняшнее число — это сегодняшнее число.',
         'number', 'сек', null, 10),
    (18, 'Стакан воды до кофе',
         'Возвращаем. Мелочь, которая держится только на повторении.',
         'done', null, null, 8),
    (19, 'Пятьдесят берпи за день',
         'Самое тяжёлое за три недели — и всё равно можно разложить на пять по десять. Колени берегут: шагом вместо прыжка, это полноценный вариант.',
         'done', null, null, 15),
    (20, 'Десять минут растяжки',
         'После вчерашнего — самое то. Спокойно, без фанатизма.',
         'done', null, null, 10),
    (21, 'Итог трёх недель',
         'Что изменилось за три недели и что из этого хочется оставить насовсем. Одно-два предложения.',
         'text', null, null, 12)
  ) as v (day, title, body, proof_kind, unit, target_num, points)
  where v.day >= v_today;
end $$;
