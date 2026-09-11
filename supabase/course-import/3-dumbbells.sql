-- PART 3 OF 5 — Гантели дома: сила и рельеф
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
-- dumbbells — Гантели дома: сила и рельеф
-- 16 workouts, 42 days
-- ---------------------------------------------------------------------------
insert into public.admin_courses (
  slug_id, status, sort_order, level, weeks, sessions_per_week, avg_session_min,
  equipment, tile, price_rub, price_usd, content
) values (
  'dumbbells', 'draft', 3, 2, 6, 4, 35,
  '{"dumbbells","none","mat"}'::text[], '#16202b', 3990, 39,
  '{"slug":{"ru":"ganteli-doma-sila-i-relef","en":"dumbbell-builder"},"name":{"ru":"Гантели дома: сила и рельеф","en":"Dumbbell Builder"},"tagline":{"ru":"Шесть недель силовых тренировок с парой гантелей — присед, тяга, жим и трастеры, четыре дня в неделю.","en":"Six weeks of strength training with a pair of dumbbells — squats, deadlifts, presses and thrusters, four days a week."},"description":{"ru":"Силовая программа для дома с гантелями: два силовых дня в неделю, день выносливости с рывком и взятием на грудь и день комплексов. Разгрузочная неделя, два бенчмарка — «DT» и 21-15-9 трастеров с бёрпи — и один и тот же тест в начале и в конце.","en":"A home strength program with dumbbells: two strength days a week, a conditioning day built around snatches and cleans, and a complex day. A deload week, two benchmarks — DT and 21-15-9 thrusters with burpees — and the same test at the start and the end."},"longDescription":[{"ru":"Пара гантелей — это почти целый зал. С ними можно приседать, тянуть с пола, жать стоя и лёжа, делать выпады, взятия и рывки. Курс построен вокруг шести базовых движений — гоблет- и фронтальный присед, становая и румынская тяга, тяга в наклоне, жим и швунг, — и каждую неделю они становятся чуть тяжелее или объёмнее: три подхода превращаются в четыре, средний вес — в тяжёлый, жим стоя — в швунг, а присед и жим — в трастер.","en":"A pair of dumbbells is very nearly a whole gym. You can squat, lift from the floor, press standing and lying, lunge, clean and snatch with them. The course is built around six base movements — goblet and front squats, deadlifts and Romanian deadlifts, bent-over rows, presses and push presses — and every week they get a little heavier or bigger: three sets become four, medium weight becomes heavy, the standing press becomes a push press, and squat plus press becomes a thruster."},{"ru":"Неделя выглядит так: день приседа и жима, день тяги и спины — оба с блоком на кор, — день «двигателя» с EMOM, AMRAP или табатой и день комплексов, где гантели не выпускают из рук несколько движений подряд. Между тренировками — дни отдыха с целью 7000 шагов. Четвёртая неделя разгрузочная: объём падает примерно на треть, и именно после неё сила обычно делает скачок.","en":"A week looks like this: a squat & press day, a hinge & pull day — both with a core block — an engine day with an EMOM, AMRAP or Tabata, and a complex day where the dumbbells stay in your hands through several movements in a row. Between sessions are rest days with a 7,000-step goal. Week four is a deload: volume drops by about a third, and that is usually when strength jumps."},{"ru":"Веса в программе обозначены как лёгкий, средний и тяжёлый — приложение само сопоставляет их с гантелями, которые ты указал в профиле. Количество повторений подбирается по входному тесту и корректируется после каждой тренировки по твоей оценке усилия. Если какое-то движение пока не по силам — рывок или тяга ренегата, — приложение подставит вариант проще.","en":"Loads in the program are labelled light, medium and heavy — the app maps them to the dumbbells you listed in your profile. Rep counts come from the baseline test and are adjusted after every session from your effort rating. If a movement is not there yet — the snatch or the renegade row — the app substitutes an easier variant."},{"ru":"Два бенчмарка держат курс в тонусе: в третью неделю — «DT» с гантелями, пять кругов становой, взятий и швунгов на время; в шестую — 21-15-9 трастеров и бёрпи. А в самом начале и в самом конце — один и тот же тест: отжимания, приседания, планка и бёрпи. Так ты увидишь прогресс не в ощущениях, а в цифрах.","en":"Two benchmarks keep the course honest: in week three, dumbbell DT — five rounds of deadlifts, cleans and push presses for time; in week six, 21-15-9 thrusters and burpees. And at the very start and the very end, the same test: push-ups, squats, plank and burpees. That way you see your progress in numbers, not just in feelings."}],"forWhom":[{"ru":"У тебя есть пара гантелей (лучше две пары или разборные) и коврик.","en":"You own a pair of dumbbells (two pairs or adjustables are better) and a mat."},{"ru":"Ты уже отжимаешься 8–10 раз подряд и держишь планку минуту — или прошёл курс «Старт».","en":"You can already do 8–10 push-ups in a row and hold a plank for a minute — or you finished the Start course."},{"ru":"Хочешь стать сильнее и подтянуть рельеф, а не только сбросить вес.","en":"You want to get stronger and build definition, not just lose weight."},{"ru":"Тебе нравится структура: подходы, веса, прогрессия и понятные бенчмарки.","en":"You like structure: sets, weights, progression and clear benchmarks."},{"ru":"Есть 30–40 минут четыре раза в неделю.","en":"You have 30–40 minutes four times a week."}],"outcomes":[{"ru":"Уверенная техника шести базовых движений с гантелями: присед, становая, румынская тяга, тяга в наклоне, жим, швунг.","en":"Confident technique in six base dumbbell movements: squat, deadlift, Romanian deadlift, row, press, push press."},{"ru":"Освоишь взятие на грудь, рывок гантели и трастер — движения, из которых состоят кроссфит-комплексы.","en":"You learn the dumbbell clean, snatch and thruster — the movements CrossFit workouts are built from."},{"ru":"Рабочие веса вырастут: от средних гантелей в первую неделю к тяжёлым в пятую.","en":"Your working weights go up: from medium dumbbells in week one to heavy ones in week five."},{"ru":"Два бенчмарка с результатом на время: «DT» с гантелями и 21-15-9.","en":"Two benchmarks with a time to beat: dumbbell DT and 21-15-9."},{"ru":"Больше отжиманий, приседаний и бёрпи в повторном тесте — сравнишь с первой неделей.","en":"More push-ups, squats and burpees in the retest — you compare with week one."},{"ru":"Привычка к четырём тренировкам в неделю с отдыхом и разгрузкой, без перегруза.","en":"A habit of four sessions a week with rest days and a deload — without burning out."}],"faq":[{"q":{"ru":"Какие гантели нужны?","en":"What dumbbells do I need?"},"a":{"ru":"Минимум — одна пара. Идеально — две пары или разборные гантели: лёгкая для трастеров, рывков и AMRAP и тяжёлая для становой, тяги и приседа. Ориентир для «лёгкой»: ты можешь чисто выжать её над головой 15 раз подряд; для «тяжёлой»: 8 становых тяг даются с усилием. Если пара одна, все три метки нагрузки будут указывать на неё — регулируй темпом и паузами, а в быстрых движениях бери одну гантель вместо двух.","en":"One pair at minimum. Ideally two pairs or adjustable dumbbells: a light one for thrusters, snatches and AMRAPs and a heavy one for deadlifts, rows and squats. Rule of thumb for ''light'': you can press it overhead cleanly 15 times in a row; for ''heavy'': 8 deadlifts take real effort. If you own a single pair, all three load labels will point to it — adjust with tempo and pauses, and use one dumbbell instead of two in the fast movements."}},{"q":{"ru":"Мне подойдёт этот курс или лучше начать со «Старта»?","en":"Is this course right for me, or should I begin with Start?"},"a":{"ru":"Ориентир: 8–10 отжиманий от пола подряд, минута планки и 15 приседаний с гантелью у груди без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт» или «Своим весом»: там те же паттерны движения без веса, а через месяц-полтора гантели дадутся легче и безопаснее.","en":"Rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15 goblet squats without getting winded. If that is you, jump in. If not yet, do Start or Bodyweight Engine first: the same movement patterns without load, and in a month or so the dumbbells will come easier and safer."}},{"q":{"ru":"Сколько времени занимает тренировка?","en":"How long is a session?"},"a":{"ru":"Силовые дни — 30–40 минут вместе с разминкой и заминкой, «двигатель» — около 25, комплексы — около 30, бенчмарки — 18–20 минут: они короткие, но самые тяжёлые в курсе. В среднем выходит чуть больше получаса. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.","en":"Strength days run 30–40 minutes including warm-up and cool-down, engine days about 25, complexes about 30, and the benchmarks 18–20 minutes: short, but the hardest sessions of the course. The average lands a little over half an hour. Before you start, the app shows the estimated time for each of the three difficulty options."}},{"q":{"ru":"Пропустил тренировку — что делать?","en":"I missed a session — what now?"},"a":{"ru":"Просто продолжай со следующего узла, когда сможешь: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — лучше сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках и возвращайся к прежним весам постепенно.","en":"Just continue from the next node when you can: the path does not reset. Do not stack two strength days back to back to ''catch up'' — shift the week instead. After a break longer than two weeks, pick ''Easier'' for the first two sessions and ease back into your old weights gradually."}},{"q":{"ru":"Как приложение подбирает нагрузку и вес?","en":"How does the app pick the load and the weight?"},"a":{"ru":"Количество повторений считается по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — приложение чуть поднимает или снижает объём в следующий раз. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля: самая лёгкая, средняя, самая тяжёлая. В разгрузочную неделю объём снижается автоматически, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее».","en":"Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the app nudges the volume up or down next time. The labels ''light'', ''medium'' and ''heavy'' are mapped to the dumbbells in your profile: the lightest, the middle one, the heaviest. In the deload week volume drops automatically, and before every session you can choose Easier, As usual or Harder."}},{"q":{"ru":"После становой тянет поясницу. Это нормально?","en":"My lower back feels it after deadlifts. Is that normal?"},"a":{"ru":"Лёгкая усталость в мышцах вдоль позвоночника на следующий день — норма: они тоже работали. Острая боль, прострел или боль, которая усиливается при наклоне, — нет. В этом случае отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку. Проверь технику: гантели близко к голеням, спина прямая, движение начинается с таза, а не с поясницы. Если поясница беспокоит регулярно, укажи это в ограничениях профиля — приложение заменит тяжёлые наклоны более безопасными вариантами — и покажись врачу.","en":"Mild fatigue in the muscles along the spine the next day is normal: they worked too. Sharp pain, a sudden twinge or pain that gets worse as you bend is not. In that case mark ''Pain'' in the post-workout feedback: the app reduces the load. Check your technique: dumbbells close to the shins, back flat, the movement starts from the hips, not the lower back. If your lower back bothers you regularly, add it to the limitations in your profile — the app swaps heavy hinges for safer variants — and see a doctor."}}]}'::jsonb
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
