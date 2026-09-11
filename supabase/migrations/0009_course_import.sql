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

-- ---------------------------------------------------------------------------
-- engine — Форма своим весом: сила и выносливость
-- 16 workouts, 42 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'engine', 'draft', 2, 2, 6, 4, 30,
  '{"none","mat","chair","jump_rope"}'::text[], '#20293c', 3990, 39,
  '{"slug":{"ru":"svoim-vesom-sila-i-vynoslivost","en":"bodyweight-engine"},"name":{"ru":"Форма своим весом: сила и выносливость","en":"Forma. Bodyweight: strength and conditioning"},"tagline":{"ru":"Шесть недель силы и выносливости на собственном весе — четыре тренировки в неделю, без инвентаря.","en":"Six weeks of bodyweight strength and conditioning — four sessions a week, no gear."},"description":{"ru":"Программа для тех, кто уже знает, что такое присед и отжимание, и хочет двигаться дальше: силовые дни, AMRAP и EMOM, табата, чипперы и два бенчмарка. Всё дома, без оборудования.","en":"For people who already know their way around a squat and a push-up and want the next step: strength days, AMRAPs and EMOMs, Tabata, chippers and two benchmarks. All at home, no equipment."},"longDescription":[{"ru":"Курс построен как настоящий кроссфит-цикл, только без штанги и зала. Каждая неделя — четыре разных дня: присед и жим, тяга и кор, «двигатель» (интервалы на выносливость) и чиппер на всё тело. Паттерны движений повторяются из недели в неделю, а объём и сложность растут: обычный присед превращается в прыжковый, отжимания — в узкие, планка — в лодочку.","en":"The course is built like a real CrossFit cycle, just without a barbell or a gym. Every week has four different days: squat and push, hinge and core, an \"engine\" day (conditioning intervals) and a full-body chipper. The movement patterns repeat from week to week while volume and complexity grow: the air squat becomes a jump squat, push-ups become diamond push-ups, the plank becomes a hollow hold."},{"ru":"Ты начинаешь с теста — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По его результатам приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Четвёртая неделя — разгрузочная: объём падает примерно на треть, чтобы тело усвоило нагрузку. В конце третьей недели — 100 бёрпи на время, в конце шестой — 20-минутный AMRAP в духе «Синди» и повторный тест, чтобы увидеть прогресс в цифрах.","en":"You start with a test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. Week four is a deload: volume drops by about a third so your body can absorb the work. Week three ends with 100 burpees for time, week six with a 20-minute Cindy-style AMRAP and a retest, so you see your progress in numbers."},{"ru":"Из оборудования нужны только устойчивый стул для зашагиваний и коврик. Скакалка — по желанию: если её нет, приложение заменит прыжки на скакалке джампинг-джеками.","en":"All you need is a sturdy chair for step-ups and a mat. A jump rope is optional: if you do not have one, the app swaps rope jumps for jumping jacks."}],"forWhom":[{"ru":"Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.","en":"You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute."},{"ru":"Ты прошёл курс «Старт» и хочешь следующий уровень.","en":"You finished the Start course and want the next level."},{"ru":"Ты хочешь тренироваться дома без инвентаря, но с настоящей структурой: силовые дни, интервалы, бенчмарки.","en":"You want to train at home without gear but with real structure: strength days, intervals, benchmarks."},{"ru":"У тебя есть 25–35 минут четыре раза в неделю.","en":"You have 25–35 minutes four times a week."}],"outcomes":[{"ru":"Больше отжиманий, приседаний и бёрпи в тестах — ты сравнишь первую и шестую неделю.","en":"More push-ups, squats and burpees in the tests — you compare week one with week six."},{"ru":"Освоишь прыжковые приседания, узкие отжимания, лодочку и складку.","en":"You learn jump squats, diamond push-ups, the hollow hold and V-ups."},{"ru":"Пройдёшь два бенчмарка: 100 бёрпи на время и 20-минутный AMRAP в духе «Синди».","en":"You complete two benchmarks: 100 burpees for time and a 20-minute Cindy-style AMRAP."},{"ru":"Научишься работать в форматах AMRAP, EMOM, табата и чиппер и распределять силы.","en":"You get comfortable with AMRAP, EMOM, Tabata and chipper formats and learn to pace them."},{"ru":"Привыкнешь к четырём тренировкам в неделю без перегруза — с днями отдыха и разгрузочной неделей.","en":"You settle into four sessions a week without burning out — with rest days and a deload week built in."}],"faq":[{"q":{"ru":"Что нужно из оборудования?","en":"What equipment do I need?"},"a":{"ru":"Коврик и устойчивый стул — для зашагиваний и для отжиманий от опоры в лёгкий день. Скакалка по желанию: если её нет, приложение автоматически заменит прыжки на скакалке джампинг-джеками, и программа от этого не изменится.","en":"A mat and a sturdy chair — for step-ups and for incline push-ups on the easy day. A jump rope is optional: without one the app automatically swaps rope jumps for jumping jacks and the program stays the same."}},{"q":{"ru":"Мне подойдёт этот курс или лучше начать со «Старта»?","en":"Is this course right for me, or should I begin with Start?"},"a":{"ru":"Ориентир такой: 8–10 отжиманий от пола подряд, минута планки и 15–20 приседаний без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт»: там те же паттерны движений, но без прыжков и с отжиманиями с колен, а через четыре недели вернёшься сюда.","en":"A rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15–20 squats without getting winded. If that is you, jump in. If not yet, do Start first: same movement patterns, no jumps and knee push-ups, and you come back here in four weeks."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"В среднем около 30 минут вместе с разминкой и заминкой: силовые дни — 27–37 минут, «двигатель» — 24–30, чипперы, бенчмарки и лёгкий день — 20–30. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.","en":"About 30 minutes on average including warm-up and cool-down: strength days run 27–37 minutes, engine days 24–30, chippers, benchmarks and the easy day 20–30. Before you start, the app shows the estimated duration for your own volume."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не пытайся сделать две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва.","en":"No problem: the path does not reset, just continue from the next node when you can. Do not try to double up to \"catch up\" — shifting the week is better. If the break was longer than two weeks, pick \"Easier\" for the first two sessions back."}},{"q":{"ru":"Как приложение подстраивает нагрузку?","en":"How does the app adapt the load?"},"a":{"ru":"Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. В четвёртую неделю объём снижается автоматически.","en":"Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. In week four the volume drops automatically."}},{"q":{"ru":"Болят мышцы после тренировки — это нормально?","en":"My muscles are sore after training — is that normal?"},"a":{"ru":"Тянущая боль в мышцах через день-два после нагрузки — норма, особенно в первые две недели и после прыжков. Помогают прогулка, сон и следующая лёгкая тренировка. А вот резкая боль в суставе или пояснице, или та, что усиливается во время движения, — сигнал остановиться. Отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку, а если не проходит несколько дней — покажись врачу.","en":"A dull ache a day or two after a session is normal, especially in the first two weeks and after jumps. A walk, sleep and the next easy session help. Sharp pain in a joint or the lower back, or pain that gets worse as you move, is a signal to stop. Mark \"Pain\" in the post-workout feedback — the app reduces the load — and if it lasts several days, see a doctor."}}]}'::jsonb
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
values ('engine_w_test', 'Тест: отжимания, присед, планка, бёрпи', 'Четыре коротких теста с отдыхом по полторы минуты. Работай честно: результат определяет стартовый объём всех тренировок, а в конце курса ты повторишь тест и сравнишь цифры.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"test_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"test","format":"sets","sets":1,"setsField":"sets","title":"Тест","titleEn":"Test","description":"Максимум повторений за отведённое время. Останавливайся, как только ломается техника — засчитываются только чистые повторения.","descriptionEn":"Max reps in the given time. Stop as soon as your form breaks — only clean reps count.","scalable":false,"blockId":"test_main","items":[{"exerciseId":"push_up","unit":"seconds","target":120,"restAfterSec":90,"note":"Максимум за 2 минуты. Отдыхать можно в верхней точке.","noteEn":"Max reps in 2 minutes. Rest at the top if you need to."},{"exerciseId":"air_squat","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.","noteEn":"Max reps in one minute. Hips below parallel, full extension at the top."},{"exerciseId":"plank","unit":"seconds","target":300,"restAfterSec":90,"note":"Держи, пока не провиснет поясница. Лимит — 5 минут.","noteEn":"Hold until your lower back starts to sag. Five-minute limit."},{"exerciseId":"burpee","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.","noteEn":"Max reps in one minute: chest to the floor, jump and clap at the top."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"test_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 80)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_squat_push_a', 'Присед и жим A', 'Три подхода классической связки: присед, отжимания, обратные выпады и отжимания уголком. Темп спокойный, техника важнее скорости — эти движения ты будешь усложнять весь курс. В конце короткий блок на кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"spa_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"Силовой блок","titleEn":"Strength","description":"Три подхода. Каждое повторение — две секунды вниз, секунда вверх. Между упражнениями 20 секунд, между подходами — 75.","descriptionEn":"Three sets. Two seconds down, one second up on every rep. Twenty seconds between exercises, 75 between sets.","scalable":true,"blockId":"spa_strength","items":[{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":20},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":20},{"exerciseId":"reverse_lunge","unit":"reps","target":12,"restAfterSec":20},{"exerciseId":"pike_push_up","unit":"reps","target":8,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"spa_core","items":[{"exerciseId":"plank","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"plank_shoulder_tap","unit":"reps","target":16,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spa_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_squat_push_b', 'Присед и жим B', 'Четыре подхода. Присед становится прыжковым, отжиманий больше, добавляются боковые выпады. Между подходами отдыхай полные 75 секунд — прыжки требуют свежих ног. Кор: лодочка и касания плеч.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"spb_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Силовой блок","titleEn":"Strength","description":"Четыре подхода. В прыжковом приседе приземляйся мягко, на всю стопу, и сразу уходи в следующий присед.","descriptionEn":"Four sets. Land the jump squat softly on the whole foot and sink straight into the next rep.","scalable":true,"blockId":"spb_strength","items":[{"exerciseId":"jump_squat","unit":"reps","target":10,"restAfterSec":20},{"exerciseId":"push_up","unit":"reps","target":12,"restAfterSec":20},{"exerciseId":"lateral_lunge","unit":"reps","target":12,"restAfterSec":20},{"exerciseId":"pike_push_up","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"spb_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"plank_shoulder_tap","unit":"reps","target":20,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spb_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_squat_push_c', 'Присед и жим C', 'Самый плотный силовой день курса: четыре подхода прыжковых приседаний, узких отжиманий, выпадов и отжиманий уголком, а в конце каждого подхода — стульчик у стены. Если узкие отжимания пока не идут, делай обычные с паузой внизу.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"spc_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"Силовой блок","titleEn":"Strength","description":"Четыре подхода, стульчик в конце каждого. Держи дыхание ровным в стульчике — это тренировка терпения.","descriptionEn":"Four sets with a wall sit closing each one. Keep breathing evenly in the wall sit — it is patience training.","scalable":true,"blockId":"spc_strength","items":[{"exerciseId":"jump_squat","unit":"reps","target":12,"restAfterSec":20},{"exerciseId":"diamond_push_up","unit":"reps","target":8,"restAfterSec":20,"note":"Не идут узкие — обычные отжимания с паузой в одну секунду внизу.","noteEn":"If diamonds are too hard, do regular push-ups with a one-second pause at the bottom."},{"exerciseId":"reverse_lunge","unit":"reps","target":16,"restAfterSec":20},{"exerciseId":"pike_push_up","unit":"reps","target":12,"restAfterSec":20},{"exerciseId":"wall_sit","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"spc_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"v_up","unit":"reps","target":10,"restAfterSec":0,"note":"Складка не получается — делай ситапы с прямыми руками над головой.","noteEn":"If V-ups are not happening, do sit-ups with straight arms overhead."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spc_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_hinge_core_a', 'Тяга и кор A', 'День без прыжков и отжиманий: ягодичный мостик, румынская тяга на одной ноге, супермен и зашагивания на стул — всё, что делает спину и ягодицы сильными. Потом три круга на кор: мёртвый жук, планка, боковая планка.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"hca_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":60,"title":"Силовой блок","titleEn":"Strength","description":"Три подхода. В мостике сжимай ягодицы наверху на секунду, в тяге на одной ноге спина прямая, а колено опорной ноги чуть согнуто.","descriptionEn":"Three sets. Squeeze the glutes for a second at the top of the bridge; in the single-leg deadlift keep the back flat and a soft knee on the standing leg.","scalable":true,"blockId":"hca_strength","items":[{"exerciseId":"glute_bridge","unit":"reps","target":15,"restAfterSec":15},{"exerciseId":"single_leg_rdl","unit":"reps","target":8,"perSide":true,"restAfterSec":15},{"exerciseId":"superman","unit":"reps","target":12,"restAfterSec":15},{"exerciseId":"step_up","unit":"reps","target":10,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Три круга. Поясница прижата к полу в жуке, таз не проваливается в планках.","descriptionEn":"Three rounds. Lower back pressed into the floor in the dead bug, hips level in both planks.","scalable":true,"blockId":"hca_core","items":[{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"plank","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":30,"perSide":true,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"hca_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_hinge_core_b', 'Тяга и кор B', 'Мостик переходит на одну ногу, тяга и зашагивания — с большим числом повторений. В блоке на кор появляются лодочка, подъёмы ног и русский твист. Двигайся медленно: две секунды вверх, две вниз.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"hcb_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":60,"title":"Силовой блок","titleEn":"Strength","description":"Три подхода, как и раньше, но мостик переехал на одну ногу, а повторений на ногу стало больше. Слабую ногу делай первой — так ты не «добьёшь» её уставшим.","descriptionEn":"Three sets as before, but the bridge has moved to one leg and there are more reps per leg. Start each unilateral move with your weaker leg so you never do it tired.","scalable":true,"blockId":"hcb_strength","items":[{"exerciseId":"single_leg_glute_bridge","unit":"reps","target":10,"perSide":true,"restAfterSec":15},{"exerciseId":"single_leg_rdl","unit":"reps","target":10,"perSide":true,"restAfterSec":15},{"exerciseId":"superman","unit":"reps","target":15,"restAfterSec":15},{"exerciseId":"step_up","unit":"reps","target":12,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга без спешки — четыре упражнения подряд, это больше работы на кор, чем кажется. В лодочке поясница вжата в пол; в твисте поворачивай грудь, а не только руки.","descriptionEn":"Two unhurried rounds — four exercises back to back is more core work than it looks. Lower back glued to the floor in the hollow hold; rotate the chest, not just the arms, in the twist.","scalable":true,"blockId":"hcb_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"leg_raise","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"russian_twist","unit":"reps","target":20,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"hcb_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_hinge_core_c', 'Тяга и кор C', 'Самая объёмная версия дня тяги: по 12 повторений на ногу в мостике, десять в румынской тяге, двенадцать зашагиваний на сторону. Кор — 40 секунд боковой планки на каждую сторону и ножницы. После такого дня отдых заслужен.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"hcc_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"bird_dog","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":12,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":6,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":60,"title":"Силовой блок","titleEn":"Strength","description":"Три больших подхода. Если баланс в тяге уходит — коснись пальцами стула, но не опирайся на него.","descriptionEn":"Three big sets. If you lose balance in the deadlift, touch the chair with your fingertips — do not lean on it.","scalable":true,"blockId":"hcc_strength","items":[{"exerciseId":"single_leg_glute_bridge","unit":"reps","target":12,"perSide":true,"restAfterSec":15},{"exerciseId":"single_leg_rdl","unit":"reps","target":10,"perSide":true,"restAfterSec":15},{"exerciseId":"superman","unit":"reps","target":15,"restAfterSec":15},{"exerciseId":"step_up","unit":"reps","target":12,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга из четырёх упражнений. В ножницах ноги низко над полом, но поясница не отрывается — если отрывается, подними ноги выше.","descriptionEn":"Two rounds of four exercises. In flutter kicks keep the legs low but the lower back down — if it lifts, raise the legs higher.","scalable":true,"blockId":"hcc_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"leg_raise","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"flutter_kick","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"hcc_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_engine_amrap10', 'Двигатель: AMRAP 10', 'Десять минут ровной работы: бёрпи, приседания, скалолаз и скакалка. Задача — не выложиться в первые две минуты, а найти темп, который сможешь держать все десять. Считай круги: в пятой неделе ты сделаешь пятнадцатиминутную версию.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"ea10_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":600,"title":"AMRAP 10 минут","titleEn":"AMRAP 10 minutes","description":"Как можно больше кругов за 10 минут. Отдыхай короткими паузами по 5–10 секунд, а не одной длинной.","descriptionEn":"As many rounds as possible in 10 minutes. Rest in short 5–10 second breaks, not one long one.","scalable":true,"blockId":"ea10_amrap","items":[{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"mountain_climber","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"single_under","unit":"reps","target":30,"restAfterSec":0,"note":"Нет скакалки — 30 джампинг-джеков.","noteEn":"No rope — 30 jumping jacks."}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"ea10_core","items":[{"exerciseId":"plank","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"ea10_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_engine_emom12', 'Двигатель: EMOM 12', 'Каждую минуту — новое упражнение: бёрпи, приседания, скалолаз, скакалка, и так три круга. Сделал объём — остаток минуты отдыхаешь. Если работа занимает больше 45 секунд, в следующем круге сделай чуть меньше повторений.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"ee12_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"emom","sets":12,"setsField":"rounds","title":"EMOM 12 минут","titleEn":"EMOM 12 minutes","description":"Каждую минуту новое упражнение из списка, по кругу. Остаток минуты — отдых.","descriptionEn":"A new exercise from the list every minute, cycling through. The rest of the minute is rest.","scalable":true,"blockId":"ee12_emom","items":[{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"mountain_climber","unit":"reps","target":24,"restAfterSec":0},{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0,"note":"Нет скакалки — 40 джампинг-джеков.","noteEn":"No rope — 40 jumping jacks."}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"ee12_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"russian_twist","unit":"reps","target":20,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"ee12_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_engine_tabata', 'Двигатель: табата', 'Три табаты по четыре минуты: 20 секунд работы, 10 секунд отдыха, восемь раундов — четыре на первое упражнение, четыре на второе. Первая табата — прыжковый присед и бёрпи, вторая — отжимания и скалолаз, третья — бег с высоким коленом и конькобежец. Между табатами отдышись минуту. Число рядом с упражнением — ориентир на один 20-секундный раунд.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"et_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"tabata","sets":4,"setsField":"rounds","workSec":20,"restSec":10,"title":"Табата 1: ноги","titleEn":"Tabata 1: legs","description":"Четыре раунда прыжкового приседа, затем четыре раунда бёрпи: 20 секунд работы, 10 отдыха. Всего восемь раундов — четыре минуты.","descriptionEn":"Four rounds of jump squats, then four rounds of burpees: 20 seconds on, 10 off. Eight rounds in total — four minutes.","scalable":true,"blockId":"et_tabata_1","items":[{"exerciseId":"jump_squat","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"burpee","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"tabata","sets":4,"setsField":"rounds","workSec":20,"restSec":10,"title":"Табата 2: жим и кор","titleEn":"Tabata 2: push and core","description":"Четыре раунда отжиманий, затем четыре раунда скалолаза. Перед стартом отдышись минуту после первой табаты.","descriptionEn":"Four rounds of push-ups, then four rounds of mountain climbers. Take a minute to catch your breath after the first Tabata before you start.","scalable":true,"blockId":"et_tabata_2","items":[{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"mountain_climber","unit":"reps","target":20,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"tabata","sets":4,"setsField":"rounds","workSec":20,"restSec":10,"title":"Табата 3: двигатель","titleEn":"Tabata 3: engine","description":"Четыре раунда бега с высоким коленом, затем четыре раунда конькобежца. Последняя табата — держи высоту колена и ширину прыжка до конца.","descriptionEn":"Four rounds of high knees, then four rounds of skaters. Last Tabata — keep the knees high and the jumps wide to the end.","scalable":true,"blockId":"et_tabata_3","items":[{"exerciseId":"high_knees","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"skater","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"et_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_engine_amrap15', 'Двигатель: AMRAP 15', 'Пятнадцать минут — самый длинный интервал курса перед «Синди». Пять упражнений в круге: бёрпи, прыжковые приседания, отжимания, скакалка и ситапы. Распредели силы: первые пять минут на 80 %, дальше держи темп, последние две — всё, что осталось.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"ea15_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":900,"title":"AMRAP 15 минут","titleEn":"AMRAP 15 minutes","description":"Как можно больше кругов за 15 минут. Запиши число кругов — сравнишь с AMRAP 10 из первой недели.","descriptionEn":"As many rounds as possible in 15 minutes. Note the rounds — compare with the AMRAP 10 from week one.","scalable":true,"blockId":"ea15_amrap","items":[{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"jump_squat","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0,"note":"Нет скакалки — 40 джампинг-джеков.","noteEn":"No rope — 40 jumping jacks."},{"exerciseId":"sit_up","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"ea15_core","items":[{"exerciseId":"side_plank","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"ea15_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_chipper_a', 'Чиппер: всё тело A', 'Три круга на время с лимитом 15 минут: бёрпи, приседания, отжимания, выпады, ситапы. Чиппер — это про то, чтобы «откусывать» по кусочку: разбивай большие серии на части и не останавливайся надолго. Запиши время — в пятой неделе будет четыре круга.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"cha_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":3,"setsField":"sets","durationSec":900,"title":"3 круга на время","titleEn":"3 rounds for time","description":"Лимит 15 минут. Первый круг — на 85 % от максимума, чтобы третий не развалился.","descriptionEn":"15-minute cap. Run the first round at 85% so the third one does not fall apart.","scalable":true,"blockId":"cha_fortime","items":[{"exerciseId":"burpee","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"reverse_lunge","unit":"reps","target":16,"restAfterSec":0},{"exerciseId":"sit_up","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"cha_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_chipper_b', 'Чиппер: всё тело B', 'Четыре круга, лимит 20 минут. К бёрпи и отжиманиям добавляются прыжковые приседания, конькобежец и касания плеч в планке. Начни чуть медленнее, чем хочется: четвёртый круг не должен быть намного медленнее первого.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"chb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":4,"setsField":"sets","durationSec":1200,"title":"4 круга на время","titleEn":"4 rounds for time","description":"Лимит 20 минут. Засеки время каждого круга — ровные круги важнее рекордного первого.","descriptionEn":"20-minute cap. Note each round time — even rounds matter more than a record first one.","scalable":true,"blockId":"chb_fortime","items":[{"exerciseId":"burpee","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"jump_squat","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"skater","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"sit_up","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"plank_shoulder_tap","unit":"reps","target":20,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"chb_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_easy_flow', 'Лёгкий поток', 'Лёгкий день: три круга спокойной работы — приседания, отжимания от стула, мостик, медвежья походка, удержание в приседе — без спешки и на идеальной технике. Потом кор и длинная растяжка. Пульс не должен подниматься высоко: это день, когда тело догоняет нагрузку.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"flow_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":60,"title":"Техника","titleEn":"Technique","description":"Три круга в темпе разговора. Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке.","descriptionEn":"Three rounds at a talking pace. Treat every rep as a demo: full range, a pause at the end point.","scalable":true,"blockId":"flow_skill","items":[{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"incline_push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"bear_crawl","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"squat_hold","unit":"seconds","target":20,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"flow_core","items":[{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":20,"perSide":true,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"flow_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_bench_burpees', '100 бёрпи на время', 'Классика: 100 бёрпи, лимит 12 минут. Разбей на серии — например, 10 по 10 с коротким выдохом между ними — и не стой дольше 10 секунд. Запиши время: это твоя точка отсчёта. Не уложился в лимит — запиши, сколько успел: это тоже результат.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"bb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":720,"title":"100 бёрпи на время","titleEn":"100 burpees for time","description":"Лимит 12 минут. Полное бёрпи: грудь касается пола, прыжок с хлопком над головой.","descriptionEn":"12-minute cap. Full burpee: chest touches the floor, jump with a clap overhead.","scalable":true,"blockId":"bb_fortime","items":[{"exerciseId":"burpee","unit":"reps","target":100,"restAfterSec":0,"note":"Серии по 10, пауза не дольше 10 секунд.","noteEn":"Sets of 10, pauses no longer than 10 seconds."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"bb_cooldown","items":[{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0}]}]}'::jsonb, 150)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('engine_w_bench_cindy', 'Синди своим весом', 'Домашняя версия «Синди»: 20 минут, круг — 10 ситапов, 10 отжиманий, 15 приседаний. В оригинале вместо ситапов подтягивания, но турника у нас нет. Держи ровный темп с первой минуты и считай круги — это число ты будешь бить в следующем цикле.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to get warm and move through full range, not to get tired.","scalable":false,"blockId":"bc_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":1200,"title":"AMRAP 20 минут","titleEn":"AMRAP 20 minutes","description":"Как можно больше кругов за 20 минут. Отжимания разбивай раньше, чем откажут руки: 6 + 4 лучше, чем 10 и минута паузы.","descriptionEn":"As many rounds as possible in 20 minutes. Break the push-ups before your arms give out: 6 + 4 beats 10 and a minute of standing around.","scalable":true,"blockId":"bc_amrap","items":[{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"bc_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 150)
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d1_test', 1, 1, 'test', (select id from public.custom_workouts where short_id = 'engine_w_test'),
  '{"title":{"ru":"Тест: точка отсчёта","en":"Baseline test"},"subtitle":{"ru":"4 теста · отжимания, присед, планка, бёрпи","en":"4 tests · push-ups, squats, plank, burpees"},"body":[]}'::jsonb, false, null, 0
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d2_rest', 1, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 7000, 1
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d3_squat_push', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"3 подхода · база","en":"3 sets · the base"},"body":[]}'::jsonb, false, null, 2
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d4_rest', 1, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Лёгкая крепатура — норма. Прогулка разгонит кровь и облегчит её быстрее, чем диван.","en":"Mild soreness is normal. A walk gets the blood moving and eases it faster than the couch."},"body":[]}'::jsonb, false, 7000, 3
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d5_hinge_core', 1, 5, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_hinge_core_a'),
  '{"title":{"ru":"Тяга и кор","en":"Hinge & core"},"subtitle":{"ru":"3 подхода + 3 круга кора","en":"3 sets + 3 core rounds"},"body":[]}'::jsonb, false, null, 4
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d6_engine', 1, 6, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_engine_amrap10'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"AMRAP 10 мин","en":"AMRAP 10 min"},"body":[]}'::jsonb, false, null, 5
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w1d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка: мышцы восстанавливаются в дни отдыха, а не на тренировке.","en":"7,000 steps and light stretching: muscles recover on rest days, not during the workout."},"body":[]}'::jsonb, false, 7000, 6
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d1_squat_push', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"3 подхода · закрепляем технику","en":"3 sets · locking in the form"},"body":[]}'::jsonb, false, null, 7
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d2_rest', 2, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут. Сон 7–8 часов сделает для прогресса больше, чем лишняя тренировка.","en":"A 40–60 minute walk. Seven to eight hours of sleep does more for progress than an extra session."},"body":[]}'::jsonb, false, 7000, 8
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d3_hinge_core', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_hinge_core_a'),
  '{"title":{"ru":"Тяга и кор","en":"Hinge & core"},"subtitle":{"ru":"3 подхода + кор","en":"3 sets + core"},"body":[]}'::jsonb, false, null, 9
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d4_engine', 2, 4, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_engine_emom12'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"EMOM 12 мин","en":"EMOM 12 min"},"body":[]}'::jsonb, false, null, 10
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d5_rest', 2, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка: мышцы восстанавливаются в дни отдыха, а не на тренировке.","en":"7,000 steps and light stretching: muscles recover on rest days, not during the workout."},"body":[]}'::jsonb, false, 7000, 11
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d6_chipper', 2, 6, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_chipper_a'),
  '{"title":{"ru":"Чиппер","en":"Chipper"},"subtitle":{"ru":"3 круга на время, лимит 15 мин","en":"3 rounds for time, 15-min cap"},"body":[]}'::jsonb, false, null, 12
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w2d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 7000, 13
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d1_squat_push', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"4 подхода · прыжковый присед","en":"4 sets · jump squats"},"body":[]}'::jsonb, false, null, 14
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d2_rest', 3, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Лёгкая крепатура — норма. Прогулка разгонит кровь и облегчит её быстрее, чем диван.","en":"Mild soreness is normal. A walk gets the blood moving and eases it faster than the couch."},"body":[]}'::jsonb, false, 7000, 15
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d3_hinge_core', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_hinge_core_b'),
  '{"title":{"ru":"Тяга и кор","en":"Hinge & core"},"subtitle":{"ru":"3 подхода · на одной ноге","en":"3 sets · single-leg"},"body":[]}'::jsonb, false, null, 16
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d4_engine', 3, 4, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_engine_tabata'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"3 табаты 20/10","en":"3 Tabatas 20/10"},"body":[]}'::jsonb, false, null, 17
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d5_rest', 3, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы.","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today."},"body":[]}'::jsonb, false, 7000, 18
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d6_benchmark', 3, 6, 'benchmark', (select id from public.custom_workouts where short_id = 'engine_w_bench_burpees'),
  '{"title":{"ru":"100 бёрпи","en":"100 burpees"},"subtitle":{"ru":"Бенчмарк · на время, лимит 12 мин","en":"Benchmark · for time, 12-min cap"},"body":[]}'::jsonb, false, null, 19
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w3d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут. Сон 7–8 часов сделает для прогресса больше, чем лишняя тренировка.","en":"A 40–60 minute walk. Seven to eight hours of sleep does more for progress than an extra session."},"body":[]}'::jsonb, false, 7000, 20
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d1_squat_push', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 21
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d2_rest', 4, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks."},"body":[]}'::jsonb, false, 7000, 22
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d3_hinge_core', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_hinge_core_b'),
  '{"title":{"ru":"Тяга и кор","en":"Hinge & core"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 23
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d4_engine', 4, 4, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_engine_amrap10'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Разгрузка · AMRAP 10 мин","en":"Deload · AMRAP 10 min"},"body":[]}'::jsonb, true, null, 24
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d5_rest', 4, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks."},"body":[]}'::jsonb, false, 7000, 25
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d6_flow', 4, 6, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_easy_flow'),
  '{"title":{"ru":"Лёгкий поток","en":"Easy flow"},"subtitle":{"ru":"Разгрузка · техника и растяжка","en":"Deload · technique and stretching"},"body":[]}'::jsonb, true, null, 26
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w4d7_rest', 4, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут. Сон 7–8 часов сделает для прогресса больше, чем лишняя тренировка.","en":"A 40–60 minute walk. Seven to eight hours of sleep does more for progress than an extra session."},"body":[]}'::jsonb, false, 7000, 27
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d1_squat_push', 5, 1, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"4 подхода · узкие отжимания","en":"4 sets · diamond push-ups"},"body":[]}'::jsonb, false, null, 28
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d2_rest', 5, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Лёгкая крепатура — норма. Прогулка разгонит кровь и облегчит её быстрее, чем диван.","en":"Mild soreness is normal. A walk gets the blood moving and eases it faster than the couch."},"body":[]}'::jsonb, false, 7000, 29
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d3_hinge_core', 5, 3, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_hinge_core_c'),
  '{"title":{"ru":"Тяга и кор","en":"Hinge & core"},"subtitle":{"ru":"3 больших подхода · пик объёма","en":"3 big sets · peak volume"},"body":[]}'::jsonb, false, null, 30
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d4_engine', 5, 4, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_engine_amrap15'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"AMRAP 15 мин","en":"AMRAP 15 min"},"body":[]}'::jsonb, false, null, 31
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d5_rest', 5, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка: мышцы восстанавливаются в дни отдыха, а не на тренировке.","en":"7,000 steps and light stretching: muscles recover on rest days, not during the workout."},"body":[]}'::jsonb, false, 7000, 32
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d6_chipper', 5, 6, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_chipper_b'),
  '{"title":{"ru":"Чиппер","en":"Chipper"},"subtitle":{"ru":"4 круга на время, лимит 20 мин","en":"4 rounds for time, 20-min cap"},"body":[]}'::jsonb, false, null, 33
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w5d7_rest', 5, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 7000, 34
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d1_squat_push', 6, 1, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_squat_push_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"4 подхода · последний силовой","en":"4 sets · last strength day"},"body":[]}'::jsonb, false, null, 35
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d2_rest', 6, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы.","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today."},"body":[]}'::jsonb, false, 7000, 36
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d3_benchmark', 6, 3, 'benchmark', (select id from public.custom_workouts where short_id = 'engine_w_bench_cindy'),
  '{"title":{"ru":"Синди своим весом","en":"Bodyweight Cindy"},"subtitle":{"ru":"Бенчмарк · AMRAP 20 мин","en":"Benchmark · AMRAP 20 min"},"body":[]}'::jsonb, false, null, 37
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d4_rest', 6, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут. Сон 7–8 часов сделает для прогресса больше, чем лишняя тренировка.","en":"A 40–60 minute walk. Seven to eight hours of sleep does more for progress than an extra session."},"body":[]}'::jsonb, false, 7000, 38
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d5_flow', 6, 5, 'workout', (select id from public.custom_workouts where short_id = 'engine_w_easy_flow'),
  '{"title":{"ru":"Лёгкий поток","en":"Easy flow"},"subtitle":{"ru":"Техника и растяжка перед тестом","en":"Technique and stretching before the retest"},"body":[]}'::jsonb, false, null, 39
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d6_rest', 6, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Перед тестом — только прогулка. Завтра ты сравнишь цифры с первым днём.","en":"Only a walk before the test. Tomorrow you compare your numbers with day one."},"body":[]}'::jsonb, false, 7000, 40
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
  (select id from public.admin_courses where slug_id = 'engine'),
  'w6d7_retest', 6, 7, 'test', (select id from public.custom_workouts where short_id = 'engine_w_test'),
  '{"title":{"ru":"Повторный тест","en":"Retest"},"subtitle":{"ru":"Те же 4 теста · сравни с первой неделей","en":"Same 4 tests · compare with week 1"},"body":[]}'::jsonb, false, null, 41
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

