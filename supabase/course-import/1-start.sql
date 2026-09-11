-- PART 1 OF 5 — Форма с нуля: кроссфит дома без оборудования
--
-- Paste this whole file into the Supabase SQL editor and run it. Run the parts in order:
-- a course's days reference the course row, so an earlier part has to go in first.
--
-- Safe to re-run, and safe to re-run a part on its own.
--
-- GENERATED from supabase/migrations/0009_course_import.sql by scripts/db/split-import.mjs — do not edit by hand.

-- =============================================================================
-- 0009 — the compiled courses, as rows the admin panel can edit.
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate with:  node scripts/content/gen-course-import.mjs
-- Source of truth:  content/courses/*.ts (validated by src/content/registry.ts)
--
-- Requires 0008_course_builder.sql. Idempotent: re-running updates the rows in place.
--
-- These arrive as DRAFTS. Nothing changes for anyone until a course is published from the
-- admin panel, and even then the compiled file keeps winning while it exists — the catalogue
-- prefers compiled content on an id collision. Delete the course file to hand a course over.
--
-- Ids are preserved throughout: a course keeps its slug_id, a workout keeps its id as
-- short_id, a day keeps its node id. Purchases, sessions and progress all key off those, so
-- the imported copy scores and resumes exactly as the original.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- start — Форма с нуля: кроссфит дома без оборудования
-- 20 workouts, 28 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'start', 'draft', 1, 1, 4, 5, 18,
  '{"none","mat","chair"}'::text[], '#1a2634', 2990, 29,
  '{"slug":{"ru":"start-krossfit-doma-bez-oborudovaniya","en":"start-home-crossfit-basics"},"name":{"ru":"Форма с нуля: кроссфит дома без оборудования","en":"Forma. Start: home CrossFit basics"},"tagline":{"ru":"Четыре недели по программе тренера для новичков: коротко, по кругу, без оборудования.","en":"Four weeks of the coach’s own beginner programme: short, in rounds, no equipment."},"description":{"ru":"Программа для тех, кто начинает с нуля или возвращается после долгого перерыва. Двадцать коротких тренировок за двадцать дней — те самые, по которым тренер ведёт новичков: отжимания с колен, приседания, ситапы, выпады, зашагивания и червячки. Пять раз в неделю по 15–20 минут вместе с разминкой и заминкой, нагрузка подстраивается под тебя.","en":"A programme for complete beginners and anyone coming back after a long break. Twenty short sessions over twenty days — the same ones the coach runs his beginners through: knee push-ups, squats, sit-ups, lunges, step-ups and inchworms. Five times a week, 15–20 minutes each including warm-up and cool-down, and the load adapts to you."},"longDescription":[{"ru":"«Старт» — это программа для новичков, которую тренер ведёт в своей группе, перенесённая в приложение без изменений в сути: те же 20 тренировок, тот же порядок, те же слова. Цель первых недель — проработать большие группы мышц и включить тебя в процесс, а не выжать до предела. Каждую тренировку тренер показывает сам: на каждое движение есть его видео.","en":"Start is the beginner programme the coach runs with his own group, moved into the app without changing what matters: the same 20 sessions, the same order, the same words. The aim of the first weeks is to work the big muscle groups and get you into the process, not to wring you out. The coach demonstrates every session himself: every movement has his video."},{"ru":"Первые тренировки — работа по таймеру: каждую минуту новое движение, потом простые круги с минутой отдыха. Дальше форматы кроссфита по одному: три круга на время, AMRAP, EMOM, старт раз в 2–3 минуты, лесенки и длинный комплекс на время. Пять тренировок в неделю, два дня — отдых с целью 10000 шагов: мышцы восстанавливаются лучше, когда ты двигаешься, а не лежишь.","en":"The first sessions are work by the timer — a new movement every minute — then simple rounds with a minute of rest. The CrossFit formats arrive one at a time: three rounds for time, AMRAP, EMOM, starts every 2–3 minutes, ladders and a long chipper for time. Five sessions a week, two rest days with a 10,000-step goal — muscles recover better when you move than when you lie still."},{"ru":"Тренировки короткие — 15–20 минут вместе с разминкой и заминкой, самая длинная около 23. Сама работа — 5–15 минут, как у тренера; разминка — суставная гимнастика сверху вниз, без бега — и растяжка в конце в это время не входят. Из инвентаря нужны коврик и устойчивый стул: от него ты будешь отжиматься и на него зашагивать. Приложение считает, сколько повторений тебе делать сегодня, по результатам прошлой тренировки — было тяжело, легко или в самый раз. Тяжёлые упражнения заменяются простыми: ситапы — «мёртвым жуком», прыжки — шагом.","en":"Sessions are short — 15–20 minutes including warm-up and cool-down, the longest around 23. The work itself is 5–15 minutes, as the coach runs it; the warm-up — top-to-bottom joint mobility, no running — and the stretch at the end are not counted in that. You need a mat and a sturdy chair: you will do dips off it and step-ups onto it. The app works out how many reps you should do today from how your last session went — too hard, too easy or just right. Hard movements swap for simple ones: sit-ups for dead bugs, jumps for steps."},{"ru":"Первый день — это первая тренировка, а не тест на максимум: тренер считает, что первое занятие не должно тебя уничтожить. Стартовую нагрузку задаёт анкета при первом входе. Внутри программы у тренера свои точки отсчёта: лесенка червячков в предпоследней тренировке, к которой вернёшься через месяц-два, и финальные три круга, где сравнишь ощущения с самой первой тренировкой.","en":"Day one is the first workout, not a max-effort test: the coach believes the first session must not destroy you. Your starting load comes from the onboarding on first login. Inside the programme the coach has his own reference points: an inchworm ladder in the penultimate session that you come back to in a month or two, and a final three rounds where you compare how it feels with your very first workout."}],"forWhom":[{"ru":"Ты начинаешь с нуля или возвращаешься после долгого перерыва — год и больше.","en":"You are starting from zero or coming back after a long break — a year or more."},{"ru":"Хочешь тренироваться по программе живого тренера, а не по подборке упражнений из интернета.","en":"You want a real coach’s programme, not a list of exercises off the internet."},{"ru":"Нет инвентаря и места: только коврик, стул и два квадратных метра.","en":"You have no gear and little space: a mat, a chair and two square metres."},{"ru":"Есть 15–20 минут пять раз в неделю и желание не бросить через две.","en":"You can find 15–20 minutes five times a week and want to still be going in week three."}],"outcomes":[{"ru":"Уверенная техника базовых движений: присед, отжимание с колен, ситап, выпад, зашагивание.","en":"Confident technique in the base movements: squat, knee push-up, sit-up, lunge, step-up."},{"ru":"Все форматы кроссфита в лёгких дозах — и лесенка червячков, к которой ты вернёшься, чтобы увидеть прогресс.","en":"Every CrossFit format in gentle doses — and an inchworm ladder you will come back to and see the difference."},{"ru":"Привычка тренироваться пять раз в неделю и ходить в дни отдыха.","en":"A habit of training five times a week and walking on rest days."},{"ru":"Знакомство со всеми форматами кроссфита: круги, «на время», AMRAP, EMOM, лесенки, длинный комплекс.","en":"A working knowledge of every CrossFit format: rounds, for-time, AMRAP, EMOM, ladders, the chipper."},{"ru":"Твои личные цифры: точки отсчёта тренера — лесенка червячков и финальные три круга против самой первой тренировки.","en":"Your own numbers: the coach’s reference points — the inchworm ladder and the final three rounds against your very first workout."},{"ru":"Готовность перейти к курсу «Своим весом» или к тренировкам с гантелями.","en":"Readiness to move on to the Bodyweight Engine course or to dumbbell training."}],"faq":[{"q":{"ru":"Что нужно из оборудования?","en":"What equipment do I need?"},"a":{"ru":"Коврик и устойчивый стул без колёсиков — от него ты будешь делать обратные отжимания и на него зашагивать. Если стула нет, зашагивай на ступеньку, а обратные отжимания замени на отжимания от подоконника. Скакалка — по желанию: везде, где она есть, можно делать джампинг-джеки.","en":"A mat and a sturdy chair without wheels — you will do dips off it and step-ups onto it. No chair? Use a stair step for step-ups and a windowsill for the dips. A jump rope is optional: wherever it appears, jumping jacks do the same job."}},{"q":{"ru":"Я совсем не в форме. Точно получится?","en":"I am completely out of shape. Will I cope?"},"a":{"ru":"Курс написан именно для этого. Тренер советует новичкам начинать с минимальных цифр — и приложение делает это за тебя: после анкеты при первом входе оно уменьшает количество повторений, а после каждой тренировки спрашивает, как было, и корректирует следующую. Если тяжело — выбирай режим «Полегче»: это не поражение, а часть плана. Ситапы можно всегда заменить «мёртвым жуком».","en":"That is exactly who this course is for. The coach tells beginners to start at the minimum — and the app does it for you: after the onboarding on first login it lowers the rep counts, then asks how each session felt and adjusts the next one. If it is hard, pick \"Easier\" — that is not failure, it is part of the plan. Sit-ups can always become dead bugs."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"В среднем около 18 минут вместе с разминкой и заминкой — по 5 минут на суставную гимнастику и растяжку и 5–15 минут работы. Самые короткие — первые тренировки по таймеру, около 14–15 минут; самые длинные — чиппер и два длинных круга, около 22–23 минут. Перед стартом приложение показывает расчётное время для каждого режима сложности.","en":"About 18 minutes on average including warm-up and cool-down — 5 minutes each of joint mobility and stretching plus 5–15 minutes of work. The shortest are the first timer sessions at around 14–15 minutes; the longest are the chipper and the two long rounds at around 22–23. Before you start, the app shows the estimated time for each difficulty option."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Ничего страшного: сделай её на следующий день и сдвинь остальные. Не пытайся нагнать две за один день — у новичков это заканчивается крепатурой и пропуском ещё одной недели. Если совсем нет сил или времени, у тренера есть альтернатива на любой день: 10 000 шагов.","en":"No drama: do it the next day and shift the rest. Do not try to squeeze two into one day — for beginners that ends in soreness and another week off. And if there is no energy or time at all, the coach has an alternative for any day: 10,000 steps."}},{"q":{"ru":"У меня диастаз. Можно ли делать ситапы?","en":"I have diastasis. Can I do sit-ups?"},"a":{"ru":"Тренер не рекомендует ситапы, русский твист и тягу к носкам при диастазе. Везде, где они есть, делай «мёртвого жука» — в два раза больше повторений. В приложении это написано прямо в упражнении, а при ограничении «беременность» замена происходит автоматически.","en":"The coach advises against sit-ups, Russian twists and toe reaches with diastasis. Wherever they appear, do dead bugs — twice the reps. The app says so right on the exercise, and with the \"pregnancy\" limitation set the swap happens automatically."}},{"q":{"ru":"Мышцы болят после тренировки. Это нормально?","en":"My muscles are sore. Is that normal?"},"a":{"ru":"Лёгкая боль на второй день после новой нагрузки — норма, особенно в первые две недели. Помогают прогулка, вода и сон. Если боль острая, в суставе или не проходит три дня — отдохни и при необходимости покажись врачу. В отзыве о тренировке отметь «Боль»: приложение снизит нагрузку.","en":"Mild soreness a day or two after a new load is normal, especially in the first two weeks. Walking, water and sleep help. If the pain is sharp, in a joint, or lasts more than three days, rest and see a professional if needed. Mark \"Pain\" in the session feedback: the app will reduce the load."}}]}'::jsonb
)
on conflict (slug_id) do update set
  sort_order = excluded.sort_order,
  level = excluded.level,
  weeks = excluded.weeks,
  sessions_per_week = excluded.sessions_per_week,
  avg_session_min = excluded.avg_session_min,
  equipment = excluded.equipment,
  tile = excluded.tile,
  price_rub = excluded.price_rub,
  price_usd = excluded.price_usd,
  content = excluded.content,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s01_emom', 'Отжимания, приседания, «жук»', 'Тренировка 1. Работаем по таймеру: каждую минуту — новое упражнение, выполнил и до конца минуты отдыхаешь. 1-я минута — отжимания с колен, 2-я — приседания, 3-я — «мёртвый жук», 4-я — отдых. Цель — включить в работу большие группы мышц и просто начать. Не спеши и не гонись за максимумом: техника и комфортная нагрузка важнее цифр. Первая тренировка не должна тебя уничтожить — она должна помочь захотеть прийти на вторую.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":3,"setsField":"rounds","title":"По минутам","titleEn":"By the minute","description":"Каждую минуту — новое движение, потом отдых до конца минуты. После трёх минут — минута отдыха. Спокойный темп, аккуратная техника.","descriptionEn":"A new movement every minute, then rest until the minute is up. After the three minutes, take a rest minute. Easy pace, careful technique.","scalable":true,"blockId":"s01_main","items":[{"exerciseId":"knee_push_up","unit":"reps","target":8,"restAfterSec":0,"note":"Тренер: 5–10, совсем новичок — с 5. Корпус ровно, локти не разводим; если и 5 тяжело — от высокой опоры","noteEn":"The coach: 5–10, complete beginners start at 5. Body straight, elbows in; if even 5 is hard, from a high surface"},{"exerciseId":"air_squat","unit":"reps","target":13,"restAfterSec":0,"note":"Тренер: 10–15. Пятки на полу, глубина комфортная","noteEn":"The coach: 10–15. Heels down, comfortable depth"},{"exerciseId":"dead_bug","unit":"reps","target":13,"restAfterSec":0,"note":"Тренер: 10–15, суммарно. Поясница прижата к полу, движения медленные. Уверенно и без диастаза — можно ситапы","noteEn":"The coach: 10–15 total. Lower back pressed down, slow. Confident and no diastasis? Sit-ups instead"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s02_emom', 'Обратные отжимания, выпады, «жук»', 'Тренировка 2. Та же схема, что в первой, но другие движения: обратные отжимания от стула, выпады назад и «жук». Каждую минуту новое упражнение, 4-я минута — отдых. Не гонимся за количеством: выбирай число, при котором последние повторения ощущаются, а техника остаётся хорошей.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":3,"setsField":"rounds","title":"По минутам","titleEn":"By the minute","description":"Минута 1 — обратные отжимания, 2 — выпады, 3 — «жук», 4 — отдых. Выполнил движение — отдыхаешь до конца минуты.","descriptionEn":"Minute 1 dips, 2 lunges, 3 dead bugs, 4 rest. Do the movement, then rest until the minute is up.","scalable":true,"blockId":"s02_main","items":[{"exerciseId":"chair_dip","unit":"reps","target":12,"restAfterSec":0,"note":"Тренер: 8–16. Стул к стене, локти назад, плечи вниз","noteEn":"The coach: 8–16. Chair to the wall, elbows back, shoulders down"},{"exerciseId":"reverse_lunge","unit":"reps","target":12,"restAfterSec":0,"note":"Тренер: 8–16 в сумме на две ноги. Колено мягко к полу","noteEn":"The coach: 8–16 total for both legs. Knee softly to the floor"},{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0,"note":"Тренер: 8–16, суммарно. Медленно, поясница прижата","noteEn":"The coach: 8–16 total. Slow, lower back pressed down"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s03_pairs', 'Три пары: верх, ноги, пресс', 'Тренировка 3. Три пары упражнений, старт каждой пары раз в 2 минуты: сделал круг — до конца двух минут отдыхаешь, потом минута отдыха и следующая пара. Пара 1 — обратные отжимания и отжимания с колен, пара 2 — приседания и выпады назад, пара 3 — ситапы и «мёртвый жук». По одному кругу на каждую пару.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":540,"title":"Три пары","titleEn":"Three pairs","description":"По одному кругу на каждую пару, между парами — минута отдыха. Не торопись: техника важнее скорости.","descriptionEn":"One round per pair, a minute of rest between pairs. Do not rush: technique beats speed.","scalable":true,"blockId":"s03_main","items":[{"exerciseId":"chair_dip","unit":"reps","target":15,"restAfterSec":0,"note":"Тренер: 10–20","noteEn":"The coach: 10–20"},{"exerciseId":"knee_push_up","unit":"reps","target":13,"restAfterSec":60,"note":"Тренер: 10–15","noteEn":"The coach: 10–15"},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0,"note":"Тренер: 10–20","noteEn":"The coach: 10–20"},{"exerciseId":"reverse_lunge","unit":"reps","target":15,"restAfterSec":60,"note":"Тренер: 10–20 в сумме на две ноги","noteEn":"The coach: 10–20 total for both legs"},{"exerciseId":"sit_up","unit":"reps","target":8,"restAfterSec":0,"note":"Тренер: 5–10. При диастазе — «жук»","noteEn":"The coach: 5–10. With diastasis, dead bugs"},{"exerciseId":"dead_bug","unit":"reps","target":30,"restAfterSec":0,"note":"Тренер: 20–40, суммарно","noteEn":"The coach: 20–40 total"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s04_bridges', 'Ягодичный мост, 5 минут', 'Тренировка 4. Одно движение — ягодичный мост. Набери максимум повторений за 5 минут, цель — 100. Разбивай на подходы как удобно и в верхней точке каждый раз на секунду сжимай ягодицы.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":300,"title":"5 минут, цель 100","titleEn":"5 minutes, target 100","description":"Максимум мостов за 5 минут. Разбивай на подходы по 20–25, отдыхай сколько нужно; цель — сто повторений.","descriptionEn":"As many bridges as possible in 5 minutes. Break it into sets of 20–25, rest as needed; the target is one hundred.","scalable":true,"blockId":"s04_main","items":[{"exerciseId":"glute_bridge","unit":"reps","target":25,"restAfterSec":0,"note":"Вверху сожми ягодицы на секунду, поясницу не прогибай","noteEn":"Squeeze the glutes for a second at the top, do not arch the lower back"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s05_three_rounds', 'Три круга: пресс, ноги, верх', 'Тренировка 5. Три круга: ситапы, приседания и отжимания с колен. Во втором круге отжиманий чуть больше. Крышка 10 минут, отдыхай как комфортно. Запиши время и ощущения — в конце курса сравнишь с этой тренировкой.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":600,"title":"3 круга на время","titleEn":"3 rounds for time","description":"Крышка 10 минут. Ситапы можно заменить «жуком» (вдвое больше). Отдыхай между кругами как комфортно.","descriptionEn":"10-minute cap. Sit-ups can be swapped for dead bugs (twice the reps). Rest between rounds as you like.","scalable":true,"blockId":"s05_main","items":[{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":15,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s06_amrap8', 'AMRAP 8: пресс, присед, отжимания', 'Тренировка 6. Тот же круг, что в пятой, но теперь по кругу в течение 8 минут в спокойном темпе: столько кругов, сколько получится. Не спринтуй первые две минуты — выбери темп, который сможешь держать всё время.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8 мин","titleEn":"AMRAP 8 min","description":"Максимум кругов за 8 минут в ровном темпе. Ситапы можно заменить «жуком» (вдвое больше).","descriptionEn":"As many rounds as possible in 8 minutes at an even pace. Sit-ups can be swapped for dead bugs (twice the reps).","scalable":true,"blockId":"s06_main","items":[{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s07_emom_ladder', 'EMOM: присед, отжимания, выпады, пресс', 'Тренировка 7. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений: приседания, отжимания с колен, выпады, ситапы. Во втором круге добавь по 2 повтора к каждому. Всего два круга — восемь минут.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":8,"setsField":"rounds","title":"EMOM 8, +2 во втором круге","titleEn":"EMOM 8, +2 in the second loop","description":"Минуты 1–4 — по 12 повторений, минуты 5–8 — по 14. Выполнил движение — отдыхаешь до конца минуты.","descriptionEn":"Minutes 1–4 twelve reps, minutes 5–8 fourteen. Do the movement, then rest until the minute is up.","scalable":true,"blockId":"s07_main","items":[{"exerciseId":"air_squat","unit":"reps","target":12,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":12,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"reverse_lunge","unit":"reps","target":12,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"sit_up","unit":"reps","target":12,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s08_two_rounds', 'Два круга: верх, ноги, кор', 'Тренировка 8. Круг из четырёх движений по 20 повторений: обратные отжимания, приседания, скалолазы, выпады назад. Два круга, крышка 10 минут, отдыхаешь когда хочешь. Держи ровный темп и не жертвуй техникой ради секунд.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":2,"setsField":"sets","durationSec":600,"title":"2 круга на время","titleEn":"2 rounds for time","description":"Крышка 10 минут. Скалолазы считаем по коленям. Отдыхаешь когда хочешь — задача закрыть два круга.","descriptionEn":"10-minute cap. Count mountain climbers per knee. Rest whenever — the task is to close two rounds.","scalable":true,"blockId":"s08_main","items":[{"exerciseId":"chair_dip","unit":"reps","target":20,"restAfterSec":0,"note":"Стул без колёсиков, к стене. Локти назад, плечи вниз, опускайся до комфортной глубины","noteEn":"A chair without wheels, against the wall. Elbows back, shoulders down, lower to a comfortable depth"},{"exerciseId":"air_squat","unit":"reps","target":20,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"mountain_climber","unit":"reps","target":20,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Считаем по коленям — каждое колено это повтор","noteEn":"Shoulders over the wrists, hips not piked. Count per knee — every knee drive is a rep"},{"exerciseId":"reverse_lunge","unit":"reps","target":20,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s09_for_time', 'Пресс и скалолазы на время', 'Тренировка 9. Два круга на время: 15 ситапов, 30 скалолазов, 30 «жуков», 15 ситапов. Работа на время — чем быстрее сделаешь, тем быстрее освободишься; отдыхаешь когда хочешь, задача закрыть два круга как можно скорее. Крышка 8 минут.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":2,"setsField":"sets","durationSec":480,"title":"2 круга на время","titleEn":"2 rounds for time","description":"Крышка 8 минут. Скалолазы по коленям, «жук» медленно и под контролем. Ситапы при диастазе — «жук», вдвое больше.","descriptionEn":"8-minute cap. Climbers per knee, dead bugs slow and controlled. Sit-ups with diastasis: dead bugs, twice the reps.","scalable":true,"blockId":"s09_main","items":[{"exerciseId":"sit_up","unit":"reps","target":15,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"mountain_climber","unit":"reps","target":30,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Считаем по коленям — каждое колено это повтор","noteEn":"Shoulders over the wrists, hips not piked. Count per knee — every knee drive is a rep"},{"exerciseId":"dead_bug","unit":"reps","target":30,"restAfterSec":0,"note":"Поясница прижата к полу, движения медленные, корпус под контролем","noteEn":"Lower back pressed into the floor, slow movements, trunk under control"},{"exerciseId":"sit_up","unit":"reps","target":15,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s10_every_2min', 'Червячки и приседания', 'Тренировка 10. Короткий круг — 5 червячков и 10 приседаний. Старт раз в 2 минуты: выполнил круг — до конца двухминутки отдыхаешь. Четыре круга, всего восемь минут. Червячки — в спокойном темпе, шаг руками не слишком широкий.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":4,"setsField":"sets","durationSec":480,"title":"4 круга, старт раз в 2 минуты","titleEn":"4 rounds, start every 2 minutes","description":"Круг без пауз, потом отдых до конца двухминутки — около 1–1,5 минуты. Не торопись на червячках.","descriptionEn":"No pauses inside the round, then rest until the 2-minute mark — about 1–1.5 minutes. Do not rush the inchworms.","scalable":true,"blockId":"s10_main","items":[{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s11_emom8', 'EMOM 8: отжимания, присед, пресс, выпады', 'Тренировка 11. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений по 10 повторений: отжимания с колен, приседания, ситапы (или 20 «жуков»), выпады. Два круга — восемь минут.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":8,"setsField":"rounds","title":"EMOM 8 мин","titleEn":"EMOM 8 min","description":"Минута 1 — отжимания, 2 — приседания, 3 — ситапы или «жук», 4 — выпады, и снова по кругу.","descriptionEn":"Minute 1 push-ups, 2 squats, 3 sit-ups or dead bugs, 4 lunges, then round again.","scalable":true,"blockId":"s11_main","items":[{"exerciseId":"knee_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"reverse_lunge","unit":"reps","target":10,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s12_step_ladder', 'Лесенка вниз: зашагивания и червячки', 'Тренировка 12. Лесенка вниз: 10 зашагиваний на каждую ногу и 5 червячков, потом 8 и 4, 6 и 3, 4 и 2, 2 и 1. Работа на время, но на зашагиваниях не торопись — лучше аккуратно и правильно, чем быстро и непонятно как.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":600,"title":"Лесенка на время","titleEn":"The ladder for time","description":"Крышка 10 минут. Зашагивания — на стул без колёсиков или на ступеньку; вставай через пятку и полностью выпрямляйся наверху.","descriptionEn":"10-minute cap. Step-ups onto a chair without wheels or a stair step; drive through the heel and stand up fully at the top.","scalable":true,"blockId":"s12_main","items":[{"exerciseId":"step_up","unit":"reps","target":10,"perSide":true,"restAfterSec":0,"note":"Вставай через пятку, наверху выпрямись полностью, спускайся под контролем","noteEn":"Drive through the heel, stand up fully at the top, step down under control"},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"step_up","unit":"reps","target":8,"perSide":true,"restAfterSec":0,"note":"Вставай через пятку, наверху выпрямись полностью, спускайся под контролем","noteEn":"Drive through the heel, stand up fully at the top, step down under control"},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"step_up","unit":"reps","target":6,"perSide":true,"restAfterSec":0,"note":"Вставай через пятку, наверху выпрямись полностью, спускайся под контролем","noteEn":"Drive through the heel, stand up fully at the top, step down under control"},{"exerciseId":"inchworm","unit":"reps","target":3,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"step_up","unit":"reps","target":4,"perSide":true,"restAfterSec":0,"note":"Вставай через пятку, наверху выпрямись полностью, спускайся под контролем","noteEn":"Drive through the heel, stand up fully at the top, step down under control"},{"exerciseId":"inchworm","unit":"reps","target":2,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"step_up","unit":"reps","target":2,"perSide":true,"restAfterSec":0,"note":"Вставай через пятку, наверху выпрямись полностью, спускайся под контролем","noteEn":"Drive through the heel, stand up fully at the top, step down under control"},{"exerciseId":"inchworm","unit":"reps","target":1,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s13_ladder5', 'Пять движений, максимум кругов', 'Тренировка 13. Немного усложняем: круг из пяти движений — 5 червячков, 6 ситапов, 7 отжиманий с колен, 8 выпадов, 9 приседаний. За отведённое время — максимум кругов, ориентир три круга. Ровный темп важнее скорости.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8, цель 3 круга","titleEn":"AMRAP 8, target 3 rounds","description":"Максимум кругов за 8 минут, ориентир — три круга. Выпады считаем в сумме на две ноги.","descriptionEn":"As many rounds as possible in 8 minutes, three is the mark. Lunges counted as the total for both legs.","scalable":true,"blockId":"s13_main","items":[{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"sit_up","unit":"reps","target":6,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"knee_push_up","unit":"reps","target":7,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"reverse_lunge","unit":"reps","target":8,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"air_squat","unit":"reps","target":9,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s14_double', 'Выпады, отжимания, твисты: 20 и 40', 'Тренировка 14. Два круга. Первый — по 20: выпады назад, отжимания с колен, русские твисты (или 40 «жуков»). Отдых 2 минуты. Второй — по 40: те же движения. Второй круг длинный, разбивай на подходы и держи технику.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":360,"title":"Круг по 20","titleEn":"Round of 20","description":"По 20 повторений каждого движения, потом отдых 2 минуты перед вторым кругом.","descriptionEn":"20 reps of each movement, then rest 2 minutes before the second round.","scalable":true,"blockId":"s14_first","items":[{"exerciseId":"reverse_lunge","unit":"reps","target":20,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"knee_push_up","unit":"reps","target":20,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"russian_twist","unit":"reps","target":20,"restAfterSec":0,"note":"Спина прямая, поворот от корпуса, а не руками. При диастазе — «мёртвый жук», вдвое больше","noteEn":"Back straight, twist from the trunk, not the arms. With diastasis, dead bugs — twice the reps"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":600,"title":"Круг по 40","titleEn":"Round of 40","description":"После двух минут отдыха — по 40 каждого. Разбивай на подходы, техника важнее скорости.","descriptionEn":"After two minutes of rest — 40 of each. Break it into sets, technique over speed.","scalable":true,"blockId":"s14_second","items":[{"exerciseId":"reverse_lunge","unit":"reps","target":40,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"knee_push_up","unit":"reps","target":40,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"},{"exerciseId":"russian_twist","unit":"reps","target":40,"restAfterSec":0,"note":"Спина прямая, поворот от корпуса, а не руками. При диастазе — «мёртвый жук», вдвое больше","noteEn":"Back straight, twist from the trunk, not the arms. With diastasis, dead bugs — twice the reps"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s15_amrap8', 'AMRAP 8: отжимания, присед, скалолазы', 'Тренировка 15. По кругу в течение 8 минут: 8 отжиманий, 16 приседаний, 32 скалолаза. Обычные отжимания — тяжело, делай с колен. Ровный темп: столько кругов, сколько получится держать до конца.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8 мин","titleEn":"AMRAP 8 min","description":"Максимум кругов за 8 минут. Скалолазы по коленям. Отжимания тяжело — с колен.","descriptionEn":"As many rounds as possible in 8 minutes. Climbers per knee. Push-ups hard? From the knees.","scalable":true,"blockId":"s15_main","items":[{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0,"note":"Корпус ровно, локти назад под 45°, грудь к полу. Тяжело — с колен или от высокой опоры","noteEn":"Body straight, elbows back at 45 degrees, chest to the floor. Too hard? From the knees or a high surface"},{"exerciseId":"air_squat","unit":"reps","target":16,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"mountain_climber","unit":"reps","target":32,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Считаем по коленям — каждое колено это повтор","noteEn":"Shoulders over the wrists, hips not piked. Count per knee — every knee drive is a rep"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s16_chipper', 'Чиппер: присед, выпады, зашагивания, червячки', 'Тренировка 16. Длинный список на время: 60 приседаний, 40 выпадов, 30 зашагиваний, 20 червячков. Порядок и количество менять нельзя — идём сверху вниз. Крышка 13 минут; разбивай на подходы, но не меняй последовательность.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":780,"title":"Чиппер на время","titleEn":"The chipper for time","description":"Крышка 13 минут. Выпады и зашагивания считаем в сумме на две ноги. Порядок менять нельзя.","descriptionEn":"13-minute cap. Lunges and step-ups counted as the total for both legs. Do not change the order.","scalable":true,"blockId":"s16_main","items":[{"exerciseId":"air_squat","unit":"reps","target":60,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"reverse_lunge","unit":"reps","target":40,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"step_up","unit":"reps","target":30,"restAfterSec":0,"note":"В сумме на две ноги","noteEn":"Total for both legs"},{"exerciseId":"inchworm","unit":"reps","target":20,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s17_buyin', 'Входной билет и червячки', 'Тренировка 17. Раз в 3 минуты выполни входной билет: 10 отжиманий, 10 приседаний, 10 ситапов, а в оставшееся время — максимум червячков. Два круга, между кругами 3 минуты отдыха. Червячки не торопи.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":180,"title":"2 круга раз в 3 минуты","titleEn":"2 rounds every 3 minutes","description":"Входной билет — 10/10/10, оставшееся время трёхминутки — максимум червячков. Между кругами 3 минуты отдыха. Отжимания тяжело — с колен.","descriptionEn":"The buy-in is 10/10/10; spend the rest of the 3 minutes on max inchworms. 3 minutes of rest between rounds. Push-ups hard? From the knees.","scalable":true,"blockId":"s17_main","items":[{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, локти назад под 45°, грудь к полу. Тяжело — с колен или от высокой опоры","noteEn":"Body straight, elbows back at 45 degrees, chest to the floor. Too hard? From the knees or a high surface"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений","noteEn":"Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps"},{"exerciseId":"inchworm","unit":"reps","target":8,"restAfterSec":0,"note":"Максимум за оставшееся время трёхминутки","noteEn":"As many as possible in the time left in the 3 minutes"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s18_intervals', 'Два интервала: верх и низ', 'Тренировка 18. Два интервала по 2 минуты. Первый: 15 отжиманий, в оставшееся время — максимум червячков. Минута отдыха. Второй: 20 выпадов, в оставшееся время — максимум ситапов. Отжимания тяжело — с колен.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":120,"title":"2 минуты: отжимания + червячки","titleEn":"2 minutes: push-ups + inchworms","description":"15 отжиманий, потом до конца двух минут — максимум червячков. Затем минута отдыха.","descriptionEn":"15 push-ups, then max inchworms until the 2 minutes are up. Then one minute of rest.","scalable":true,"blockId":"s18_first","items":[{"exerciseId":"push_up","unit":"reps","target":15,"restAfterSec":0,"note":"Корпус ровно, локти назад под 45°, грудь к полу. Тяжело — с колен или от высокой опоры","noteEn":"Body straight, elbows back at 45 degrees, chest to the floor. Too hard? From the knees or a high surface"},{"exerciseId":"inchworm","unit":"reps","target":8,"restAfterSec":0,"note":"Максимум за оставшееся время","noteEn":"As many as possible in the time left"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":120,"title":"2 минуты: выпады + ситапы","titleEn":"2 minutes: lunges + sit-ups","description":"После минуты отдыха: 20 выпадов, потом до конца двух минут — максимум ситапов (или «жука», вдвое больше).","descriptionEn":"After a minute of rest: 20 lunges, then max sit-ups until the 2 minutes are up (or dead bugs, twice the reps).","scalable":true,"blockId":"s18_second","items":[{"exerciseId":"reverse_lunge","unit":"reps","target":20,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor, trunk upright"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0,"note":"Максимум за оставшееся время. При диастазе — «жук»","noteEn":"As many as possible in the time left. With diastasis, dead bugs"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s19_inchworm_ladder', 'Лесенка червячков: точка отсчёта', 'Тренировка 19. Точка отсчёта. Каждую минуту — на одного червячка больше: 1-я минута 1, 2-я 2, и так до 10-й. Делаешь, пока укладываешься в минуту; закрыть все десять не обязательно. Запиши, на какой минуте остановился — через месяц-два повторишь и сравнишь.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":600,"title":"Лесенка червячков","titleEn":"The inchworm ladder","description":"По минутам, каждую на один больше. Это ориентир, а не тест на разрыв: остановись, где перестанешь укладываться, и запиши минуту.","descriptionEn":"By the minute, one more each time. A reference, not a test to failure: stop where you stop fitting the minute and note it.","scalable":true,"blockId":"s19_main","items":[{"exerciseId":"inchworm","unit":"reps","target":1,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":2,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":3,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":6,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":7,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":8,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":9,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"},{"exerciseId":"inchworm","unit":"reps","target":10,"restAfterSec":0,"note":"Шагай руками спокойно, спина ровная, колени можно чуть согнуть","noteEn":"Walk the hands calmly, back flat, knees may bend a little"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('start_w_s20_finisher', 'Три круга: «жук», присед, отжимания', 'Тренировка 20. Финал курса: три круга — 20 «жуков», 10 приседаний, 10 отжиманий с колен. Спокойный темп, чистая техника. А теперь сравни ощущения после этой тренировки и после самой первой — почувствуй, насколько легче стало.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"wu_mobility","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Полукруги спереди, назад не запрокидываем","noteEn":"Half-circles across the front, no dropping back"},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Половину вперёд, половину назад","noteEn":"Half forward, half backward"},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"В обе стороны","noteEn":"Both directions"},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0,"note":"Круги маленькие, пятки на полу","noteEn":"Small circles, heels down"},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0,"note":"Медленно, до комфортной глубины","noteEn":"Slowly, to a comfortable depth"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":3,"setsField":"sets","durationSec":600,"title":"3 круга","titleEn":"3 rounds","description":"Три круга в спокойном темпе. «Жук» медленно, поясница прижата; приседания и отжимания — чисто.","descriptionEn":"Three rounds at an easy pace. Dead bugs slow, lower back pressed down; squats and push-ups clean.","scalable":true,"blockId":"s20_main","items":[{"exerciseId":"dead_bug","unit":"reps","target":20,"restAfterSec":0,"note":"Поясница прижата к полу, движения медленные, корпус под контролем","noteEn":"Lower back pressed into the floor, slow movements, trunk under control"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника","noteEn":"Heels down, knees out, comfortable depth — no lower than your technique holds"},{"exerciseId":"knee_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры","noteEn":"Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.","descriptionEn":"Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.","scalable":false,"blockId":"cd_stretch","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

-- days
insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d1_s01', 1, 1, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s01_emom'),
  '{"title":{"ru":"Тренировка 1","en":"Workout 1"},"subtitle":{"ru":"По таймеру, 3 движения","en":"By the timer, 3 movements"},"body":[]}'::jsonb, false, null, 0
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d2_s02', 1, 2, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s02_emom'),
  '{"title":{"ru":"Тренировка 2","en":"Workout 2"},"subtitle":{"ru":"По таймеру, 3 движения","en":"By the timer, 3 movements"},"body":[]}'::jsonb, false, null, 1
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d3_s03', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s03_pairs'),
  '{"title":{"ru":"Тренировка 3","en":"Workout 3"},"subtitle":{"ru":"Три пары, старт раз в 2 мин","en":"Three pairs, start every 2 min"},"body":[]}'::jsonb, false, null, 2
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d4_s04', 1, 4, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s04_bridges'),
  '{"title":{"ru":"Тренировка 4","en":"Workout 4"},"subtitle":{"ru":"Мосты 5 мин, цель 100","en":"Bridges 5 min, target 100"},"body":[]}'::jsonb, false, null, 3
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d5_s05', 1, 5, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s05_three_rounds'),
  '{"title":{"ru":"Тренировка 5","en":"Workout 5"},"subtitle":{"ru":"3 круга на время","en":"3 rounds for time"},"body":[]}'::jsonb, false, null, 4
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d6_rest', 1, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройдись: лёгкое движение снимает крепатуру","en":"Go for a walk: gentle movement eases soreness"},"body":[]}'::jsonb, false, 10000, 5
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w1_d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходные: два дня прогулок, сна и нормальной еды","en":"Weekend: two days of walks, sleep and proper food"},"body":[]}'::jsonb, false, 10000, 6
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d1_s06', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s06_amrap8'),
  '{"title":{"ru":"Тренировка 6","en":"Workout 6"},"subtitle":{"ru":"AMRAP 8 мин","en":"AMRAP 8 min"},"body":[]}'::jsonb, false, null, 7
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d2_s07', 2, 2, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s07_emom_ladder'),
  '{"title":{"ru":"Тренировка 7","en":"Workout 7"},"subtitle":{"ru":"EMOM 8, +2 во 2-м круге","en":"EMOM 8, +2 in loop 2"},"body":[]}'::jsonb, false, null, 8
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d3_s08', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s08_two_rounds'),
  '{"title":{"ru":"Тренировка 8","en":"Workout 8"},"subtitle":{"ru":"2 круга, крышка 10 мин","en":"2 rounds, 10-min cap"},"body":[]}'::jsonb, false, null, 9
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d4_s09', 2, 4, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s09_for_time'),
  '{"title":{"ru":"Тренировка 9","en":"Workout 9"},"subtitle":{"ru":"2 круга на время, крышка 8","en":"2 rounds for time, cap 8"},"body":[]}'::jsonb, false, null, 10
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d5_s10', 2, 5, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s10_every_2min'),
  '{"title":{"ru":"Тренировка 10","en":"Workout 10"},"subtitle":{"ru":"4 круга раз в 2 минуты","en":"4 rounds every 2 min"},"body":[]}'::jsonb, false, null, 11
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d6_rest', 2, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"10000 шагов и сон — так растёт сила","en":"10,000 steps and sleep — that is how strength grows"},"body":[]}'::jsonb, false, 10000, 12
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w2_d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходные: два дня прогулок, сна и нормальной еды","en":"Weekend: two days of walks, sleep and proper food"},"body":[]}'::jsonb, false, 10000, 13
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d1_s11', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s11_emom8'),
  '{"title":{"ru":"Тренировка 11","en":"Workout 11"},"subtitle":{"ru":"EMOM 8 мин","en":"EMOM 8 min"},"body":[]}'::jsonb, false, null, 14
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d2_s12', 3, 2, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s12_step_ladder'),
  '{"title":{"ru":"Тренировка 12","en":"Workout 12"},"subtitle":{"ru":"Лесенка вниз","en":"Descending ladder"},"body":[]}'::jsonb, false, null, 15
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d3_s13', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s13_ladder5'),
  '{"title":{"ru":"Тренировка 13","en":"Workout 13"},"subtitle":{"ru":"5 движений, максимум кругов","en":"5 movements, max rounds"},"body":[]}'::jsonb, false, null, 16
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d4_s14', 3, 4, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s14_double'),
  '{"title":{"ru":"Тренировка 14","en":"Workout 14"},"subtitle":{"ru":"Два круга: 20 и 40","en":"Two rounds: 20 and 40"},"body":[]}'::jsonb, false, null, 17
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d5_s15', 3, 5, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s15_amrap8'),
  '{"title":{"ru":"Тренировка 15","en":"Workout 15"},"subtitle":{"ru":"AMRAP 8 мин","en":"AMRAP 8 min"},"body":[]}'::jsonb, false, null, 18
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d6_rest', 3, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"10000 шагов и сон — так растёт сила","en":"10,000 steps and sleep — that is how strength grows"},"body":[]}'::jsonb, false, 10000, 19
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w3_d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходные: два дня прогулок, сна и нормальной еды","en":"Weekend: two days of walks, sleep and proper food"},"body":[]}'::jsonb, false, 10000, 20
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d1_s16', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s16_chipper'),
  '{"title":{"ru":"Тренировка 16","en":"Workout 16"},"subtitle":{"ru":"Чиппер, крышка 13 мин","en":"Chipper, 13-min cap"},"body":[]}'::jsonb, false, null, 21
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d2_s17', 4, 2, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s17_buyin'),
  '{"title":{"ru":"Тренировка 17","en":"Workout 17"},"subtitle":{"ru":"Входной билет + червячки","en":"Buy-in + inchworms"},"body":[]}'::jsonb, false, null, 22
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d3_s18', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'start_w_s18_intervals'),
  '{"title":{"ru":"Тренировка 18","en":"Workout 18"},"subtitle":{"ru":"Два интервала по 2 мин","en":"Two 2-min intervals"},"body":[]}'::jsonb, false, null, 23
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d4_rest', 4, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Восстановление — часть тренировки, а не пауза в ней","en":"Recovery is part of the training, not a break from it"},"body":[]}'::jsonb, false, 10000, 24
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d5_s19', 4, 5, 'benchmark', (select id from public.custom_workouts where short_id = 'start_w_s19_inchworm_ladder'),
  '{"title":{"ru":"Тренировка 19","en":"Workout 19"},"subtitle":{"ru":"Лесенка червячков — точка отсчёта","en":"Inchworm ladder — a benchmark"},"body":[]}'::jsonb, false, null, 25
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d6_rest', 4, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра повторный тест. Пройдись, выспись, не переедай","en":"Retest tomorrow. Walk, sleep well, do not overeat"},"body":[]}'::jsonb, false, 10000, 26
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload, steps_goal,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'start'),
  'w4_d7_s20', 4, 7, 'benchmark', (select id from public.custom_workouts where short_id = 'start_w_s20_finisher'),
  '{"title":{"ru":"Тренировка 20","en":"Workout 20"},"subtitle":{"ru":"3 круга — сравни с первой","en":"3 rounds — compare to workout 1"},"body":[]}'::jsonb, false, null, 27
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  steps_goal = excluded.steps_goal,
  sort_order = excluded.sort_order,
  updated_at = now();
