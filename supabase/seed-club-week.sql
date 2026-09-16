-- =============================================================================
-- Forma — «Клуб маленьких шагов»: one week of tasks, for testing.
--
-- Run it in the Supabase SQL editor after the migrations (docs/SETUP.md §2).
-- It is idempotent: running it again rewrites the same week rather than adding a
-- second copy, so the plan can be edited here and re-applied as often as you like.
--
-- What it creates
--   • one marathon, slug `klub_test`, seven days, starting today
--   • seventeen tasks across those seven days
--   • nothing else — no people, no teams, no proof. Add the testers at the bottom.
--
-- It touches ONLY the row whose slug is `klub_test`. Any other marathon is left
-- alone, including a real one running at the same time.
--
-- The plan is written for the format the name promises: one small thing a day,
-- never a feat. Each day has at most one task that takes real effort; the rest are
-- a line to answer, a glass of water, a flight of stairs. The pair task
-- (`all_members`) is the one that scores properly, because it is the one that
-- makes two people pull each other through — that is the whole mechanism.
--
-- Points per day land between 8 and 18, so no single day can decide the week.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) The club itself.
--
-- `starts_on` is today, so day 1 is today and the app has something to show the
-- moment you open it. To rehearse a week that is already running, set it back a
-- few days — `current_date - 3` makes today day 4, with three days of history.
-- -----------------------------------------------------------------------------
insert into public.marathons (slug, title, description, status, starts_on, days, team_size, timezone, due_time, prize)
values (
  'klub_test',
  'Клуб маленьких шагов',
  'Тестовая неделя. Одно небольшое задание в день, напарник и общая таблица.',
  'active',
  current_date,
  7,
  2,          -- пара: задание «на двоих» засчитывается, только если сделали оба
  'Europe/Moscow',
  '22:00',
  'Час с тренером'
)
on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  status      = excluded.status,
  starts_on   = excluded.starts_on,
  days        = excluded.days,
  team_size   = excluded.team_size,
  timezone    = excluded.timezone,
  due_time    = excluded.due_time,
  prize       = excluded.prize;