-- ---------------------------------------------------------------------------
-- dumbbells — Форма с гантелями: сила и рельеф
-- 16 workouts, 42 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'dumbbells', 'draft', 3, 2, 6, 4, 35,
  '{"dumbbells","none","mat"}'::text[], '#16202b', 3990, 39,
  '{"slug":{"ru":"ganteli-doma-sila-i-relef","en":"dumbbell-builder"},"name":{"ru":"Форма с гантелями: сила и рельеф","en":"Forma. Dumbbells: strength and definition"},"tagline":{"ru":"Шесть недель силовых тренировок с парой гантелей — присед, тяга, жим и трастеры, четыре дня в неделю.","en":"Six weeks of strength training with a pair of dumbbells — squats, deadlifts, presses and thrusters, four days a week."},"description":{"ru":"Силовая программа для дома с гантелями: два силовых дня в неделю, день выносливости с рывком и взятием на грудь и день комплексов. Разгрузочная неделя, два бенчмарка — «DT» и 21-15-9 трастеров с бёрпи — и один и тот же тест в начале и в конце.","en":"A home strength program with dumbbells: two strength days a week, a conditioning day built around snatches and cleans, and a complex day. A deload week, two benchmarks — DT and 21-15-9 thrusters with burpees — and the same test at the start and the end."},"longDescription":[{"ru":"Пара гантелей — это почти целый зал. С ними можно приседать, тянуть с пола, жать стоя и лёжа, делать выпады, взятия и рывки. Курс построен вокруг шести базовых движений — гоблет- и фронтальный присед, становая и румынская тяга, тяга в наклоне, жим и швунг, — и каждую неделю они становятся чуть тяжелее или объёмнее: три подхода превращаются в четыре, средний вес — в тяжёлый, жим стоя — в швунг, а присед и жим — в трастер.","en":"A pair of dumbbells is very nearly a whole gym. You can squat, lift from the floor, press standing and lying, lunge, clean and snatch with them. The course is built around six base movements — goblet and front squats, deadlifts and Romanian deadlifts, bent-over rows, presses and push presses — and every week they get a little heavier or bigger: three sets become four, medium weight becomes heavy, the standing press becomes a push press, and squat plus press becomes a thruster."},{"ru":"Неделя выглядит так: день приседа и жима, день тяги и спины — оба с блоком на кор, — день «двигателя» с EMOM, AMRAP или табатой и день комплексов, где гантели не выпускают из рук несколько движений подряд. Между тренировками — дни отдыха с целью 7000 шагов. Четвёртая неделя разгрузочная: объём падает примерно на треть, и именно после неё сила обычно делает скачок.","en":"A week looks like this: a squat & press day, a hinge & pull day — both with a core block — an engine day with an EMOM, AMRAP or Tabata, and a complex day where the dumbbells stay in your hands through several movements in a row. Between sessions are rest days with a 7,000-step goal. Week four is a deload: volume drops by about a third, and that is usually when strength jumps."},{"ru":"Веса в программе обозначены как лёгкий, средний и тяжёлый — приложение само сопоставляет их с гантелями, которые ты указал в профиле. Количество повторений подбирается по входному тесту и корректируется после каждой тренировки по твоей оценке усилия. Если какое-то движение пока не по силам — рывок или тяга ренегата, — приложение подставит вариант проще.","en":"Loads in the program are labelled light, medium and heavy — the app maps them to the dumbbells you listed in your profile. Rep counts come from the baseline test and are adjusted after every session from your effort rating. If a movement is not there yet — the snatch or the renegade row — the app substitutes an easier variant."},{"ru":"Два бенчмарка держат курс в тонусе: в третью неделю — «DT» с гантелями, пять кругов становой, взятий и швунгов на время; в шестую — 21-15-9 трастеров и бёрпи. А в самом начале и в самом конце — один и тот же тест: отжимания, приседания, планка и бёрпи. Так ты увидишь прогресс не в ощущениях, а в цифрах.","en":"Two benchmarks keep the course honest: in week three, dumbbell DT — five rounds of deadlifts, cleans and push presses for time; in week six, 21-15-9 thrusters and burpees. And at the very start and the very end, the same test: push-ups, squats, plank and burpees. That way you see your progress in numbers, not just in feelings."}],"forWhom":[{"ru":"У тебя есть пара гантелей (лучше две пары или разборные) и коврик.","en":"You own a pair of dumbbells (two pairs or adjustables are better) and a mat."},{"ru":"Ты уже отжимаешься 8–10 раз подряд и держишь планку минуту — или прошёл курс «Старт».","en":"You can already do 8–10 push-ups in a row and hold a plank for a minute — or you finished the Start course."},{"ru":"Хочешь стать сильнее и подтянуть рельеф, а не только сбросить вес.","en":"You want to get stronger and build definition, not just lose weight."},{"ru":"Тебе нравится структура: подходы, веса, прогрессия и понятные бенчмарки.","en":"You like structure: sets, weights, progression and clear benchmarks."},{"ru":"Есть 30–40 минут четыре раза в неделю.","en":"You have 30–40 minutes four times a week."}],"outcomes":[{"ru":"Уверенная техника шести базовых движений с гантелями: присед, становая, румынская тяга, тяга в наклоне, жим, швунг.","en":"Confident technique in six base dumbbell movements: squat, deadlift, Romanian deadlift, row, press, push press."},{"ru":"Освоишь взятие на грудь, рывок гантели и трастер — движения, из которых состоят кроссфит-комплексы.","en":"You learn the dumbbell clean, snatch and thruster — the movements CrossFit workouts are built from."},{"ru":"Рабочие веса вырастут: от средних гантелей в первую неделю к тяжёлым в пятую.","en":"Your working weights go up: from medium dumbbells in week one to heavy ones in week five."},{"ru":"Два бенчмарка с результатом на время: «DT» с гантелями и 21-15-9.","en":"Two benchmarks with a time to beat: dumbbell DT and 21-15-9."},{"ru":"Больше отжиманий, приседаний и бёрпи в повторном тесте — сравнишь с первой неделей.","en":"More push-ups, squats and burpees in the retest — you compare with week one."},{"ru":"Привычка к четырём тренировкам в неделю с отдыхом и разгрузкой, без перегруза.","en":"A habit of four sessions a week with rest days and a deload — without burning out."}],"faq":[{"q":{"ru":"Какие гантели нужны?","en":"What dumbbells do I need?"},"a":{"ru":"Минимум — одна пара. Идеально — две пары или разборные гантели: лёгкая для трастеров, рывков и AMRAP и тяжёлая для становой, тяги и приседа. Ориентир для «лёгкой»: ты можешь чисто выжать её над головой 15 раз подряд; для «тяжёлой»: 8 становых тяг даются с усилием. Если пара одна, все три метки нагрузки будут указывать на неё — регулируй темпом и паузами, а в быстрых движениях бери одну гантель вместо двух.","en":"One pair at minimum. Ideally two pairs or adjustable dumbbells: a light one for thrusters, snatches and AMRAPs and a heavy one for deadlifts, rows and squats. Rule of thumb for ''light'': you can press it overhead cleanly 15 times in a row; for ''heavy'': 8 deadlifts take real effort. If you own a single pair, all three load labels will point to it — adjust with tempo and pauses, and use one dumbbell instead of two in the fast movements."}},{"q":{"ru":"Мне подойдёт этот курс или лучше начать со «Старта»?","en":"Is this course right for me, or should I begin with Start?"},"a":{"ru":"Ориентир: 8–10 отжиманий от пола подряд, минута планки и 15 приседаний с гантелью у груди без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт» или «Своим весом»: там те же паттерны движения без веса, а через месяц-полтора гантели дадутся легче и безопаснее.","en":"Rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15 goblet squats without getting winded. If that is you, jump in. If not yet, do Start or Bodyweight Engine first: the same movement patterns without load, and in a month or so the dumbbells will come easier and safer."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"Силовые дни — 30–40 минут вместе с разминкой и заминкой, «двигатель» — около 25, комплексы — около 30, бенчмарки — 18–20 минут: они короткие, но самые тяжёлые в курсе. В среднем выходит чуть больше получаса. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.","en":"Strength days run 30–40 minutes including warm-up and cool-down, engine days about 25, complexes about 30, and the benchmarks 18–20 minutes: short, but the hardest sessions of the course. The average lands a little over half an hour. Before you start, the app shows the estimated time for each of the three difficulty options."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Просто продолжай со следующего узла, когда сможешь: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — лучше сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках и возвращайся к прежним весам постепенно.","en":"Just continue from the next node when you can: the path does not reset. Do not stack two strength days back to back to ''catch up'' — shift the week instead. After a break longer than two weeks, pick ''Easier'' for the first two sessions and ease back into your old weights gradually."}},{"q":{"ru":"Как приложение подбирает нагрузку и вес?","en":"How does the app pick the load and the weight?"},"a":{"ru":"Количество повторений считается по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — приложение чуть поднимает или снижает объём в следующий раз. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля: самая лёгкая, средняя, самая тяжёлая. В разгрузочную неделю объём снижается автоматически, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее».","en":"Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the app nudges the volume up or down next time. The labels ''light'', ''medium'' and ''heavy'' are mapped to the dumbbells in your profile: the lightest, the middle one, the heaviest. In the deload week volume drops automatically, and before every session you can choose Easier, As usual or Harder."}},{"q":{"ru":"После становой тянет поясницу. Это нормально?","en":"My lower back feels it after deadlifts. Is that normal?"},"a":{"ru":"Лёгкая усталость в мышцах вдоль позвоночника на следующий день — норма: они тоже работали. Острая боль, прострел или боль, которая усиливается при наклоне, — нет. В этом случае отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку. Проверь технику: гантели близко к голеням, спина прямая, движение начинается с таза, а не с поясницы. Если поясница беспокоит регулярно, укажи это в ограничениях профиля — приложение заменит тяжёлые наклоны более безопасными вариантами — и покажись врачу.","en":"Mild fatigue in the muscles along the spine the next day is normal: they worked too. Sharp pain, a sudden twinge or pain that gets worse as you bend is not. In that case mark ''Pain'' in the post-workout feedback: the app reduces the load. Check your technique: dumbbells close to the shins, back flat, the movement starts from the hips, not the lower back. If your lower back bothers you regularly, add it to the limitations in your profile — the app swaps heavy hinges for safer variants — and see a doctor."}}]}'::jsonb
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
values ('dumbbells_w_test', 'Тест: отжимания, присед, планка, бёрпи', 'Четыре коротких теста с отдыхом по 90 секунд: отжимания за две минуты, приседания за минуту, планка на максимум и бёрпи за минуту. По ним приложение подберёт стартовый объём, а в конце курса ты повторишь тест и сравнишь цифры. Работай честно, но без геройства: считаются только чистые повторения.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Лёгкая разминка. Не утомляйся: силы нужны для теста.","descriptionEn":"A light warm-up. Do not tire yourself out: save your strength for the test.","scalable":false,"blockId":"test_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":3,"restAfterSec":0}]},{"kind":"main","blockType":"test","format":"sets","sets":1,"setsField":"sets","title":"Тест","titleEn":"Test","description":"Максимум повторений за отведённое время, отдых 90 секунд между тестами. Останавливайся, как только ломается техника.","descriptionEn":"Max reps in the given time, 90 seconds of rest between tests. Stop as soon as your form breaks.","scalable":false,"blockId":"test_main","items":[{"exerciseId":"push_up","unit":"seconds","target":120,"restAfterSec":90,"note":"Максимум за 2 минуты. Грудь касается пола, локти выпрямляются полностью. Отдыхать можно в верхней точке.","noteEn":"Max reps in 2 minutes. Chest to the floor, elbows fully locked at the top. Rest at the top if you need to."},{"exerciseId":"air_squat","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.","noteEn":"Max reps in one minute. Hips below parallel, full extension at the top."},{"exerciseId":"plank","unit":"seconds","target":300,"restAfterSec":90,"note":"Держи, пока не провиснет поясница. Лимит — 5 минут.","noteEn":"Hold until your lower back starts to sag. Five-minute limit."},{"exerciseId":"burpee","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.","noteEn":"Max reps in one minute: chest to the floor, jump and clap at the top."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"test_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 80)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_squat_press_a', 'Присед и жим A', 'Первый силовой день курса. Четыре движения по кругу — гоблет-присед, жим гантелей стоя, обратные выпады и жим с пола — три подхода со средним весом. Задача первых двух недель — найти рабочие веса и отточить технику, а не вымотаться. В конце короткий блок на кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"spa_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"Сила","titleEn":"Strength","description":"Три подхода по кругу: присед → жим стоя → выпады → жим с пола. Между упражнениями 20 секунд, между подходами 75. Темп: две секунды вниз, одна вверх. Если в последнем подходе техника держится легко — в следующий раз бери вес тяжелее.","descriptionEn":"Three sets in rotation: squat → standing press → lunges → floor press. Twenty seconds between exercises, 75 between sets. Tempo: two seconds down, one up. If form still feels easy in the last set, go heavier next time.","scalable":true,"blockId":"spa_strength","items":[{"exerciseId":"db_goblet_squat","unit":"reps","target":12,"restAfterSec":20,"note":"Гантель у груди, локти внутрь коленей внизу, пятки на полу","noteEn":"Dumbbell at the chest, elbows inside the knees at the bottom, heels down","load":"medium"},{"exerciseId":"db_shoulder_press","unit":"reps","target":10,"restAfterSec":20,"note":"Сожми ягодицы и живот — поясница не прогибается","noteEn":"Squeeze glutes and abs — no arching in the lower back","load":"medium"},{"exerciseId":"db_lunge","unit":"reps","target":12,"restAfterSec":20,"note":"По 6 на ногу, гантели вдоль тела","noteEn":"6 per leg, dumbbells at your sides","load":"medium"},{"exerciseId":"db_floor_press","unit":"reps","target":12,"restAfterSec":0,"note":"Локти под 45°, касание трицепсом пола — и жми","noteEn":"Elbows at 45°, touch the triceps to the floor, then press","load":"medium"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга. Таз не крутится в касаниях плеч — поставь ноги шире, если нужно.","descriptionEn":"Two rounds. Hips stay still in the shoulder taps — widen your feet if you need to.","scalable":true,"blockId":"spa_core","items":[{"exerciseId":"plank","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"plank_shoulder_tap","unit":"reps","target":16,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spa_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_squat_press_b', 'Присед и жим B', 'Гантели переезжают на плечи: фронтальный присед и швунг — движения, из которых потом складывается трастер. Четыре подхода, отдых 90 секунд, жим с пола — с тяжёлой парой. После силы — восемь минут AMRAP с лёгкими трастерами, чтобы связать всё в одно движение.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"spb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Сила","titleEn":"Strength","description":"Четыре подхода по кругу: фронтальный присед → швунг → жим с пола. Отдых 20 секунд между упражнениями и 90 между подходами. В швунге гантели уходят вверх за счёт ног — руки только доводят.","descriptionEn":"Four sets in rotation: front squat → push press → floor press. Twenty seconds between exercises, 90 between sets. In the push press the legs launch the dumbbells — the arms only finish.","scalable":true,"blockId":"spb_strength","items":[{"exerciseId":"db_front_squat","unit":"reps","target":10,"restAfterSec":20,"note":"Гантели на плечах, локти вперёд, грудь вверх","noteEn":"Dumbbells on the shoulders, elbows forward, chest up","load":"medium"},{"exerciseId":"db_push_press","unit":"reps","target":8,"restAfterSec":20,"note":"Короткий подсед — и резко вверх","noteEn":"A short dip, then drive up hard","load":"medium"},{"exerciseId":"db_floor_press","unit":"reps","target":12,"restAfterSec":0,"note":"Тяжёлая пара: последние два повторения — с усилием","noteEn":"The heavy pair: the last two reps should be a grind","load":"heavy"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8 мин","titleEn":"AMRAP 8 min","description":"Максимум кругов за 8 минут: 8 трастеров, 8 отжиманий, 12 приседаний. Лёгкая пара гантелей. Держи ровный темп — это финишер, а не бенчмарк.","descriptionEn":"As many rounds as possible in 8 minutes: 8 thrusters, 8 push-ups, 12 air squats. Light dumbbells. Keep an even pace — this is a finisher, not a benchmark.","scalable":true,"blockId":"spb_amrap","items":[{"exerciseId":"db_thruster","unit":"reps","target":8,"restAfterSec":0,"note":"Из приседа сразу в жим, одним движением","noteEn":"Straight from the squat into the press, one movement","load":"light"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spb_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_squat_press_c', 'Присед и жим C', 'Пик силового дня: тяжёлая пара во фронтальном приседе и швунге, выпады с гантелями на плечах. Потом десять минут AMRAP — трастеры, бёрпи, ситапы: та же связка, что ждёт тебя в финальном бенчмарке, только короче. Кор — лодочка и складка.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"spc_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Сила","titleEn":"Strength","description":"Четыре подхода по кругу: фронтальный присед → швунг → выпады. Отдых 75 секунд. Вес тяжёлый, но техника не ломается: если два последних повторения не идут чисто — уменьши вес, а не глубину.","descriptionEn":"Four sets in rotation: front squat → push press → lunges. Rest 75 seconds. Heavy weight, but form holds: if the last two reps are not clean, drop the weight, not the depth.","scalable":true,"blockId":"spc_strength","items":[{"exerciseId":"db_front_squat","unit":"reps","target":12,"restAfterSec":20,"note":"Ниже параллели, локти не падают","noteEn":"Below parallel, elbows stay up","load":"heavy"},{"exerciseId":"db_push_press","unit":"reps","target":10,"restAfterSec":20,"note":"Гантели над макушкой, локти выпрямлены полностью","noteEn":"Dumbbells over the crown of the head, elbows fully locked","load":"heavy"},{"exerciseId":"db_lunge","unit":"reps","target":12,"restAfterSec":0,"note":"По 6 на ногу, гантели на плечах","noteEn":"6 per leg, dumbbells on the shoulders","load":"medium"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":600,"title":"AMRAP 10 мин","titleEn":"AMRAP 10 min","description":"Максимум кругов за 10 минут: 8 трастеров, 5 бёрпи, 10 ситапов. Разбивай трастеры на 4 + 4 раньше, чем придётся бросать гантели посреди подхода.","descriptionEn":"As many rounds as possible in 10 minutes: 8 thrusters, 5 burpees, 10 sit-ups. Split the thrusters 4 + 4 before you are forced to drop the dumbbells mid-set.","scalable":true,"blockId":"spc_amrap","items":[{"exerciseId":"db_thruster","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spc_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_hinge_pull_a', 'Тяга и спина A', 'День наклона и тяги: становая тяга с тяжёлой парой, тяга гантели в наклоне, румынская тяга и ягодичный мостик. Здесь ты учишься держать спину прямой под нагрузкой — навык, который бережёт поясницу во всех остальных тренировках. Кор — боковая планка, бёрд-дог и подъёмы ног.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.","descriptionEn":"Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.","scalable":false,"blockId":"hpa_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"Сила","titleEn":"Strength","description":"Три подхода по кругу: становая → тяга в наклоне → румынская тяга → мостик. Отдых 20 секунд между упражнениями, 75 между подходами. Поясница нейтральна всё время: если не уверен — посмотри на себя сбоку в зеркало.","descriptionEn":"Three sets in rotation: deadlift → bent-over row → Romanian deadlift → bridge. Twenty seconds between exercises, 75 between sets. Keep a neutral lower back throughout: if in doubt, check yourself side-on in a mirror.","scalable":true,"blockId":"hpa_strength","items":[{"exerciseId":"db_deadlift","unit":"reps","target":12,"restAfterSec":20,"note":"Гантели вдоль голеней, вставай через пятки","noteEn":"Dumbbells along the shins, drive up through the heels","load":"heavy"},{"exerciseId":"db_row","unit":"reps","target":10,"perSide":true,"restAfterSec":20,"note":"Свободная рука упирается в колено, локоть тянется к бедру","noteEn":"Free hand braced on the knee, pull the elbow towards the hip","load":"heavy"},{"exerciseId":"db_rdl","unit":"reps","target":10,"restAfterSec":20,"note":"Колени мягкие, гантели скользят по бёдрам до середины голени","noteEn":"Soft knees, dumbbells slide down the thighs to mid-shin","load":"medium"},{"exerciseId":"glute_bridge","unit":"reps","target":15,"restAfterSec":0,"note":"Секунда паузы наверху","noteEn":"One-second pause at the top"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга без спешки: таз не проваливается в боковой планке, поясница на полу в подъёмах ног.","descriptionEn":"Two unhurried rounds: hips stay up in the side plank, lower back on the floor in the leg raises.","scalable":true,"blockId":"hpa_core","items":[{"exerciseId":"side_plank","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"leg_raise","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Спокойно верни спину и таз в нейтраль: длинный выдох в каждой позе, без рывков.","descriptionEn":"Gently bring the spine and hips back to neutral: a long exhale in every position, no bouncing.","scalable":false,"blockId":"hpa_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_hinge_pull_b', 'Тяга и спина B', 'Четыре подхода вместо трёх, больше повторений в тяге, а в блок на кор приходит прогулка фермера — самое честное упражнение на хват и осанку. Становая по-прежнему с тяжёлой парой; если пары две, румынскую делай со средней.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.","descriptionEn":"Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.","scalable":false,"blockId":"hpb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Сила","titleEn":"Strength","description":"Четыре подхода по кругу: становая → тяга в наклоне → румынская тяга. 20 секунд между упражнениями, 90 между подходами. В тяге в наклоне не крути корпус — тянет спина, а не поясница.","descriptionEn":"Four sets in rotation: deadlift → bent-over row → Romanian deadlift. Twenty seconds between exercises, 90 between sets. Do not twist in the row — the back pulls, not the lower back.","scalable":true,"blockId":"hpb_strength","items":[{"exerciseId":"db_deadlift","unit":"reps","target":10,"restAfterSec":20,"load":"heavy"},{"exerciseId":"db_row","unit":"reps","target":12,"perSide":true,"restAfterSec":20,"load":"heavy"},{"exerciseId":"db_rdl","unit":"reps","target":12,"restAfterSec":0,"note":"Три секунды вниз, растяжение сзади бедра — и вверх","noteEn":"Three seconds down, feel the hamstrings stretch, then up","load":"medium"}]},{"kind":"main","blockType":"core","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор и хват","titleEn":"Core & grip","description":"Три круга. Прогулка фермера с тяжёлой парой: если гантели тянут плечи вперёд — вес правильный, просто не давай им это сделать.","descriptionEn":"Three rounds. Farmer carry with the heavy pair: if the dumbbells try to pull your shoulders forward, the weight is right — just do not let them.","scalable":true,"blockId":"hpb_core","items":[{"exerciseId":"farmer_carry","unit":"seconds","target":40,"restAfterSec":0,"note":"Плечи назад и вниз, шагай по комнате туда и обратно","noteEn":"Shoulders back and down, walk the room back and forth","load":"heavy"},{"exerciseId":"side_plank","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Спокойно верни спину и таз в нейтраль: длинный выдох в каждой позе, без рывков.","descriptionEn":"Gently bring the spine and hips back to neutral: a long exhale in every position, no bouncing.","scalable":false,"blockId":"hpb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_hinge_pull_c', 'Тяга и спина C', 'Самый тяжёлый день тяги: двенадцать становых с тяжёлой парой, тяга ренегата в планке, румынская тяга тем же весом и 45 секунд прогулки фермера в каждом подходе. Кор — лодочка, боковая планка и складка. После такого дня отдых обязателен — и он в плане.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.","descriptionEn":"Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.","scalable":false,"blockId":"hpc_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Сила","titleEn":"Strength","description":"Четыре подхода по кругу: становая → тяга ренегата → румынская тяга → прогулка фермера. 20 секунд между упражнениями, 90 между подходами. В тяге ренегата ноги шире плеч, таз не разворачивается.","descriptionEn":"Four sets in rotation: deadlift → renegade row → Romanian deadlift → farmer carry. Twenty seconds between exercises, 90 between sets. In the renegade row set the feet wide and keep the hips square.","scalable":true,"blockId":"hpc_strength","items":[{"exerciseId":"db_deadlift","unit":"reps","target":12,"restAfterSec":20,"load":"heavy"},{"exerciseId":"db_renegade_row","unit":"reps","target":12,"restAfterSec":20,"note":"По 6 на руку. Не идёт — тяга в наклоне по 8 на сторону","noteEn":"6 per arm. Too hard? Bent-over rows, 8 per side","load":"medium"},{"exerciseId":"db_rdl","unit":"reps","target":12,"restAfterSec":20,"load":"heavy"},{"exerciseId":"farmer_carry","unit":"seconds","target":45,"restAfterSec":0,"load":"heavy"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга. Самый большой объём на корпус за курс — держи позиции, пока техника чистая, и не задерживай дыхание.","descriptionEn":"Two rounds. The biggest core volume of the course — hold each position only while form is clean, and do not hold your breath.","scalable":true,"blockId":"hpc_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"v_up","unit":"reps","target":10,"restAfterSec":0,"note":"Или ситапы с прямыми руками","noteEn":"Or sit-ups with straight arms overhead"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Спокойно верни спину и таз в нейтраль: длинный выдох в каждой позе, без рывков.","descriptionEn":"Gently bring the spine and hips back to neutral: a long exhale in every position, no bouncing.","scalable":false,"blockId":"hpc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_engine_emom12', 'Двигатель: EMOM 12', 'Первый день выносливости. Сначала короткий блок техники взятия на грудь, потом EMOM 12: каждую минуту — новое упражнение, взятие, бёрпи, скалолаз, четыре круга. Сделал — отдыхай до конца минуты. Так ты учишься главному в кроссфите: распределять силы.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ee_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Техника: взятие на грудь","titleEn":"Skill: the clean","description":"Два круга с лёгкой парой. Становая — чтобы вспомнить наклон, потом взятие: тяни ногами, локти быстро уходят вперёд, гантели ловишь на плечи в подседе.","descriptionEn":"Two rounds with the light pair. Deadlifts to rehearse the hinge, then cleans: drive with the legs, whip the elbows forward, catch the dumbbells on the shoulders in a shallow squat.","scalable":true,"blockId":"ee_skill","items":[{"exerciseId":"db_deadlift","unit":"reps","target":6,"restAfterSec":0,"load":"light"},{"exerciseId":"db_clean","unit":"reps","target":6,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":12,"setsField":"rounds","title":"EMOM 12 мин","titleEn":"EMOM 12 min","description":"Минута 1 — взятие, минута 2 — бёрпи, минута 3 — скалолаз, и так четыре круга. Если работа занимает больше 40 секунд, в следующем круге убавь два повторения.","descriptionEn":"Minute 1 cleans, minute 2 burpees, minute 3 mountain climbers, four cycles. If the work takes more than 40 seconds, drop two reps in the next cycle.","scalable":true,"blockId":"ee_emom","items":[{"exerciseId":"db_clean","unit":"reps","target":8,"restAfterSec":0,"note":"Две гантели, средний вес","noteEn":"Two dumbbells, medium weight","load":"medium"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"mountain_climber","unit":"reps","target":24,"restAfterSec":0,"note":"Считай касания: 24 — это по 12 на ногу","noteEn":"Count the touches: 24 means 12 per leg"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ee_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_engine_amrap12', 'Двигатель: AMRAP 12', 'Знакомство с трастером — главным движением этого курса: присед и жим одним махом. Короткий блок техники, затем 12 минут AMRAP: трастеры, отжимания, приседания, ситапы. Найди темп, который сможешь держать все двенадцать минут, и запиши число кругов.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ea12_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Техника: трастер","titleEn":"Skill: the thruster","description":"Два круга с лёгкой парой. Фронтальный присед — грудь вверх, локти вперёд. Трастер — из самой нижней точки приседа разгоняешь гантели вверх без паузы.","descriptionEn":"Two rounds with the light pair. Front squat: chest up, elbows forward. Thruster: from the very bottom of the squat drive the dumbbells overhead with no pause.","scalable":true,"blockId":"ea12_skill","items":[{"exerciseId":"db_front_squat","unit":"reps","target":6,"restAfterSec":0,"load":"light"},{"exerciseId":"db_thruster","unit":"reps","target":6,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":720,"title":"AMRAP 12 мин","titleEn":"AMRAP 12 min","description":"Максимум кругов за 12 минут. Первые три минуты — на 80 %: если после них ты ещё можешь говорить короткими фразами, темп правильный.","descriptionEn":"As many rounds as possible in 12 minutes. The first three minutes at 80%: if you can still speak in short phrases after them, the pace is right.","scalable":true,"blockId":"ea12_amrap","items":[{"exerciseId":"db_thruster","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ea12_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_engine_tabata', 'Двигатель: табата', 'Три табаты по четыре минуты: 20 секунд работы, 10 отдыха, восемь раундов на одно упражнение, между табатами минута. Рывок гантели, отжимания, гоблет-присед. Перед стартом — короткий блок техники рывка: это самое быстрое движение курса, и его нужно сначала прожить медленно.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"et_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Техника: рывок","titleEn":"Skill: the snatch","description":"Два круга. Гантель между стоп, спина прямая: ноги толкают, рука — как верёвка, гантель летит вверх вдоль тела, локоть выпрямляется над головой.","descriptionEn":"Two rounds. Dumbbell between the feet, back flat: the legs push, the arm is a rope, the dumbbell travels close to the body and locks out overhead.","scalable":true,"blockId":"et_skill","items":[{"exerciseId":"db_snatch","unit":"reps","target":8,"restAfterSec":0,"note":"По 4 на руку, медленно, с паузой над коленом","noteEn":"4 per arm, slowly, with a pause above the knee","load":"light"}]},{"kind":"main","blockType":"metcon","format":"tabata","sets":8,"setsField":"rounds","workSec":20,"restSec":10,"restBetweenRoundsSec":60,"title":"3 табаты 20/10","titleEn":"3 Tabatas 20/10","description":"Восемь раундов рывка, минута отдыха, восемь раундов отжиманий, минута, восемь раундов гоблет-приседа. Число рядом с упражнением — ориентир на один 20-секундный раунд; в последних раундах делай, сколько успеешь, не теряя техники.","descriptionEn":"Eight rounds of snatches, a minute of rest, eight rounds of push-ups, a minute, eight rounds of goblet squats. The number next to each exercise is the target for one 20-second round; in the last rounds do what you can without losing form.","scalable":true,"blockId":"et_tabata","items":[{"exerciseId":"db_snatch","unit":"reps","target":6,"restAfterSec":0,"note":"По 3 на руку. Не идёт рывок — взятие одной гантели на плечо","noteEn":"3 per arm. If the snatch is not there yet, do single-dumbbell cleans","load":"light"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"db_goblet_squat","unit":"reps","target":8,"restAfterSec":0,"load":"light"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"et_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_engine_amrap15', 'Двигатель: AMRAP 15', 'Самый длинный интервал курса: 15 минут, четыре упражнения — рывок гантели, отжимания, гоблет-присед, бёрпи. Стратегия: первые пять минут спокойно, середину — ровно, последние две — всё, что осталось. Число кругов сравни с AMRAP 12 из второй недели.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ea15_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":900,"title":"AMRAP 15 мин","titleEn":"AMRAP 15 min","description":"Максимум кругов за 15 минут. Отдыхай короткими паузами по 5–10 секунд и не оставляй гантель на полу дольше чем на три вдоха.","descriptionEn":"As many rounds as possible in 15 minutes. Rest in short 5–10 second breaks and never leave the dumbbell on the floor for more than three breaths.","scalable":true,"blockId":"ea15_amrap","items":[{"exerciseId":"db_snatch","unit":"reps","target":10,"restAfterSec":0,"note":"По 5 на руку, меняй руку над головой или на полу","noteEn":"5 per arm, switch hands overhead or on the floor","load":"light"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"db_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"load":"light"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ea15_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_complex_a', 'Комплекс с гантелями A', 'Комплекс — это несколько движений подряд, не выпуская гантели из рук: становая, взятие, фронтальный присед, швунг. Четыре круга со средним весом, минута отдыха. Потом восемь минут AMRAP из бёрпи, гоблет-приседа и ситапов. Это день, где сила и выносливость встречаются.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"cxa_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"circuit","sets":4,"setsField":"sets","restBetweenRoundsSec":60,"title":"Комплекс: 4 круга","titleEn":"Complex: 4 rounds","description":"Гантели в руках весь круг: 8 становых → 6 взятий → 6 фронтальных приседов → 6 швунгов. Вес выбирай по швунгу — самому слабому звену. Между кругами минута.","descriptionEn":"Dumbbells stay in your hands the whole round: 8 deadlifts → 6 cleans → 6 front squats → 6 push presses. Pick the weight by the push press — the weakest link. A minute between rounds.","scalable":true,"blockId":"cxa_complex","items":[{"exerciseId":"db_deadlift","unit":"reps","target":8,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_clean","unit":"reps","target":6,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_front_squat","unit":"reps","target":6,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_push_press","unit":"reps","target":6,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8 мин","titleEn":"AMRAP 8 min","description":"Максимум кругов за 8 минут. Гантель для приседа — лёгкая: тут работает дыхание, а не сила.","descriptionEn":"As many rounds as possible in 8 minutes. Light dumbbell for the squats: this part is about breathing, not strength.","scalable":true,"blockId":"cxa_amrap","items":[{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"db_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"load":"light"},{"exerciseId":"sit_up","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"cxa_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_complex_b', 'Комплекс с гантелями B', 'Пять кругов комплекса по восемь повторений в каждом движении — это уже серьёзный объём под нагрузкой. Затем три круга на время: дьявольский жим, приседания, складка, лимит 10 минут. Дьявольский жим — бёрпи с гантелями и мах обеих над головой; если пока не идёт, делай бёрпи и взятие двух гантелей.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"cxb_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"circuit","sets":4,"setsField":"sets","restBetweenRoundsSec":75,"title":"Комплекс: 5 кругов","titleEn":"Complex: 5 rounds","description":"Не выпуская гантели: 8 становых → 8 взятий → 8 фронтальных приседов → 8 швунгов. Между кругами 75 секунд. Если в четвёртом круге пришлось поставить гантели — это нормально: отдохни 10 секунд и продолжай.","descriptionEn":"Without putting the dumbbells down: 8 deadlifts → 8 cleans → 8 front squats → 8 push presses. 75 seconds between rounds. If you have to drop the dumbbells in round four, that is fine: rest 10 seconds and carry on.","scalable":true,"blockId":"cxb_complex","items":[{"exerciseId":"db_deadlift","unit":"reps","target":8,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_clean","unit":"reps","target":8,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_front_squat","unit":"reps","target":8,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_push_press","unit":"reps","target":8,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":3,"setsField":"sets","rounds":3,"durationSec":600,"title":"3 круга на время","titleEn":"3 rounds for time","description":"Лимит 10 минут: 6 дьявольских жимов, 15 приседаний, 10 складок — три круга. Гантели лёгкие. Засеки время.","descriptionEn":"10-minute cap: 6 devil presses, 15 air squats, 10 V-ups — three rounds. Light dumbbells. Note your time.","scalable":true,"blockId":"cxb_fortime","items":[{"exerciseId":"db_devil_press","unit":"reps","target":6,"restAfterSec":0,"note":"Не идёт — бёрпи + взятие двух гантелей на плечи","noteEn":"Too hard? Burpee + a two-dumbbell clean to the shoulders","load":"light"},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"v_up","unit":"reps","target":10,"restAfterSec":0,"note":"Или ситапы с прямыми руками","noteEn":"Or sit-ups with straight arms overhead"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"cxb_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_technique_flow', 'Лёгкий день: техника', 'Лёгкий день с лёгкой парой: три круга гоблет-приседа с паузой внизу, медленной румынской тяги, жима стоя, медвежьей походки и удержания в приседе. Затем спокойный кор и длинная растяжка. Пульс не должен подниматься высоко — это день, когда тело догоняет нагрузку.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.","descriptionEn":"Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.","scalable":false,"blockId":"tf_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":60,"title":"Техника","titleEn":"Technique","description":"Три круга в темпе разговора. Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке, лёгкий вес.","descriptionEn":"Three rounds at a talking pace. Treat every rep as a demo: full range, a pause at the end point, light weight.","scalable":true,"blockId":"tf_skill","items":[{"exerciseId":"db_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пауза две секунды внизу","noteEn":"Two-second pause at the bottom","load":"light"},{"exerciseId":"db_rdl","unit":"reps","target":10,"restAfterSec":0,"note":"Три секунды вниз","noteEn":"Three seconds down","load":"light"},{"exerciseId":"db_shoulder_press","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"bear_crawl","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"squat_hold","unit":"seconds","target":20,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два спокойных круга. Дыши ровно, движения медленные.","descriptionEn":"Two calm rounds. Breathe evenly, move slowly.","scalable":true,"blockId":"tf_core","items":[{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"side_plank","unit":"seconds","target":20,"perSide":true,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Сегодня растяжка длиннее обычного. Не торопись: это часть тренировки, а не довесок к ней.","descriptionEn":"The stretch is longer than usual today. Take your time: it is part of the session, not an add-on.","scalable":false,"blockId":"tf_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_bench_dt', 'DT с гантелями', '«DT» — классический кроссфит-бенчмарк, в оригинале со штангой. Наша версия с гантелями: пять кругов по 12 становых, 9 взятий на грудь и 6 швунгов, лимит 15 минут. Один средний вес на все движения. Стратегия: 11 становых, а двенадцатую переводишь сразу в первое взятие; 8 взятий, а девятое — в первый швунг. Запиши время — в следующем цикле ты его побьёшь.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"dt_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":5,"setsField":"sets","rounds":5,"durationSec":900,"title":"5 кругов на время","titleEn":"5 rounds for time","description":"Лимит 15 минут. Гантели можно ставить на пол, но каждый раз это дорого: короткая пауза в висе или на плечах обходится дешевле.","descriptionEn":"15-minute cap. You may set the dumbbells down, but every drop costs time: a short pause in the hang or on the shoulders is cheaper.","scalable":true,"blockId":"dt_fortime","items":[{"exerciseId":"db_deadlift","unit":"reps","target":12,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_clean","unit":"reps","target":9,"restAfterSec":0,"load":"medium"},{"exerciseId":"db_push_press","unit":"reps","target":6,"restAfterSec":0,"load":"medium"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Спокойно верни спину и таз в нейтраль: длинный выдох в каждой позе, без рывков.","descriptionEn":"Gently bring the spine and hips back to neutral: a long exhale in every position, no bouncing.","scalable":false,"blockId":"dt_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 150)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('dumbbells_w_bench_21_15_9', '21-15-9: трастеры и бёрпи', 'Финальный бенчмарк курса: 21-15-9 трастеров и бёрпи на время, лимит 12 минут. Лёгкая пара гантелей — та, с которой 21 трастер можно сделать за два подхода. Это одна из самых тяжёлых связок в кроссфите: ноги, плечи и дыхание одновременно. Начни трастеры с 11 + 10, бёрпи — ровным темпом без остановок. Время запиши: это личный рекорд, к которому ты будешь возвращаться.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.","descriptionEn":"Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.","scalable":false,"blockId":"b2159_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":720,"title":"21-15-9 на время","titleEn":"21-15-9 for time","description":"21 трастер, 21 бёрпи, 15 трастеров, 15 бёрпи, 9 трастеров, 9 бёрпи. Лимит 12 минут. Не выкладывайся на первых 21: они должны быть на 80 %.","descriptionEn":"21 thrusters, 21 burpees, 15 thrusters, 15 burpees, 9 thrusters, 9 burpees. 12-minute cap. Do not empty the tank on the first 21: run them at 80%.","scalable":true,"blockId":"b2159_fortime","items":[{"exerciseId":"db_thruster","unit":"reps","target":21,"restAfterSec":0,"note":"Лёгкая пара, 11 + 10","noteEn":"Light pair, 11 + 10","load":"light"},{"exerciseId":"burpee","unit":"reps","target":21,"restAfterSec":0},{"exerciseId":"db_thruster","unit":"reps","target":15,"restAfterSec":0,"load":"light"},{"exerciseId":"burpee","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"db_thruster","unit":"reps","target":9,"restAfterSec":0,"load":"light"},{"exerciseId":"burpee","unit":"reps","target":9,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"b2159_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 150)
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d1_test', 1, 1, 'test', (select id from public.custom_workouts where short_id = 'dumbbells_w_test'),
  '{"title":{"ru":"Входной тест","en":"Baseline test"},"subtitle":{"ru":"Отжимания, присед, планка, бёрпи","en":"Push-ups, squats, plank, burpees"},"body":[]}'::jsonb, false, null, 0
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d2_rest', 1, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak"},"body":[]}'::jsonb, false, 7000, 1
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d3_squat_press', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_squat_press_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"3 подхода · найди рабочие веса","en":"3 sets · find your working weights"},"body":[]}'::jsonb, false, null, 2
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d4_rest', 1, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после гантелей — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after dumbbells is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 3
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d5_hinge_pull', 1, 5, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_a'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"3 подхода + кор","en":"3 sets + core"},"body":[]}'::jsonb, false, null, 4
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d6_engine', 1, 6, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_engine_emom12'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Техника взятия + EMOM 12 мин","en":"Clean skill + EMOM 12 min"},"body":[]}'::jsonb, false, null, 5
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w1d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 6
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d1_squat_press', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_squat_press_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"3 подхода · чуть тяжелее","en":"3 sets · a little heavier"},"body":[]}'::jsonb, false, null, 7
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d2_rest', 2, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 8
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d3_hinge_pull', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_a'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"3 подхода + кор","en":"3 sets + core"},"body":[]}'::jsonb, false, null, 9
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d4_engine', 2, 4, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_engine_amrap12'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Техника трастера + AMRAP 12 мин","en":"Thruster skill + AMRAP 12 min"},"body":[]}'::jsonb, false, null, 10
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d5_rest', 2, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке","en":"7,000 steps and water: muscles grow on rest days, not during the workout"},"body":[]}'::jsonb, false, 7000, 11
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d6_complex', 2, 6, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_complex_a'),
  '{"title":{"ru":"Комплекс","en":"Complex"},"subtitle":{"ru":"4 круга + AMRAP 8 мин","en":"4 rounds + AMRAP 8 min"},"body":[]}'::jsonb, false, null, 12
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w2d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 13
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d1_squat_press', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_squat_press_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"4 подхода + AMRAP 8 мин","en":"4 sets + AMRAP 8 min"},"body":[]}'::jsonb, false, null, 14
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d2_rest', 3, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после гантелей — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after dumbbells is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 15
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d3_hinge_pull', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_b'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"4 подхода + прогулка фермера","en":"4 sets + farmer carry"},"body":[]}'::jsonb, false, null, 16
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d4_engine', 3, 4, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_engine_tabata'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Техника рывка + 3 табаты 20/10","en":"Snatch skill + 3 Tabatas 20/10"},"body":[]}'::jsonb, false, null, 17
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d5_rest', 3, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today"},"body":[]}'::jsonb, false, 7000, 18
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d6_benchmark', 3, 6, 'benchmark', (select id from public.custom_workouts where short_id = 'dumbbells_w_bench_dt'),
  '{"title":{"ru":"DT с гантелями","en":"Dumbbell DT"},"subtitle":{"ru":"Бенчмарк · 5 кругов, лимит 15 мин","en":"Benchmark · 5 rounds, 15-min cap"},"body":[]}'::jsonb, false, null, 19
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w3d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 20
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d1_squat_press', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_squat_press_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 21
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d2_rest', 4, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй и спи. Тело усваивает три недели работы","en":"Deload week: walk and sleep. Your body is absorbing three weeks of work"},"body":[]}'::jsonb, false, 7000, 22
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d3_hinge_pull', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_b'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 23
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d4_engine', 4, 4, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_engine_emom12'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Разгрузка · EMOM 12 мин","en":"Deload · EMOM 12 min"},"body":[]}'::jsonb, true, null, 24
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d5_rest', 4, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй и спи. Тело усваивает три недели работы","en":"Deload week: walk and sleep. Your body is absorbing three weeks of work"},"body":[]}'::jsonb, false, 7000, 25
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d6_flow', 4, 6, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_technique_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Разгрузка · техника и растяжка","en":"Deload · technique and stretching"},"body":[]}'::jsonb, true, null, 26
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w4d7_rest', 4, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 27
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d1_squat_press', 5, 1, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_squat_press_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"4 подхода · тяжёлая пара + AMRAP 10","en":"4 sets · heavy pair + AMRAP 10"},"body":[]}'::jsonb, false, null, 28
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d2_rest', 5, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после гантелей — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after dumbbells is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 29
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d3_hinge_pull', 5, 3, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_c'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"4 подхода · тяга ренегата","en":"4 sets · renegade rows"},"body":[]}'::jsonb, false, null, 30
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d4_engine', 5, 4, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_engine_amrap15'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"AMRAP 15 мин","en":"AMRAP 15 min"},"body":[]}'::jsonb, false, null, 31
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d5_rest', 5, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке","en":"7,000 steps and water: muscles grow on rest days, not during the workout"},"body":[]}'::jsonb, false, 7000, 32
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d6_complex', 5, 6, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_complex_b'),
  '{"title":{"ru":"Комплекс","en":"Complex"},"subtitle":{"ru":"5 кругов + 3 круга на время","en":"5 rounds + 3 rounds for time"},"body":[]}'::jsonb, false, null, 33
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w5d7_rest', 5, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 34
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d1_hinge_pull', 6, 1, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_hinge_pull_c'),
  '{"title":{"ru":"Тяга и спина","en":"Hinge & pull"},"subtitle":{"ru":"4 подхода · последний силовой день","en":"4 sets · the last strength day"},"body":[]}'::jsonb, false, null, 35
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d2_rest', 6, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today"},"body":[]}'::jsonb, false, 7000, 36
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d3_benchmark', 6, 3, 'benchmark', (select id from public.custom_workouts where short_id = 'dumbbells_w_bench_21_15_9'),
  '{"title":{"ru":"21-15-9","en":"21-15-9"},"subtitle":{"ru":"Бенчмарк · трастеры и бёрпи, лимит 12 мин","en":"Benchmark · thrusters & burpees, 12-min cap"},"body":[]}'::jsonb, false, null, 37
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d4_rest', 6, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 38
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d5_flow', 6, 5, 'workout', (select id from public.custom_workouts where short_id = 'dumbbells_w_technique_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Техника и растяжка перед тестом","en":"Technique and stretching before the retest"},"body":[]}'::jsonb, false, null, 39
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d6_rest', 6, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра повторный тест — только прогулка и хороший сон","en":"Retest tomorrow — just a walk and a good night''s sleep"},"body":[]}'::jsonb, false, 7000, 40
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
  (select id from public.admin_courses where slug_id = 'dumbbells'),
  'w6d7_retest', 6, 7, 'test', (select id from public.custom_workouts where short_id = 'dumbbells_w_test'),
  '{"title":{"ru":"Повторный тест","en":"Retest"},"subtitle":{"ru":"Те же 4 теста · сравни с первой неделей","en":"Same 4 tests · compare with week 1"},"body":[]}'::jsonb, false, null, 41
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

