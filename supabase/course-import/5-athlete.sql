-- PART 5 OF 5 — Атлет: продвинутый домашний кроссфит
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
-- athlete — Атлет: продвинутый домашний кроссфит
-- 18 workouts, 55 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'athlete', 'draft', 5, 3, 8, 4, 40,
  '{"dumbbells","pullup_bar","jump_rope","none","mat"}'::text[], '#1c2532', 4990, 49,
  '{"slug":{"ru":"atlet-prodvinutyj-domashnij-krossfit","en":"home-athlete"},"name":{"ru":"Атлет: продвинутый домашний кроссфит","en":"Home Athlete"},"tagline":{"ru":"Восемь недель продвинутого кроссфита дома: подтягивания, двойные прыжки, дьявольский жим, длинные AMRAP — и «Мёрф» в финале.","en":"Eight weeks of advanced CrossFit at home: pull-ups, double-unders, devil presses, long AMRAPs — and Murph at the end."},"description":{"ru":"Курс для тех, кто уже тренируется и хочет большего: четыре дня в неделю, гантели, турник и скакалка. Два силовых дня — присед и жим, тяга и подтягивания, — день «двигателя» с EMOM, AMRAP и табатой и день чипперов. Разгрузка в четвёртую неделю с «Синди» на 20 минут в её конце и половина «Мёрфа» в восьмую.","en":"For those who already train and want more: four days a week, dumbbells, a pull-up bar and a jump rope. Two strength days — squat & push, pull & hinge — an engine day with EMOMs, AMRAPs and Tabata, and a chipper day. A deload in week four with a 20-minute Cindy at its end, and Half Murph in week eight."},"longDescription":[{"ru":"Это третий уровень: курс для тех, кто отжимается двадцать пять раз подряд, держит планку две минуты и хотя бы раз висел на турнике с мыслью «а если подтянуться?». Восемь недель построены вокруг трёх навыков, которых нет в младших курсах: строгие подтягивания, двойные прыжки на скакалке и дьявольский жим. Каждый идёт по своей лестнице — негативные подтягивания превращаются в строгие по четыре, потом по шесть; синглы на скакалке — в серии двойных; бёрпи — в бёрпи с гантелями и махом над головой.","en":"This is level three: a course for someone who does twenty-five push-ups in a row, holds a plank for two minutes and has hung from a bar at least once thinking \"what if I pulled?\". Eight weeks are built around three skills the earlier courses do not have: strict pull-ups, double-unders and the devil press. Each climbs its own ladder — negative pull-ups become strict sets of four, then six; single-unders become sets of doubles; burpees become burpees with dumbbells and a swing overhead."},{"ru":"Неделя — четыре тренировки. День приседа и жима: фронтальный присед и швунг с тяжёлой парой, прыжковые выпады, отжимания, короткий AMRAP и кор. День тяги и подтягиваний: подтягивания в паре с подъёмами коленей в висе, становая и румынская тяга, тяга ренегата, прогулка фермера. День «двигателя»: EMOM-куплеты, AMRAP 15, табата, EMOM 16 из четырёх движений. И шестой день — чипперы и репетиции «Мёрфа». Между ними дни отдыха с целью 7000 шагов: в этом курсе они важны не меньше тренировок.","en":"A week is four sessions. Squat & push day: front squats and push presses with the heavy pair, jumping lunges, push-ups, a short AMRAP and core. Pull & hinge day: pull-ups paired with hanging knee raises, deadlifts and Romanian deadlifts, renegade rows, the farmer carry. Engine day: EMOM couplets, AMRAP 15, Tabata, a four-movement EMOM 16. And day six — chippers and Murph rehearsals. Between them, rest days with a 7,000-step goal: in this course they matter as much as the sessions."},{"ru":"Объём растёт волнами: недели 1–2 — база, 3 — тяжелее, 4 — разгрузка на треть с «Синди» в конце, 5–7 — пик: пять подходов, тяжёлая пара, EMOM 16 и репетиции «Мёрфа» на 5 и 8 кругов. Восьмая неделя лёгкая: техника, половина «Мёрфа» и тот же тест, что в первый день. Приложение подбирает повторения по входному тесту и твоей оценке усилия после каждой тренировки, а веса — по гантелям из профиля. Если движение пока недоступно — двойные без скакалки или подтягивания без турника, — оно подставит вариант проще.","en":"Volume rises in waves: weeks 1–2 are the base, week 3 is heavier, week 4 is a one-third deload with Cindy at its end, weeks 5–7 are the peak: five sets, the heavy pair, EMOM 16 and Murph rehearsals of 5 and 8 rounds. Week eight is light: technique, Half Murph and the same test as on day one. The app sets rep counts from the baseline test and your effort rating after every session, and weights from the dumbbells in your profile. If a movement is not available yet — double-unders without a rope or pull-ups without a bar — it substitutes an easier variant."},{"ru":"Два бенчмарка держат курс в тонусе. «Синди» — 20 минут AMRAP из 5 подтягиваний, 10 отжиманий и 15 приседаний — в конце четвёртой недели. Половина «Мёрфа» — бег, 50 подтягиваний, 100 отжиманий, 150 приседаний, бег, лимит 40 минут — в восьмую. К ней ты подойдёшь через три репетиции, зная свою разбивку и свой темп. А входной и повторный тест покажут, сколько отжиманий, приседаний и бёрпи прибавилось за два месяца.","en":"Two benchmarks keep the course honest. Cindy — a 20-minute AMRAP of 5 pull-ups, 10 push-ups and 15 squats — at the end of week four. Half Murph — run, 50 pull-ups, 100 push-ups, 150 squats, run, 40-minute cap — in week eight. You arrive at it after three rehearsals, knowing your partitioning and your pace. And the baseline and final tests show how many push-ups, squats and burpees two months added."}],"forWhom":[{"ru":"У тебя есть пара гантелей (лучше две пары или разборные), турник и скакалка.","en":"You own a pair of dumbbells (two pairs or adjustables are better), a pull-up bar and a jump rope."},{"ru":"Ты отжимаешься 20–25 раз подряд, держишь планку две минуты и висишь на турнике хотя бы 30 секунд — или прошёл «Своим весом» или «Гантели дома».","en":"You do 20–25 push-ups in a row, hold a plank for two minutes and can hang from the bar for at least 30 seconds — or you finished Bodyweight Engine or Dumbbell Builder."},{"ru":"Хочешь первое строгое подтягивание — или десятое — и серии двойных на скакалке.","en":"You want your first strict pull-up — or your tenth — and sets of double-unders."},{"ru":"Тебе нужен вызов с понятной целью: «Синди» и «Мёрф» на время.","en":"You want a challenge with a clear goal: Cindy and Murph on the clock."},{"ru":"Есть 35–45 минут четыре раза в неделю и готовность отдыхать в дни отдыха.","en":"You have 35–45 minutes four times a week and the discipline to rest on rest days."}],"outcomes":[{"ru":"Строгие подтягивания: от негативных к подходам по шесть — тридцать подтягиваний за тренировку к седьмой неделе.","en":"Strict pull-ups: from negatives to sets of six — thirty pull-ups in a session by week seven."},{"ru":"Двойные прыжки на скакалке сериями по 20–40 внутри метконов.","en":"Double-unders in sets of 20–40 inside metcons."},{"ru":"Дьявольский жим, рывок гантели, трастер и тяга ренегата — в силовых блоках и в EMOM.","en":"The devil press, dumbbell snatch, thruster and renegade row — in strength blocks and in EMOMs."},{"ru":"Результат в «Синди» (круги за 20 минут) и в половине «Мёрфа» (время при лимите 40 минут).","en":"A Cindy score (rounds in 20 minutes) and a Half Murph time (40-minute cap)."},{"ru":"Умение держать темп в длинных AMRAP и чипперах и разбивать большие числа на выполнимые серии.","en":"The skill of pacing long AMRAPs and chippers and breaking big numbers into doable sets."},{"ru":"Больше отжиманий, приседаний и бёрпи в повторном тесте — и привычка к четырём тренировкам в неделю с разгрузкой.","en":"More push-ups, squats and burpees in the retest — and a habit of four sessions a week with a built-in deload."}],"faq":[{"q":{"ru":"Какое оборудование нужно и можно ли без чего-то обойтись?","en":"What equipment do I need, and can I skip any of it?"},"a":{"ru":"Три вещи: пара гантелей (идеально две пары — лёгкая для рывков, трастеров и дьявольского жима, тяжёлая для приседа, становой и тяги), турник в дверном проёме или на стене и скакалка. Без турника курс теряет главное — подтягивания, — поэтому он обязателен. Без скакалки приложение заменит двойные прыжки на джампинг-джеки, но двойные — навык, который стоит освоить, а скакалка стоит недорого.","en":"Three things: a pair of dumbbells (ideally two pairs — a light one for snatches, thrusters and devil presses, a heavy one for squats, deadlifts and rows), a doorway or wall-mounted pull-up bar, and a jump rope. Without a bar the course loses its centrepiece — pull-ups — so it is mandatory. Without a rope the app swaps double-unders for jumping jacks, but doubles are a skill worth learning, and a rope costs very little."}},{"q":{"ru":"У меня нет ни одного строгого подтягивания. Мне рано?","en":"I don''t have a single strict pull-up yet. Is it too early?"},"a":{"ru":"Нет, если ты можешь висеть на турнике 30 секунд и медленно опускаться из верхней точки. Первые две недели курса — только негативные подтягивания, и именно так большинство людей получают первое строгое. С третьей недели в подходах появляются строгие, а рядом с каждым таким упражнением написано, как заменить: два строгих и два негативных, или негативные с прыжком в метконах. Если и вис пока даётся тяжело, начни с «Гантели дома» или «Своим весом» — там есть тяги и планки, которые готовят спину.","en":"Not if you can hang from the bar for 30 seconds and lower yourself slowly from the top. The first two weeks are negatives only, and that is how most people get their first strict rep. From week three strict reps appear in the sets, and every such exercise says how to scale: two strict plus two negatives, or jumping negatives in the metcons. If even the hang is hard for now, start with Dumbbell Builder or Bodyweight Engine — the rows and planks there prepare your back."}},{"q":{"ru":"Сколько длится тренировка?","en":"How long is a session?"},"a":{"ru":"В среднем 35–40 минут с разминкой и заминкой. Силовые дни — 40–48 минут (в пиковые недели ближе к 48), «двигатель» — около 30, чипперы и репетиции «Мёрфа» — 20–30. Два исключения — бенчмарки: «Синди» с разминкой занимает около 30 минут, половина «Мёрфа» — от 35 минут до часа, в зависимости от того, как ты разобьёшь повторения. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.","en":"Between 35 and 40 minutes on average with warm-up and cool-down. Strength days run 40–48 minutes (closer to 48 in the peak weeks), engine days about 30, chippers and Murph rehearsals 20–30. The two exceptions are the benchmarks: Cindy takes about 30 minutes with the warm-up, Half Murph anywhere from 35 minutes to an hour depending on how you partition the reps. Before you start, the app shows the estimated time for each of the three difficulty options."}},{"q":{"ru":"Пропустил тренировку или целую неделю — что делать?","en":"I missed a session or a whole week — what now?"},"a":{"ru":"Одну тренировку — просто продолжай со следующего узла: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках. Если выпала неделя перед «Мёрфом», сделай сначала репетицию — четверть «Мёрфа», — а бенчмарк через три-четыре дня после неё.","en":"One session — just continue from the next node: the path does not reset. Do not stack two strength days back to back to ''catch up'' — shift the week. After a break longer than two weeks, pick ''Easier'' for the first two sessions. If the missing week was the one before Murph, do a rehearsal first — Quarter Murph — and the benchmark three or four days later."}},{"q":{"ru":"Как приложение подбирает нагрузку?","en":"How does the app pick the load?"},"a":{"ru":"Повторения считаются по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — объём в следующий раз чуть растёт или снижается. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля. В разгрузочную неделю объём падает автоматически примерно на треть, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее». Двойные без скакалки и подтягивания без турника приложение заменит само, а вариант «нет строгих — негативные» ты выбираешь сам по подсказке рядом с упражнением.","en":"Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the volume nudges up or down next time. The labels ''light'', ''medium'' and ''heavy'' are mapped to the dumbbells in your profile. In the deload week volume drops by about a third automatically, and before every session you can choose Easier, As usual or Harder. Double-unders without a rope and pull-ups without a bar are substituted by the app; the ''no strict reps — do negatives'' option you choose yourself from the hint next to the exercise."}},{"q":{"ru":"Болят ладони и предплечья от турника. Это нормально?","en":"My palms and forearms hurt from the bar. Is that normal?"},"a":{"ru":"Усталость предплечий и мозоли в первые недели — норма: хват догоняет спину. Что помогает: не сжимать перекладину сильнее, чем нужно, спиливать огрубевшую кожу пемзой, чтобы мозоли не рвались, и не висеть лишнего вне плана. Острая боль в локте или плече — другое дело: отметь «Боль» в отчёте после тренировки, приложение снизит нагрузку, а подтягивания замени тягой гантели в наклоне до конца недели. Если боль держится больше недели — к врачу.","en":"Forearm fatigue and calluses in the first weeks are normal: your grip is catching up with your back. What helps: do not squeeze the bar harder than necessary, file down thick skin with a pumice stone so calluses do not tear, and do not hang extra outside the plan. Sharp pain in the elbow or shoulder is different: mark ''Pain'' in the post-workout feedback, the app reduces the load, and swap pull-ups for bent-over rows for the rest of the week. Pain that lasts more than a week means see a doctor."}}]}'::jsonb
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
