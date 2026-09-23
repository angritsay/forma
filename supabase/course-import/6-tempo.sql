-- PART 6 OF 6 — Форма в темпе: плотность и контроль своим весом
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
-- tempo — Форма в темпе: плотность и контроль своим весом
-- 14 workouts, 56 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'tempo', 'draft', 6, 3, 8, 4, 25,
  '{"none","mat","chair","jump_rope"}'::text[], '#383838', 4990, 49,
  '{"slug":{"ru":"v-tempe-plotnost-i-kontrol","en":"bodyweight-tempo"},"name":{"ru":"Форма в темпе: плотность и контроль своим весом","en":"Forma. Tempo: bodyweight density and control"},"tagline":{"ru":"Восемь недель для тех, кто уже уверенно двигается: тот же объём работы, всё меньше отдыха между подходами. Без инвентаря.","en":"Eight weeks for people who already move well: the same amount of work, less and less rest between sets. No gear."},"description":{"ru":"Курс про плотность: лестницы EMOM, работа на время против лимита, круги без пауз между ними и силовые дни, где отдых между подходами сокращается с 90 секунд до минуты. Дома, без оборудования — коврик, стул и скакалка по желанию.","en":"A course about density: EMOM ladders, work for time against a cap, rounds with no pause between them, and strength days where the rest between sets shrinks from ninety seconds to one minute. At home, no equipment — a mat, a chair and a jump rope if you have one."},"longDescription":[{"ru":"Это следующий шаг после «Формы своим весом» для тех, кто не собирается покупать железо. Штанги, гантелей и турника здесь нет — и курс не делает вид, что они не нужны. Без перекладины своим весом невозможно тренировать тягу, поэтому предмет курса другой: плотность и позиция. Сколько работы ты успеваешь сделать за единицу времени и насколько чисто держится техника, когда времени на восстановление всё меньше.","en":"This is the next step after Forma Bodyweight for people who are not going to buy iron. There is no barbell, no dumbbell and no pull-up bar here — and the course does not pretend they are unnecessary. Without a bar you cannot train pulling with bodyweight alone, so the subject is a different one: density and position. How much work you get done per unit of time, and how cleanly your form holds as the recovery between efforts shrinks."},{"ru":"Механизм у курса один и он виден с первого дня: силовой день повторяется каждую неделю с теми же движениями и повторами, а отдых между подходами падает с 90 секунд до 75, а потом до 60. Всё остальное построено вокруг него — лестницы, где каждую минуту число растёт, пока движение не сменится; «крышка» — длинный список на время против лимита, который не обязательно закрывать; и круги на время, между которыми не заложено ни секунды отдыха.","en":"The course has one mechanism and it is visible from day one: the strength day repeats every week with the same movements and the same reps, while the rest between sets drops from 90 seconds to 75 and then to 60. Everything else is built around it — ladders where the number climbs every minute until the movement changes; the cap, a long list for time against a ceiling you are not obliged to close; and rounds for time with not one second of rest scheduled between them."},{"ru":"Первая тренировка курса и последняя — одна и та же: пять кругов на время, которые не меняются ни от твоего уровня, ни от выбора «полегче / посложнее». Ты проходишь их четыре раза — на первой, третьей, шестой и восьмой неделе — и видишь ровно одну цифру, время, которая говорит всё. Пятая неделя разгрузочная: объём падает примерно на треть, чтобы тело усвоило первые четыре.","en":"The first session of the course and the last are the same one: five rounds for time that do not change with your level or with Easier and Harder. You meet them four times — in weeks 1, 3, 6 and 8 — and you get exactly one number, the clock, which says everything. Week five is a deload: volume drops by about a third so your body can absorb the first four."}],"forWhom":[{"ru":"Ты прошёл «Форму своим весом» или тренируешься сам и уверенно держишь 20 отжиманий подряд и 2 минуты планки.","en":"You finished Forma Bodyweight or train on your own, and you comfortably hold 20 push-ups in a row and a two-minute plank."},{"ru":"Ты не хочешь покупать инвентарь и не готов вешать турник — но тебе уже мало обычного домашнего комплекса.","en":"You do not want to buy gear and you are not going to mount a pull-up bar — but an ordinary home routine is no longer enough."},{"ru":"Тебе интересна работа на время: EMOM, лимиты, круги — и то, как держать ровный темп, когда тяжело.","en":"You are interested in working against the clock: EMOMs, caps, rounds — and in holding an even pace when it gets hard."},{"ru":"У тебя есть 25–30 минут четыре раза в неделю.","en":"You have 25–30 minutes four times a week."}],"outcomes":[{"ru":"Пройдёшь одни и те же пять кругов четыре раза за курс и увидишь, на сколько минут сдвинулось время.","en":"You run the same five rounds four times over the course and see how many minutes the clock moved."},{"ru":"Будешь делать тот же объём силовой работы с отдыхом на треть короче, чем в первую неделю.","en":"You do the same volume of strength work on a third less rest than in week one."},{"ru":"Освоишь прыжковые выпады, узкие отжимания, отжимания уголком, складку и прыжок с коленями к груди.","en":"You learn jumping lunges, diamond push-ups, pike push-ups, V-ups and tuck jumps."},{"ru":"Научишься раскладывать силы на длинной работе: EMOM-лестницу, чиппер с лимитом и пять кругов без пауз.","en":"You learn to pace long work: an EMOM ladder, a chipper against a cap, and five rounds with no pauses."},{"ru":"Подтянешь одностороннюю работу — выпады, тягу и мостик на одной ноге, боковую планку.","en":"You build up your single-side work — lunges, single-leg RDLs and bridges, side planks."}],"faq":[{"q":{"ru":"Что нужно из оборудования?","en":"What equipment do I need?"},"a":{"ru":"Коврик и устойчивый стул без колёсиков — для отжиманий от опоры в лёгкий день. Скакалка по желанию: если её нет, приложение само заменит двойные прыжки на джампинг-джеки. Турник не нужен и нигде не используется.","en":"A mat and a sturdy chair without wheels — for the dips on the easy day. A jump rope is optional: without one the app swaps double-unders for jumping jacks. No pull-up bar is needed and none is used."}},{"q":{"ru":"Чем этот курс отличается от «Формы своим весом»?","en":"How is this different from Forma Bodyweight?"},"a":{"ru":"Тот курс про то, чтобы научиться делать больше. Этот — про то, чтобы делать столько же за меньшее время. Силовой день здесь повторяется неизменным, а сокращается отдых между подходами: 90 секунд, потом 75, потом 60. Форматы тоже другие: лестницы EMOM, работа против лимита, круги без пауз между ними. И курс длиннее — восемь недель вместо шести.","en":"That course is about learning to do more. This one is about doing the same amount in less time. The strength day repeats unchanged here while the rest between sets shrinks: 90 seconds, then 75, then 60. The formats are different too: EMOM ladders, work against a cap, rounds with no pause between them. And it is longer — eight weeks instead of six."}},{"q":{"ru":"Мне подойдёт этот курс?","en":"Is this course right for me?"},"a":{"ru":"Ориентир: 20 отжиманий от пола подряд, 2 минуты планки, 40 приседаний без остановки и знакомство с бёрпи. Если это про тебя — заходи. Если пока нет, пройди «Форму своим весом»: там те же паттерны, но с бо́льшим отдыхом и без прыжковых выпадов.","en":"A rule of thumb: 20 full push-ups in a row, a two-minute plank, 40 unbroken squats and some familiarity with burpees. If that is you, come in. If not yet, do Forma Bodyweight first: same patterns, more rest and no jumping lunges."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"Около 25–30 минут вместе с разминкой и заминкой. Разминка — суставная гимнастика, пять минут, она обязательна и не считается тренировкой. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.","en":"About 25–30 minutes including warm-up and cool-down. The warm-up is joint mobility, five minutes, mandatory and not counted as training. Before you start, the app shows the estimated duration for your own volume."}},{"q":{"ru":"Что делать, если не укладываюсь в лимит?","en":"What if I do not make the cap?"},"a":{"ru":"Ничего. «Крышка» на то и крышка: лимит стоит выше, чем возьмёт большинство, и закрывать его не обязательно. Не успел — доделай остаток в своём темпе, если хочешь, и запиши в отчёте, где тебя остановило время. Через две недели тот же список пойдёт быстрее — это и есть смысл курса.","en":"Nothing. That is what a cap is: the ceiling sits above what most people reach, and closing it is not required. If time runs out, finish the rest at your own pace if you want to, and note in the feedback where the clock stopped you. In two weeks the same list goes faster — that is the point of the course."}},{"q":{"ru":"Как приложение подстраивает нагрузку?","en":"How does the app adapt the load?"},"a":{"ru":"Стартовый объём считается по онбордингу. После каждой тренировки ты оцениваешь усилие и самочувствие, и приложение чуть двигает повторы на следующий раз. Перед тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее» — это меняет объём, число подходов и окна форматов, но не трогает отдых между подходами: отдых на этом курсе задан программой и меняется только по неделям. Пять кругов не меняются никогда.","en":"Your starting volume comes from onboarding. After every session you rate the effort and how you felt, and the app nudges the reps for next time. Before a session you can pick Easier, As usual or Harder — that moves the volume, the set count and the format windows, but never the rest between sets: on this course the rest is set by the programme and changes only by week. The five rounds never change at all."}}]}'::jsonb
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
values ('tempo_w_gate', 'Пять кругов', 'Пять кругов на время: 8 бёрпи, 15 приседаний, 10 отжиманий, 15 подъёмов корпуса. Без отдыха между кругами — отдых ты выбираешь сам, и в этом весь смысл замера. Лимит 15 минут. Это единственная тренировка курса, которая никогда не меняется: ни от твоего уровня, ни от выбора «полегче / посложнее». Ты увидишь её четыре раза — на первой, третьей, шестой и восьмой неделе — и каждый раз сравнишь время с прошлым.

ПРИМЕЧАНИЕ ‼️ 11 минут — отличный результат. 🎯 цель уложиться в 15.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"gate_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":5,"setsField":"sets","durationSec":900,"restBetweenRoundsSec":0,"title":"5 кругов на время","titleEn":"5 rounds for time","description":"Между кругами не останавливаемся специально — переходим к следующему движению. Не успеваешь в 15 минут — записывай, сколько успел: в следующий раз сравнишь по кругам.","descriptionEn":"Do not stop between rounds on purpose — move to the next movement. Not done inside 15 minutes? Log how far you got: next time you compare by rounds.","scalable":false,"blockId":"gate_main","items":[{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"air_squat","unit":"reps","target":15,"restAfterSec":0},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0},{"exerciseId":"sit_up","unit":"reps","target":15,"restAfterSec":0}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"gate_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 130)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_strength_a', 'Сила без паузы A', 'Три подхода из четырёх движений: выпады назад, отжимания, румынская тяга на одной ноге, лодочка. Внутри подхода отдых 20 секунд, между подходами — 90. Эти 90 секунд — единственное, что будет меняться за курс: через две недели их станет 75, ещё через две — 60. Движения и повторы останутся, а времени между ними будет меньше. Поэтому здесь не нужно спешить: техника сейчас, плотность потом.

ПРИМЕЧАНИЕ ‼️ Если к третьему подходу техника ломается — бери «полегче» на следующей тренировке. 🎯 цель — три ровных подхода.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"sa_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":90,"title":"3 подхода · отдых 90 с","titleEn":"3 sets · 90 s rest","description":"Внутри подхода отдых 20 секунд, между подходами полторы минуты. Считай их — они будут короче.","descriptionEn":"Twenty seconds of rest inside the set, a minute and a half between sets. Count them — they will get shorter.","scalable":true,"blockId":"sa_main","items":[{"exerciseId":"reverse_lunge","unit":"reps","target":14,"restAfterSec":20,"note":"Считаем в сумме на две ноги. Шаг назад, колено мягко к полу","noteEn":"Counted as the total for both legs. Step back, knee softly to the floor"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":20,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"single_leg_rdl","unit":"reps","target":6,"perSide":true,"restAfterSec":20,"note":"Таз назад, спина ровная, опорное колено чуть мягкое. Медленно — это про контроль","noteEn":"Hips back, back flat, the standing knee soft. Slowly — this one is about control"},{"exerciseId":"hollow_hold","unit":"seconds","target":25,"restAfterSec":0,"note":"Поясница прижата к полу. Не держится — согни колени и подними руки","noteEn":"Lower back pressed into the floor. Losing it? Bend the knees and raise the arms"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"sa_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 110)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_strength_b', 'Сила без паузы B', 'Те же четыре места в подходе, движения сложнее: прыжковые выпады вместо шаговых, узкие отжимания вместо обычных, ягодичный мостик на одной ноге, боковая планка. Отдых между подходами — 75 секунд вместо 90.

ПРИМЕЧАНИЕ ‼️ Прыжковый выпад считается в сумме на две ноги. Не идёт прыжок — делай шаговый выпад, но не сокращай повторы. 🎯 цель — три подхода без добора отдыха.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"sb_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":75,"title":"3 подхода · отдых 75 с","titleEn":"3 sets · 75 s rest","description":"Отдых между подходами короче на 15 секунд, чем в первые две недели. Всё остальное на месте.","descriptionEn":"Fifteen seconds less rest between sets than in the first two weeks. Everything else stays.","scalable":true,"blockId":"sb_main","items":[{"exerciseId":"jumping_lunge","unit":"reps","target":14,"restAfterSec":20,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"diamond_push_up","unit":"reps","target":8,"restAfterSec":20,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"single_leg_glute_bridge","unit":"reps","target":8,"perSide":true,"restAfterSec":20,"note":"Таз поднимаем ягодицей, а не поясницей. Наверху пауза на счёт","noteEn":"Lift with the glute, not the lower back. Pause at the top for a count"},{"exerciseId":"side_plank","unit":"seconds","target":25,"perSide":true,"restAfterSec":0,"note":"Таз высоко, плечо строго над локтем","noteEn":"Hips high, shoulder directly over the elbow"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"sb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 115)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_strength_c', 'Сила без паузы C', 'Финальный вариант: прыжковые выпады, отжимания уголком, румынская тяга на одной ноге, складка. Отдых внутри подхода 15 секунд, между подходами — минута. Это на треть меньше, чем на первой неделе, при том же объёме работы. Если ты дошёл сюда и держишь технику — курс сделал ровно то, для чего он есть.

ПРИМЕЧАНИЕ ‼️ Минуты не хватает — досчитай до 75 и не вини себя, но запиши это. 🎯 цель — три подхода ровно по минуте.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"sc_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"strength","format":"sets","sets":3,"setsField":"sets","restBetweenSetsSec":60,"title":"3 подхода · отдых 60 с","titleEn":"3 sets · 60 s rest","description":"Отдых внутри подхода 15 секунд, между подходами минута. Плотность, ради которой был весь курс.","descriptionEn":"Fifteen seconds inside the set, a minute between sets. The density the whole course was for.","scalable":true,"blockId":"sc_main","items":[{"exerciseId":"jumping_lunge","unit":"reps","target":16,"restAfterSec":15,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"pike_push_up","unit":"reps","target":8,"restAfterSec":15,"note":"Таз высоко, макушка к полу между кистями, локти назад","noteEn":"Hips high, crown of the head to the floor between the hands, elbows back"},{"exerciseId":"single_leg_rdl","unit":"reps","target":8,"perSide":true,"restAfterSec":15,"note":"Таз назад, спина ровная, опорное колено чуть мягкое. Медленно — это про контроль","noteEn":"Hips back, back flat, the standing knee soft. Slowly — this one is about control"},{"exerciseId":"v_up","unit":"reps","target":12,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"sc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_ladder_a', 'Лестница A', 'Пятнадцать минут, каждую минуту одно задание. Число растёт, пока движение не сменится: приседания, скалолаз, отжимания, конькобежец, бёрпи. Сделал — остаток минуты твой. Не успел в минуту — это сигнал, что верх лестницы уже близко: доделай и иди дальше, но запиши, на какой минуте это случилось.

ПРИМЕЧАНИЕ ‼️ Если работа занимает больше 45 секунд, в следующем движении начинай с нижней ступени. 🎯 цель — дойти до бёрпи, не выпав из минуты.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"la_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"emom","sets":15,"setsField":"rounds","title":"EMOM 15 · лестница","titleEn":"EMOM 15 · ladder","description":"Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.","descriptionEn":"A new task from the list every minute, top to bottom. The rest of the minute is rest.","scalable":true,"blockId":"la_emom","items":[{"exerciseId":"air_squat","unit":"reps","target":8,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"air_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"air_squat","unit":"reps","target":12,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"air_squat","unit":"reps","target":14,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"mountain_climber","unit":"reps","target":20,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"},{"exerciseId":"mountain_climber","unit":"reps","target":24,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"},{"exerciseId":"mountain_climber","unit":"reps","target":28,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"},{"exerciseId":"mountain_climber","unit":"reps","target":32,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"},{"exerciseId":"push_up","unit":"reps","target":6,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"push_up","unit":"reps","target":8,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"push_up","unit":"reps","target":10,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"push_up","unit":"reps","target":12,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"skater","unit":"reps","target":16,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":20,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":24,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":28,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":7,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"la_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 115)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_ladder_b', 'Лестница B', 'Пятнадцать минут по той же схеме, движения сложнее: прыжковый присед, планка с подъёмом на руки, отжимания уголком, конькобежец, бёрпи. Планка с подъёмом — самое медленное движение лестницы, ступени в ней короткие не случайно.

ПРИМЕЧАНИЕ ‼️ Плечи горят раньше ног — это нормально и так задумано. 🎯 цель — не пропустить ни одной минуты.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"lb_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"emom","sets":15,"setsField":"rounds","title":"EMOM 15 · лестница","titleEn":"EMOM 15 · ladder","description":"Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.","descriptionEn":"A new task from the list every minute, top to bottom. The rest of the minute is rest.","scalable":true,"blockId":"lb_emom","items":[{"exerciseId":"jump_squat","unit":"reps","target":8,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"jump_squat","unit":"reps","target":10,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"jump_squat","unit":"reps","target":12,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"jump_squat","unit":"reps","target":14,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"up_down_plank","unit":"reps","target":5,"restAfterSec":0,"note":"Таз не раскачиваем: опускаемся и встаём, как будто на голове стакан","noteEn":"Do not let the hips swing: go down and up as if balancing a glass on your head"},{"exerciseId":"up_down_plank","unit":"reps","target":6,"restAfterSec":0,"note":"Таз не раскачиваем: опускаемся и встаём, как будто на голове стакан","noteEn":"Do not let the hips swing: go down and up as if balancing a glass on your head"},{"exerciseId":"up_down_plank","unit":"reps","target":7,"restAfterSec":0,"note":"Таз не раскачиваем: опускаемся и встаём, как будто на голове стакан","noteEn":"Do not let the hips swing: go down and up as if balancing a glass on your head"},{"exerciseId":"up_down_plank","unit":"reps","target":8,"restAfterSec":0,"note":"Таз не раскачиваем: опускаемся и встаём, как будто на голове стакан","noteEn":"Do not let the hips swing: go down and up as if balancing a glass on your head"},{"exerciseId":"pike_push_up","unit":"reps","target":6,"restAfterSec":0,"note":"Таз высоко, макушка к полу между кистями, локти назад","noteEn":"Hips high, crown of the head to the floor between the hands, elbows back"},{"exerciseId":"pike_push_up","unit":"reps","target":7,"restAfterSec":0,"note":"Таз высоко, макушка к полу между кистями, локти назад","noteEn":"Hips high, crown of the head to the floor between the hands, elbows back"},{"exerciseId":"pike_push_up","unit":"reps","target":8,"restAfterSec":0,"note":"Таз высоко, макушка к полу между кистями, локти назад","noteEn":"Hips high, crown of the head to the floor between the hands, elbows back"},{"exerciseId":"pike_push_up","unit":"reps","target":9,"restAfterSec":0,"note":"Таз высоко, макушка к полу между кистями, локти назад","noteEn":"Hips high, crown of the head to the floor between the hands, elbows back"},{"exerciseId":"skater","unit":"reps","target":18,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":22,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":26,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"skater","unit":"reps","target":28,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":7,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"lb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_ladder_c', 'Лестница C', 'Последний вариант: прыжковые выпады, складка, узкие отжимания, прыжок с коленями к груди, бёрпи. Все пять — те, которых не было в начале курса. Если ты проходишь эту пятнадцатиминутку целиком, ты в той форме, ради которой был курс.

ПРИМЕЧАНИЕ ‼️ Прыжок с коленями к груди — тихий. Стало шумно — закончи ступень раньше. 🎯 цель — пятнадцать минут без пропусков.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"lc_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"emom","sets":15,"setsField":"rounds","title":"EMOM 15 · лестница","titleEn":"EMOM 15 · ladder","description":"Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.","descriptionEn":"A new task from the list every minute, top to bottom. The rest of the minute is rest.","scalable":true,"blockId":"lc_emom","items":[{"exerciseId":"jumping_lunge","unit":"reps","target":10,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"jumping_lunge","unit":"reps","target":12,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"jumping_lunge","unit":"reps","target":14,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"jumping_lunge","unit":"reps","target":16,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"v_up","unit":"reps","target":8,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"v_up","unit":"reps","target":10,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"v_up","unit":"reps","target":12,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"v_up","unit":"reps","target":13,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"diamond_push_up","unit":"reps","target":5,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"diamond_push_up","unit":"reps","target":6,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"diamond_push_up","unit":"reps","target":7,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"diamond_push_up","unit":"reps","target":8,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"tuck_jump","unit":"reps","target":8,"restAfterSec":0,"note":"Колени к груди, приземление тихое. Стало шумно — останови подход","noteEn":"Knees to the chest, a quiet landing. Gone noisy? End the set"},{"exerciseId":"tuck_jump","unit":"reps","target":10,"restAfterSec":0,"note":"Колени к груди, приземление тихое. Стало шумно — останови подход","noteEn":"Knees to the chest, a quiet landing. Gone noisy? End the set"},{"exerciseId":"tuck_jump","unit":"reps","target":12,"restAfterSec":0,"note":"Колени к груди, приземление тихое. Стало шумно — останови подход","noteEn":"Knees to the chest, a quiet landing. Gone noisy? End the set"},{"exerciseId":"tuck_jump","unit":"reps","target":14,"restAfterSec":0,"note":"Колени к груди, приземление тихое. Стало шумно — останови подход","noteEn":"Knees to the chest, a quiet landing. Gone noisy? End the set"},{"exerciseId":"burpee","unit":"reps","target":5,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":6,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"burpee","unit":"reps","target":7,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"lc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 125)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_cap_a', 'Крышка A', 'Один проход сверху вниз на время, лимит 16 минут: 40 бёрпи, 80 приседаний, 50 отжиманий, 60 подъёмов корпуса, 100 скалолазов. Разбивай как хочешь — по 10, по 20, как удержишь темп. Закрывать не обязательно: не успел в 16 минут — доделай остаток в своём темпе, если хочешь, и запиши, где тебя остановил лимит.

ПРИМЕЧАНИЕ ‼️ Начинать с бёрпи по 20 — самая частая ошибка. 🎯 цель — уложиться в 16 минут.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"ca_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":960,"title":"На время · лимит 16 мин","titleEn":"For time · 16-min cap","description":"Сверху вниз, по одному движению за раз. Следующее начинается, когда закончилось предыдущее.","descriptionEn":"Top to bottom, one movement at a time. The next starts when the last one is done.","scalable":true,"blockId":"ca_main","items":[{"exerciseId":"burpee","unit":"reps","target":40,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"air_squat","unit":"reps","target":80,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"push_up","unit":"reps","target":50,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"sit_up","unit":"reps","target":60,"restAfterSec":0,"note":"Поднимаемся животом, стопы прижаты","noteEn":"Lift with the abdominals, feet pressed down"},{"exerciseId":"mountain_climber","unit":"reps","target":100,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"ca_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_cap_b', 'Крышка B', 'Тот же формат и тот же лимит, список злее: 45 бёрпи, 70 прыжковых приседаний, 60 отжиманий от стула, 60 складок, 100 конькобежцев. Прыжковый присед в середине — место, где ломается темп: раздели его на пятёрки заранее, а не когда станет тяжело.

ПРИМЕЧАНИЕ ‼️ Стул для отжиманий — без колёсиков и к стене. 🎯 цель — уложиться в 16 минут.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"cb_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":960,"title":"На время · лимит 16 мин","titleEn":"For time · 16-min cap","description":"Сверху вниз, по одному движению за раз. Разбивай на части заранее, а не по факту усталости.","descriptionEn":"Top to bottom, one movement at a time. Plan the breaks in advance, not when the fatigue decides for you.","scalable":true,"blockId":"cb_main","items":[{"exerciseId":"burpee","unit":"reps","target":45,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"jump_squat","unit":"reps","target":70,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"chair_dip","unit":"reps","target":60,"restAfterSec":0,"note":"Стул без колёсиков, к стене. Плечи вниз от ушей, опускайся до комфортной глубины","noteEn":"A chair without wheels, against the wall. Shoulders down, lower to a comfortable depth"},{"exerciseId":"v_up","unit":"reps","target":60,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"skater","unit":"reps","target":100,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"cb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 125)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_cap_c', 'Крышка C', 'Финальная «крышка»: 50 бёрпи, 80 прыжков с коленями к груди, 60 узких отжиманий, 70 складок, 120 двойных прыжков на скакалке. Нет скакалки — приложение поставит джампинг-джеки, и это честная замена по времени.

ПРИМЕЧАНИЕ ‼️ Это самый длинный список курса, и лимит тот же. Закрыть его — не обязательство, а хороший день. 🎯 цель — дойти до скакалки к двенадцатой минуте.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"cc_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":1,"setsField":"sets","durationSec":960,"title":"На время · лимит 16 мин","titleEn":"For time · 16-min cap","description":"Сверху вниз, по одному движению за раз. Последним идёт самое быстрое — оставь на него силы.","descriptionEn":"Top to bottom, one movement at a time. The fastest one comes last — leave something for it.","scalable":true,"blockId":"cc_main","items":[{"exerciseId":"burpee","unit":"reps","target":50,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"},{"exerciseId":"tuck_jump","unit":"reps","target":80,"restAfterSec":0,"note":"Колени к груди, приземление тихое. Стало шумно — останови подход","noteEn":"Knees to the chest, a quiet landing. Gone noisy? End the set"},{"exerciseId":"diamond_push_up","unit":"reps","target":60,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"v_up","unit":"reps","target":70,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"double_under","unit":"reps","target":120,"restAfterSec":0,"note":"Прыжок чуть выше обычного, кисти у бёдер. Нет скакалки — приложение заменит на джампинг-джеки","noteEn":"Jump slightly higher than usual, hands by the hips. No rope — the app swaps in jumping jacks"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"cc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 130)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_rounds_a', 'Круги без отдыха A', 'Пять кругов на время, и между кругами не заложено ничего: закончил подъёмы корпуса — начинай приседания следующего круга. Отдых здесь существует только как твоё решение, и в этом вся тренировка: ровный темп, который держится пять кругов, быстрее рывка и паузы.

ПРИМЕЧАНИЕ ‼️ Первый круг должен ощущаться слишком лёгким. Если нет — ты стартовал слишком быстро. 🎯 цель — пятый круг не медленнее первого больше чем на 30 секунд.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"ra_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":5,"setsField":"sets","durationSec":1080,"restBetweenRoundsSec":0,"title":"5 кругов на время · лимит 18 мин","titleEn":"5 rounds for time · 18-min cap","description":"Между кругами ничего не заложено. Паузу берёшь сам и сам за неё платишь временем.","descriptionEn":"Nothing is scheduled between the rounds. You take the pause yourself, and you pay for it on the clock.","scalable":true,"blockId":"ra_main","items":[{"exerciseId":"air_squat","unit":"reps","target":20,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"push_up","unit":"reps","target":12,"restAfterSec":0,"note":"Корпус одной линией, локти вдоль тела, грудь до пола","noteEn":"Body in one line, elbows close, chest to the floor"},{"exerciseId":"sit_up","unit":"reps","target":20,"restAfterSec":0,"note":"Поднимаемся животом, стопы прижаты","noteEn":"Lift with the abdominals, feet pressed down"},{"exerciseId":"mountain_climber","unit":"reps","target":30,"restAfterSec":0,"note":"Плечи над кистями, таз не задираем. Каждое колено — повтор","noteEn":"Shoulders over the wrists, hips not piked. Every knee drive is a rep"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"ra_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 120)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_rounds_b', 'Круги без отдыха B', 'Пять кругов, движения сложнее: прыжковые приседания, отжимания от стула, складки, конькобежец. Прыжок стоит первым в круге специально — на усталости ноги теряют технику раньше рук, и лучше встречать это на свежую голову в начале круга.

ПРИМЕЧАНИЕ ‼️ Если колено начинает заваливаться внутрь — заканчивай подход и иди дальше. 🎯 цель — пять кругов ровным темпом.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"rb_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":5,"setsField":"sets","durationSec":1080,"restBetweenRoundsSec":0,"title":"5 кругов на время · лимит 18 мин","titleEn":"5 rounds for time · 18-min cap","description":"Между кругами ничего не заложено. Считай круги вслух — на четвёртом это помогает.","descriptionEn":"Nothing is scheduled between the rounds. Count them out loud — by the fourth it helps.","scalable":true,"blockId":"rb_main","items":[{"exerciseId":"jump_squat","unit":"reps","target":20,"restAfterSec":0,"note":"Приземляемся мягко через носок в пятку, колено не заваливаем внутрь","noteEn":"Land softly, toe to heel, do not let the knee cave in"},{"exerciseId":"chair_dip","unit":"reps","target":15,"restAfterSec":0,"note":"Стул без колёсиков, к стене. Плечи вниз от ушей, опускайся до комфортной глубины","noteEn":"A chair without wheels, against the wall. Shoulders down, lower to a comfortable depth"},{"exerciseId":"v_up","unit":"reps","target":15,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"skater","unit":"reps","target":30,"restAfterSec":0,"note":"Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой","noteEn":"Counted as the total. Jump sideways, land on one leg and pause"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"rb_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 125)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_rounds_c', 'Круги без отдыха C', 'Пять кругов из движений, которых не было на первой неделе: прыжковые выпады, узкие отжимания, складки, бёрпи. Бёрпи в конце круга — это место, где решается, ровный у тебя темп или нет.

ПРИМЕЧАНИЕ ‼️ Прыжковый выпад считается в сумме на две ноги. 🎯 цель — не остановиться перед бёрпи ни в одном круге.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"rc_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"metcon","format":"fortime","sets":5,"setsField":"sets","durationSec":1080,"restBetweenRoundsSec":0,"title":"5 кругов на время · лимит 18 мин","titleEn":"5 rounds for time · 18-min cap","description":"Между кругами ничего не заложено. Последний круг — единственное место, где можно ускориться.","descriptionEn":"Nothing is scheduled between the rounds. The last one is the only place to speed up.","scalable":true,"blockId":"rc_main","items":[{"exerciseId":"jumping_lunge","unit":"reps","target":24,"restAfterSec":0,"note":"Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе","noteEn":"Counted as the total for both legs. Trunk vertical, swap legs in the air"},{"exerciseId":"diamond_push_up","unit":"reps","target":12,"restAfterSec":0,"note":"Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире","noteEn":"Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands"},{"exerciseId":"v_up","unit":"reps","target":18,"restAfterSec":0,"note":"Складываемся одновременно руками и ногами, не тянем себя за шею","noteEn":"Fold arms and legs together, do not pull on your neck"},{"exerciseId":"burpee","unit":"reps","target":8,"restAfterSec":0,"note":"Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца","noteEn":"Chest to the floor, full extension at the top. A pace you can hold to the end"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"rc_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":6,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":25,"perSide":true,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":20,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":45,"restAfterSec":0}]}]}'::jsonb, 130)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

insert into public.custom_workouts (short_id, title, description, structure, points)
values ('tempo_w_flow', 'Лёгкий день', 'День, когда тело догоняет нагрузку. Три круга спокойной работы на позицию — присед, медвежья походка, ягодичный мостик на одной ноге, удержание в приседе, — потом кор и длинная растяжка. Пульс не должен подниматься: если в конце круга сбито дыхание, ты делаешь этот день неправильно.

ПРИМЕЧАНИЕ ‼️ Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке. 🎯 цель — уйти с тренировки свежее, чем пришёл.',
  '{"sections":[{"kind":"warmup","blockType":"warmup","format":"circuit","sets":1,"setsField":"sets","title":"Разминка: суставная гимнастика","titleEn":"Warm-up: joint mobility","description":"Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.","descriptionEn":"Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.","scalable":false,"blockId":"fl_warmup","items":[{"exerciseId":"neck_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"arm_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"elbow_wrist_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"side_bend","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"hip_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"leg_swing","unit":"reps","target":6,"perSide":true,"restAfterSec":0},{"exerciseId":"knee_circles","unit":"seconds","target":20,"restAfterSec":0},{"exerciseId":"ankle_circles","unit":"seconds","target":15,"perSide":true,"restAfterSec":0},{"exerciseId":"squat_to_stand","unit":"reps","target":5,"restAfterSec":0}]},{"kind":"main","blockType":"skill","format":"circuit","sets":3,"setsField":"sets","restBetweenRoundsSec":60,"title":"Техника · 3 круга","titleEn":"Technique · 3 rounds","description":"Три круга в темпе разговора. Полная амплитуда, пауза в крайней точке, без спешки.","descriptionEn":"Three rounds at a talking pace. Full range, a pause at the end point, no rush.","scalable":false,"blockId":"fl_skill","items":[{"exerciseId":"air_squat","unit":"reps","target":12,"restAfterSec":0,"note":"Пятки на полу, колени в стороны, наверху выпрямляемся полностью","noteEn":"Heels down, knees out, full extension at the top"},{"exerciseId":"bear_crawl","unit":"seconds","target":25,"restAfterSec":0,"note":"Колени в сантиметре от пола, таз низко","noteEn":"Knees a centimetre off the floor, hips low"},{"exerciseId":"single_leg_glute_bridge","unit":"reps","target":8,"perSide":true,"restAfterSec":0,"note":"Таз поднимаем ягодицей, а не поясницей. Наверху пауза на счёт","noteEn":"Lift with the glute, not the lower back. Pause at the top for a count"},{"exerciseId":"squat_hold","unit":"seconds","target":25,"restAfterSec":0}]},{"kind":"main","blockType":"core","format":"circuit","sets":2,"setsField":"sets","restBetweenRoundsSec":45,"title":"Кор","titleEn":"Core","scalable":false,"blockId":"fl_core","items":[{"exerciseId":"hollow_hold","unit":"seconds","target":25,"restAfterSec":0,"note":"Поясница прижата к полу. Не держится — согни колени и подними руки","noteEn":"Lower back pressed into the floor. Losing it? Bend the knees and raise the arms"},{"exerciseId":"side_plank","unit":"seconds","target":20,"perSide":true,"restAfterSec":0,"note":"Таз высоко, плечо строго над локтем","noteEn":"Hips high, shoulder directly over the elbow"},{"exerciseId":"superman","unit":"reps","target":10,"restAfterSec":0,"note":"Поднимаем грудь и бёдра, шея — продолжение позвоночника","noteEn":"Lift chest and thighs, neck in line with the spine"}]},{"kind":"cooldown","blockType":"cooldown","format":"sets","sets":1,"setsField":"sets","title":"Заминка и растяжка","titleEn":"Cool-down and stretch","description":"Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.","descriptionEn":"Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.","scalable":false,"blockId":"fl_cooldown","items":[{"exerciseId":"cat_cow","unit":"reps","target":8,"restAfterSec":0},{"exerciseId":"hip_flexor_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"hamstring_stretch","unit":"seconds","target":45,"perSide":true,"restAfterSec":0},{"exerciseId":"quad_stretch","unit":"seconds","target":30,"perSide":true,"restAfterSec":0},{"exerciseId":"child_pose","unit":"seconds","target":60,"restAfterSec":0}]}]}'::jsonb, 90)
on conflict (short_id) do update set
  title = excluded.title,
  description = excluded.description,
  structure = excluded.structure,
  points = excluded.points,
  updated_at = now();

-- days
insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d1_gate', 1, 1, 'benchmark', (select id from public.custom_workouts where short_id = 'tempo_w_gate'),
  '{"title":{"ru":"Пять кругов","en":"Five rounds"},"subtitle":{"ru":"Замер · с этого начинается отсчёт","en":"Measurement · the clock starts here"},"body":[]}'::jsonb, false, 0
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d2_rest', 1, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после прыжков — норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Soreness after jumping days is normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 1
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d3_strength', 1, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_a'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 90 с","en":"3 sets · 90 s rest"},"body":[]}'::jsonb, false, 2
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d4_ladder', 1, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_a'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 3
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d5_rest', 1, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 4
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d6_cap', 1, 6, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_a'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 5
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w1d7_rest', 1, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 6
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d1_strength', 2, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_a'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 90 с","en":"3 sets · 90 s rest"},"body":[]}'::jsonb, false, 7
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d2_rest', 2, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 8
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d3_ladder', 2, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_a'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 9
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d4_cap', 2, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_a'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 10
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d5_rest', 2, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после прыжков — норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Soreness after jumping days is normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 11
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d6_rounds', 2, 6, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_rounds_a'),
  '{"title":{"ru":"Круги без отдыха","en":"Rounds without a break"},"subtitle":{"ru":"5 кругов · без пауз между ними","en":"5 rounds · no pause between them"},"body":[]}'::jsonb, false, 12
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w2d7_rest', 2, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 13
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d1_strength', 3, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_b'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 75 с","en":"3 sets · 75 s rest"},"body":[]}'::jsonb, false, 14
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d2_rest', 3, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 15
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d3_ladder', 3, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_b'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 16
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d4_cap', 3, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_b'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 17
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d5_rest', 3, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра замер: шаги, вода, ранний сон. Никакой «дополнительной» работы сегодня.","en":"The measurement is tomorrow: steps, water, an early night. No \"extra\" work today."},"body":[]}'::jsonb, false, 18
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d6_gate', 3, 6, 'benchmark', (select id from public.custom_workouts where short_id = 'tempo_w_gate'),
  '{"title":{"ru":"Пять кругов","en":"Five rounds"},"subtitle":{"ru":"Замер · сравни с первой неделей","en":"Measurement · compare with week one"},"body":[]}'::jsonb, false, 19
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w3d7_rest', 3, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 20
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d1_strength', 4, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_b'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 75 с","en":"3 sets · 75 s rest"},"body":[]}'::jsonb, false, 21
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d2_rest', 4, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 22
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d3_ladder', 4, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_b'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 23
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d4_cap', 4, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_b'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 24
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d5_rest', 4, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после прыжков — норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Soreness after jumping days is normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 25
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d6_rounds', 4, 6, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_rounds_b'),
  '{"title":{"ru":"Круги без отдыха","en":"Rounds without a break"},"subtitle":{"ru":"5 кругов · без пауз между ними","en":"5 rounds · no pause between them"},"body":[]}'::jsonb, false, 26
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w4d7_rest', 4, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 27
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d1_strength', 5, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_b'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, 28
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d2_rest', 5, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет четыре недели плотной работы.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with four dense weeks."},"body":[]}'::jsonb, false, 29
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d3_flow', 5, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Техника и растяжка","en":"Technique and stretching"},"body":[]}'::jsonb, false, 30
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d4_ladder', 5, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_b'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, 31
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d5_rest', 5, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет четыре недели плотной работы.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with four dense weeks."},"body":[]}'::jsonb, false, 32
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d6_rounds', 5, 6, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_rounds_b'),
  '{"title":{"ru":"Круги без отдыха","en":"Rounds without a break"},"subtitle":{"ru":"Разгрузка · объём −35 %","en":"Deload · volume −35%"},"body":[]}'::jsonb, true, 33
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w5d7_rest', 5, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет четыре недели плотной работы.","en":"Deload week: walk, sleep, eat properly. Your body is catching up with four dense weeks."},"body":[]}'::jsonb, false, 34
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d1_strength', 6, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_c'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 60 с","en":"3 sets · 60 s rest"},"body":[]}'::jsonb, false, 35
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d2_rest', 6, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 36
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d3_ladder', 6, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_c'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 37
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d4_cap', 6, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_c'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 38
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d5_rest', 6, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра замер: шаги, вода, ранний сон. Никакой «дополнительной» работы сегодня.","en":"The measurement is tomorrow: steps, water, an early night. No \"extra\" work today."},"body":[]}'::jsonb, false, 39
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d6_gate', 6, 6, 'benchmark', (select id from public.custom_workouts where short_id = 'tempo_w_gate'),
  '{"title":{"ru":"Пять кругов","en":"Five rounds"},"subtitle":{"ru":"Замер · третий раз, тот же список","en":"Measurement · third time, same list"},"body":[]}'::jsonb, false, 40
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w6d7_rest', 6, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 41
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d1_strength', 7, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_c'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 60 с","en":"3 sets · 60 s rest"},"body":[]}'::jsonb, false, 42
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d2_rest', 7, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Крепатура после прыжков — норма. Прогулка разгонит кровь быстрее, чем диван.","en":"Soreness after jumping days is normal. A walk gets the blood moving faster than the couch."},"body":[]}'::jsonb, false, 43
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d3_ladder', 7, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_ladder_c'),
  '{"title":{"ru":"Лестница","en":"The ladder"},"subtitle":{"ru":"EMOM 15 · ступени растут","en":"EMOM 15 · the rungs climb"},"body":[]}'::jsonb, false, 44
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d4_cap', 7, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_cap_c'),
  '{"title":{"ru":"Крышка","en":"The cap"},"subtitle":{"ru":"На время · лимит 16 мин","en":"For time · 16-min cap"},"body":[]}'::jsonb, false, 45
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d5_rest', 7, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 46
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d6_rounds', 7, 6, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_rounds_c'),
  '{"title":{"ru":"Круги без отдыха","en":"Rounds without a break"},"subtitle":{"ru":"5 кругов · без пауз между ними","en":"5 rounds · no pause between them"},"body":[]}'::jsonb, false, 47
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w7d7_rest', 7, 7, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Пройди 8000 шагов и отметь их в приложении — день зачтётся в серию.","en":"Walk 8,000 steps and log them in the app — the day counts toward your streak."},"body":[]}'::jsonb, false, 48
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d1_strength', 8, 1, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_strength_c'),
  '{"title":{"ru":"Сила без паузы","en":"Strength without a pause"},"subtitle":{"ru":"3 подхода · отдых 60 с","en":"3 sets · 60 s rest"},"body":[]}'::jsonb, false, 49
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d2_rest', 8, 2, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.","en":"8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it."},"body":[]}'::jsonb, false, 50
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d3_rounds', 8, 3, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_rounds_c'),
  '{"title":{"ru":"Круги без отдыха","en":"Rounds without a break"},"subtitle":{"ru":"5 кругов · без пауз между ними","en":"5 rounds · no pause between them"},"body":[]}'::jsonb, false, 51
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d4_flow', 8, 4, 'workout', (select id from public.custom_workouts where short_id = 'tempo_w_flow'),
  '{"title":{"ru":"Лёгкий день","en":"Easy day"},"subtitle":{"ru":"Техника и растяжка","en":"Technique and stretching"},"body":[]}'::jsonb, false, 52
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d5_rest', 8, 5, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.","en":"A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session."},"body":[]}'::jsonb, false, 53
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d6_rest', 8, 6, 'rest', null,
  '{"title":{"ru":"Отдых и прогулка","en":"Rest & walk"},"subtitle":{"ru":"Завтра замер: шаги, вода, ранний сон. Никакой «дополнительной» работы сегодня.","en":"The measurement is tomorrow: steps, water, an early night. No \"extra\" work today."},"body":[]}'::jsonb, false, 54
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.admin_course_days (
  course_id, node_id, week, day, kind, custom_workout_id, content, deload,
  sort_order
) values (
  (select id from public.admin_courses where slug_id = 'tempo'),
  'w8d7_gate', 8, 7, 'benchmark', (select id from public.custom_workouts where short_id = 'tempo_w_gate'),
  '{"title":{"ru":"Пять кругов","en":"Five rounds"},"subtitle":{"ru":"Замер · те же пять кругов, восемь недель спустя","en":"Measurement · the same five rounds, eight weeks on"},"body":[]}'::jsonb, false, 55
)
on conflict (course_id, node_id) do update set
  week = excluded.week,
  day = excluded.day,
  kind = excluded.kind,
  custom_workout_id = excluded.custom_workout_id,
  content = excluded.content,
  deload = excluded.deload,
  sort_order = excluded.sort_order,
  updated_at = now();