-- ---------------------------------------------------------------------------
-- kettlebell — Форма с гирей: сила и метаболизм
-- 13 workouts, 37 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'kettlebell', 'draft', 4, 2, 6, 3, 32,
  '{"kettlebell","none","mat"}'::text[], '#232f42', 3990, 39,
  '{"slug":{"ru":"girya-sila-i-metabolizm","en":"kettlebell-power"},"name":{"ru":"Форма с гирей: сила и метаболизм","en":"Forma. Kettlebell: strength and metabolism"},"tagline":{"ru":"Шесть недель с одной гирей: от становой тяги до рывка, три тренировки в неделю.","en":"Six weeks with a single kettlebell: from the deadlift to the snatch, three sessions a week."},"description":{"ru":"Курс вокруг гиревого маха и всего, что из него вырастает: взятие, жим, рывок, турецкий подъём и переноски. Силовые дни, EMOM и лестницы махов, разгрузочная неделя и бенчмарк «100 махов + 50 приседаний» в финале. Дома, с одной гирей.","en":"A course built around the kettlebell swing and everything that grows out of it: the clean, the press, the snatch, the Turkish get-up and carries. Strength days, swing EMOMs and ladders, a deload week and the \"100 swings + 50 squats\" benchmark at the end. At home, with one bell."},"longDescription":[{"ru":"Гиря — самый честный домашний снаряд: один кусок железа, а нагрузку из него можно вытащить любую. Каждая неделя курса — три разных дня. «Присед и жим»: гоблет-присед, жим стоя, выпады с гирей у груди и отжимания. «Школа маха»: здесь живёт главная линия курса — становая тяга, потом мах, из маха взятие на грудь, из взятия жим, а на пятой неделе — рывок; на каждом таком дне есть блок турецкого подъёма и переноски. И «Метаболизм»: EMOM махов, лестница 10–25–10 на время и длинный AMRAP.","en":"A kettlebell is the most honest piece of home equipment: one lump of iron, and you can get any kind of load out of it. Every week of the course has three different days. \"Squat & press\": goblet squats, standing press, front-rack lunges and push-ups. \"Swing school\", where the main thread of the course lives — the deadlift, then the swing, the clean out of the swing, the press out of the clean, and in week five the snatch; every one of these days also has a Turkish get-up block and carries. And \"Metabolic\": swing EMOMs, a 10–25–10 ladder for time and a long AMRAP."},{"ru":"Ты начинаешь с теста без гири — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По нему приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Вес гири ты не считаешь сам: в программе стоят метки «лёгкая», «средняя», «тяжёлая», и приложение подставляет твои гири. Четвёртая неделя — разгрузочная: объём падает примерно на треть, техника остаётся. В шестой — последний силовой день, бенчмарк «100 махов + 50 гоблет-приседаний» на время и повторный тест.","en":"You start with a bodyweight test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. You never have to calculate the bell weight yourself: the program uses \"light\", \"medium\" and \"heavy\" labels and the app maps them to the bells you own. Week four is a deload: volume drops by about a third, the technique work stays. Week six holds the last strength day, the \"100 swings + 50 goblet squats\" benchmark for time and the retest."},{"ru":"Из инвентаря нужна одна гиря и коврик. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, приложение само выберет полегче для жима и рывка и потяжелее для тяги и переносок. Вторая гиря не нужна: прогулка фермера в курсе делается с одной, со сменой руки.","en":"All you need is one kettlebell and a mat. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several bells, the app picks a lighter one for the press and the snatch and a heavier one for deadlifts and carries. You do not need a second bell: the farmer carry in this course is done with one, switching hands."}],"forWhom":[{"ru":"Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.","en":"You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute."},{"ru":"У тебя есть гиря (или ты готов её купить) и ты хочешь уметь с ней всё, а не только махать.","en":"You own a kettlebell (or are ready to buy one) and want to be able to do everything with it, not just swing."},{"ru":"Тебе нужны сила и выносливость одновременно — за 30–35 минут три раза в неделю.","en":"You want strength and conditioning at the same time — in 30–35 minutes, three times a week."},{"ru":"Ты прошёл «Старт» или «Своим весом» и хочешь добавить к собственному весу железо.","en":"You finished Start or Bodyweight Engine and want to add iron to bodyweight."}],"outcomes":[{"ru":"Чистый мах гирей: наклон от бёдер, прямая спина, гиря летит от таза, а не от рук.","en":"A clean kettlebell swing: hinge from the hips, flat back, the bell driven by the hips rather than the arms."},{"ru":"Освоишь взятие на грудь, жим стоя, рывок и турецкий подъём — весь базовый гиревой набор.","en":"You learn the clean, the standing press, the snatch and the Turkish get-up — the whole basic kettlebell toolkit."},{"ru":"Пройдёшь бенчмарк «100 махов + 50 гоблет-приседаний» и запишешь время, которое будешь бить дальше.","en":"You complete the \"100 swings + 50 goblet squats\" benchmark and record a time to beat next cycle."},{"ru":"Больше отжиманий, приседаний, планки и бёрпи в повторном тесте — ты сравнишь первую и шестую неделю.","en":"More push-ups, squats, plank time and burpees in the retest — you compare week one with week six."},{"ru":"Сильный хват и устойчивый кор за счёт переносок, турецкого подъёма и планок.","en":"A strong grip and a stable core from carries, get-ups and planks."}],"faq":[{"q":{"ru":"Какая гиря нужна? Одна или две?","en":"What kettlebell do I need? One or two?"},"a":{"ru":"Одной достаточно — весь курс построен под одну гирю, а прогулка фермера делается со сменой руки. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, укажи их в профиле: приложение подставит полегче туда, где в программе стоит «лёгкая» (жим, рывок, турецкий подъём в первые недели), и потяжелее туда, где «тяжёлая» (становая тяга, переноски). Ещё нужен коврик.","en":"One is enough — the whole course is built around a single bell, and the farmer carry is done switching hands. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several, list them in your profile: the app uses a lighter one where the program says \"light\" (press, snatch, the get-up in the first weeks) and a heavier one where it says \"heavy\" (deadlifts, carries). You also need a mat."}},{"q":{"ru":"Я никогда не занимался с гирей. Мне подойдёт?","en":"I have never trained with a kettlebell. Is this for me?"},"a":{"ru":"Да, если у тебя есть общая база: 8–10 отжиманий от пола подряд, минута планки, 15–20 приседаний без одышки. Гиревая техника здесь строится с нуля: первые две недели — только тяга, мах и разбор турецкого подъёма, взятие появляется на второй неделе, жим из взятия на третьей, рывок на пятой. Если базы пока нет, пройди сначала «Старт» — четыре недели без инвентаря, и возвращайся.","en":"Yes, if you have a general base: 8–10 full push-ups in a row, a one-minute plank, 15–20 squats without getting winded. Kettlebell technique is built from scratch here: the first two weeks are only the deadlift, the swing and the get-up steps; the clean appears in week two, the press out of the clean in week three, the snatch in week five. If the base is not there yet, do Start first — four weeks with no equipment — and come back."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"Около получаса вместе с разминкой и заминкой: силовые дни и «Школа маха» — 27–38 минут, метаболические дни — 21–29, «Лёгкий поток» — около 20, бенчмарк — около 18: он короткий, но самый тяжёлый в курсе. Три тренировки в неделю; в последней неделе добавляется короткий технический день перед повторным тестом. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.","en":"About half an hour including warm-up and cool-down: strength days and Swing school run 27–38 minutes, metabolic days 21–29, Easy flow about 20, and the benchmark about 18 — short, but the hardest session of the course. Three sessions a week; the final week adds a short technique day before the retest. Before you start, the app shows the estimated duration for your own volume."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не делай две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва и возьми гирю полегче на махах: хват и ладони отвыкают быстрее, чем ноги.","en":"No problem: the path does not reset, just continue from the next node when you can. Do not double up to \"catch up\" — shifting the week is better. If the break was longer than two weeks, pick \"Easier\" for the first two sessions back and use a lighter bell on the swings: your grip and palms lose the habit faster than your legs do."}},{"q":{"ru":"После махов болит поясница. Это нормально?","en":"My lower back hurts after swings. Is that normal?"},"a":{"ru":"Тянущая усталость в ягодицах и задней поверхности бедра через день после махов — норма. Боль именно в пояснице — нет: чаще всего это значит, что наклон идёт спиной, а не бёдрами, или гиря опускается слишком низко к коленям. Вернись к становой тяге с гирей и махам с лёгкой гирей, следи, чтобы гиря проходила высоко «в пах», а наверху сжимай ягодицы. Отметь «Боль» в отчёте после тренировки — приложение снизит нагрузку. Если боль резкая, отдаёт в ногу или не проходит несколько дней — покажись врачу.","en":"Dull fatigue in the glutes and hamstrings the day after swings is normal. Pain in the lower back itself is not: most often it means you are bending with your back instead of your hips, or letting the bell drop too low toward the knees. Go back to kettlebell deadlifts and swings with a light bell, keep the bell passing high into the groin and squeeze your glutes at the top. Mark \"Pain\" in the post-workout feedback — the app reduces the load. If the pain is sharp, radiates into a leg or lasts several days, see a doctor."}},{"q":{"ru":"Как приложение подстраивает нагрузку?","en":"How does the app adapt the load?"},"a":{"ru":"Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. Вес гири оно выбирает из тех, что ты указал в профиле, по меткам «лёгкая / средняя / тяжёлая». В четвёртую неделю объём снижается автоматически, а если ты отметил проблемы с поясницей или плечами, тяжёлые махи и жимы заменяются на более щадящие варианты.","en":"Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. It picks the bell from the ones in your profile using the \"light / medium / heavy\" labels. In week four the volume drops automatically, and if you flagged lower-back or shoulder issues, heavy swings and presses are swapped for gentler variants."}}]}'::jsonb
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
values ('kettlebell_w_test', 'Тест: отжимания, присед, планка, бёрпи', 'Четыре коротких теста без гири, с отдыхом по полторы минуты между ними. Работай честно: результат задаёт стартовый объём всех тренировок, а в конце курса ты повторишь тест и сравнишь цифры.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"test_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"test","format":"sets","sets":1,"setsField":"sets","title":"Тест","titleEn":"Test","description":"Максимум повторений за отведённое время. Останавливайся, как только ломается техника — засчитываются только чистые повторения.","descriptionEn":"Max reps in the given time. Stop as soon as your form breaks — only clean reps count.","scalable":false,"blockId":"test_main","items":[{"exerciseId":"push_up","unit":"seconds","target":120,"restAfterSec":90,"note":"Максимум за 2 минуты. Отдыхать можно в верхней точке.","noteEn":"Max reps in 2 minutes. Rest at the top if you need to."},{"exerciseId":"air_squat","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.","noteEn":"Max reps in one minute. Hips below parallel, full extension at the top."},{"exerciseId":"plank","unit":"seconds","target":300,"restAfterSec":90,"note":"Держи, пока не провиснет поясница. Лимит — 5 минут.","noteEn":"Hold until your lower back starts to sag. Five-minute limit."},{"exerciseId":"burpee","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.","noteEn":"Max reps in one minute: chest to the floor, jump and clap at the top."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"test_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 80)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_squat_press_a', 'Присед и жим A', 'Три подхода базовой связки: гоблет-присед, жим гири стоя, обратные выпады с гирей у груди и отжимания. Темп спокойный, каждое повторение — с полной амплитудой: в приседе локти уходят внутрь коленей, в жиме гиря идёт по прямой мимо лица. В конце короткий блок на кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"spa_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"Силовой блок","titleEn":"Strength","description":"Три подхода. Две секунды вниз, секунда вверх. Между упражнениями 20 секунд, между подходами — 75.","descriptionEn":"Three sets. Two seconds down, one second up. Twenty seconds between exercises, 75 between sets.","scalable":true,"blockId":"spa_strength","items":[{"exerciseId":"kb_goblet_squat","unit":"reps","target":10,"restAfterSec":20,"note":"Внизу — секунда паузы, локти раздвигают колени.","noteEn":"One-second pause at the bottom, elbows pushing the knees out.","load":"medium"},{"exerciseId":"kb_press","unit":"reps","target":6,"perSide":true,"restAfterSec":20,"note":"Сначала слабая рука. Корпус не отклоняется — жмёт плечо, а не поясница.","noteEn":"Weaker arm first. No leaning back — the shoulder presses, not the lower back.","load":"medium"},{"exerciseId":"kb_lunge","unit":"reps","target":12,"restAfterSec":20,"note":"12 всего, по 6 на ногу, чередуй. Гиря у груди двумя руками.","noteEn":"12 total, 6 per leg, alternating. Hold the bell at your chest with both hands.","load":"light"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"spa_core","items":[{"exerciseId":"plank","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"spa_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_squat_press_b', 'Присед и жим B', 'Те же четыре движения, но четыре подхода и больше повторений: восемь жимов на руку вместо шести, 16 выпадов вместо 12. Если в последнем подходе жим «залипает» на середине — доделай оставшиеся повторения швунгом, слегка подсев ногами. Кор: боковая планка и касания плеч.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"spb_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Силовой блок","titleEn":"Strength","description":"Четыре подхода. Держи темп из первой недели: две секунды вниз, секунда вверх, никаких отбивов от коленей.","descriptionEn":"Four sets. Keep the week-one tempo: two seconds down, one up, no bouncing off the knees.","scalable":true,"blockId":"spb_strength","items":[{"exerciseId":"kb_goblet_squat","unit":"reps","target":12,"restAfterSec":20,"load":"medium"},{"exerciseId":"kb_press","unit":"reps","target":8,"perSide":true,"restAfterSec":20,"note":"Сжимай свободный кулак и ягодицы — жим станет стабильнее.","noteEn":"Squeeze your free fist and your glutes — the press gets steadier.","load":"medium"},{"exerciseId":"kb_lunge","unit":"reps","target":16,"restAfterSec":20,"note":"16 всего, по 8 на ногу.","noteEn":"16 total, 8 per leg.","load":"medium"},{"exerciseId":"push_up","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"spb_core","items":[{"exerciseId":"side_plank","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"plank_shoulder_tap","unit":"reps","target":16,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"spb_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_squat_press_c', 'Присед и жим C', 'Самый плотный силовой день курса: четыре подхода с паузой в приседе, тяжёлым жимом и узкими отжиманиями, а после — EMOM на 12 минут, где по минутам чередуются гоблет-присед, отжимания и выпады с гирей у груди. Между подходами отдыхай полные 90 секунд: тяжёлый жим любит свежие плечи. Кора отдельно нет — его роль выполняют присед с паузой и выпады.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"spc_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Силовой блок","titleEn":"Strength","description":"Четыре подхода, 90 секунд отдыха. Если узкие отжимания не идут, делай обычные с паузой в одну секунду внизу.","descriptionEn":"Four sets, 90 seconds of rest. If diamond push-ups are not there yet, do regular push-ups with a one-second pause at the bottom.","scalable":true,"blockId":"spc_strength","items":[{"exerciseId":"kb_goblet_squat","unit":"reps","target":15,"restAfterSec":20,"note":"Пауза две секунды в нижней точке на каждом повторении.","noteEn":"Two-second pause at the bottom of every rep.","load":"medium"},{"exerciseId":"kb_press","unit":"reps","target":8,"perSide":true,"restAfterSec":20,"note":"Самая тяжёлая гиря, которую жмёшь на 8 чисто. Не идёт — вернись к средней.","noteEn":"The heaviest bell you can press for 8 clean reps. If it stalls, go back to the medium one.","load":"heavy"},{"exerciseId":"diamond_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Не идут узкие — обычные отжимания с паузой внизу.","noteEn":"If diamonds are too hard, do regular push-ups with a pause at the bottom."}]},{"kind":"main","blockType":"metcon","format":"emom","sets":12,"setsField":"rounds","title":"EMOM 12 минут","titleEn":"EMOM 12 minutes","description":"Минута 1 — гоблет-присед, минута 2 — отжимания, минута 3 — выпады, и так по кругу четыре раза. Сделал повторения — остаток минуты отдыхаешь.","descriptionEn":"Minute 1 goblet squats, minute 2 push-ups, minute 3 lunges, and round again four times. Finish the reps, rest for what is left of the minute.","scalable":true,"blockId":"spc_emom","items":[{"exerciseId":"kb_goblet_squat","unit":"reps","target":12,"restAfterSec":0,"load":"medium"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"kb_lunge","unit":"reps","target":12,"restAfterSec":0,"note":"12 всего, по 6 на ногу.","noteEn":"12 total, 6 per leg.","load":"medium"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"spc_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_swing_school_a', 'Школа маха A: тяга и мах', 'Первый урок гиревой техники. Становая тяга с гирей учит наклон с прямой спиной, мах — тот же наклон, только быстрый: гиря летит от бёдер, а не от рук. Тяга сумо к подбородку готовит плечи к взятию на следующей неделе. Потом — разбор турецкого подъёма по шагам и переноска гири в одной руке.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"ssa_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"skill","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":60,"title":"Школа маха","titleEn":"Swing school","description":"Три подхода. Тяга — медленно и с прямой спиной; мах — резко, до уровня груди, наверху ягодицы сжаты, колени прямые. Гиря опускается «в пах», а не к коленям.","descriptionEn":"Three sets. Deadlift slow and flat-backed; swing sharp, to chest height, glutes squeezed and knees straight at the top. The bell comes back high into the groin, not down to the knees.","scalable":true,"blockId":"ssa_hinge","items":[{"exerciseId":"kb_deadlift","unit":"reps","target":8,"restAfterSec":20,"note":"Гиря между стоп, вес на пятках, взгляд в пол в двух метрах перед собой.","noteEn":"Bell between the feet, weight on the heels, eyes on the floor two metres ahead.","load":"heavy"},{"exerciseId":"kb_swing","unit":"reps","target":10,"restAfterSec":20,"note":"Русский мах — до уровня груди. Руки — верёвки, работают бёдра.","noteEn":"Russian swing — chest height. Arms are ropes; the hips do the work.","load":"medium"},{"exerciseId":"kb_sumo_high_pull","unit":"reps","target":8,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"skill","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":30,"title":"Турецкий подъём: разбор","titleEn":"Turkish get-up: the steps","description":"По одному подъёму на руку, три подхода. В первую неделю можно вообще без гири или с самой лёгкой: задача — запомнить порядок шагов, а не вес.","descriptionEn":"One get-up per arm, three sets. This week you can do it with no bell or the lightest one: the goal is to memorise the sequence, not the weight.","scalable":true,"blockId":"ssa_getup","items":[{"exerciseId":"kb_turkish_get_up","unit":"reps","target":1,"perSide":true,"restAfterSec":30,"note":"Смотри на гирю всю дорогу вверх. Каждую позицию — с паузой на секунду.","noteEn":"Eyes on the bell all the way up. Pause for a second in every position.","load":"light"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Переноска и кор","titleEn":"Carry and core","description":"Два круга. В переноске плечи на одном уровне, корпус не заваливается к гире — это и есть упражнение на кор.","descriptionEn":"Two rounds. In the carry keep the shoulders level and do not lean toward the bell — that is the core exercise.","scalable":true,"blockId":"ssa_carry","items":[{"exerciseId":"kb_suitcase_carry","unit":"seconds","target":30,"perSide":true,"restAfterSec":0,"load":"heavy"},{"exerciseId":"side_plank","unit":"seconds","target":30,"perSide":true,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"ssa_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_swing_school_b', 'Школа маха B: мах и взятие', 'Махов становится больше — 15 в подходе, четыре подхода, — а из маха вырастает взятие на грудь: та же работа бёдер, только гиря не летит вперёд, а «обвивает» руку и мягко ложится на предплечье. Турецкий подъём уже с гирей. В конце — переноска подольше и супермен для спины.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"ssb_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"skill","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":60,"title":"Школа маха","titleEn":"Swing school","description":"Четыре подхода. Взятие — с малым числом повторений: пять на руку, каждое чистое. Если гиря бьёт по предплечью, держи локоть ближе к корпусу и «протягивай» кисть сквозь дужку раньше.","descriptionEn":"Four sets. Keep the clean reps low — five per arm, every one clean. If the bell bangs your forearm, keep the elbow closer to your body and thread your hand through the handle earlier.","scalable":true,"blockId":"ssb_hinge","items":[{"exerciseId":"kb_deadlift","unit":"reps","target":6,"restAfterSec":15,"load":"heavy"},{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":20,"note":"Резкий выдох на каждом махе наверху.","noteEn":"A sharp exhale at the top of every swing.","load":"medium"},{"exerciseId":"kb_clean","unit":"reps","target":5,"perSide":true,"restAfterSec":20,"note":"Гиря обвивает руку, а не бьёт по ней. Локоть прижат к рёбрам в конечной точке.","noteEn":"The bell wraps around the arm rather than hitting it. Elbow tucked to the ribs in the rack.","load":"medium"}]},{"kind":"main","blockType":"skill","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":30,"title":"Турецкий подъём","titleEn":"Turkish get-up","description":"По одному подъёму на руку, три подхода, лёгкая гиря. Рука с гирей вертикальна в каждой позиции.","descriptionEn":"One get-up per arm, three sets, light bell. The loaded arm stays vertical in every position.","scalable":true,"blockId":"ssb_getup","items":[{"exerciseId":"kb_turkish_get_up","unit":"reps","target":1,"perSide":true,"restAfterSec":30,"load":"light"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Переноска и спина","titleEn":"Carry and back","scalable":true,"blockId":"ssb_carry","items":[{"exerciseId":"kb_suitcase_carry","unit":"seconds","target":40,"perSide":true,"restAfterSec":0,"load":"heavy"},{"exerciseId":"superman","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"ssb_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_clean_press', 'Взятие и жим', 'Гиревой комплекс, где движения складываются в цепочку: махи, взятия, жим прямо из положения на груди, тяга сумо. Четыре подхода, отдых 75 секунд. Турецкий подъём — уже по два на руку. В конце прогулка фермера и лодочка: хват и кор держат всё, что ты делаешь с гирей.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"cp_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Комплекс","titleEn":"Complex","description":"Четыре подхода. Жим делай сразу после взятия той же рукой: взял — выжал — опустил на грудь — следующее.","descriptionEn":"Four sets. Press right after the clean with the same arm: clean — press — lower to the rack — next rep.","scalable":true,"blockId":"cp_complex","items":[{"exerciseId":"kb_swing","unit":"reps","target":12,"restAfterSec":15,"load":"medium"},{"exerciseId":"kb_clean","unit":"reps","target":5,"perSide":true,"restAfterSec":15,"load":"medium"},{"exerciseId":"kb_press","unit":"reps","target":5,"perSide":true,"restAfterSec":15,"note":"Из положения на груди. Вдох перед жимом, выдох наверху.","noteEn":"From the rack. Breathe in before the press, out at the top.","load":"medium"},{"exerciseId":"kb_sumo_high_pull","unit":"reps","target":10,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"skill","format":"sets","sets":2,"setsField":"sets","restBetweenSetsSec":30,"title":"Турецкий подъём","titleEn":"Turkish get-up","description":"По два подъёма на руку, два подхода. Первый — медленный и разборчивый, второй — в один плавный поток.","descriptionEn":"Two get-ups per arm, two sets. The first one slow and deliberate, the second one in one smooth flow.","scalable":true,"blockId":"cp_getup","items":[{"exerciseId":"kb_turkish_get_up","unit":"reps","target":2,"perSide":true,"restAfterSec":30,"load":"light"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Хват и кор","titleEn":"Grip and core","scalable":true,"blockId":"cp_carry","items":[{"exerciseId":"farmer_carry","unit":"seconds","target":45,"restAfterSec":0,"note":"Одна гиря — половину времени в одной руке, половину в другой, не ставя на пол.","noteEn":"One bell — half the time in one hand, half in the other, without setting it down.","load":"heavy"},{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"cp_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_snatch_swing', 'Рывок и мах', 'Рывок — это мах, который не остановился на уровне груди: гиря идёт по прямой вверх, кисть проворачивается под дужкой, и гиря мягко садится на предплечье над головой. Пять на руку, лёгкая гиря, никакой спешки. Тяжёлые махи, взятия и жим остаются — теперь весь гиревой набор собран. Турецкий подъём — с гирей потяжелее.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"sn_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Мах, взятие, рывок, жим","titleEn":"Swing, clean, snatch, press","description":"Четыре подхода. Рывок только чистый: если гиря ударяет по предплечью — гиря тяжёлая или ты тянешь её рукой. Опускай через грудь на первых порах.","descriptionEn":"Four sets. Only clean snatches: if the bell bangs your forearm, it is too heavy or you are pulling with the arm. Lower it through the rack while you learn.","scalable":true,"blockId":"sn_hinge","items":[{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":15,"note":"Уверен в технике — делай одной рукой: 8 и 7 со сменой в воздухе или через пол.","noteEn":"Confident with the form — go one-handed: 8 and 7, switching in the air or via the floor.","load":"heavy"},{"exerciseId":"kb_clean","unit":"reps","target":5,"perSide":true,"restAfterSec":15,"load":"medium"},{"exerciseId":"kb_snatch","unit":"reps","target":5,"perSide":true,"restAfterSec":15,"note":"Гиря по прямой, локоть остаётся близко к телу до уровня груди, наверху — фиксация.","noteEn":"Bell travels in a straight line, elbow stays close to the body until chest height, lock out at the top.","load":"light"},{"exerciseId":"kb_press","unit":"reps","target":5,"perSide":true,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"skill","format":"sets","sets":2,"setsField":"sets","restBetweenSetsSec":30,"title":"Турецкий подъём","titleEn":"Turkish get-up","description":"По два на руку с гирей средней тяжести. Если техника плывёт — вернись к лёгкой, в этом упражнении вес второстепенен.","descriptionEn":"Two per arm with a medium bell. If the form gets shaky, go back to the light one — weight is secondary in this movement.","scalable":true,"blockId":"sn_getup","items":[{"exerciseId":"kb_turkish_get_up","unit":"reps","target":2,"perSide":true,"restAfterSec":30,"load":"medium"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Переноска и кор","titleEn":"Carry and core","scalable":true,"blockId":"sn_carry","items":[{"exerciseId":"kb_suitcase_carry","unit":"seconds","target":40,"perSide":true,"restAfterSec":0,"load":"heavy"},{"exerciseId":"side_plank","unit":"seconds","target":40,"perSide":true,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"sn_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_metcon_emom12', 'Метаболизм: EMOM 12', 'Двенадцать минут, каждую минуту новое упражнение по кругу: махи, гоблет-присед, бёрпи — четыре цикла. Сделал повторения — остаток минуты отдыхаешь. Махи должны занимать не больше 25 секунд: если дольше, гиря тяжеловата для темпа или ты машешь руками. В конце короткий блок на кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"em_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"emom","sets":12,"setsField":"rounds","title":"EMOM 12 минут","titleEn":"EMOM 12 minutes","description":"Минута 1 — махи, минута 2 — гоблет-присед, минута 3 — бёрпи, и так по кругу. Остаток минуты — отдых.","descriptionEn":"Minute 1 swings, minute 2 goblet squats, minute 3 burpees, and round again. The rest of the minute is rest.","scalable":true,"blockId":"em_emom","items":[{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":0,"load":"medium"},{"exerciseId":"kb_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"em_core","items":[{"exerciseId":"plank","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"russian_twist","unit":"reps","target":20,"restAfterSec":0,"note":"Можно с лёгкой гирей в руках, если поясница в порядке.","noteEn":"You can hold a light bell if your lower back is happy."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"em_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_metcon_ladder', 'Лестница махов', 'Лестница махов вверх и вниз: 10, 15, 20, 25, 20, 15, 10 — всего 115 махов, а между ступенями по 5 бёрпи. На время, лимит 12 минут. Хитрость в хвате: не сжимай дужку до белых пальцев, держи гирю «крючком» из пальцев, а на бёрпи давай кистям отдохнуть. Запиши время.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"ld_warmup","items":[{"exerciseId":"jumping_jack","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":720,"title":"Лестница на время","titleEn":"Ladder for time","description":"Лимит 12 минут. Ступени махов 10-15-20-25-20-15-10, между ступенями 5 бёрпи. Махи без пауз внутри ступени; отдых — только на смене упражнения, не дольше 10 секунд.","descriptionEn":"12-minute cap. Swing rungs of 10-15-20-25-20-15-10 with 5 burpees between rungs. No breaks inside a rung; rest only when switching exercises, no longer than 10 seconds.","scalable":true,"blockId":"ld_fortime","items":[{"exerciseId":"kb_swing","unit":"reps","target":10,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":20,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":25,"restAfterSec":0,"note":"Вершина лестницы. Дыши ритмично: выдох на каждом махе.","noteEn":"The top of the ladder. Breathe in rhythm: exhale on every swing.","load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":20,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":0,"load":"medium"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0},{"exerciseId":"kb_swing","unit":"reps","target":10,"restAfterSec":0,"load":"medium"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"ld_core","items":[{"exerciseId":"dead_bug","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"leg_raise","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"ld_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_metcon_amrap15', 'Метаболизм: AMRAP 15', 'Пятнадцать минут ровной работы: махи, гоблет-присед, отжимания, бёрпи. Это репетиция бенчмарка следующей недели — та же связка «мах + присед», только с отжиманиями и бёрпи между ними. Первые пять минут на 80 %, дальше держи темп, последние две — всё, что осталось. Считай круги.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"am_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":900,"title":"AMRAP 15 минут","titleEn":"AMRAP 15 minutes","description":"Как можно больше кругов за 15 минут. Отдыхай короткими паузами по 5–10 секунд, а не одной длинной. Ставь гирю на пол мягко — не роняй.","descriptionEn":"As many rounds as possible in 15 minutes. Rest in short 5–10 second breaks, not one long one. Set the bell down gently — do not drop it.","scalable":true,"blockId":"am_amrap","items":[{"exerciseId":"kb_swing","unit":"reps","target":15,"restAfterSec":0,"load":"medium"},{"exerciseId":"kb_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"load":"medium"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":true,"blockId":"am_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"leg_raise","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"am_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_flow', 'Лёгкий поток', 'Короткая техническая тренировка без счёта на время: гало, становая тяга, махи, турецкий подъём и гоблет-присед с паузой — всё с самой лёгкой гирей, три спокойных круга. Это день, когда ты шлифуешь движения, а не устаёшь. В конце — длинная заминка с удержанием в приседе.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"fl_warmup","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":10,"perSide":true,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":4,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":45,"title":"Технический круг","titleEn":"Technique round","description":"Три круга с лёгкой гирей. Каждое повторение — как на экзамене: медленно, с полной амплитудой и паузой в ключевой точке.","descriptionEn":"Three rounds with a light bell. Treat every rep like an exam: slow, full range, a pause at the key position.","scalable":true,"blockId":"fl_skill","items":[{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"kb_deadlift","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"kb_swing","unit":"reps","target":10,"restAfterSec":0,"note":"Следи за верхней точкой: колени прямые, ягодицы сжаты, гиря не выше груди.","noteEn":"Watch the top: knees straight, glutes squeezed, bell no higher than the chest.","load":"light"},{"exerciseId":"kb_turkish_get_up","unit":"reps","target":1,"perSide":true,"restAfterSec":0,"load":"light"},{"exerciseId":"kb_goblet_squat","unit":"reps","target":8,"restAfterSec":0,"note":"Пауза две секунды внизу, локти раздвигают колени.","noteEn":"Two-second pause at the bottom, elbows pushing the knees out.","load":"light"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"fl_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('kettlebell_w_bench_swings_squats', '100 махов и 50 приседаний', 'Гиревой бенчмарк курса: 100 махов, затем 50 гоблет-приседаний, на время, лимит 12 минут. Махи разбивай сериями по 20–25 с паузой не дольше 10 секунд, приседы — по 10. Гиря средняя: та, с которой ты делал EMOM и AMRAP. Запиши время — это твой результат, который ты будешь бить в следующем цикле. Не уложился в лимит — запиши, сколько успел: это тоже результат.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.","descriptionEn":"Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.","scalable":false,"blockId":"bs_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"kb_halo","unit":"reps","target":8,"restAfterSec":0,"load":"light"},{"exerciseId":"squat_to_stand","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"glute_bridge","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":720,"title":"100 махов + 50 приседаний","titleEn":"100 swings + 50 squats","description":"Лимит 12 минут. Сначала все махи, потом все приседы. Мах — до уровня груди, присед — ниже параллели.","descriptionEn":"12-minute cap. All the swings first, then all the squats. Swing to chest height, squat below parallel.","scalable":true,"blockId":"bs_fortime","items":[{"exerciseId":"kb_swing","unit":"reps","target":100,"restAfterSec":0,"note":"Серии по 20–25, пауза не дольше 10 секунд.","noteEn":"Sets of 20–25, pauses no longer than 10 seconds.","load":"medium"},{"exerciseId":"kb_goblet_squat","unit":"reps","target":50,"restAfterSec":0,"note":"Серии по 10. Гиря у груди, локти внутрь коленей.","noteEn":"Sets of 10. Bell at the chest, elbows inside the knees.","load":"medium"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.","descriptionEn":"Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.","scalable":false,"blockId":"bs_cooldown","items":[{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 150)
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d1_test', 1, 1, 'test', (select id from public.custom_workouts where short_id = 'kettlebell_w_test'),
  '{"title":{"ru":"Тест: точка отсчёта","en":"Baseline test"},"subtitle":{"ru":"4 теста · отжимания, присед, планка, бёрпи","en":"4 tests · push-ups, squats, plank, burpees"},"body":[]}'::jsonb, false, null, 0
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d2_rest', 1, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 7000, 1
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d3_squat_press', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"3 подхода · техника гоблет-приседа и жима","en":"3 sets · goblet squat and press form"},"body":[]}'::jsonb, false, null, 2
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d4_rest', 1, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Тянет ягодицы и заднюю поверхность бедра после махов — это норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Sore glutes and hamstrings after swings are normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 7000, 3
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d5_swing_school', 1, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_swing_school_a'),
  '{"title":{"ru":"Школа маха","en":"Swing school"},"subtitle":{"ru":"Тяга → мах · турецкий подъём по шагам","en":"Deadlift → swing · get-up step by step"},"body":[]}'::jsonb, false, null, 4
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w1d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка. Сила растёт в дни отдыха — не отбирай их у себя.","en":"7,000 steps and light stretching. Strength is built on rest days — do not skip them."},"body":[]}'::jsonb, false, 7000, 5
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d1_squat_press', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"3 подхода · закрепляем технику","en":"3 sets · locking in the form"},"body":[]}'::jsonb, false, null, 6
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d2_rest', 2, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и 7–8 часов сна. Это даст больше, чем ещё одна тренировка с гирей.","en":"A 40–60 minute walk and 7–8 hours of sleep. That does more than one more kettlebell session."},"body":[]}'::jsonb, false, 7000, 7
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d3_swing_school', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_swing_school_b'),
  '{"title":{"ru":"Школа маха","en":"Swing school"},"subtitle":{"ru":"4 подхода · махи и первое взятие","en":"4 sets · swings and the first clean"},"body":[]}'::jsonb, false, null, 8
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d4_rest', 2, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Ладоням тоже нужен отдых: осмотри мозоли, подпили огрубевшую кожу, смажь кремом. Сорванная ладонь выбьет из графика на неделю.","en":"Your palms need rest too: check the calluses, file down hard skin, moisturise. A torn palm costs a week of training."},"body":[]}'::jsonb, false, 7000, 9
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d5_metcon', 2, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_metcon_emom12'),
  '{"title":{"ru":"Метаболизм","en":"Metabolic"},"subtitle":{"ru":"EMOM 12 мин · махи, присед, бёрпи","en":"EMOM 12 min · swings, squats, burpees"},"body":[]}'::jsonb, false, null, 10
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w2d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 7000, 11
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d1_squat_press', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"4 подхода · больше жима","en":"4 sets · more pressing"},"body":[]}'::jsonb, false, null, 12
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d2_rest', 3, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Тянет ягодицы и заднюю поверхность бедра после махов — это норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Sore glutes and hamstrings after swings are normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 7000, 13
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d3_clean_press', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_clean_press'),
  '{"title":{"ru":"Взятие и жим","en":"Clean & press"},"subtitle":{"ru":"Комплекс 4 подхода · подъём по 2 на руку","en":"4-set complex · 2 get-ups per arm"},"body":[]}'::jsonb, false, null, 14
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d4_rest', 3, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка. Сила растёт в дни отдыха — не отбирай их у себя.","en":"7,000 steps and light stretching. Strength is built on rest days — do not skip them."},"body":[]}'::jsonb, false, 7000, 15
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d5_metcon', 3, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_metcon_ladder'),
  '{"title":{"ru":"Метаболизм","en":"Metabolic"},"subtitle":{"ru":"Лестница махов · на время, лимит 12 мин","en":"Swing ladder · for time, 12-min cap"},"body":[]}'::jsonb, false, null, 16
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w3d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и 7–8 часов сна. Это даст больше, чем ещё одна тренировка с гирей.","en":"A 40–60 minute walk and 7–8 hours of sleep. That does more than one more kettlebell session."},"body":[]}'::jsonb, false, 7000, 17
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d1_squat_press', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 18
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d2_rest', 4, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks."},"body":[]}'::jsonb, false, 7000, 19
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d3_clean_press', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_clean_press'),
  '{"title":{"ru":"Взятие и жим","en":"Clean & press"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 20
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d4_rest', 4, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks."},"body":[]}'::jsonb, false, 7000, 21
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d5_flow', 4, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_flow'),
  '{"title":{"ru":"Лёгкий поток","en":"Easy flow"},"subtitle":{"ru":"Разгрузка · техника с лёгкой гирей","en":"Deload · technique with a light bell"},"body":[]}'::jsonb, true, null, 22
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w4d7_rest', 4, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и 7–8 часов сна. Это даст больше, чем ещё одна тренировка с гирей.","en":"A 40–60 minute walk and 7–8 hours of sleep. That does more than one more kettlebell session."},"body":[]}'::jsonb, false, 7000, 23
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d1_squat_press', 5, 1, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"4 подхода + EMOM 12 · пик силы","en":"4 sets + EMOM 12 · peak strength"},"body":[]}'::jsonb, false, null, 24
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d2_rest', 5, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Тянет ягодицы и заднюю поверхность бедра после махов — это норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Sore glutes and hamstrings after swings are normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 7000, 25
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d3_snatch', 5, 3, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_snatch_swing'),
  '{"title":{"ru":"Рывок и мах","en":"Snatch & swing"},"subtitle":{"ru":"4 подхода · первый рывок","en":"4 sets · your first snatch"},"body":[]}'::jsonb, false, null, 26
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d4_rest', 5, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Ладоням тоже нужен отдых: осмотри мозоли, подпили огрубевшую кожу, смажь кремом. Сорванная ладонь выбьет из графика на неделю.","en":"Your palms need rest too: check the calluses, file down hard skin, moisturise. A torn palm costs a week of training."},"body":[]}'::jsonb, false, 7000, 27
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d5_metcon', 5, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_metcon_amrap15'),
  '{"title":{"ru":"Метаболизм","en":"Metabolic"},"subtitle":{"ru":"AMRAP 15 мин · репетиция бенчмарка","en":"AMRAP 15 min · benchmark rehearsal"},"body":[]}'::jsonb, false, null, 28
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w5d7_rest', 5, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и лёгкая растяжка. Сила растёт в дни отдыха — не отбирай их у себя.","en":"7,000 steps and light stretching. Strength is built on rest days — do not skip them."},"body":[]}'::jsonb, false, 7000, 29
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d1_squat_press', 6, 1, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_squat_press_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & press"},"subtitle":{"ru":"4 подхода + EMOM 12 · последний силовой","en":"4 sets + EMOM 12 · last strength day"},"body":[]}'::jsonb, false, null, 30
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d2_rest', 6, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Ни одного «лишнего» маха сегодня.","en":"Benchmark tomorrow: steps, water, an early night. Not a single \"extra\" swing today."},"body":[]}'::jsonb, false, 7000, 31
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d3_benchmark', 6, 3, 'benchmark', (select id from public.custom_workouts where short_id = 'kettlebell_w_bench_swings_squats'),
  '{"title":{"ru":"100 махов и 50 приседаний","en":"100 swings & 50 squats"},"subtitle":{"ru":"Бенчмарк · на время, лимит 12 мин","en":"Benchmark · for time, 12-min cap"},"body":[]}'::jsonb, false, null, 32
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d4_rest', 6, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и 7–8 часов сна. Это даст больше, чем ещё одна тренировка с гирей.","en":"A 40–60 minute walk and 7–8 hours of sleep. That does more than one more kettlebell session."},"body":[]}'::jsonb, false, 7000, 33
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d5_flow', 6, 5, 'workout', (select id from public.custom_workouts where short_id = 'kettlebell_w_flow'),
  '{"title":{"ru":"Лёгкий поток","en":"Easy flow"},"subtitle":{"ru":"Техника и растяжка перед тестом","en":"Technique and stretching before the retest"},"body":[]}'::jsonb, false, null, 34
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d6_rest', 6, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Перед тестом — только прогулка. Завтра ты сравнишь цифры с первым днём курса.","en":"Only a walk before the test. Tomorrow you compare your numbers with day one of the course."},"body":[]}'::jsonb, false, 7000, 35
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
  (select id from public.admin_courses where slug_id = 'kettlebell'),
  'w6d7_retest', 6, 7, 'test', (select id from public.custom_workouts where short_id = 'kettlebell_w_test'),
  '{"title":{"ru":"Повторный тест","en":"Retest"},"subtitle":{"ru":"Те же 4 теста · сравни с первой неделей","en":"Same 4 tests · compare with week 1"},"body":[]}'::jsonb, false, null, 36
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