-- -----------------------------------------------------------------------------
-- 2) The week.
--
-- Tasks are replaced wholesale, not merged: the plan below is the whole truth, and
-- editing a line here and re-running should not leave yesterday's version behind.
--
-- Deleting a task deletes its proof too (`on delete cascade`), which is what you
-- want while testing and is worth knowing before you re-run this on a week people
-- have already played.
--
-- Columns worth knowing:
--   rule         all_members — the entry scores only if BOTH of the pair delivered
--                per_member  — everyone who delivered scores for themselves
--                capped      — per_member, but the pair's total stops at `cap`
--                none        — no points: a morning line, a rest day, a tip
--   proof_kind   done | text | number | media
--   unit/target  the figure and what it is measured in (target is informational —
--                "did you hit it" stays the coach's judgement, not arithmetic)
--   proof_visibility  team (the partner sees it) | coach (only the coach does)
--   due_time     overrides the club's 22:00 for this one task
-- -----------------------------------------------------------------------------
delete from public.marathon_tasks
where marathon_id = (select id from public.marathons where slug = 'klub_test');

insert into public.marathon_tasks
  (marathon_id, day_index, sort_order, title, body, rule, points, cap,
   proof_kind, unit, target_num, proof_visibility, due_time)
select
  (select id from public.marathons where slug = 'klub_test'),
  t.day_index, t.sort_order, t.title, t.body, t.rule, t.points, t.cap,
  t.proof_kind, t.unit, t.target_num, t.proof_visibility, t.due_time
from (values
  -- ДЕНЬ 1 — начали. Ничего физического: первый день решает, вернёшься ли ты завтра.
  (1, 0, 'Доброе утро',
      'Первая неделя клуба. Ответь одним словом, с каким настроением начинаешь.',
      'none', 0, null::int, 'text', null::text, null::numeric, 'team', null::time),
  (1, 1, 'Десять минут на ногах',
      'Прогулка, уборка, танцы на кухне — что угодно, лишь бы десять минут не сидя.',
      'all_members', 10, null, 'done', null, null, 'team', null),
  (1, 2, 'Стакан воды до кофе',
      'Один стакан воды перед первой чашкой. Всё.',
      'per_member', 3, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 2 — цифры. Два задания, которые измеряются, чтобы в таблице появились числа.
  (2, 0, 'Шаги',
      'Считаем шаги за день. Шесть тысяч — это примерно час спокойной ходьбы, набирается по частям.',
      'per_member', 5, null, 'number', 'шагов', 6000, 'team', null),
  (2, 1, 'Планка',
      'Максимум за один подход. Записываем секунды — на этой неделе важно не сколько, а что померили.',
      'per_member', 5, null, 'number', 'сек', null, 'team', null),

  -- ДЕНЬ 3 — лестница. Первое задание с дедлайном до обеда: проверяет, что время работает.
  (3, 0, 'Доброе утро',
      'Третий день — тот самый, на котором обычно всё и заканчивается. Не сегодня.',
      'none', 0, null, 'done', null, null, 'team', null),
  (3, 1, 'Пешком по лестнице',
      'Сегодня лифт не работает. Считаем подъёмы: до пяти в зачёт, дальше уже из спортивного интереса.',
      'capped', 3, 15, 'number', 'этажей', null, 'team', null),
  (3, 2, 'Двадцать приседаний до обеда',
      'Можно за два подхода. Главное — до обеда, пока день не съел.',
      'all_members', 8, null, 'done', null, null, 'team', '14:00'),

  -- ДЕНЬ 4 — полегче. Не ноль: день без задания читается как «клуб про меня забыл».
  (4, 0, 'День полегче',
      'Сегодня ничего тяжёлого. Отдых — часть плана, а не пропуск.',
      'none', 0, null, 'done', null, null, 'team', null),
  (4, 1, 'Пятнадцать минут растяжки',
      'Перед сном, без экрана. Спина и ноги.',
      'per_member', 5, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 5 — еда. Фото видит только тренер: это проверка приватности, и она важная.
  (5, 0, 'Фото тарелки',
      'Один обед, как есть. Без комментариев и без «сначала приготовлю что-то приличное».',
      'per_member', 4, null, 'media', null, null, 'coach', null),
  (5, 1, 'Отжимания',
      'Сколько получится, за три подхода. С колен — тоже отжимания.',
      'per_member', 6, null, 'number', 'раз', null, 'team', null),

  -- ДЕНЬ 6 — вдвоём. Самое дорогое задание недели и единственное «настоящее».
  (6, 0, 'Доброе утро',
      'Предпоследний день. Сегодня то самое задание, ради которого нужен напарник.',
      'none', 0, null, 'done', null, null, 'team', null),
  (6, 1, 'Тренировка из курса',
      'Любая из «Формы с нуля», восемнадцать минут. Засчитывается, только если сделали оба.',
      'all_members', 12, null, 'done', null, null, 'team', null),
  (6, 2, 'Без сладкого до вечера',
      'До ужина. Вечером — как хочешь.',
      'per_member', 4, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 7 — итог. Текстом: неделя заканчивается словами, а не цифрой.
  (7, 0, 'Прогулка сорок минут',
      'Без наушников, если получится. Вдвоём — если получится совсем хорошо.',
      'all_members', 10, null, 'done', null, null, 'team', null),
  (7, 1, 'Итог недели',
      'Одной строкой: что из этих семи дней останется с тобой на следующей.',
      'per_member', 3, null, 'text', null, null, 'team', null)
) as t (day_index, sort_order, title, body, rule, points, cap,
        proof_kind, unit, target_num, proof_visibility, due_time);

commit;

-- =============================================================================
-- 3) The testers. Fill in the two real emails and run this block separately.
--
-- Emails are NOT in this file on purpose: the repository is public, and an email
-- committed here is an email published forever. Type them in the SQL editor, run
-- the block, and do not paste the result back into the repo or into chat.
--
-- `team_size` is 2 above, so the pair task only scores when both deliver. Put the
-- two testers in ONE team to see that; put them in two teams to watch the board
-- instead. A member can be added before they have ever signed in — the club finds
-- them by the address they sign in with, exactly like a course purchase does.
-- =============================================================================
--
--   with club as (select id from public.marathons where slug = 'klub_test'),
--        team as (
--          insert into public.marathon_teams (marathon_id, name)
--          select id, 'Пара 1' from club
--          -- `do update`, not `do nothing`: a conflicting `do nothing` returns no row at all,
--          -- and the insert below would then quietly add nobody. Re-running this must be safe.
--          on conflict (marathon_id, name) do update set name = excluded.name
--          returning id
--        )
--   insert into public.marathon_members (marathon_id, email, team_id, display_name)
--   select club.id, v.email, team.id, v.name
--   from club, team, (values
--     ('ЗАМЕНИ-НА-ПОЧТУ-1', 'Настя'),
--     ('ЗАМЕНИ-НА-ПОЧТУ-2', 'Сергей')
--   ) as v (email, name)
--   on conflict (marathon_id, email) do update set
--     team_id      = excluded.team_id,
--     display_name = excluded.display_name,
--     status       = 'active';
--
-- =============================================================================
-- 4) Handy afterwards
-- =============================================================================
--
-- Что сейчас в плане:
--   select day_index, sort_order, title, rule, points, proof_kind
--   from public.marathon_tasks
--   where marathon_id = (select id from public.marathons where slug = 'klub_test')
--   order by day_index, sort_order;
--
-- Сдвинуть неделю (например, чтобы сегодня стал четвёртым днём):
--   update public.marathons set starts_on = current_date - 3 where slug = 'klub_test';
--
-- Стереть тестовый клуб целиком — задания, участников, команды и отчёты:
--   delete from public.marathons where slug = 'klub_test';
