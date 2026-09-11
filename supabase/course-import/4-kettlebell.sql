-- PART 4 OF 5 — Гиря: сила и метаболизм
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
-- kettlebell — Гиря: сила и метаболизм
-- 13 workouts, 37 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'kettlebell', 'draft', 4, 2, 6, 3, 32,
  '{"kettlebell","none","mat"}'::text[], '#232f42', 3990, 39,
  '{"slug":{"ru":"girya-sila-i-metabolizm","en":"kettlebell-power"},"name":{"ru":"Гиря: сила и метаболизм","en":"Kettlebell Power"},"tagline":{"ru":"Шесть недель с одной гирей: от становой тяги до рывка, три тренировки в неделю.","en":"Six weeks with a single kettlebell: from the deadlift to the snatch, three sessions a week."},"description":{"ru":"Курс вокруг гиревого маха и всего, что из него вырастает: взятие, жим, рывок, турецкий подъём и переноски. Силовые дни, EMOM и лестницы махов, разгрузочная неделя и бенчмарк «100 махов + 50 приседаний» в финале. Дома, с одной гирей.","en":"A course built around the kettlebell swing and everything that grows out of it: the clean, the press, the snatch, the Turkish get-up and carries. Strength days, swing EMOMs and ladders, a deload week and the \"100 swings + 50 squats\" benchmark at the end. At home, with one bell."},"longDescription":[{"ru":"Гиря — самый честный домашний снаряд: один кусок железа, а нагрузку из него можно вытащить любую. Каждая неделя курса — три разных дня. «Присед и жим»: гоблет-присед, жим стоя, выпады с гирей у груди и отжимания. «Школа маха»: здесь живёт главная линия курса — становая тяга, потом мах, из маха взятие на грудь, из взятия жим, а на пятой неделе — рывок; на каждом таком дне есть блок турецкого подъёма и переноски. И «Метаболизм»: EMOM махов, лестница 10–25–10 на время и длинный AMRAP.","en":"A kettlebell is the most honest piece of home equipment: one lump of iron, and you can get any kind of load out of it. Every week of the course has three different days. \"Squat & press\": goblet squats, standing press, front-rack lunges and push-ups. \"Swing school\", where the main thread of the course lives — the deadlift, then the swing, the clean out of the swing, the press out of the clean, and in week five the snatch; every one of these days also has a Turkish get-up block and carries. And \"Metabolic\": swing EMOMs, a 10–25–10 ladder for time and a long AMRAP."},{"ru":"Ты начинаешь с теста без гири — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По нему приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Вес гири ты не считаешь сам: в программе стоят метки «лёгкая», «средняя», «тяжёлая», и приложение подставляет твои гири. Четвёртая неделя — разгрузочная: объём падает примерно на треть, техника остаётся. В шестой — последний силовой день, бенчмарк «100 махов + 50 гоблет-приседаний» на время и повторный тест.","en":"You start with a bodyweight test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. You never have to calculate the bell weight yourself: the program uses \"light\", \"medium\" and \"heavy\" labels and the app maps them to the bells you own. Week four is a deload: volume drops by about a third, the technique work stays. Week six holds the last strength day, the \"100 swings + 50 goblet squats\" benchmark for time and the retest."},{"ru":"Из инвентаря нужна одна гиря и коврик. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, приложение само выберет полегче для жима и рывка и потяжелее для тяги и переносок. Вторая гиря не нужна: прогулка фермера в курсе делается с одной, со сменой руки.","en":"All you need is one kettlebell and a mat. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several bells, the app picks a lighter one for the press and the snatch and a heavier one for deadlifts and carries. You do not need a second bell: the farmer carry in this course is done with one, switching hands."}],"forWhom":[{"ru":"Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.","en":"You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute."},{"ru":"У тебя есть гиря (или ты готов её купить) и ты хочешь уметь с ней всё, а не только махать.","en":"You own a kettlebell (or are ready to buy one) and want to be able to do everything with it, not just swing."},{"ru":"Тебе нужны сила и выносливость одновременно — за 30–35 минут три раза в неделю.","en":"You want strength and conditioning at the same time — in 30–35 minutes, three times a week."},{"ru":"Ты прошёл «Старт» или «Своим весом» и хочешь добавить к собственному весу железо.","en":"You finished Start or Bodyweight Engine and want to add iron to bodyweight."}],"outcomes":[{"ru":"Чистый мах гирей: наклон от бёдер, прямая спина, гиря летит от таза, а не от рук.","en":"A clean kettlebell swing: hinge from the hips, flat back, the bell driven by the hips rather than the arms."},{"ru":"Освоишь взятие на грудь, жим стоя, рывок и турецкий подъём — весь базовый гиревой набор.","en":"You learn the clean, the standing press, the snatch and the Turkish get-up — the whole basic kettlebell toolkit."},{"ru":"Пройдёшь бенчмарк «100 махов + 50 гоблет-приседаний» и запишешь время, которое будешь бить дальше.","en":"You complete the \"100 swings + 50 goblet squats\" benchmark and record a time to beat next cycle."},{"ru":"Больше отжиманий, приседаний, планки и бёрпи в повторном тесте — ты сравнишь первую и шестую неделю.","en":"More push-ups, squats, plank time and burpees in the retest — you compare week one with week six."},{"ru":"Сильный хват и устойчивый кор за счёт переносок, турецкого подъёма и планок.","en":"A strong grip and a stable core from carries, get-ups and planks."}],"faq":[{"q":{"ru":"Какая гиря нужна? Одна или две?","en":"What kettlebell do I need? One or two?"},"a":{"ru":"Одной достаточно — весь курс построен под одну гирю, а прогулка фермера делается со сменой руки. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, укажи их в профиле: приложение подставит полегче туда, где в программе стоит «лёгкая» (жим, рывок, турецкий подъём в первые недели), и потяжелее туда, где «тяжёлая» (становая тяга, переноски). Ещё нужен коврик.","en":"One is enough — the whole course is built around a single bell, and the farmer carry is done switching hands. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several, list them in your profile: the app uses a lighter one where the program says \"light\" (press, snatch, the get-up in the first weeks) and a heavier one where it says \"heavy\" (deadlifts, carries). You also need a mat."}},{"q":{"ru":"Я никогда не занимался с гирей. Мне подойдёт?","en":"I have never trained with a kettlebell. Is this for me?"},"a":{"ru":"Да, если у тебя есть общая база: 8–10 отжиманий от пола подряд, минута планки, 15–20 приседаний без одышки. Гиревая техника здесь строится с нуля: первые две недели — только тяга, мах и разбор турецкого подъёма, взятие появляется на второй неделе, жим из взятия на третьей, рывок на пятой. Если базы пока нет, пройди сначала «Старт» — четыре недели без инвентаря, и возвращайся.","en":"Yes, if you have a general base: 8–10 full push-ups in a row, a one-minute plank, 15–20 squats without getting winded. Kettlebell technique is built from scratch here: the first two weeks are only the deadlift, the swing and the get-up steps; the clean appears in week two, the press out of the clean in week three, the snatch in week five. If the base is not there yet, do Start first — four weeks with no equipment — and come back."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"Около получаса вместе с разминкой и заминкой: силовые дни и «Школа маха» — 27–38 минут, метаболические дни — 21–29, «Лёгкий поток» — около 20, бенчмарк — около 18: он короткий, но самый тяжёлый в курсе. Три тренировки в неделю; в последней неделе добавляется короткий технический день перед повторным тестом. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.","en":"About half an hour including warm-up and cool-down: strength days and Swing school run 27–38 minutes, metabolic days 21–29, Easy flow about 20, and the benchmark about 18 — short, but the hardest session of the course. Three sessions a week; the final week adds a short technique day before the retest. Before you start, the app shows the estimated duration for your own volume."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не делай две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва и возьми гирю полегче на махах: хват и ладони отвыкают быстрее, чем ноги.","en":"No problem: the path does not reset, just continue from the next node when you can. Do not double up to \"catch up\" — shifting the week is better. If the break was longer than two weeks, pick \"Easier\" for the first two sessions back and use a lighter bell on the swings: your grip and palms lose the habit faster than your legs do."}},{"q":{"ru":"После махов болит поясница. Это нормально?","en":"My lower back hurts after swings. Is that normal?"},"a":{"ru":"Тянущая усталость в ягодицах и задней поверхности бедра через день после махов — норма. Боль именно в пояснице — нет: чаще всего это значит, что наклон идёт спиной, а не бёдрами, или гиря опускается слишком низко к коленям. Вернись к становой тяге с гирей и махам с лёгкой гирей, следи, чтобы гиря проходила высоко «в пах», а наверху сжимай ягодицы. Отметь «Боль» в отчёте после тренировки — приложение снизит нагрузку. Если боль резкая, отдаёт в ногу или не проходит несколько дней — покажись врачу.","en":"Dull fatigue in the glutes and hamstrings the day after swings is normal. Pain in the lower back itself is not: most often it means you are bending with your back instead of your hips, or letting the bell drop too low toward the knees. Go back to kettlebell deadlifts and swings with a light bell, keep the bell passing high into the groin and squeeze your glutes at the top. Mark \"Pain\" in the post-workout feedback — the app reduces the load. If the pain is sharp, radiates into a leg or lasts several days, see a doctor."}},{"q":{"ru":"Как приложение подстраивает нагрузку?","en":"How does the app adapt the load?"},"a":{"ru":"Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. Вес гири оно выбирает из тех, что ты указал в профиле, по меткам «лёгкая / средняя / тяжёлая». В четвёртую неделю объём снижается автоматически, а если ты отметил проблемы с поясницей или плечами, тяжёлые махи и жимы заменяются на более щадящие варианты.","en":"Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. It picks the bell from the ones in your profile using the \"light / medium / heavy\" labels. In week four the volume drops automatically, and if you flagged lower-back or shoulder issues, heavy swings and presses are swapped for gentler variants."}}]}'::jsonb
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