-- ---------------------------------------------------------------------------
-- athlete — Форма атлета: продвинутый домашний кроссфит
-- 18 workouts, 55 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'athlete', 'draft', 5, 3, 8, 4, 40,
  '{"dumbbells","pullup_bar","jump_rope","none","mat"}'::text[], '#1c2532', 4990, 49,
  '{"slug":{"ru":"atlet-prodvinutyj-domashnij-krossfit","en":"home-athlete"},"name":{"ru":"Форма атлета: продвинутый домашний кроссфит","en":"Forma. Athlete: advanced home CrossFit"},"tagline":{"ru":"Восемь недель продвинутого кроссфита дома: подтягивания, двойные прыжки, дьявольский жим, длинные AMRAP — и «Мёрф» в финале.","en":"Eight weeks of advanced CrossFit at home: pull-ups, double-unders, devil presses, long AMRAPs — and Murph at the end."},"description":{"ru":"Курс для тех, кто уже тренируется и хочет большего: четыре дня в неделю, гантели, турник и скакалка. Два силовых дня — присед и жим, тяга и подтягивания, — день «двигателя» с EMOM, AMRAP и табатой и день чипперов. Разгрузка в четвёртую неделю с «Синди» на 20 минут в её конце и половина «Мёрфа» в восьмую.","en":"For those who already train and want more: four days a week, dumbbells, a pull-up bar and a jump rope. Two strength days — squat & push, pull & hinge — an engine day with EMOMs, AMRAPs and Tabata, and a chipper day. A deload in week four with a 20-minute Cindy at its end, and Half Murph in week eight."},"longDescription":[{"ru":"Это третий уровень: курс для тех, кто отжимается двадцать пять раз подряд, держит планку две минуты и хотя бы раз висел на турнике с мыслью «а если подтянуться?». Восемь недель построены вокруг трёх навыков, которых нет в младших курсах: строгие подтягивания, двойные прыжки на скакалке и дьявольский жим. Каждый идёт по своей лестнице — негативные подтягивания превращаются в строгие по четыре, потом по шесть; синглы на скакалке — в серии двойных; бёрпи — в бёрпи с гантелями и махом над головой.","en":"This is level three: a course for someone who does twenty-five push-ups in a row, holds a plank for two minutes and has hung from a bar at least once thinking \"what if I pulled?\". Eight weeks are built around three skills the earlier courses do not have: strict pull-ups, double-unders and the devil press. Each climbs its own ladder — negative pull-ups become strict sets of four, then six; single-unders become sets of doubles; burpees become burpees with dumbbells and a swing overhead."},{"ru":"Неделя — четыре тренировки. День приседа и жима: фронтальный присед и швунг с тяжёлой парой, прыжковые выпады, отжимания, короткий AMRAP и кор. День тяги и подтягиваний: подтягивания в паре с подъёмами коленей в висе, становая и румынская тяга, тяга ренегата, прогулка фермера. День «двигателя»: EMOM-куплеты, AMRAP 15, табата, EMOM 16 из четырёх движений. И шестой день — чипперы и репетиции «Мёрфа». Между ними дни отдыха с целью 7000 шагов: в этом курсе они важны не меньше тренировок.","en":"A week is four sessions. Squat & push day: front squats and push presses with the heavy pair, jumping lunges, push-ups, a short AMRAP and core. Pull & hinge day: pull-ups paired with hanging knee raises, deadlifts and Romanian deadlifts, renegade rows, the farmer carry. Engine day: EMOM couplets, AMRAP 15, Tabata, a four-movement EMOM 16. And day six — chippers and Murph rehearsals. Between them, rest days with a 7,000-step goal: in this course they matter as much as the sessions."},{"ru":"Объём растёт волнами: недели 1–2 — база, 3 — тяжелее, 4 — разгрузка на треть с «Синди» в конце, 5–7 — пик: пять подходов, тяжёлая пара, EMOM 16 и репетиции «Мёрфа» на 5 и 8 кругов. Восьмая неделя лёгкая: техника, половина «Мёрфа» и тот же тест, что в первый день. Приложение подбирает повторения по входному тесту и твоей оценке усилия после каждой тренировки, а веса — по гантелям из профиля. Если движение пока недоступно — двойные без скакалки или подтягивания без турника, — оно подставит вариант проще.","en":"Volume rises in waves: weeks 1–2 are the base, week 3 is heavier, week 4 is a one-third deload with Cindy at its end, weeks 5–7 are the peak: five sets, the heavy pair, EMOM 16 and Murph rehearsals of 5 and 8 rounds. Week eight is light: technique, Half Murph and the same test as on day one. The app sets rep counts from the baseline test and your effort rating after every session, and weights from the dumbbells in your profile. If a movement is not available yet — double-unders without a rope or pull-ups without a bar — it substitutes an easier variant."},{"ru":"Два бенчмарка держат курс в тонусе. «Синди» — 20 минут AMRAP из 5 подтягиваний, 10 отжиманий и 15 приседаний — в конце четвёртой недели. Половина «Мёрфа» — бег, 50 подтягиваний, 100 отжиманий, 150 приседаний, бег, лимит 40 минут — в восьмую. К ней ты подойдёшь через три репетиции, зная свою разбивку и свой темп. А входной и повторный тест покажут, сколько отжиманий, приседаний и бёрпи прибавилось за два месяца.","en":"Two benchmarks keep the course honest. Cindy — a 20-minute AMRAP of 5 pull-ups, 10 push-ups and 15 squats — at the end of week four. Half Murph — run, 50 pull-ups, 100 push-ups, 150 squats, run, 40-minute cap — in week eight. You arrive at it after three rehearsals, knowing your partitioning and your pace. And the baseline and final tests show how many push-ups, squats and burpees two months added."}],"forWhom":[{"ru":"У тебя есть пара гантелей (лучше две пары или разборные), турник и скакалка.","en":"You own a pair of dumbbells (two pairs or adjustables are better), a pull-up bar and a jump rope."},{"ru":"Ты отжимаешься 20–25 раз подряд, держишь планку две минуты и висишь на турнике хотя бы 30 секунд — или прошёл «Своим весом» или «Гантели дома».","en":"You do 20–25 push-ups in a row, hold a plank for two minutes and can hang from the bar for at least 30 seconds — or you finished Bodyweight Engine or Dumbbell Builder."},{"ru":"Хочешь первое строгое подтягивание — или десятое — и серии двойных на скакалке.","en":"You want your first strict pull-up — or your tenth — and sets of double-unders."},{"ru":"Тебе нужен вызов с понятной целью: «Синди» и «Мёрф» на время.","en":"You want a challenge with a clear goal: Cindy and Murph on the clock."},{"ru":"Есть 35–45 минут четыре раза в неделю и готовность отдыхать в дни отдыха.","en":"You have 35–45 minutes four times a week and the discipline to rest on rest days."}],"outcomes":[{"ru":"Строгие подтягивания: от негативных к подходам по шесть — тридцать подтягиваний за тренировку к седьмой неделе.","en":"Strict pull-ups: from negatives to sets of six — thirty pull-ups in a session by week seven."},{"ru":"Двойные прыжки на скакалке сериями по 20–40 внутри метконов.","en":"Double-unders in sets of 20–40 inside metcons."},{"ru":"Дьявольский жим, рывок гантели, трастер и тяга ренегата — в силовых блоках и в EMOM.","en":"The devil press, dumbbell snatch, thruster and renegade row — in strength blocks and in EMOMs."},{"ru":"Результат в «Синди» (круги за 20 минут) и в половине «Мёрфа» (время при лимите 40 минут).","en":"A Cindy score (rounds in 20 minutes) and a Half Murph time (40-minute cap)."},{"ru":"Умение держать темп в длинных AMRAP и чипперах и разбивать большие числа на выполнимые серии.","en":"The skill of pacing long AMRAPs and chippers and breaking big numbers into doable sets."},{"ru":"Больше отжиманий, приседаний и бёрпи в повторном тесте — и привычка к четырём тренировкам в неделю с разгрузкой.","en":"More push-ups, squats and burpees in the retest — and a habit of four sessions a week with a built-in deload."}],"faq":[{"q":{"ru":"Какое оборудование нужно и можно ли без чего-то обойтись?","en":"What equipment do I need, and can I skip any of it?"},"a":{"ru":"Три вещи: пара гантелей (идеально две пары — лёгкая для рывков, трастеров и дьявольского жима, тяжёлая для приседа, становой и тяги), турник в дверном проёме или на стене и скакалка. Без турника курс теряет главное — подтягивания, — поэтому он обязателен. Без скакалки приложение заменит двойные прыжки на джампинг-джеки, но двойные — навык, который стоит освоить, а скакалка стоит недорого.","en":"Three things: a pair of dumbbells (ideally two pairs — a light one for snatches, thrusters and devil presses, a heavy one for squats, deadlifts and rows), a doorway or wall-mounted pull-up bar, and a jump rope. Without a bar the course loses its centrepiece — pull-ups — so it is mandatory. Without a rope the app swaps double-unders for jumping jacks, but doubles are a skill worth learning, and a rope costs very little."}},{"q":{"ru":"У меня нет ни одного строгого подтягивания. Мне рано?","en":"I don''t have a single strict pull-up yet. Is it too early?"},"a":{"ru":"Нет, если ты можешь висеть на турнике 30 секунд и медленно опускаться из верхней точки. Первые две недели курса — только негативные подтягивания, и именно так большинство людей получают первое строгое. С третьей недели в подходах появляются строгие, а рядом с каждым таким упражнением написано, как заменить: два строгих и два негативных, или негативные с прыжком в метконах. Если и вис пока даётся тяжело, начни с «Гантели дома» или «Своим весом» — там есть тяги и планки, которые готовят спину.","en":"Not if you can hang from the bar for 30 seconds and lower yourself slowly from the top. The first two weeks are negatives only, and that is how most people get their first strict rep. From week three strict reps appear in the sets, and every such exercise says how to scale: two strict plus two negatives, or jumping negatives in the metcons. If even the hang is hard for now, start with Dumbbell Builder or Bodyweight Engine — the rows and planks there prepare your back."}},{"q":{"ru":"Сколько длится тренировка?","en":"How long is a session?"},"a":{"ru":"В среднем 35–40 минут с разминкой и заминкой. Силовые дни — 40–48 минут (в пиковые недели ближе к 48), «двигатель» — около 30, чипперы и репетиции «Мёрфа» — 20–30. Два исключения — бенчмарки: «Синди» с разминкой занимает около 30 минут, половина «Мёрфа» — от 35 минут до часа, в зависимости от того, как ты разобьёшь повторения. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.","en":"Between 35 and 40 minutes on average with warm-up and cool-down. Strength days run 40–48 minutes (closer to 48 in the peak weeks), engine days about 30, chippers and Murph rehearsals 20–30. The two exceptions are the benchmarks: Cindy takes about 30 minutes with the warm-up, Half Murph anywhere from 35 minutes to an hour depending on how you partition the reps. Before you start, the app shows the estimated time for each of the three difficulty options."}},{"q":{"ru":"Пропустил тренировку или целую неделю — что делать?","en":"I missed a session or a whole week — what now?"},"a":{"ru":"Одну тренировку — просто продолжай со следующего узла: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках. Если выпала неделя перед «Мёрфом», сделай сначала репетицию — четверть «Мёрфа», — а бенчмарк через три-четыре дня после неё.","en":"One session — just continue from the next node: the path does not reset. Do not stack two strength days back to back to ''catch up'' — shift the week. After a break longer than two weeks, pick ''Easier'' for the first two sessions. If the missing week was the one before Murph, do a rehearsal first — Quarter Murph — and the benchmark three or four days later."}},{"q":{"ru":"Как приложение подбирает нагрузку?","en":"How does the app pick the load?"},"a":{"ru":"Повторения считаются по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — объём в следующий раз чуть растёт или снижается. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля. В разгрузочную неделю объём падает автоматически примерно на треть, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее». Двойные без скакалки и подтягивания без турника приложение заменит само, а вариант «нет строгих — негативные» ты выбираешь сам по подсказке рядом с упражнением.","en":"Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the volume nudges up or down next time. The labels ''light'', ''medium'' and ''heavy'' are mapped to the dumbbells in your profile. In the deload week volume drops by about a third automatically, and before every session you can choose Easier, As usual or Harder. Double-unders without a rope and pull-ups without a bar are substituted by the app; the ''no strict reps — do negatives'' option you choose yourself from the hint next to the exercise."}},{"q":{"ru":"Болят ладони и предплечья от турника. Это нормально?","en":"My palms and forearms hurt from the bar. Is that normal?"},"a":{"ru":"Усталость предплечий и мозоли в первые недели — норма: хват догоняет спину. Что помогает: не сжимать перекладину сильнее, чем нужно, спиливать огрубевшую кожу пемзой, чтобы мозоли не рвались, и не висеть лишнего вне плана. Острая боль в локте или плече — другое дело: отметь «Боль» в отчёте после тренировки, приложение снизит нагрузку, а подтягивания замени тягой гантели в наклоне до конца недели. Если боль держится больше недели — к врачу.","en":"Forearm fatigue and calluses in the first weeks are normal: your grip is catching up with your back. What helps: do not squeeze the bar harder than necessary, file down thick skin with a pumice stone so calluses do not tear, and do not hang extra outside the plan. Sharp pain in the elbow or shoulder is different: mark ''Pain'' in the post-workout feedback, the app reduces the load, and swap pull-ups for bent-over rows for the rest of the week. Pain that lasts more than a week means see a doctor."}}]}'::jsonb
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
values ('athlete_w_test', 'Тест: отжимания, присед, планка, бёрпи', 'Четыре теста с отдыхом по 90 секунд: отжимания за две минуты, приседания за минуту, планка на максимум и бёрпи за минуту. По ним приложение выставит стартовый объём курса, а в восьмую неделю ты повторишь тест и увидишь разницу в цифрах. Считаются только чистые повторения: грудь до пола, бедро ниже параллели, прыжок с хлопком.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Лёгкая разминка. Не утомляйся: силы нужны для теста.","descriptionEn":"A light warm-up. Do not tire yourself out: save your strength for the test.","scalable":false,"blockId":"test_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":45,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":3,"restAfterSec":0}]},{"kind":"main","blockType":"test","format":"sets","sets":1,"setsField":"sets","title":"Тест","titleEn":"Test","description":"Максимум повторений за отведённое время, отдых 90 секунд между тестами. Останавливайся, как только ломается техника.","descriptionEn":"Max reps in the given time, 90 seconds of rest between tests. Stop as soon as your form breaks.","scalable":false,"blockId":"test_main","items":[{"exerciseId":"push_up","unit":"seconds","target":120,"restAfterSec":90,"note":"Максимум за 2 минуты. Грудь касается пола, локти выпрямляются полностью. Отдыхать можно в верхней точке.","noteEn":"Max reps in 2 minutes. Chest to the floor, elbows fully locked at the top. Rest at the top if you need to."},{"exerciseId":"air_squat","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.","noteEn":"Max reps in one minute. Hips below parallel, full extension at the top."},{"exerciseId":"plank","unit":"seconds","target":300,"restAfterSec":90,"note":"Держи, пока не провиснет поясница. Лимит — 5 минут.","noteEn":"Hold until your lower back starts to sag. Five-minute limit."},{"exerciseId":"burpee","unit":"seconds","target":60,"restAfterSec":90,"note":"Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.","noteEn":"Max reps in one minute: chest to the floor, jump and clap at the top."}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"test_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 80)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_squat_push_a', 'Присед и жим A', 'Первый силовой день. Четыре подхода по кругу: фронтальный присед с тяжёлой парой, швунг, прыжковые выпады и узкие отжимания. Задача первых двух недель — найти веса, с которыми последние два повторения даются с усилием, но чисто. После силы — семь минут AMRAP из отжиманий и двойных прыжков, потом кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Скакалка лёгкая, на носках; в приседе-разгибании прожми колени наружу и раскрой грудь.","descriptionEn":"Two rounds. Easy rope on the toes; in the squat-to-stand push the knees out and open the chest.","scalable":false,"blockId":"spa_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Сила","titleEn":"Strength","description":"Четыре подхода по кругу: присед → швунг → прыжковые выпады → узкие отжимания. 20 секунд между упражнениями, 90 между подходами. Темп в приседе: две секунды вниз, взрыв вверх.","descriptionEn":"Four sets in rotation: squat → push press → jumping lunges → diamond push-ups. Twenty seconds between exercises, 90 between sets. Squat tempo: two seconds down, explode up.","scalable":true,"blockId":"spa_strength","items":[{"exerciseId":"db_front_squat","unit":"reps","target":8,"restAfterSec":20,"note":"Гантели на плечах, локти вперёд, бедро ниже параллели","noteEn":"Dumbbells on the shoulders, elbows forward, hips below parallel","load":"heavy"},{"exerciseId":"db_push_press","unit":"reps","target":8,"restAfterSec":20,"note":"Короткий подсед — и гантели летят вверх за счёт ног","noteEn":"A short dip, then the legs launch the dumbbells","load":"medium"},{"exerciseId":"jumping_lunge","unit":"reps","target":16,"restAfterSec":20,"note":"По 8 на ногу, заднее колено мягко касается пола","noteEn":"8 per leg, the back knee kisses the floor"},{"exerciseId":"diamond_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Ладони под грудью, локти вдоль корпуса","noteEn":"Hands under the chest, elbows along the body"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":420,"title":"AMRAP 7 мин","titleEn":"AMRAP 7 min","description":"Максимум кругов за 7 минут: 10 отжиманий, 30 двойных. Отжимания без остановки, скакалку — сериями, которые не рвутся.","descriptionEn":"As many rounds as possible in 7 minutes: 10 push-ups, 30 double-unders. Push-ups unbroken, the rope in sets you do not trip on.","scalable":true,"blockId":"spa_amrap","items":[{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":30,"restAfterSec":0,"note":"Нет дабл-андеров — 60 синглов","noteEn":"No double-unders yet? 60 singles"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spa_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_squat_push_b', 'Присед и жим B', 'Пять подходов вместо четырёх, вес тяжелее, повторений меньше: фронтальный присед и швунг по шесть, прыжковые выпады по двадцать, отжимания уголком для плеч. AMRAP восемь минут — трастеры, отжимания, скакалка — связывает силу с дыханием. Кор — лодочка, складка, касания плеч.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Скакалка лёгкая, на носках; в приседе-разгибании прожми колени наружу и раскрой грудь.","descriptionEn":"Two rounds. Easy rope on the toes; in the squat-to-stand push the knees out and open the chest.","scalable":false,"blockId":"spb_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Сила","titleEn":"Strength","description":"Пять подходов по кругу: присед → швунг → прыжковые выпады → отжимания уголком. 20 секунд между упражнениями, 90 между подходами. Если шесть приседов даются легко — в следующий раз вес тяжелее.","descriptionEn":"Five sets in rotation: squat → push press → jumping lunges → pike push-ups. Twenty seconds between exercises, 90 between sets. If six squats feel easy, go heavier next time.","scalable":true,"blockId":"spb_strength","items":[{"exerciseId":"db_front_squat","unit":"reps","target":6,"restAfterSec":20,"note":"Ниже параллели, локти не падают","noteEn":"Below parallel, elbows stay up","load":"heavy"},{"exerciseId":"db_push_press","unit":"reps","target":6,"restAfterSec":20,"note":"Тяжёлая пара: локти выпрямляются полностью над головой","noteEn":"The heavy pair: elbows fully locked overhead","load":"heavy"},{"exerciseId":"jumping_lunge","unit":"reps","target":20,"restAfterSec":20,"note":"По 10 на ногу, приземляйся мягко","noteEn":"10 per leg, land softly"},{"exerciseId":"pike_push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Таз высоко, макушка к полу между ладонями","noteEn":"Hips high, crown of the head to the floor between the hands"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":480,"title":"AMRAP 8 мин","titleEn":"AMRAP 8 min","description":"Максимум кругов за 8 минут: 6 трастеров, 8 отжиманий, 40 двойных. Лёгкая пара — трастеры без остановки.","descriptionEn":"As many rounds as possible in 8 minutes: 6 thrusters, 8 push-ups, 40 double-unders. Light pair — thrusters unbroken.","scalable":true,"blockId":"spb_amrap","items":[{"exerciseId":"db_thruster","unit":"reps","target":6,"restAfterSec":0,"note":"Из приседа сразу в жим, одним движением","noteEn":"Straight from the squat into the press, one movement","load":"light"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":40,"restAfterSec":0,"note":"Или 80 синглов","noteEn":"Or 80 singles"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spb_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_squat_push_c', 'Присед и жим C', 'Пик силового дня, недели с пятой по седьмую: пять подходов по восемь с тяжёлой парой в приседе и швунге, 24 прыжковых выпада, 12 узких отжиманий. Потом десять минут AMRAP — дьявольский жим, отжимания, приседания, скакалка — это объём, из которого сложится «Мёрф». Кор — лодочка и складка.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Скакалка лёгкая, на носках; в приседе-разгибании прожми колени наружу и раскрой грудь.","descriptionEn":"Two rounds. Easy rope on the toes; in the squat-to-stand push the knees out and open the chest.","scalable":false,"blockId":"spc_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":2,"perSide":true,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Сила","titleEn":"Strength","description":"Пять подходов по кругу: присед → швунг → прыжковые выпады → узкие отжимания. 20 секунд между упражнениями, 75 между подходами. Вес тяжёлый, техника не ломается: если два последних повторения не идут чисто — уменьши вес, а не глубину.","descriptionEn":"Five sets in rotation: squat → push press → jumping lunges → diamond push-ups. Twenty seconds between exercises, 75 between sets. Heavy weight, form holds: if the last two reps are not clean, drop the weight, not the depth.","scalable":true,"blockId":"spc_strength","items":[{"exerciseId":"db_front_squat","unit":"reps","target":8,"restAfterSec":20,"load":"heavy"},{"exerciseId":"db_push_press","unit":"reps","target":8,"restAfterSec":20,"note":"Гантели над макушкой, локти выпрямлены полностью","noteEn":"Dumbbells over the crown of the head, elbows fully locked","load":"heavy"},{"exerciseId":"jumping_lunge","unit":"reps","target":24,"restAfterSec":20,"note":"По 12 на ногу","noteEn":"12 per leg"},{"exerciseId":"diamond_push_up","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":600,"title":"AMRAP 10 мин","titleEn":"AMRAP 10 min","description":"Максимум кругов за 10 минут: 4 дьявольских жима, 10 отжиманий, 15 приседаний, 30 двойных. Ровный темп: это репетиция «Мёрфа», а не спринт.","descriptionEn":"As many rounds as possible in 10 minutes: 4 devil presses, 10 push-ups, 15 air squats, 30 double-unders. Even pace: it is a Murph rehearsal, not a sprint.","scalable":true,"blockId":"spc_amrap","items":[{"exerciseId":"db_devil_press","unit":"reps","target":4,"restAfterSec":0,"note":"Не идёт — бёрпи + взятие двух гантелей на плечи","noteEn":"Too hard? Burpee + a two-dumbbell clean to the shoulders","load":"light"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":30,"restAfterSec":0,"note":"Или 60 синглов","noteEn":"Or 60 singles"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"spc_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_pull_hinge_a', 'Тяга и подтягивания A', 'День спины и задней цепи. Сначала подтягивания: четыре подхода негативных — прыгни или залезь в верхнюю точку и опускайся пять секунд; уже есть строгие — делай строгие, а негативными добивай подход. В паре с ними подъёмы коленей в висе. Потом тяга: румынская с тяжёлой парой, тяга ренегата, румынская на одной ноге. Кор — лодочка, боковая планка, супермен.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину, таз и заднюю поверхность бедра — сегодня они главные.","descriptionEn":"Two unhurried rounds. Wake up the spine, hips and hamstrings — they are in charge today.","scalable":false,"blockId":"pha_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Подтягивания","titleEn":"Pull-ups","description":"Четыре подхода: негативные → подъём коленей. 20 секунд между упражнениями, 90 между подходами. Пять секунд вниз — это правда пять секунд, считай вслух.","descriptionEn":"Four sets: negatives → knee raises. Twenty seconds between exercises, 90 between sets. Five seconds down means five real seconds — count out loud.","scalable":true,"blockId":"pha_pull","items":[{"exerciseId":"negative_pull_up","unit":"reps","target":5,"restAfterSec":20,"note":"Есть строгие — 3 строгих + 2 негативных","noteEn":"Got strict reps? 3 strict + 2 negatives"},{"exerciseId":"hanging_knee_raise","unit":"reps","target":10,"restAfterSec":0,"note":"Колени к груди, без раскачки","noteEn":"Knees to the chest, no swinging"}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Тяга","titleEn":"Hinge","description":"Четыре подхода по кругу: румынская тяга → тяга ренегата → румынская на одной ноге. 20 секунд между упражнениями, 75 между подходами. Спина плоская всё время, движение начинается с таза.","descriptionEn":"Four sets in rotation: Romanian deadlift → renegade row → single-leg RDL. Twenty seconds between exercises, 75 between sets. Back flat throughout, the movement starts from the hips.","scalable":true,"blockId":"pha_hinge","items":[{"exerciseId":"db_rdl","unit":"reps","target":10,"restAfterSec":20,"note":"Колени мягкие, гантели скользят по бёдрам до середины голени","noteEn":"Soft knees, dumbbells slide down the thighs to mid-shin","load":"heavy"},{"exerciseId":"db_renegade_row","unit":"reps","target":12,"restAfterSec":20,"note":"По 6 на руку, ноги шире плеч, таз не крутится","noteEn":"6 per arm, feet wide, hips square","load":"medium"},{"exerciseId":"single_leg_rdl","unit":"reps","target":8,"perSide":true,"restAfterSec":0,"note":"Без веса или с лёгкой гантелью в противоположной руке","noteEn":"Bodyweight or a light dumbbell in the opposite hand"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Вис на турнике здесь — не работа, а вытяжение: расслабь плечи, дыши животом. Потом длинный выдох в каждой позе.","descriptionEn":"The hang here is not work but decompression: relax the shoulders, breathe into the belly. Then a long exhale in every position.","scalable":false,"blockId":"pha_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"dead_hang","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_pull_hinge_b', 'Тяга и подтягивания B', 'Подтягивания становятся строгими: пять подходов по четыре. Нет четырёх — два строгих и два негативных, но каждый подход начинай со строгих. Становая с тяжёлой парой, тяга ренегата по восемь на руку, румынская средним весом. Кор — лодочка, складка, боковая планка.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину, таз и заднюю поверхность бедра — сегодня они главные.","descriptionEn":"Two unhurried rounds. Wake up the spine, hips and hamstrings — they are in charge today.","scalable":false,"blockId":"phb_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Подтягивания","titleEn":"Pull-ups","description":"Пять подходов: строгие подтягивания → подъём коленей. Из полного виса до подбородка над перекладиной, без раскачки. 90 секунд между подходами — используй их все.","descriptionEn":"Five sets: strict pull-ups → knee raises. From a dead hang to chin over the bar, no kipping. Ninety seconds between sets — use all of them.","scalable":true,"blockId":"phb_pull","items":[{"exerciseId":"pull_up","unit":"reps","target":4,"restAfterSec":20,"note":"Нет четырёх — 2 строгих + 2 негативных по 5 секунд","noteEn":"No four yet? 2 strict + 2 five-second negatives"},{"exerciseId":"hanging_knee_raise","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Тяга","titleEn":"Hinge","description":"Четыре подхода по кругу: становая → тяга ренегата → румынская тяга. 20 секунд между упражнениями, 90 между подходами. В тяге ренегата не крути корпус — тянет спина, а не поясница.","descriptionEn":"Four sets in rotation: deadlift → renegade row → Romanian deadlift. Twenty seconds between exercises, 90 between sets. Do not twist in the renegade row — the back pulls, not the lower back.","scalable":true,"blockId":"phb_hinge","items":[{"exerciseId":"db_deadlift","unit":"reps","target":10,"restAfterSec":20,"note":"Гантели вдоль голеней, вставай через пятки","noteEn":"Dumbbells along the shins, drive up through the heels","load":"heavy"},{"exerciseId":"db_renegade_row","unit":"reps","target":16,"restAfterSec":20,"note":"По 8 на руку","noteEn":"8 per arm","load":"medium"},{"exerciseId":"db_rdl","unit":"reps","target":10,"restAfterSec":0,"note":"Три секунды вниз","noteEn":"Three seconds down","load":"medium"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Вис на турнике здесь — не работа, а вытяжение: расслабь плечи, дыши животом. Потом длинный выдох в каждой позе.","descriptionEn":"The hang here is not work but decompression: relax the shoulders, breathe into the belly. Then a long exhale in every position.","scalable":false,"blockId":"phb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"dead_hang","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_pull_hinge_c', 'Тяга и подтягивания C', 'Самый объёмный день спины: пять подходов подтягиваний по шесть — тридцать за тренировку, половина того, что ждёт тебя в «Мёрфе». Становая с тяжёлой парой по восемь, тяга ренегата тяжёлой парой, 45 секунд прогулки фермера в каждом подходе. Кор — лодочка, складка, боковая планка. После этого дня — отдых, и он в плане.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину, таз и заднюю поверхность бедра — сегодня они главные.","descriptionEn":"Two unhurried rounds. Wake up the spine, hips and hamstrings — they are in charge today.","scalable":false,"blockId":"phc_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":90,"title":"Подтягивания","titleEn":"Pull-ups","description":"Пять подходов: подтягивания → подъём коленей. Если шестое подтягивание не идёт чисто — четыре строгих и два негативных, но не сокращай число подходов.","descriptionEn":"Five sets: pull-ups → knee raises. If the sixth rep is not clean — four strict and two negatives, but do not cut the number of sets.","scalable":true,"blockId":"phc_pull","items":[{"exerciseId":"pull_up","unit":"reps","target":6,"restAfterSec":20,"note":"Не идут шесть — 4 строгих + 2 негативных","noteEn":"Six not there yet? 4 strict + 2 negatives"},{"exerciseId":"hanging_knee_raise","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":4,"setsField":"sets","restBetweenSetsSec":75,"title":"Тяга и хват","titleEn":"Hinge & grip","description":"Четыре подхода по кругу: становая → тяга ренегата → прогулка фермера. 20 секунд между упражнениями, 75 между подходами. Прогулка с тяжёлой парой: если гантели тянут плечи вперёд — вес правильный, просто не давай им это сделать.","descriptionEn":"Four sets in rotation: deadlift → renegade row → farmer carry. Twenty seconds between exercises, 75 between sets. Carry the heavy pair: if the dumbbells try to pull your shoulders forward, the weight is right — just do not let them.","scalable":true,"blockId":"phc_hinge","items":[{"exerciseId":"db_deadlift","unit":"reps","target":8,"restAfterSec":20,"load":"heavy"},{"exerciseId":"db_renegade_row","unit":"reps","target":16,"restAfterSec":20,"note":"По 8 на руку. Гантель тянется к бедру, локоть вдоль корпуса","noteEn":"8 per arm. Pull the dumbbell to the hip, elbow along the body","load":"heavy"},{"exerciseId":"farmer_carry","unit":"seconds","target":45,"restAfterSec":0,"note":"Плечи назад и вниз, шагай по комнате туда и обратно","noteEn":"Shoulders back and down, walk the room back and forth","load":"heavy"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Вис на турнике здесь — не работа, а вытяжение: расслабь плечи, дыши животом. Потом длинный выдох в каждой позе.","descriptionEn":"The hang here is not work but decompression: relax the shoulders, breathe into the belly. Then a long exhale in every position.","scalable":false,"blockId":"phc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"dead_hang","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_engine_emom12', 'Двигатель: EMOM 12', 'Первый день выносливости. Короткий блок техники — рывок гантели и дьявольский жим, два движения, на которых держатся метконы этого курса. Потом EMOM 12: нечётная минута — десять рывков, чётная — восемь бёрпи. Сделал — отдыхай до конца минуты. Если работа занимает больше 40 секунд, убавь два повторения в следующем круге. В конце — кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ee_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":30,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Техника: рывок и дьявольский жим","titleEn":"Skill: the snatch and the devil press","description":"Два круга с лёгкой парой. Рывок: ноги толкают, рука — верёвка, гантель летит вдоль тела и фиксируется над головой. Дьявольский жим: грудь к полу между гантелями, встал — и мах обеих над головой с прямой спиной.","descriptionEn":"Two rounds with the light pair. Snatch: the legs push, the arm is a rope, the dumbbell travels close to the body and locks out overhead. Devil press: chest to the floor between the dumbbells, stand up, then swing both overhead with a flat back.","scalable":true,"blockId":"ee_skill","items":[{"exerciseId":"db_snatch","unit":"reps","target":6,"restAfterSec":0,"note":"По 3 на руку, медленно, с паузой над коленом","noteEn":"3 per arm, slowly, with a pause above the knee","load":"light"},{"exerciseId":"db_devil_press","unit":"reps","target":3,"restAfterSec":0,"note":"Бёрпи на гантели, потом обе гантели махом над головой","noteEn":"Burpee onto the dumbbells, then swing both overhead","load":"light"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":12,"setsField":"rounds","title":"EMOM 12 мин","titleEn":"EMOM 12 min","description":"Минута 1 — рывки, минута 2 — бёрпи, и так шесть раз. Цель — заканчивать работу на 35–40-й секунде каждой минуты.","descriptionEn":"Minute 1 snatches, minute 2 burpees, six times over. The goal is to finish the work by second 35–40 of every minute.","scalable":true,"blockId":"ee_emom","items":[{"exerciseId":"db_snatch","unit":"reps","target":10,"restAfterSec":0,"note":"По 5 на руку, меняй руку внизу","noteEn":"5 per arm, switch hands at the bottom","load":"medium"},{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга. В ножницах поясница на полу, ноги низко, пятки не касаются пола.","descriptionEn":"Two rounds. In the flutter kicks the lower back stays down, legs low, heels never touch the floor.","scalable":true,"blockId":"ee_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"flutter_kick","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ee_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_engine_amrap15', 'Двигатель: AMRAP 15', 'Круг «Синди» — 5 подтягиваний, 10 отжиманий, 15 приседаний — плюс 30 двойных прыжков, пятнадцать минут. Перед стартом блок скакалки: двойные нужно тренировать на свежих ногах. В первый раз, во вторую неделю, просто найди темп и запиши круги; во второй, в шестую, побей это число.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ea_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":30,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":30,"title":"Скакалка: двойные","titleEn":"Rope: double-unders","description":"Три круга. Прыжок чуть выше обычного, скакалку крутят кисти, локти у корпуса. Запутался — не злись, просто начни серию заново.","descriptionEn":"Three rounds. Jump a little higher than usual, the wrists turn the rope, elbows close to the body. Tripped? Do not get angry, just restart the set.","scalable":true,"blockId":"ea_skill","items":[{"exerciseId":"single_under","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":10,"restAfterSec":0,"note":"Учишь дабл — чередуй: сингл, дабл, сингл. Ещё нет — 20 быстрых синглов","noteEn":"Learning? Alternate single, double, single. Not there yet? 20 fast singles"}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":900,"title":"AMRAP 15 мин","titleEn":"AMRAP 15 min","description":"Максимум кругов за 15 минут. Первые пять минут — на 80 %. Подтягивания сериями, которые не разваливаются; отжимания 5 + 5 раньше, чем откажут руки.","descriptionEn":"As many rounds as possible in 15 minutes. The first five minutes at 80%. Pull-ups in sets that hold together; push-ups 5 + 5 before your arms give out.","scalable":true,"blockId":"ea_amrap","items":[{"exerciseId":"pull_up","unit":"reps","target":5,"restAfterSec":0,"note":"Нет строгих — 5 негативных: прыжок вверх, медленно вниз","noteEn":"No strict pull-ups? 5 negatives: jump up, lower slowly"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":30,"restAfterSec":0,"note":"Или 60 синглов","noteEn":"Or 60 singles"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ea_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_engine_tabata', 'Двигатель: табата', 'Три табаты по четыре минуты — 20 секунд работы, 10 отдыха, восемь раундов — с минутой между ними: двойные прыжки, бёрпи, приседания с выпрыгиванием. Перед стартом короткий блок скакалки. Число рядом с упражнением — цель на один раунд; держи его во всех восьми, а не только в первых трёх. Потом кор.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"et_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":30,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":30,"title":"Скакалка: двойные","titleEn":"Rope: double-unders","description":"Два круга. Синглы — ритм, двойные — сериями, сколько получается без ошибки.","descriptionEn":"Two rounds. Singles for rhythm, doubles in sets as long as you can go without a miss.","scalable":true,"blockId":"et_skill","items":[{"exerciseId":"single_under","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"double_under","unit":"reps","target":15,"restAfterSec":0,"note":"Ещё нет — сингл, дабл, сингл или 30 быстрых синглов","noteEn":"Not there yet? Single, double, single — or 30 fast singles"}]},{"kind":"main","blockType":"metcon","format":"tabata","sets":8,"setsField":"rounds","workSec":20,"restSec":10,"restBetweenRoundsSec":60,"title":"3 табаты 20/10","titleEn":"3 Tabatas 20/10","description":"Восемь раундов скакалки, минута отдыха, восемь раундов бёрпи, минута, восемь раундов выпрыгиваний. В последних раундах делай, сколько успеваешь, не теряя техники.","descriptionEn":"Eight rounds of rope, a minute of rest, eight rounds of burpees, a minute, eight rounds of jump squats. In the last rounds do what you can without losing form.","scalable":true,"blockId":"et_tabata","items":[{"exerciseId":"double_under","unit":"reps","target":15,"restAfterSec":0,"note":"Или 30 синглов","noteEn":"Or 30 singles"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"jump_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Приземляйся мягко, в полный присед","noteEn":"Land softly, into a full squat"}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга. В русском твисте пятки на полу или на весу — как держишь спину прямой.","descriptionEn":"Two rounds. In the Russian twist keep the heels down or up — whichever keeps your back straight.","scalable":true,"blockId":"et_core","items":[{"exerciseId":"v_up","unit":"reps","target":12,"restAfterSec":0},{"exerciseId":"russian_twist","unit":"reps","target":20,"restAfterSec":0},{"exerciseId":"flutter_kick","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"et_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 100)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_engine_emom16', 'Двигатель: EMOM 16', 'Шестнадцать минут, четыре движения по кругу: дьявольский жим, двойные прыжки, подтягивания, бёрпи — четыре цикла. Каждое должно занимать 30–40 секунд, остаток минуты — отдых. Это самый плотный «двигатель» курса: если к третьему циклу не укладываешься, убирай по одному повторению, а не пропускай минуты. Кор — лодочка и подъёмы коленей в висе.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга, второй быстрее первого: пульс должен подняться до старта таймера.","descriptionEn":"Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.","scalable":false,"blockId":"ee16_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":30,"restAfterSec":0},{"exerciseId":"high_knees","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":30,"title":"Техника: скакалка и дьявольский жим","titleEn":"Skill: rope and devil press","description":"Два круга с лёгкой парой. Двойные — сериями; дьявольский жим — медленно, с полной фиксацией над головой.","descriptionEn":"Two rounds with the light pair. Doubles in sets; the devil press slowly, with a full lockout overhead.","scalable":true,"blockId":"ee16_skill","items":[{"exerciseId":"double_under","unit":"reps","target":20,"restAfterSec":0,"note":"Или 40 синглов","noteEn":"Or 40 singles"},{"exerciseId":"db_devil_press","unit":"reps","target":3,"restAfterSec":0,"load":"light"}]},{"kind":"main","blockType":"metcon","format":"emom","sets":16,"setsField":"rounds","title":"EMOM 16 мин","titleEn":"EMOM 16 min","description":"Минута 1 — дьявольский жим, 2 — скакалка, 3 — подтягивания, 4 — бёрпи, четыре круга. Дыши ровно в отдыхе: три-четыре глубоких выдоха до следующего сигнала.","descriptionEn":"Minute 1 devil presses, 2 rope, 3 pull-ups, 4 burpees, four cycles. Breathe evenly in the rest: three or four deep exhales before the next beep.","scalable":true,"blockId":"ee16_emom","items":[{"exerciseId":"db_devil_press","unit":"reps","target":5,"restAfterSec":0,"note":"Не идёт — 5 бёрпи + взятие двух гантелей","noteEn":"Too hard? 5 burpees + a two-dumbbell clean","load":"medium"},{"exerciseId":"double_under","unit":"reps","target":30,"restAfterSec":0,"note":"Или 60 синглов","noteEn":"Or 60 singles"},{"exerciseId":"pull_up","unit":"reps","target":5,"restAfterSec":0,"note":"Нет строгих — 5 негативных","noteEn":"No strict pull-ups? 5 negatives"},{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два круга. После EMOM хват устал — в подъёмах коленей держи перекладину спокойно, без сжатия до белых пальцев.","descriptionEn":"Two rounds. Your grip is tired after the EMOM — hold the bar calmly in the knee raises, no white-knuckle squeeze.","scalable":true,"blockId":"ee16_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":40,"restAfterSec":0},{"exerciseId":"hanging_knee_raise","unit":"reps","target":12,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"ee16_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_chipper_a', 'Чиппер 60-50-40-30-20-10', 'Чиппер — список движений, который ты «откусываешь» по кусочку: 60 двойных прыжков, 50 приседаний, 40 отжиманий, 30 рывков гантели, 20 складок, 10 дьявольских жимов. Один проход, лимит 15 минут. Порядок такой специально: сначала ноги, потом руки, потом всё вместе. Стратегия — короткие серии с короткими паузами, а не одна большая серия и минута стояния.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"cha_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":900,"title":"На время, лимит 15 мин","titleEn":"For time, 15-min cap","description":"Один проход сверху вниз. Засеки и запиши время: чипперы ещё вернутся.","descriptionEn":"One pass from the top down. Time it and write it down: the chippers will be back.","scalable":true,"blockId":"cha_fortime","items":[{"exerciseId":"double_under","unit":"reps","target":60,"restAfterSec":0,"note":"Или 120 синглов","noteEn":"Or 120 singles"},{"exerciseId":"air_squat","unit":"reps","target":50,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":40,"restAfterSec":0,"note":"Разбивай 10 + 10 + 10 + 10","noteEn":"Split 10 + 10 + 10 + 10"},{"exerciseId":"db_snatch","unit":"reps","target":30,"restAfterSec":0,"note":"По 15 на руку, меняй каждые 5","noteEn":"15 per arm, switch every 5","load":"light"},{"exerciseId":"v_up","unit":"reps","target":20,"restAfterSec":0,"note":"Или ситапы с прямыми руками","noteEn":"Or sit-ups with straight arms overhead"},{"exerciseId":"db_devil_press","unit":"reps","target":10,"restAfterSec":0,"note":"Не идёт — бёрпи + взятие двух гантелей","noteEn":"Too hard? Burpee + a two-dumbbell clean","load":"light"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"cha_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_chipper_b', 'Чиппер: 4 круга', 'Четыре круга на время, лимит 20 минут: 8 подтягиваний, 12 трастеров, 20 прыжковых выпадов, 40 двойных, 8 бёрпи. Пять движений, ни одного «лёгкого» — это репетиция того, как тело ведёт себя на пятнадцатой минуте под нагрузкой. Лёгкая пара в трастерах; подтягивания разбивай 4 + 4 с первого круга, а не когда придётся.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"chb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":4,"setsField":"sets","rounds":4,"durationSec":1200,"title":"4 круга на время","titleEn":"4 rounds for time","description":"Лимит 20 минут. Между кругами не садись: пройди три шага, выдохни и начинай следующий.","descriptionEn":"20-minute cap. Do not sit down between rounds: take three steps, exhale and start the next one.","scalable":true,"blockId":"chb_fortime","items":[{"exerciseId":"pull_up","unit":"reps","target":8,"restAfterSec":0,"note":"Нет строгих — негативные, по 5 в круге","noteEn":"No strict pull-ups? Negatives, 5 per round"},{"exerciseId":"db_thruster","unit":"reps","target":12,"restAfterSec":0,"note":"Лёгкая пара, без остановки","noteEn":"Light pair, unbroken","load":"light"},{"exerciseId":"jumping_lunge","unit":"reps","target":20,"restAfterSec":0,"note":"По 10 на ногу","noteEn":"10 per leg"},{"exerciseId":"double_under","unit":"reps","target":40,"restAfterSec":0,"note":"Или 80 синглов","noteEn":"Or 80 singles"},{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.","descriptionEn":"Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.","scalable":false,"blockId":"chb_cooldown","items":[{"exerciseId":"squat_hold","unit":"seconds","target":30,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_murph_prep_a', 'Четверть Мёрфа', 'Первая репетиция главного бенчмарка курса: две минуты бега на месте, 25 подтягиваний, 50 отжиманий, 75 приседаний и снова две минуты бега — четверть настоящего «Мёрфа». Лимит 20 минут. Среднюю часть разбей на пять кругов по 5-10-15: так ты никогда не упрёшься в отказ. Запиши время: в седьмую неделю ты сделаешь эту же тренировку и сравнишь.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"mpa_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":1200,"title":"На время, лимит 20 мин","titleEn":"For time, 20-min cap","description":"Бег → 5 кругов «Синди» → бег. Круги делай подряд, без пауз между движениями дольше трёх вдохов.","descriptionEn":"Run → 5 Cindy rounds → run. Do the rounds back to back, no break between movements longer than three breaths.","scalable":true,"blockId":"mpa_fortime","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":120,"restAfterSec":0,"note":"Бег на месте: колени выше, темп разговорный","noteEn":"Jog in place: knees up, a talking pace"},{"exerciseId":"pull_up","unit":"reps","target":25,"restAfterSec":0,"note":"5 кругов по 5. Нет строгих — негативные с прыжком","noteEn":"5 rounds of 5. No strict pull-ups? Jumping negatives"},{"exerciseId":"push_up","unit":"reps","target":50,"restAfterSec":0,"note":"По 10 в круге","noteEn":"10 per round"},{"exerciseId":"air_squat","unit":"reps","target":75,"restAfterSec":0,"note":"По 15 в круге","noteEn":"15 per round"},{"exerciseId":"jog_in_place","unit":"seconds","target":120,"restAfterSec":0,"note":"Второй бег — на уставших ногах, но темп тот же","noteEn":"The second run is on tired legs, but the pace is the same"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"mpa_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_murph_prep_b', 'Репетиция Мёрфа', 'Генеральная репетиция: две с половиной минуты бега, 40 подтягиваний, 80 отжиманий, 120 приседаний, две с половиной минуты бега — восемь кругов по 5-10-15 внутри, лимит 30 минут. Это 80 % финального бенчмарка, и главное здесь — темп: круг за две-две с половиной минуты, без рывка в начале. Найди схему разбивки, которая работает, — с ней и пойдёшь на «Мёрф» через две недели.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"mpb_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":1800,"title":"На время, лимит 30 мин","titleEn":"For time, 30-min cap","description":"Бег → 8 кругов «Синди» → бег. Отжимания разбивай 5 + 5 уже с третьего круга: экономь руки для последних кругов.","descriptionEn":"Run → 8 Cindy rounds → run. Split the push-ups 5 + 5 from round three on: save your arms for the last rounds.","scalable":true,"blockId":"mpb_fortime","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":150,"restAfterSec":0},{"exerciseId":"pull_up","unit":"reps","target":40,"restAfterSec":0,"note":"8 кругов по 5. Нет строгих — негативные с прыжком","noteEn":"8 rounds of 5. No strict pull-ups? Jumping negatives"},{"exerciseId":"push_up","unit":"reps","target":80,"restAfterSec":0,"note":"По 10 в круге","noteEn":"10 per round"},{"exerciseId":"air_squat","unit":"reps","target":120,"restAfterSec":0,"note":"По 15 в круге","noteEn":"15 per round"},{"exerciseId":"jog_in_place","unit":"seconds","target":150,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Сегодня растяжка длиннее обычного. Не торопись: это часть тренировки, а не довесок к ней.","descriptionEn":"The stretch is longer than usual today. Take your time: it is part of the session, not an add-on.","scalable":false,"blockId":"mpb_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 130)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_skill_flow', 'Лёгкий день: техника', 'Лёгкий день, пульс низкий. Три круга: двойные прыжки сериями, три медленных негативных (или три строгих с паузой наверху), гоблет-присед с паузой внизу, медвежья походка и удержание в приседе. Потом спокойный кор и длинная растяжка. В разгрузочную неделю это день, когда тело догоняет нагрузку; в восьмую — последняя тренировка перед «Мёрфом», и цель у неё одна: прийти на бенчмарк свежим.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга без спешки. Разбуди спину, таз и заднюю поверхность бедра — сегодня они главные.","descriptionEn":"Two unhurried rounds. Wake up the spine, hips and hamstrings — they are in charge today.","scalable":false,"blockId":"sf_warmup","items":[{"exerciseId":"single_under","unit":"reps","target":40,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":8,"perSide":true,"restAfterSec":0},{"exerciseId":"inchworm","unit":"reps","target":4,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":60,"title":"Техника","titleEn":"Technique","description":"Три круга в темпе разговора. Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке, лёгкий вес.","descriptionEn":"Three rounds at a talking pace. Treat every rep as a demo: full range, a pause at the end point, light weight.","scalable":true,"blockId":"sf_skill","items":[{"exerciseId":"double_under","unit":"reps","target":20,"restAfterSec":0,"note":"Сериями по 5–10, без спешки. Нет — 40 синглов","noteEn":"Sets of 5–10, unhurried. Not there yet? 40 singles"},{"exerciseId":"negative_pull_up","unit":"reps","target":3,"restAfterSec":0,"note":"Пять секунд вниз. Есть строгие — 3 строгих с паузой наверху","noteEn":"Five seconds down. Got strict reps? 3 strict with a pause at the top"},{"exerciseId":"db_goblet_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пауза две секунды внизу","noteEn":"Two-second pause at the bottom","load":"light"},{"exerciseId":"bear_crawl","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"squat_hold","unit":"seconds","target":20,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","description":"Два спокойных круга. Дыши ровно, движения медленные.","descriptionEn":"Two calm rounds. Breathe evenly, move slowly.","scalable":true,"blockId":"sf_core","items":[{"exerciseId":"bird_dog","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"dead_bug","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"hollow_hold","unit":"seconds","target":20,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Сегодня растяжка длиннее обычного. Не торопись: это часть тренировки, а не довесок к ней.","descriptionEn":"The stretch is longer than usual today. Take your time: it is part of the session, not an add-on.","scalable":false,"blockId":"sf_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_bench_cindy', 'Синди', '«Синди» — классический кроссфит-бенчмарк: 20 минут, круг — 5 подтягиваний, 10 отжиманий, 15 приседаний. Никакого оборудования, кроме турника, и никаких скидок. Хороший результат для домашнего атлета — 15 кругов, очень хороший — 20. Темп ровный с первой минуты: круг в минуту — это 20 кругов; если первые три круга ты сделал быстрее, чем за две с половиной минуты, — притормози. Запиши число кругов.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"bc_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"amrap","sets":1,"setsField":"none","durationSec":1200,"title":"AMRAP 20 мин","titleEn":"AMRAP 20 min","description":"Максимум кругов за 20 минут. Отжимания разбивай раньше, чем откажут руки: 6 + 4 лучше, чем 10 и минута стояния.","descriptionEn":"As many rounds as possible in 20 minutes. Break the push-ups before your arms give out: 6 + 4 beats 10 and a minute of standing around.","scalable":true,"blockId":"bc_amrap","items":[{"exerciseId":"pull_up","unit":"reps","target":5,"restAfterSec":0,"note":"Нет строгих — негативные с прыжком, но считай честно","noteEn":"No strict pull-ups? Jumping negatives — but count honestly"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.","descriptionEn":"Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.","scalable":false,"blockId":"bc_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":40,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 150)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('athlete_w_bench_half_murph', 'Половина Мёрфа', '«Мёрф» — бенчмарк-мемориал в честь лейтенанта Майкла Мёрфи: миля бега, 100 подтягиваний, 200 отжиманий, 300 приседаний и ещё миля. Наша домашняя половина: три минуты бега на месте, 50 подтягиваний, 100 отжиманий, 150 приседаний, три минуты бега — лимит 40 минут. Разбивай середину как на репетициях: 10 кругов по 5-10-15 или 20 по 3-5-8 — как тебе удобнее. Это финал восьми недель. Не ускоряйся в первые пять минут, дыши, и время придёт само.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":2,"setsField":"sets","title":"Разминка","titleEn":"Warm-up","description":"Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.","descriptionEn":"Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.","scalable":false,"blockId":"bhm_warmup","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"worlds_greatest_stretch","unit":"reps","target":3,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":30,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"none","durationSec":2400,"title":"На время, лимит 40 мин","titleEn":"For time, 40-min cap","description":"Бег → 50 / 100 / 150 любой разбивкой → бег. Гантели сегодня не нужны: только турник, пол и ты.","descriptionEn":"Run → 50 / 100 / 150 in any partition → run. No dumbbells today: just the bar, the floor and you.","scalable":true,"blockId":"bhm_fortime","items":[{"exerciseId":"jog_in_place","unit":"seconds","target":180,"restAfterSec":0,"note":"Бег на месте: колени выше, темп разговорный","noteEn":"Jog in place: knees up, a talking pace"},{"exerciseId":"pull_up","unit":"reps","target":50,"restAfterSec":0,"note":"10 кругов по 5. Нет строгих — негативные с прыжком","noteEn":"10 rounds of 5. No strict pull-ups? Jumping negatives"},{"exerciseId":"push_up","unit":"reps","target":100,"restAfterSec":0,"note":"По 10 в круге, 5 + 5 когда станет тяжело","noteEn":"10 per round, 5 + 5 once it gets hard"},{"exerciseId":"air_squat","unit":"reps","target":150,"restAfterSec":0,"note":"По 15 в круге","noteEn":"15 per round"},{"exerciseId":"jog_in_place","unit":"seconds","target":180,"restAfterSec":0,"note":"Последний бег: всё, что осталось, но без потери формы","noteEn":"The last run: whatever is left, without losing form"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка","titleEn":"Cool-down","description":"Сегодня растяжка длиннее обычного. Не торопись: это часть тренировки, а не довесок к ней.","descriptionEn":"The stretch is longer than usual today. Take your time: it is part of the session, not an add-on.","scalable":false,"blockId":"bhm_cooldown","items":[{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0},{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0}]}]}'::jsonb, 150)
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d1_test', 1, 1, 'test', (select id from public.custom_workouts where short_id = 'athlete_w_test'),
  '{"title":{"ru":"Входной тест","en":"Baseline test"},"subtitle":{"ru":"Отжимания, присед, планка, бёрпи","en":"Push-ups, squats, plank, burpees"},"body":[]}'::jsonb, false, null, 0
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d2_rest', 1, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию","en":"Walk 7,000 steps and log them in the app — the day counts toward your streak"},"body":[]}'::jsonb, false, 7000, 1
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d3_squat_push', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"4 подхода + AMRAP 7 мин","en":"4 sets + AMRAP 7 min"},"body":[]}'::jsonb, false, null, 2
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d4_rest', 1, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после выпадов и подтягиваний — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after lunges and pull-ups is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 3
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d5_pull_hinge', 1, 5, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_a'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"Негативные подтягивания + тяга","en":"Negative pull-ups + hinge"},"body":[]}'::jsonb, false, null, 4
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d6_engine', 1, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_emom12'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Техника рывка + EMOM 12 мин","en":"Snatch skill + EMOM 12 min"},"body":[]}'::jsonb, false, null, 5
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w1d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 6
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d1_squat_push', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_a'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"4 подхода · чуть тяжелее","en":"4 sets · a little heavier"},"body":[]}'::jsonb, false, null, 7
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d2_rest', 2, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 8
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d3_pull_hinge', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_a'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"4 подхода · негативные по 5 секунд","en":"4 sets · five-second negatives"},"body":[]}'::jsonb, false, null, 9
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d4_engine', 2, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_amrap15'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Скакалка + AMRAP 15 мин","en":"Rope skill + AMRAP 15 min"},"body":[]}'::jsonb, false, null, 10
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d5_rest', 2, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке","en":"7,000 steps and water: muscles grow on rest days, not during the workout"},"body":[]}'::jsonb, false, 7000, 11
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d6_chipper', 2, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_chipper_a'),
  '{"title":{"ru":"Чиппер","en":"Chipper"},"subtitle":{"ru":"60-50-40-30-20-10 на время","en":"60-50-40-30-20-10 for time"},"body":[]}'::jsonb, false, null, 12
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w2d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 13
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d1_squat_push', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"5 подходов + AMRAP 8 мин","en":"5 sets + AMRAP 8 min"},"body":[]}'::jsonb, false, null, 14
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d2_rest', 3, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Дай ладоням отдохнуть: никаких лишних висов. Шаги, вода, сон","en":"Give your palms a break: no extra hanging. Steps, water, sleep"},"body":[]}'::jsonb, false, 7000, 15
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d3_pull_hinge', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_b'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"5 подходов · строгие подтягивания","en":"5 sets · strict pull-ups"},"body":[]}'::jsonb, false, null, 16
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d4_engine', 3, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_tabata'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"Скакалка + 3 табаты 20/10","en":"Rope skill + 3 Tabatas 20/10"},"body":[]}'::jsonb, false, null, 17
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d5_rest', 3, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после выпадов и подтягиваний — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after lunges and pull-ups is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 18
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d6_murph_prep', 3, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_murph_prep_a'),
  '{"title":{"ru":"Репетиция Мёрфа","en":"Murph rehearsal"},"subtitle":{"ru":"Четверть Мёрфа · лимит 20 мин","en":"Quarter Murph · 20-min cap"},"body":[]}'::jsonb, false, null, 19
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w3d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 20
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d1_squat_push', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_b'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 21
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d2_rest', 4, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй и спи. Тело усваивает три недели работы","en":"Deload week: walk and sleep. Your body is absorbing three weeks of work"},"body":[]}'::jsonb, false, 7000, 22
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d3_pull_hinge', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_b'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, null, 23
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d4_flow', 4, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_skill_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Разгрузка · скакалка и техника","en":"Deload · rope and technique"},"body":[]}'::jsonb, true, null, 24
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d5_rest', 4, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today"},"body":[]}'::jsonb, false, 7000, 25
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d6_benchmark', 4, 6, 'benchmark', (select id from public.custom_workouts where short_id = 'athlete_w_bench_cindy'),
  '{"title":{"ru":"Синди","en":"Cindy"},"subtitle":{"ru":"Бенчмарк · AMRAP 20 мин","en":"Benchmark · AMRAP 20 min"},"body":[]}'::jsonb, false, null, 26
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w4d7_rest', 4, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 27
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d1_squat_push', 5, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"5 подходов · тяжёлая пара + AMRAP 10","en":"5 sets · heavy pair + AMRAP 10"},"body":[]}'::jsonb, false, null, 28
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d2_rest', 5, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после выпадов и подтягиваний — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after lunges and pull-ups is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 29
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d3_pull_hinge', 5, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_c'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"5 × 6 подтягиваний + становая","en":"5 × 6 pull-ups + deadlifts"},"body":[]}'::jsonb, false, null, 30
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d4_engine', 5, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_emom16'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"EMOM 16 мин · 4 движения","en":"EMOM 16 min · 4 movements"},"body":[]}'::jsonb, false, null, 31
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d5_rest', 5, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Дай ладоням отдохнуть: никаких лишних висов. Шаги, вода, сон","en":"Give your palms a break: no extra hanging. Steps, water, sleep"},"body":[]}'::jsonb, false, 7000, 32
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d6_chipper', 5, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_chipper_b'),
  '{"title":{"ru":"Чиппер","en":"Chipper"},"subtitle":{"ru":"4 круга на время, лимит 20 мин","en":"4 rounds for time, 20-min cap"},"body":[]}'::jsonb, false, null, 33
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w5d7_rest', 5, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 34
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d1_squat_push', 6, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"5 подходов · вес ещё тяжелее","en":"5 sets · heavier still"},"body":[]}'::jsonb, false, null, 35
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d2_rest', 6, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 36
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d3_pull_hinge', 6, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_c'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"5 × 6 подтягиваний + прогулка фермера","en":"5 × 6 pull-ups + farmer carry"},"body":[]}'::jsonb, false, null, 37
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d4_engine', 6, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_amrap15'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"AMRAP 15 мин · побей вторую неделю","en":"AMRAP 15 min · beat week two"},"body":[]}'::jsonb, false, null, 38
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d5_rest', 6, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке","en":"7,000 steps and water: muscles grow on rest days, not during the workout"},"body":[]}'::jsonb, false, 7000, 39
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d6_murph_prep', 6, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_murph_prep_b'),
  '{"title":{"ru":"Репетиция Мёрфа","en":"Murph rehearsal"},"subtitle":{"ru":"Генеральная репетиция · лимит 30 мин","en":"Dress rehearsal · 30-min cap"},"body":[]}'::jsonb, false, null, 40
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w6d7_rest', 6, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе","en":"A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is"},"body":[]}'::jsonb, false, 7000, 41
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d1_squat_push', 7, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_squat_push_c'),
  '{"title":{"ru":"Присед и жим","en":"Squat & push"},"subtitle":{"ru":"5 подходов · последний тяжёлый присед","en":"5 sets · the last heavy squat day"},"body":[]}'::jsonb, false, null, 42
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d2_rest', 7, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после выпадов и подтягиваний — норма. Прогулка снимет её быстрее, чем диван","en":"Soreness after lunges and pull-ups is normal. A walk clears it faster than the couch"},"body":[]}'::jsonb, false, 7000, 43
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d3_pull_hinge', 7, 3, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_pull_hinge_c'),
  '{"title":{"ru":"Тяга и подтягивания","en":"Pull & hinge"},"subtitle":{"ru":"5 × 6 · последний день тяги","en":"5 × 6 · the last pull day"},"body":[]}'::jsonb, false, null, 44
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d4_engine', 7, 4, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_engine_emom16'),
  '{"title":{"ru":"Двигатель","en":"Engine"},"subtitle":{"ru":"EMOM 16 мин · второй раз","en":"EMOM 16 min · second pass"},"body":[]}'::jsonb, false, null, 45
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d5_rest', 7, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке","en":"7,000 steps and water: muscles grow on rest days, not during the workout"},"body":[]}'::jsonb, false, 7000, 46
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d6_murph_prep', 7, 6, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_murph_prep_a'),
  '{"title":{"ru":"Репетиция Мёрфа","en":"Murph rehearsal"},"subtitle":{"ru":"Четверть Мёрфа · сравни с третьей неделей","en":"Quarter Murph · compare with week three"},"body":[]}'::jsonb, false, null, 47
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w7d7_rest', 7, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Выходной: прогулка, растяжка, нормальная еда","en":"Day off: a walk, a stretch, proper food"},"body":[]}'::jsonb, false, 7000, 48
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d1_flow', 8, 1, 'workout', (select id from public.custom_workouts where short_id = 'athlete_w_skill_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Подводка · техника и растяжка","en":"Taper · technique and stretching"},"body":[]}'::jsonb, false, null, 49
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d2_rest', 8, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы","en":"Benchmark tomorrow: steps, water, an early night. No \"extra\" work today"},"body":[]}'::jsonb, false, 7000, 50
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d3_benchmark', 8, 3, 'benchmark', (select id from public.custom_workouts where short_id = 'athlete_w_bench_half_murph'),
  '{"title":{"ru":"Половина Мёрфа","en":"Half Murph"},"subtitle":{"ru":"Бенчмарк · на время, лимит 40 мин","en":"Benchmark · for time, 40-min cap"},"body":[]}'::jsonb, false, null, 51
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d4_rest', 8, 4, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"После «Мёрфа» — только прогулка и еда. Плечи и спина восстанавливаются двое суток","en":"After Murph — a walk and food, nothing else. Shoulders and back need two days to recover"},"body":[]}'::jsonb, false, 7000, 52
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d5_rest', 8, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра повторный тест — только прогулка и хороший сон","en":"Retest tomorrow — just a walk and a good night''s sleep"},"body":[]}'::jsonb, false, 7000, 53
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
  (select id from public.admin_courses where slug_id = 'athlete'),
  'w8d6_retest', 8, 6, 'test', (select id from public.custom_workouts where short_id = 'athlete_w_test'),
  '{"title":{"ru":"Повторный тест","en":"Retest"},"subtitle":{"ru":"Те же 4 теста · сравни с первой неделей","en":"Same 4 tests · compare with week 1"},"body":[]}'::jsonb, false, null, 54
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

