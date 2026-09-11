-- PART 2 OF 5 — Своим весом: сила и выносливость
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
-- engine — Своим весом: сила и выносливость
-- 16 workouts, 42 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'engine', 'draft', 2, 2, 6, 4, 30,
  '{"none","mat","chair","jump_rope"}'::text[], '#20293c', 3990, 39,
  '{"slug":{"ru":"svoim-vesom-sila-i-vynoslivost","en":"bodyweight-engine"},"name":{"ru":"Своим весом: сила и выносливость","en":"Bodyweight Engine"},"tagline":{"ru":"Шесть недель силы и выносливости на собственном весе — четыре тренировки в неделю, без инвентаря.","en":"Six weeks of bodyweight strength and conditioning — four sessions a week, no gear."},"description":{"ru":"Программа для тех, кто уже знает, что такое присед и отжимание, и хочет двигаться дальше: силовые дни, AMRAP и EMOM, табата, чипперы и два бенчмарка. Всё дома, без оборудования.","en":"For people who already know their way around a squat and a push-up and want the next step: strength days, AMRAPs and EMOMs, Tabata, chippers and two benchmarks. All at home, no equipment."},"longDescription":[{"ru":"Курс построен как настоящий кроссфит-цикл, только без штанги и зала. Каждая неделя — четыре разных дня: присед и жим, тяга и кор, «двигатель» (интервалы на выносливость) и чиппер на всё тело. Паттерны движений повторяются из недели в неделю, а объём и сложность растут: обычный присед превращается в прыжковый, отжимания — в узкие, планка — в лодочку.","en":"The course is built like a real CrossFit cycle, just without a barbell or a gym. Every week has four different days: squat and push, hinge and core, an \"engine\" day (conditioning intervals) and a full-body chipper. The movement patterns repeat from week to week while volume and complexity grow: the air squat becomes a jump squat, push-ups become diamond push-ups, the plank becomes a hollow hold."},{"ru":"Ты начинаешь с теста — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По его результатам приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Четвёртая неделя — разгрузочная: объём падает примерно на треть, чтобы тело усвоило нагрузку. В конце третьей недели — 100 бёрпи на время, в конце шестой — 20-минутный AMRAP в духе «Синди» и повторный тест, чтобы увидеть прогресс в цифрах.","en":"You start with a test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. Week four is a deload: volume drops by about a third so your body can absorb the work. Week three ends with 100 burpees for time, week six with a 20-minute Cindy-style AMRAP and a retest, so you see your progress in numbers."},{"ru":"Из оборудования нужны только устойчивый стул для зашагиваний и коврик. Скакалка — по желанию: если её нет, приложение заменит прыжки на скакалке джампинг-джеками.","en":"All you need is a sturdy chair for step-ups and a mat. A jump rope is optional: if you do not have one, the app swaps rope jumps for jumping jacks."}],"forWhom":[{"ru":"Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.","en":"You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute."},{"ru":"Ты прошёл курс «Старт» и хочешь следующий уровень.","en":"You finished the Start course and want the next level."},{"ru":"Ты хочешь тренироваться дома без инвентаря, но с настоящей структурой: силовые дни, интервалы, бенчмарки.","en":"You want to train at home without gear but with real structure: strength days, intervals, benchmarks."},{"ru":"У тебя есть 25–35 минут четыре раза в неделю.","en":"You have 25–35 minutes four times a week."}],"outcomes":[{"ru":"Больше отжиманий, приседаний и бёрпи в тестах — ты сравнишь первую и шестую неделю.","en":"More push-ups, squats and burpees in the tests — you compare week one with week six."},{"ru":"Освоишь прыжковые приседания, узкие отжимания, лодочку и складку.","en":"You learn jump squats, diamond push-ups, the hollow hold and V-ups."},{"ru":"Пройдёшь два бенчмарка: 100 бёрпи на время и 20-минутный AMRAP в духе «Синди».","en":"You complete two benchmarks: 100 burpees for time and a 20-minute Cindy-style AMRAP."},{"ru":"Научишься работать в форматах AMRAP, EMOM, табата и чиппер и распределять силы.","en":"You get comfortable with AMRAP, EMOM, Tabata and chipper formats and learn to pace them."},{"ru":"Привыкнешь к четырём тренировкам в неделю без перегруза — с днями отдыха и разгрузочной неделей.","en":"You settle into four sessions a week without burning out — with rest days and a deload week built in."}],"faq":[{"q":{"ru":"Что нужно из оборудования?","en":"What equipment do I need?"},"a":{"ru":"Коврик и устойчивый стул — для зашагиваний и для отжиманий от опоры в лёгкий день. Скакалка по желанию: если её нет, приложение автоматически заменит прыжки на скакалке джампинг-джеками, и программа от этого не изменится.","en":"A mat and a sturdy chair — for step-ups and for incline push-ups on the easy day. A jump rope is optional: without one the app automatically swaps rope jumps for jumping jacks and the program stays the same."}},{"q":{"ru":"Мне подойдёт этот курс или лучше начать со «Старта»?","en":"Is this course right for me, or should I begin with Start?"},"a":{"ru":"Ориентир такой: 8–10 отжиманий от пола подряд, минута планки и 15–20 приседаний без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт»: там те же паттерны движений, но без прыжков и с отжиманиями с колен, а через четыре недели вернёшься сюда.","en":"A rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15–20 squats without getting winded. If that is you, jump in. If not yet, do Start first: same movement patterns, no jumps and knee push-ups, and you come back here in four weeks."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"В среднем около 30 минут вместе с разминкой и заминкой: силовые дни — 27–37 минут, «двигатель» — 24–30, чипперы, бенчмарки и лёгкий день — 20–30. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.","en":"About 30 minutes on average including warm-up and cool-down: strength days run 27–37 minutes, engine days 24–30, chippers, benchmarks and the easy day 20–30. Before you start, the app shows the estimated duration for your own volume."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не пытайся сделать две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва.","en":"No problem: the path does not reset, just continue from the next node when you can. Do not try to double up to \"catch up\" — shifting the week is better. If the break was longer than two weeks, pick \"Easier\" for the first two sessions back."}},{"q":{"ru":"Как приложение подстраивает нагрузку?","en":"How does the app adapt the load?"},"a":{"ru":"Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. В четвёртую неделю объём снижается автоматически.","en":"Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. In week four the volume drops automatically."}},{"q":{"ru":"Болят мышцы после тренировки — это нормально?","en":"My muscles are sore after training — is that normal?"},"a":{"ru":"Тянущая боль в мышцах через день-два после нагрузки — норма, особенно в первые две недели и после прыжков. Помогают прогулка, сон и следующая лёгкая тренировка. А вот резкая боль в суставе или пояснице, или та, что усиливается во время движения, — сигнал остановиться. Отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку, а если не проходит несколько дней — покажись врачу.","en":"A dull ache a day or two after a session is normal, especially in the first two weeks and after jumps. A walk, sleep and the next easy session help. Sharp pain in a joint or the lower back, or pain that gets worse as you move, is a signal to stop. Mark \"Pain\" in the post-workout feedback — the app reduces the load — and if it lasts several days, see a doctor."}}]}'::jsonb
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
