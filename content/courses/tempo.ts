/**
 * Course "tempo" — «Форма в темпе» / "Forma. Tempo".
 *
 * Eight weeks, four sessions a week, level 3, nothing but a mat, a chair and an optional rope.
 * It exists to close a hole in the ladder: `start` (level 1) and `engine` (level 2) are
 * bodyweight, `athlete` is level 3 but needs dumbbells and a pull-up bar. Somebody who finishes
 * the bodyweight branch and does not want to buy iron had nowhere to go.
 *
 * **Why it is not a strength course.** Without a bar there is no vertical pull, no horizontal
 * pull and no carry in the library, and no pistol or shrimp squat either — the object "a level-3
 * squat" does not exist. Adding the bar does not work either: `pull_up.scaling.easier` walks to
 * `negative_pull_up` and then `dead_hang`, and all three need the bar, so "bar optional" leaves
 * an athlete without one holding a session with a hole in it. So this course does not pretend.
 * Its subject is density and position: the same movements, less and less rest, held together.
 *
 * **Rest is the progression axis, and it is written as literal numbers.** `Block.adapt` and the
 * item `min`/`max` levers are validated by the schema but the engine never reads them
 * (`prescribe.ts` does not import `levers.ts`), so a declared "shrink the rest" would do nothing.
 * Instead the three phases author it by hand: 90 s between sets in phase A, 75 s in B, 60 s in C.
 * That reaches the athlete unchanged, because `prescribe.ts` deliberately leaves rest immune to
 * the difficulty choice — only the deload stretches it.
 *
 * **Authored for 24–28 minutes, not 40.** The load test measures at level 2 and scale 1.0, but a
 * level-3 athlete arrives from onboarding at scale 1.06–1.30 and can add a tenth on top by
 * choosing «посложнее». Every number here is checked so that the work of one minute still fits
 * inside that minute at 1.43× — the failure that killed three generated drafts was a ladder whose
 * top rung took ninety seconds.
 *
 * Weekly skeleton (D = day of week), the same as `engine` so somebody moving across knows it:
 *   D1 strength without a pause · D2 rest · D3 the ladder · D4 the cap · D5 rest ·
 *   D6 rounds or the gate · D7 rest
 *
 * Week 1 opens with «Пять кругов» and week 8 closes with the same piece, every block
 * `scalable: false`, so the app can put the two times side by side; weeks 3 and 6 repeat it in
 * between rather than leaving one measurement at the very end. Week 5 is a deload.
 *
 * Engine facts this file relies on:
 * - an `emom` block plays `items[(minute - 1) % items.length]`, so N items are N rungs of a
 *   ladder; the choice moves the minutes by ±20 %, so there are more rungs authored than minutes;
 * - a `fortime` block takes its round count from `sets` and scales volume by ±20 %, harder than
 *   any other format, because a for-time piece has no rest to trade away;
 * - `evenTarget` in `prescribe.ts` rounds a two-sided movement counted as a total to an even
 *   number at every scale, so the lunge counts here never come out as a limp;
 * - `leg_raise` is deliberately absent: its `scaling.harder` is `hanging_knee_raise`, which needs
 *   a bar, and a level-3 athlete who owns one would silently be given it in a course that says it
 *   needs none.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type ItemInput = BlockInput['items'][number];
type NodeInput = CourseInput['nodes'][number];

const l = (ru: string, en: string): L10n => ({ ru, en });

/* ---------------------------------------------------------------------------------------- */
/* Shared blocks                                                                              */
/* ---------------------------------------------------------------------------------------- */

/**
 * The coach's warm-up: joint mobility top to bottom, never running or jumping. Identical to the
 * beginner course on purpose — it is the same warm-up whatever the athlete can do, and it is
 * already filmed in full. `scalable: false`, so the engine neither grows nor shrinks it.
 */
function warmup(id: string): BlockInput {
  return {
    id,
    type: 'warmup',
    format: 'circuit',
    sets: 1,
    scalable: false,
    title: l('Разминка: суставная гимнастика', 'Warm-up: joint mobility'),
    description: l(
      'Обязательно перед каждой тренировкой, и на этом курсе особенно: работа плотная, суставы должны быть готовы заранее. Сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно. Разминка не входит в тренировку — это подготовка.',
      'Mandatory before every session, and on this course especially: the work is dense, so the joints have to be ready in advance. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually. The warm-up is not part of the workout — it is preparation.',
    ),
    items: [
      { exerciseId: 'neck_circles', seconds: 20 },
      { exerciseId: 'arm_circles', seconds: 20 },
      { exerciseId: 'elbow_wrist_circles', seconds: 20 },
      { exerciseId: 'side_bend', seconds: 20 },
      { exerciseId: 'hip_circles', seconds: 20 },
      { exerciseId: 'leg_swing', reps: 6, perSide: true },
      { exerciseId: 'knee_circles', seconds: 20 },
      { exerciseId: 'ankle_circles', seconds: 15, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 5 },
    ],
  };
}

/** The coach's «заминка»: spine, legs, hips, a rest pose — then write down how it went. */
function cooldown(id: string, items?: ItemInput[]): BlockInput {
  return {
    id,
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    title: l('Заминка и растяжка', 'Cool-down and stretch'),
    description: l(
      'Дыши медленно, тяни до приятного натяжения, не через боль. Потом отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым. На этом курсе записи важнее обычного — отдых между подходами сокращается каждые две недели, и по ним ты увидишь, успевает ли тело за этим.',
      'Breathe slowly, stretch to a pleasant pull, never into pain. Then record in the app how it went: the effort, what felt easy, what turned out hard. On this course those notes matter more than usual — the rest between sets shrinks every two weeks, and they are how you see whether your body is keeping up.',
    ),
    items: items ?? [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'quad_stretch', seconds: 30, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 25, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 20, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

/* ---------------------------------------------------------------------------------------- */
/* Cues                                                                                       */
/* ---------------------------------------------------------------------------------------- */

/**
 * One technique reminder per movement, applied by `withCues()` to every main-work item that has
 * no note of its own — the coach never shows a movement as a bare number.
 */
const CUES: Record<string, L10n> = {
  air_squat: l(
    'Пятки на полу, колени в стороны, наверху выпрямляемся полностью',
    'Heels down, knees out, full extension at the top',
  ),
  jump_squat: l(
    'Приземляемся мягко через носок в пятку, колено не заваливаем внутрь',
    'Land softly, toe to heel, do not let the knee cave in',
  ),
  tuck_jump: l(
    'Колени к груди, приземление тихое. Стало шумно — останови подход',
    'Knees to the chest, a quiet landing. Gone noisy? End the set',
  ),
  jumping_lunge: l(
    'Считаем в сумме на две ноги. Корпус вертикально, смена ног в воздухе',
    'Counted as the total for both legs. Trunk vertical, swap legs in the air',
  ),
  reverse_lunge: l(
    'Считаем в сумме на две ноги. Шаг назад, колено мягко к полу',
    'Counted as the total for both legs. Step back, knee softly to the floor',
  ),
  lateral_lunge: l(
    'Считаем в сумме на две стороны. Таз назад, вторая нога прямая',
    'Counted as the total for both sides. Hips back, the other leg straight',
  ),
  skater: l(
    'Считаем в сумме. Прыжок в сторону, приземление на одну ногу с паузой',
    'Counted as the total. Jump sideways, land on one leg and pause',
  ),
  broad_jump: l(
    'Прыжок в длину с двух ног, приземление в присед. Между прыжками разворот шагом',
    'A two-footed broad jump, landing in a squat. Walk back between jumps',
  ),
  step_up: l(
    'Считаем в сумме на две ноги. Вставай через пятку, спускайся под контролем',
    'Counted as the total for both legs. Drive through the heel, step down under control',
  ),
  single_leg_rdl: l(
    'Таз назад, спина ровная, опорное колено чуть мягкое. Медленно — это про контроль',
    'Hips back, back flat, the standing knee soft. Slowly — this one is about control',
  ),
  single_leg_glute_bridge: l(
    'Таз поднимаем ягодицей, а не поясницей. Наверху пауза на счёт',
    'Lift with the glute, not the lower back. Pause at the top for a count',
  ),
  wall_sit: l(
    'Бедро параллельно полу, спина всей поверхностью к стене',
    'Thighs parallel, the whole back on the wall',
  ),
  push_up: l(
    'Корпус одной линией, локти вдоль тела, грудь до пола',
    'Body in one line, elbows close, chest to the floor',
  ),
  diamond_push_up: l(
    'Кисти ромбом под грудью, локти строго назад. Тяжело — разведи кисти шире',
    'Hands in a diamond under the chest, elbows straight back. Too hard? Widen the hands',
  ),
  pike_push_up: l(
    'Таз высоко, макушка к полу между кистями, локти назад',
    'Hips high, crown of the head to the floor between the hands, elbows back',
  ),
  chair_dip: l(
    'Стул без колёсиков, к стене. Плечи вниз от ушей, опускайся до комфортной глубины',
    'A chair without wheels, against the wall. Shoulders down, lower to a comfortable depth',
  ),
  up_down_plank: l(
    'Таз не раскачиваем: опускаемся и встаём, как будто на голове стакан',
    'Do not let the hips swing: go down and up as if balancing a glass on your head',
  ),
  plank: l(
    'Таз не проваливаем и не задираем, живот собран',
    'Hips neither sag nor pike, belly braced',
  ),
  side_plank: l(
    'Таз высоко, плечо строго над локтем',
    'Hips high, shoulder directly over the elbow',
  ),
  hollow_hold: l(
    'Поясница прижата к полу. Не держится — согни колени и подними руки',
    'Lower back pressed into the floor. Losing it? Bend the knees and raise the arms',
  ),
  v_up: l(
    'Складываемся одновременно руками и ногами, не тянем себя за шею',
    'Fold arms and legs together, do not pull on your neck',
  ),
  sit_up: l('Поднимаемся животом, стопы прижаты', 'Lift with the abdominals, feet pressed down'),
  russian_twist: l(
    'Поворот от корпуса, а не от рук, стопы можно оставить на полу',
    'Rotate from the trunk, not the arms; the feet may stay down',
  ),
  superman: l(
    'Поднимаем грудь и бёдра, шея — продолжение позвоночника',
    'Lift chest and thighs, neck in line with the spine',
  ),
  burpee: l(
    'Грудь до пола, наверху полное выпрямление. Темп — такой, который держится до конца',
    'Chest to the floor, full extension at the top. A pace you can hold to the end',
  ),
  mountain_climber: l(
    'Плечи над кистями, таз не задираем. Каждое колено — повтор',
    'Shoulders over the wrists, hips not piked. Every knee drive is a rep',
  ),
  bear_crawl: l(
    'Колени в сантиметре от пола, таз низко',
    'Knees a centimetre off the floor, hips low',
  ),
  double_under: l(
    'Прыжок чуть выше обычного, кисти у бёдер. Нет скакалки — приложение заменит на джампинг-джеки',
    'Jump slightly higher than usual, hands by the hips. No rope — the app swaps in jumping jacks',
  ),
  jumping_jack: l(
    'Мягко на носки, руки до конца над головой',
    'Land softly on the toes, hands all the way overhead',
  ),
};

function withCues(workout: WorkoutInput): WorkoutInput {
  return {
    ...workout,
    blocks: workout.blocks.map((block) =>
      block.type === 'warmup' || block.type === 'cooldown' || block.type === 'test'
        ? block
        : {
            ...block,
            items: block.items.map((item) =>
              item.note || !CUES[item.exerciseId] ? item : { ...item, note: CUES[item.exerciseId] },
            ),
          },
    ),
  };
}

/* ---------------------------------------------------------------------------------------- */
/* Workouts                                                                                   */
/* ---------------------------------------------------------------------------------------- */

/**
 * The gate: the same five rounds in week 1, week 3, week 6 and week 8.
 *
 * Every block is `scalable: false`, which is what makes it a measurement — the engine then leaves
 * the movements, the numbers and the round count alone at every difficulty and every scale, and
 * `course-load.test.ts` checks that the three choices come out identical. Four readings rather
 * than one at the end, so a plateau is visible while there is still course left to change.
 */
const W_GATE: WorkoutInput = {
  id: 'w_gate',
  name: l('Пять кругов', 'Five rounds'),
  focus: l('Точка отсчёта', 'The measure'),
  description: l(
    'Пять кругов на время: 8 бёрпи, 15 приседаний, 10 отжиманий, 15 подъёмов корпуса. Без отдыха между кругами — отдых ты выбираешь сам, и в этом весь смысл замера. Лимит 15 минут. Это единственная тренировка курса, которая никогда не меняется: ни от твоего уровня, ни от выбора «полегче / посложнее». Ты увидишь её четыре раза — на первой, третьей, шестой и восьмой неделе — и каждый раз сравнишь время с прошлым.\n\nПРИМЕЧАНИЕ ‼️ 11 минут — отличный результат. 🎯 цель уложиться в 15.',
    'Five rounds for time: 8 burpees, 15 squats, 10 push-ups, 15 sit-ups. No rest between rounds — the rest is yours to take, and that is the whole point of the measurement. Fifteen-minute cap. This is the one session on the course that never changes: not with your level, not with Easier or Harder. You meet it four times — in weeks 1, 3, 6 and 8 — and each time you compare the clock with last time.\n\nNOTE ‼️ 11 minutes is an excellent result. 🎯 the goal is to come in under 15.',
  ),
  basePoints: 130,
  tags: ['benchmark', 'fortime'],
  blocks: [
    warmup('gate_warmup'),
    {
      id: 'gate_main',
      type: 'metcon',
      format: 'fortime',
      sets: 5,
      durationSec: 900,
      restBetweenRoundsSec: 0,
      scalable: false,
      title: l('5 кругов на время', '5 rounds for time'),
      description: l(
        'Между кругами не останавливаемся специально — переходим к следующему движению. Не успеваешь в 15 минут — записывай, сколько успел: в следующий раз сравнишь по кругам.',
        'Do not stop between rounds on purpose — move to the next movement. Not done inside 15 minutes? Log how far you got: next time you compare by rounds.',
      ),
      items: [
        { exerciseId: 'burpee', reps: 8 },
        { exerciseId: 'air_squat', reps: 15 },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'sit_up', reps: 15 },
      ],
    },
    cooldown('gate_cooldown'),
  ],
};

/* --- Day 1: strength without a pause. The rest is the progression: 90 → 75 → 60 s. --------- */

const W_STRENGTH_A: WorkoutInput = withCues({
  id: 'w_strength_a',
  name: l('Сила без паузы A', 'Strength without a pause A'),
  focus: l('База и 90 секунд отдыха', 'The base, and 90 seconds of rest'),
  description: l(
    'Три подхода из четырёх движений: выпады назад, отжимания, румынская тяга на одной ноге, лодочка. Внутри подхода отдых 20 секунд, между подходами — 90. Эти 90 секунд — единственное, что будет меняться за курс: через две недели их станет 75, ещё через две — 60. Движения и повторы останутся, а времени между ними будет меньше. Поэтому здесь не нужно спешить: техника сейчас, плотность потом.\n\nПРИМЕЧАНИЕ ‼️ Если к третьему подходу техника ломается — бери «полегче» на следующей тренировке. 🎯 цель — три ровных подхода.',
    'Three sets of four movements: reverse lunges, push-ups, single-leg RDLs, a hollow hold. Twenty seconds of rest inside the set, ninety between sets. Those ninety seconds are the one thing that changes over the course: in two weeks they become 75, in two more 60. The movements and the reps stay, the time between them shrinks. So there is no need to rush now: form first, density later.\n\nNOTE ‼️ If your form breaks by the third set, take Easier next session. 🎯 the goal is three even sets.',
  ),
  basePoints: 110,
  tags: ['strength', 'unilateral'],
  blocks: [
    warmup('sa_warmup'),
    {
      id: 'sa_main',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 90,
      title: l('3 подхода · отдых 90 с', '3 sets · 90 s rest'),
      description: l(
        'Внутри подхода отдых 20 секунд, между подходами полторы минуты. Считай их — они будут короче.',
        'Twenty seconds of rest inside the set, a minute and a half between sets. Count them — they will get shorter.',
      ),
      items: [
        { exerciseId: 'reverse_lunge', reps: 14, restAfterSec: 20 },
        { exerciseId: 'push_up', reps: 10, restAfterSec: 20 },
        { exerciseId: 'single_leg_rdl', reps: 6, perSide: true, restAfterSec: 20 },
        { exerciseId: 'hollow_hold', seconds: 25 },
      ],
    },
    cooldown('sa_cooldown'),
  ],
});

const W_STRENGTH_B: WorkoutInput = withCues({
  id: 'w_strength_b',
  name: l('Сила без паузы B', 'Strength without a pause B'),
  focus: l('Прыжок, ромб и 75 секунд', 'The jump, the diamond and 75 seconds'),
  description: l(
    'Те же четыре места в подходе, движения сложнее: прыжковые выпады вместо шаговых, узкие отжимания вместо обычных, ягодичный мостик на одной ноге, боковая планка. Отдых между подходами — 75 секунд вместо 90.\n\nПРИМЕЧАНИЕ ‼️ Прыжковый выпад считается в сумме на две ноги. Не идёт прыжок — делай шаговый выпад, но не сокращай повторы. 🎯 цель — три подхода без добора отдыха.',
    'The same four slots in the set, harder movements: jumping lunges instead of stepping ones, diamond push-ups instead of regular, a single-leg glute bridge, a side plank. Rest between sets is 75 seconds rather than 90.\n\nNOTE ‼️ The jumping lunge is counted as the total for both legs. No jump yet? Do the stepping version, but do not cut the reps. 🎯 the goal is three sets without stealing extra rest.',
  ),
  basePoints: 115,
  tags: ['strength', 'unilateral'],
  blocks: [
    warmup('sb_warmup'),
    {
      id: 'sb_main',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 75,
      title: l('3 подхода · отдых 75 с', '3 sets · 75 s rest'),
      description: l(
        'Отдых между подходами короче на 15 секунд, чем в первые две недели. Всё остальное на месте.',
        'Fifteen seconds less rest between sets than in the first two weeks. Everything else stays.',
      ),
      items: [
        { exerciseId: 'jumping_lunge', reps: 14, restAfterSec: 20 },
        { exerciseId: 'diamond_push_up', reps: 8, restAfterSec: 20 },
        { exerciseId: 'single_leg_glute_bridge', reps: 8, perSide: true, restAfterSec: 20 },
        { exerciseId: 'side_plank', seconds: 25, perSide: true },
      ],
    },
    cooldown('sb_cooldown'),
  ],
});

const W_STRENGTH_C: WorkoutInput = withCues({
  id: 'w_strength_c',
  name: l('Сила без паузы C', 'Strength without a pause C'),
  focus: l('Минута между подходами', 'A minute between sets'),
  description: l(
    'Финальный вариант: прыжковые выпады, отжимания уголком, румынская тяга на одной ноге, складка. Отдых внутри подхода 15 секунд, между подходами — минута. Это на треть меньше, чем на первой неделе, при том же объёме работы. Если ты дошёл сюда и держишь технику — курс сделал ровно то, для чего он есть.\n\nПРИМЕЧАНИЕ ‼️ Минуты не хватает — досчитай до 75 и не вини себя, но запиши это. 🎯 цель — три подхода ровно по минуте.',
    'The final version: jumping lunges, pike push-ups, single-leg RDLs, V-ups. Fifteen seconds of rest inside the set, a minute between sets. That is a third less than week one for the same amount of work. If you got here with your form intact, the course did exactly what it exists for.\n\nNOTE ‼️ A minute not enough? Count to 75 and do not blame yourself — but write it down. 🎯 the goal is three sets on the minute.',
  ),
  basePoints: 120,
  tags: ['strength', 'unilateral'],
  blocks: [
    warmup('sc_warmup'),
    {
      id: 'sc_main',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      title: l('3 подхода · отдых 60 с', '3 sets · 60 s rest'),
      description: l(
        'Отдых внутри подхода 15 секунд, между подходами минута. Плотность, ради которой был весь курс.',
        'Fifteen seconds inside the set, a minute between sets. The density the whole course was for.',
      ),
      items: [
        { exerciseId: 'jumping_lunge', reps: 16, restAfterSec: 15 },
        { exerciseId: 'pike_push_up', reps: 8, restAfterSec: 15 },
        { exerciseId: 'single_leg_rdl', reps: 8, perSide: true, restAfterSec: 15 },
        { exerciseId: 'v_up', reps: 12 },
      ],
    },
    cooldown('sc_cooldown'),
  ],
});

/* --- Day 3: the ladder. Each minute is a rung; the number climbs until the movement changes. - */

/**
 * «Смерть от» as the schema can express it.
 *
 * An `emom` block plays `items[(minute - 1) % items.length]`, so a list of rising numbers is a
 * ladder and needs no new format. Nineteen rungs are authored against fifteen minutes because the
 * choice moves the minutes by ±20 %: «посложнее» runs eighteen, and a ladder that ran out of
 * rungs would silently start again from the bottom.
 *
 * Every top rung is checked against the minute it has to fit in at the hardest case an athlete can
 * reach — scale 1.30 from onboarding times 1.1 for «посложнее». The top rung of the hardest ladder
 * comes to fifty seconds of a sixty-second minute, which is where a ladder is supposed to end.
 */
const W_LADDER_A: WorkoutInput = withCues({
  id: 'w_ladder_a',
  name: l('Лестница A', 'The ladder A'),
  focus: l('Каждую минуту — больше', 'More every minute'),
  description: l(
    'Пятнадцать минут, каждую минуту одно задание. Число растёт, пока движение не сменится: приседания, скалолаз, отжимания, конькобежец, бёрпи. Сделал — остаток минуты твой. Не успел в минуту — это сигнал, что верх лестницы уже близко: доделай и иди дальше, но запиши, на какой минуте это случилось.\n\nПРИМЕЧАНИЕ ‼️ Если работа занимает больше 45 секунд, в следующем движении начинай с нижней ступени. 🎯 цель — дойти до бёрпи, не выпав из минуты.',
    'Fifteen minutes, one task each minute. The number climbs until the movement changes: squats, mountain climbers, push-ups, skaters, burpees. Finish and the rest of the minute is yours. Missed the minute? That means the top of the ladder is close: finish the reps and move on, but write down which minute it happened on.\n\nNOTE ‼️ If the work takes more than 45 seconds, start the next movement on its lowest rung. 🎯 the goal is to reach the burpees still inside the minute.',
  ),
  basePoints: 115,
  tags: ['metcon', 'emom', 'ladder'],
  blocks: [
    warmup('la_warmup'),
    {
      id: 'la_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 15,
      title: l('EMOM 15 · лестница', 'EMOM 15 · ladder'),
      description: l(
        'Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.',
        'A new task from the list every minute, top to bottom. The rest of the minute is rest.',
      ),
      items: [
        { exerciseId: 'air_squat', reps: 8 },
        { exerciseId: 'air_squat', reps: 10 },
        { exerciseId: 'air_squat', reps: 12 },
        { exerciseId: 'air_squat', reps: 14 },
        { exerciseId: 'mountain_climber', reps: 20 },
        { exerciseId: 'mountain_climber', reps: 24 },
        { exerciseId: 'mountain_climber', reps: 28 },
        { exerciseId: 'mountain_climber', reps: 32 },
        { exerciseId: 'push_up', reps: 6 },
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'push_up', reps: 12 },
        { exerciseId: 'skater', reps: 16 },
        { exerciseId: 'skater', reps: 20 },
        { exerciseId: 'skater', reps: 24 },
        { exerciseId: 'skater', reps: 28 },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'burpee', reps: 6 },
        { exerciseId: 'burpee', reps: 7 },
      ],
    },
    cooldown('la_cooldown'),
  ],
});

const W_LADDER_B: WorkoutInput = withCues({
  id: 'w_ladder_b',
  name: l('Лестница B', 'The ladder B'),
  focus: l('Та же лестница, тяжелее ступени', 'Same ladder, heavier rungs'),
  description: l(
    'Пятнадцать минут по той же схеме, движения сложнее: прыжковый присед, планка с подъёмом на руки, отжимания уголком, конькобежец, бёрпи. Планка с подъёмом — самое медленное движение лестницы, ступени в ней короткие не случайно.\n\nПРИМЕЧАНИЕ ‼️ Плечи горят раньше ног — это нормально и так задумано. 🎯 цель — не пропустить ни одной минуты.',
    'Fifteen minutes on the same plan, harder movements: jump squats, up-down planks, pike push-ups, skaters, burpees. The up-down plank is the slowest movement on the ladder, and its rungs are short for a reason.\n\nNOTE ‼️ Your shoulders burning before your legs is normal and intended. 🎯 the goal is not to miss a single minute.',
  ),
  basePoints: 120,
  tags: ['metcon', 'emom', 'ladder'],
  blocks: [
    warmup('lb_warmup'),
    {
      id: 'lb_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 15,
      title: l('EMOM 15 · лестница', 'EMOM 15 · ladder'),
      description: l(
        'Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.',
        'A new task from the list every minute, top to bottom. The rest of the minute is rest.',
      ),
      items: [
        { exerciseId: 'jump_squat', reps: 8 },
        { exerciseId: 'jump_squat', reps: 10 },
        { exerciseId: 'jump_squat', reps: 12 },
        { exerciseId: 'jump_squat', reps: 14 },
        { exerciseId: 'up_down_plank', reps: 5 },
        { exerciseId: 'up_down_plank', reps: 6 },
        { exerciseId: 'up_down_plank', reps: 7 },
        { exerciseId: 'up_down_plank', reps: 8 },
        { exerciseId: 'pike_push_up', reps: 6 },
        { exerciseId: 'pike_push_up', reps: 7 },
        { exerciseId: 'pike_push_up', reps: 8 },
        { exerciseId: 'pike_push_up', reps: 9 },
        { exerciseId: 'skater', reps: 18 },
        { exerciseId: 'skater', reps: 22 },
        { exerciseId: 'skater', reps: 26 },
        { exerciseId: 'skater', reps: 28 },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'burpee', reps: 6 },
        { exerciseId: 'burpee', reps: 7 },
      ],
    },
    cooldown('lb_cooldown'),
  ],
});

const W_LADDER_C: WorkoutInput = withCues({
  id: 'w_ladder_c',
  name: l('Лестница C', 'The ladder C'),
  focus: l('Верх лестницы', 'The top of the ladder'),
  description: l(
    'Последний вариант: прыжковые выпады, складка, узкие отжимания, прыжок с коленями к груди, бёрпи. Все пять — те, которых не было в начале курса. Если ты проходишь эту пятнадцатиминутку целиком, ты в той форме, ради которой был курс.\n\nПРИМЕЧАНИЕ ‼️ Прыжок с коленями к груди — тихий. Стало шумно — закончи ступень раньше. 🎯 цель — пятнадцать минут без пропусков.',
    'The last version: jumping lunges, V-ups, diamond push-ups, tuck jumps, burpees. None of the five was in the course at the start. If you get through this fifteen minutes whole, you are in the shape the course was for.\n\nNOTE ‼️ The tuck jump is a quiet movement. Gone noisy? End the rung early. 🎯 the goal is fifteen minutes with nothing skipped.',
  ),
  basePoints: 125,
  tags: ['metcon', 'emom', 'ladder'],
  blocks: [
    warmup('lc_warmup'),
    {
      id: 'lc_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 15,
      title: l('EMOM 15 · лестница', 'EMOM 15 · ladder'),
      description: l(
        'Каждую минуту новое задание из списка, сверху вниз. Остаток минуты — отдых.',
        'A new task from the list every minute, top to bottom. The rest of the minute is rest.',
      ),
      items: [
        { exerciseId: 'jumping_lunge', reps: 10 },
        { exerciseId: 'jumping_lunge', reps: 12 },
        { exerciseId: 'jumping_lunge', reps: 14 },
        { exerciseId: 'jumping_lunge', reps: 16 },
        { exerciseId: 'v_up', reps: 8 },
        { exerciseId: 'v_up', reps: 10 },
        { exerciseId: 'v_up', reps: 12 },
        { exerciseId: 'v_up', reps: 13 },
        { exerciseId: 'diamond_push_up', reps: 5 },
        { exerciseId: 'diamond_push_up', reps: 6 },
        { exerciseId: 'diamond_push_up', reps: 7 },
        { exerciseId: 'diamond_push_up', reps: 8 },
        { exerciseId: 'tuck_jump', reps: 8 },
        { exerciseId: 'tuck_jump', reps: 10 },
        { exerciseId: 'tuck_jump', reps: 12 },
        { exerciseId: 'tuck_jump', reps: 14 },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'burpee', reps: 6 },
        { exerciseId: 'burpee', reps: 7 },
      ],
    },
    cooldown('lc_cooldown'),
  ],
});

/* --- Day 4: the cap. One long list against a ceiling, with permission not to close it. ----- */

/**
 * The coach's «крышка»: a standard set above what most people will reach, and his own line that
 * you do not have to close it — «не обязательно закрыть», «если не успеваете, доделываете по
 * собственному желанию». That is what lets the number be ambitious without reading as a
 * punishment, and it is why the cap is authored at sixteen minutes against roughly fifteen
 * minutes of estimated work: most athletes finish just inside it, and the ones who do not have
 * been told in advance that this is fine.
 */
const W_CAP_A: WorkoutInput = withCues({
  id: 'w_cap_a',
  name: l('Крышка A', 'The cap A'),
  focus: l('Один длинный список', 'One long list'),
  description: l(
    'Один проход сверху вниз на время, лимит 16 минут: 40 бёрпи, 80 приседаний, 50 отжиманий, 60 подъёмов корпуса, 100 скалолазов. Разбивай как хочешь — по 10, по 20, как удержишь темп. Закрывать не обязательно: не успел в 16 минут — доделай остаток в своём темпе, если хочешь, и запиши, где тебя остановил лимит.\n\nПРИМЕЧАНИЕ ‼️ Начинать с бёрпи по 20 — самая частая ошибка. 🎯 цель — уложиться в 16 минут.',
    'One pass from top to bottom for time, sixteen-minute cap: 40 burpees, 80 squats, 50 push-ups, 60 sit-ups, 100 mountain climbers. Break them up however you like — tens, twenties, whatever holds your pace. You do not have to close it: if sixteen minutes runs out, finish the rest at your own pace if you want to, and note where the cap stopped you.\n\nNOTE ‼️ Starting with sets of 20 burpees is the most common mistake. 🎯 the goal is to come in under 16 minutes.',
  ),
  basePoints: 120,
  tags: ['metcon', 'fortime', 'chipper'],
  blocks: [
    warmup('ca_warmup'),
    {
      id: 'ca_main',
      type: 'metcon',
      format: 'fortime',
      sets: 1,
      durationSec: 960,
      title: l('На время · лимит 16 мин', 'For time · 16-min cap'),
      description: l(
        'Сверху вниз, по одному движению за раз. Следующее начинается, когда закончилось предыдущее.',
        'Top to bottom, one movement at a time. The next starts when the last one is done.',
      ),
      items: [
        { exerciseId: 'burpee', reps: 40 },
        { exerciseId: 'air_squat', reps: 80 },
        { exerciseId: 'push_up', reps: 50 },
        { exerciseId: 'sit_up', reps: 60 },
        { exerciseId: 'mountain_climber', reps: 100 },
      ],
    },
    cooldown('ca_cooldown'),
  ],
});

const W_CAP_B: WorkoutInput = withCues({
  id: 'w_cap_b',
  name: l('Крышка B', 'The cap B'),
  focus: l('Тот же лимит, тяжелее список', 'Same cap, heavier list'),
  description: l(
    'Тот же формат и тот же лимит, список злее: 45 бёрпи, 70 прыжковых приседаний, 60 отжиманий от стула, 60 складок, 100 конькобежцев. Прыжковый присед в середине — место, где ломается темп: раздели его на пятёрки заранее, а не когда станет тяжело.\n\nПРИМЕЧАНИЕ ‼️ Стул для отжиманий — без колёсиков и к стене. 🎯 цель — уложиться в 16 минут.',
    'Same format and the same cap, a meaner list: 45 burpees, 70 jump squats, 60 chair dips, 60 V-ups, 100 skaters. The jump squats in the middle are where the pace breaks: split them into fives in advance, not once it gets hard.\n\nNOTE ‼️ The chair for the dips: no wheels, against the wall. 🎯 the goal is to come in under 16 minutes.',
  ),
  basePoints: 125,
  tags: ['metcon', 'fortime', 'chipper'],
  blocks: [
    warmup('cb_warmup'),
    {
      id: 'cb_main',
      type: 'metcon',
      format: 'fortime',
      sets: 1,
      durationSec: 960,
      title: l('На время · лимит 16 мин', 'For time · 16-min cap'),
      description: l(
        'Сверху вниз, по одному движению за раз. Разбивай на части заранее, а не по факту усталости.',
        'Top to bottom, one movement at a time. Plan the breaks in advance, not when the fatigue decides for you.',
      ),
      items: [
        { exerciseId: 'burpee', reps: 45 },
        { exerciseId: 'jump_squat', reps: 70 },
        { exerciseId: 'chair_dip', reps: 60 },
        { exerciseId: 'v_up', reps: 60 },
        { exerciseId: 'skater', reps: 100 },
      ],
    },
    cooldown('cb_cooldown'),
  ],
});

const W_CAP_C: WorkoutInput = withCues({
  id: 'w_cap_c',
  name: l('Крышка C', 'The cap C'),
  focus: l('Самый длинный список курса', 'The longest list on the course'),
  description: l(
    'Финальная «крышка»: 50 бёрпи, 80 прыжков с коленями к груди, 60 узких отжиманий, 70 складок, 120 двойных прыжков на скакалке. Нет скакалки — приложение поставит джампинг-джеки, и это честная замена по времени.\n\nПРИМЕЧАНИЕ ‼️ Это самый длинный список курса, и лимит тот же. Закрыть его — не обязательство, а хороший день. 🎯 цель — дойти до скакалки к двенадцатой минуте.',
    'The final cap: 50 burpees, 80 tuck jumps, 60 diamond push-ups, 70 V-ups, 120 double-unders. No rope — the app puts jumping jacks in, and that is a fair swap on time.\n\nNOTE ‼️ This is the longest list on the course and the cap is the same. Closing it is not an obligation, it is a good day. 🎯 the goal is to reach the rope by minute twelve.',
  ),
  basePoints: 130,
  tags: ['metcon', 'fortime', 'chipper'],
  blocks: [
    warmup('cc_warmup'),
    {
      id: 'cc_main',
      type: 'metcon',
      format: 'fortime',
      sets: 1,
      durationSec: 960,
      title: l('На время · лимит 16 мин', 'For time · 16-min cap'),
      description: l(
        'Сверху вниз, по одному движению за раз. Последним идёт самое быстрое — оставь на него силы.',
        'Top to bottom, one movement at a time. The fastest one comes last — leave something for it.',
      ),
      items: [
        { exerciseId: 'burpee', reps: 50 },
        { exerciseId: 'tuck_jump', reps: 80 },
        { exerciseId: 'diamond_push_up', reps: 60 },
        { exerciseId: 'v_up', reps: 70 },
        { exerciseId: 'double_under', reps: 120 },
      ],
    },
    cooldown('cc_cooldown'),
  ],
});

/* --- Day 6: rounds for time, with nothing between them. ----------------------------------- */

const W_ROUNDS_A: WorkoutInput = withCues({
  id: 'w_rounds_a',
  name: l('Круги без отдыха A', 'Rounds without a break A'),
  focus: l('Пять кругов подряд', 'Five rounds back to back'),
  description: l(
    'Пять кругов на время, и между кругами не заложено ничего: закончил подъёмы корпуса — начинай приседания следующего круга. Отдых здесь существует только как твоё решение, и в этом вся тренировка: ровный темп, который держится пять кругов, быстрее рывка и паузы.\n\nПРИМЕЧАНИЕ ‼️ Первый круг должен ощущаться слишком лёгким. Если нет — ты стартовал слишком быстро. 🎯 цель — пятый круг не медленнее первого больше чем на 30 секунд.',
    'Five rounds for time, and nothing is scheduled between them: finish the sit-ups and start the next round of squats. Rest exists only as your own decision, and that is the whole session: an even pace you can hold for five rounds beats a sprint and a pause.\n\nNOTE ‼️ The first round should feel too easy. If it does not, you went out too fast. 🎯 the goal is a fifth round no more than 30 seconds slower than the first.',
  ),
  basePoints: 120,
  tags: ['metcon', 'fortime'],
  blocks: [
    warmup('ra_warmup'),
    {
      id: 'ra_main',
      type: 'metcon',
      format: 'fortime',
      sets: 5,
      durationSec: 1080,
      restBetweenRoundsSec: 0,
      title: l('5 кругов на время · лимит 18 мин', '5 rounds for time · 18-min cap'),
      description: l(
        'Между кругами ничего не заложено. Паузу берёшь сам и сам за неё платишь временем.',
        'Nothing is scheduled between the rounds. You take the pause yourself, and you pay for it on the clock.',
      ),
      items: [
        { exerciseId: 'air_squat', reps: 20 },
        { exerciseId: 'push_up', reps: 12 },
        { exerciseId: 'sit_up', reps: 20 },
        { exerciseId: 'mountain_climber', reps: 30 },
      ],
    },
    cooldown('ra_cooldown'),
  ],
});

const W_ROUNDS_B: WorkoutInput = withCues({
  id: 'w_rounds_b',
  name: l('Круги без отдыха B', 'Rounds without a break B'),
  focus: l('Прыжок в каждом круге', 'A jump in every round'),
  description: l(
    'Пять кругов, движения сложнее: прыжковые приседания, отжимания от стула, складки, конькобежец. Прыжок стоит первым в круге специально — на усталости ноги теряют технику раньше рук, и лучше встречать это на свежую голову в начале круга.\n\nПРИМЕЧАНИЕ ‼️ Если колено начинает заваливаться внутрь — заканчивай подход и иди дальше. 🎯 цель — пять кругов ровным темпом.',
    'Five rounds, harder movements: jump squats, chair dips, V-ups, skaters. The jump is first in the round on purpose — under fatigue the legs lose their form before the arms, and it is better to meet that at the top of a round with a clear head.\n\nNOTE ‼️ If a knee starts caving in, end the set and move on. 🎯 the goal is five rounds at an even pace.',
  ),
  basePoints: 125,
  tags: ['metcon', 'fortime'],
  blocks: [
    warmup('rb_warmup'),
    {
      id: 'rb_main',
      type: 'metcon',
      format: 'fortime',
      sets: 5,
      durationSec: 1080,
      restBetweenRoundsSec: 0,
      title: l('5 кругов на время · лимит 18 мин', '5 rounds for time · 18-min cap'),
      description: l(
        'Между кругами ничего не заложено. Считай круги вслух — на четвёртом это помогает.',
        'Nothing is scheduled between the rounds. Count them out loud — by the fourth it helps.',
      ),
      items: [
        { exerciseId: 'jump_squat', reps: 20 },
        { exerciseId: 'chair_dip', reps: 15 },
        { exerciseId: 'v_up', reps: 15 },
        { exerciseId: 'skater', reps: 30 },
      ],
    },
    cooldown('rb_cooldown'),
  ],
});

const W_ROUNDS_C: WorkoutInput = withCues({
  id: 'w_rounds_c',
  name: l('Круги без отдыха C', 'Rounds without a break C'),
  focus: l('Всё, чего не было в начале', 'Everything that was not here at the start'),
  description: l(
    'Пять кругов из движений, которых не было на первой неделе: прыжковые выпады, узкие отжимания, складки, бёрпи. Бёрпи в конце круга — это место, где решается, ровный у тебя темп или нет.\n\nПРИМЕЧАНИЕ ‼️ Прыжковый выпад считается в сумме на две ноги. 🎯 цель — не остановиться перед бёрпи ни в одном круге.',
    'Five rounds of movements that were not here in week one: jumping lunges, diamond push-ups, V-ups, burpees. The burpees at the end of the round are where it is decided whether your pace is even or not.\n\nNOTE ‼️ The jumping lunge is counted as the total for both legs. 🎯 the goal is not to stop before the burpees in any round.',
  ),
  basePoints: 130,
  tags: ['metcon', 'fortime'],
  blocks: [
    warmup('rc_warmup'),
    {
      id: 'rc_main',
      type: 'metcon',
      format: 'fortime',
      sets: 5,
      durationSec: 1080,
      restBetweenRoundsSec: 0,
      title: l('5 кругов на время · лимит 18 мин', '5 rounds for time · 18-min cap'),
      description: l(
        'Между кругами ничего не заложено. Последний круг — единственное место, где можно ускориться.',
        'Nothing is scheduled between the rounds. The last one is the only place to speed up.',
      ),
      items: [
        { exerciseId: 'jumping_lunge', reps: 24 },
        { exerciseId: 'diamond_push_up', reps: 12 },
        { exerciseId: 'v_up', reps: 18 },
        { exerciseId: 'burpee', reps: 8 },
      ],
    },
    cooldown('rc_cooldown'),
  ],
});

/* --- The easy day: technique, position, and a heart rate that stays down. ------------------ */

/**
 * The easy day, and the one session whose blocks do not scale.
 *
 * Left scalable it was the longest workout on the course: a level-3 athlete arrives at scale 1.30,
 * which is exactly `SETS_ADD_AT`, so the engine added a set, «посложнее» added another, and the
 * recovery day came out at 47 minutes — longer than every day it was meant to recover from.
 * `scalable: false` says the thing the day is actually for: this is not somewhere to add work.
 * It also means a deload flag would do nothing here, so the week-5 node does not carry one.
 */
const W_FLOW: WorkoutInput = withCues({
  id: 'w_flow',
  name: l('Лёгкий день', 'Easy day'),
  focus: l('Позиция и восстановление', 'Position and recovery'),
  description: l(
    'День, когда тело догоняет нагрузку. Три круга спокойной работы на позицию — присед, медвежья походка, ягодичный мостик на одной ноге, удержание в приседе, — потом кор и длинная растяжка. Пульс не должен подниматься: если в конце круга сбито дыхание, ты делаешь этот день неправильно.\n\nПРИМЕЧАНИЕ ‼️ Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке. 🎯 цель — уйти с тренировки свежее, чем пришёл.',
    'The day your body catches up. Three calm rounds of position work — squats, bear crawl, single-leg glute bridge, a bottom-squat hold — then core and a long stretch. Your heart rate should stay down: if you are out of breath at the end of a round, you are doing this day wrong.\n\nNOTE ‼️ Treat every rep as a demo: full range, a pause at the end point. 🎯 the goal is to leave fresher than you arrived.',
  ),
  basePoints: 90,
  tags: ['recovery', 'skill', 'mobility'],
  blocks: [
    warmup('fl_warmup'),
    {
      id: 'fl_skill',
      type: 'skill',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 60,
      scalable: false,
      title: l('Техника · 3 круга', 'Technique · 3 rounds'),
      description: l(
        'Три круга в темпе разговора. Полная амплитуда, пауза в крайней точке, без спешки.',
        'Three rounds at a talking pace. Full range, a pause at the end point, no rush.',
      ),
      items: [
        { exerciseId: 'air_squat', reps: 12 },
        { exerciseId: 'bear_crawl', seconds: 25 },
        { exerciseId: 'single_leg_glute_bridge', reps: 8, perSide: true },
        { exerciseId: 'squat_hold', seconds: 25 },
      ],
    },
    {
      id: 'fl_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 45,
      scalable: false,
      title: l('Кор', 'Core'),
      items: [
        { exerciseId: 'hollow_hold', seconds: 25 },
        { exerciseId: 'side_plank', seconds: 20, perSide: true },
        { exerciseId: 'superman', reps: 10 },
      ],
    },
    cooldown('fl_cooldown', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'hip_flexor_stretch', seconds: 45, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
      { exerciseId: 'quad_stretch', seconds: 30, perSide: true },
      { exerciseId: 'child_pose', seconds: 60 },
    ]),
  ],
});

/* ---------------------------------------------------------------------------------------- */
/* The path                                                                                   */
/* ---------------------------------------------------------------------------------------- */

const T_STRENGTH = l('Сила без паузы', 'Strength without a pause');
const T_LADDER = l('Лестница', 'The ladder');
const T_CAP = l('Крышка', 'The cap');
const T_ROUNDS = l('Круги без отдыха', 'Rounds without a break');
const T_FLOW = l('Лёгкий день', 'Easy day');
const T_GATE = l('Пять кругов', 'Five rounds');

const S_STRENGTH_A = l('3 подхода · отдых 90 с', '3 sets · 90 s rest');
const S_STRENGTH_B = l('3 подхода · отдых 75 с', '3 sets · 75 s rest');
const S_STRENGTH_C = l('3 подхода · отдых 60 с', '3 sets · 60 s rest');
const S_LADDER = l('EMOM 15 · ступени растут', 'EMOM 15 · the rungs climb');
const S_CAP = l('На время · лимит 16 мин', 'For time · 16-min cap');
const S_ROUNDS = l('5 кругов · без пауз между ними', '5 rounds · no pause between them');
const S_FLOW = l('Техника и растяжка', 'Technique and stretching');
const S_DELOAD = l('Разгрузка · объём −35 %', 'Deload · volume −35%');

function work(
  week: number,
  day: number,
  slug: string,
  workoutId: string,
  title: L10n,
  subtitle: L10n,
  deload = false,
): NodeInput {
  const node: NodeInput = {
    id: `w${week}d${day}_${slug}`,
    week,
    day,
    kind: 'workout',
    workoutId,
    title,
    subtitle,
  };
  if (deload) node.deload = true;
  return node;
}

/** The measurement, four times over the course. `benchmark` so it carries no stars and no scaling. */
function gate(week: number, day: number, subtitle: L10n): NodeInput {
  return {
    id: `w${week}d${day}_gate`,
    week,
    day,
    kind: 'benchmark',
    workoutId: 'w_gate',
    title: T_GATE,
    subtitle,
  };
}

const REST_TITLE = l('Отдых и прогулка', 'Rest & walk');

function rest(week: number, day: number, subtitle: L10n): NodeInput {
  return {
    id: `w${week}d${day}_rest`,
    week,
    day,
    kind: 'rest',
    title: REST_TITLE,
    subtitle,
  };
}

const R_DEFAULT = l(
  '8000 шагов и лёгкая растяжка. На этом курсе отдых — часть программы, а не пауза в ней.',
  '8,000 steps and light stretching. On this course rest is part of the programme, not a gap in it.',
);
const R_SLEEP = l(
  'Прогулка 40–60 минут и сон 7–8 часов. Плотная работа требует восстановления, а не ещё одной тренировки.',
  'A 40–60 minute walk and seven to eight hours of sleep. Dense work needs recovery, not another session.',
);
const R_SORE = l(
  'Крепатура после прыжков — норма. Прогулка разгонит кровь быстрее, чем диван.',
  'Soreness after jumping days is normal. A walk gets the blood moving faster than the couch.',
);
const R_BEFORE_GATE = l(
  'Завтра замер: шаги, вода, ранний сон. Никакой «дополнительной» работы сегодня.',
  'The measurement is tomorrow: steps, water, an early night. No "extra" work today.',
);
const R_DELOAD = l(
  'Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет четыре недели плотной работы.',
  'Deload week: walk, sleep, eat properly. Your body is catching up with four dense weeks.',
);
const R_STREAK = l(
  'Пройди 8000 шагов и отметь их в приложении — день зачтётся в серию.',
  'Walk 8,000 steps and log them in the app — the day counts toward your streak.',
);

const NODES: NodeInput[] = [
  /* Week 1 — the first reading, then the A variants. */
  gate(1, 1, l('Замер · с этого начинается отсчёт', 'Measurement · the clock starts here')),
  rest(1, 2, R_SORE),
  work(1, 3, 'strength', 'w_strength_a', T_STRENGTH, S_STRENGTH_A),
  work(1, 4, 'ladder', 'w_ladder_a', T_LADDER, S_LADDER),
  rest(1, 5, R_DEFAULT),
  work(1, 6, 'cap', 'w_cap_a', T_CAP, S_CAP),
  rest(1, 7, R_SLEEP),

  /* Week 2 — the same A week, plus the first rounds day. */
  work(2, 1, 'strength', 'w_strength_a', T_STRENGTH, S_STRENGTH_A),
  rest(2, 2, R_DEFAULT),
  work(2, 3, 'ladder', 'w_ladder_a', T_LADDER, S_LADDER),
  work(2, 4, 'cap', 'w_cap_a', T_CAP, S_CAP),
  rest(2, 5, R_SORE),
  work(2, 6, 'rounds', 'w_rounds_a', T_ROUNDS, S_ROUNDS),
  rest(2, 7, R_SLEEP),

  /* Week 3 — the rest drops to 75 seconds, and the measurement comes round again. */
  work(3, 1, 'strength', 'w_strength_b', T_STRENGTH, S_STRENGTH_B),
  rest(3, 2, R_DEFAULT),
  work(3, 3, 'ladder', 'w_ladder_b', T_LADDER, S_LADDER),
  work(3, 4, 'cap', 'w_cap_b', T_CAP, S_CAP),
  rest(3, 5, R_BEFORE_GATE),
  gate(3, 6, l('Замер · сравни с первой неделей', 'Measurement · compare with week one')),
  rest(3, 7, R_SLEEP),

  /* Week 4 — the B week in full. */
  work(4, 1, 'strength', 'w_strength_b', T_STRENGTH, S_STRENGTH_B),
  rest(4, 2, R_DEFAULT),
  work(4, 3, 'ladder', 'w_ladder_b', T_LADDER, S_LADDER),
  work(4, 4, 'cap', 'w_cap_b', T_CAP, S_CAP),
  rest(4, 5, R_SORE),
  work(4, 6, 'rounds', 'w_rounds_b', T_ROUNDS, S_ROUNDS),
  rest(4, 7, R_SLEEP),

  /* Week 5 — deload: the same sessions, volume down about a third, rests stretched by the engine. */
  work(5, 1, 'strength', 'w_strength_b', T_STRENGTH, S_DELOAD, true),
  rest(5, 2, R_DELOAD),
  work(5, 3, 'flow', 'w_flow', T_FLOW, S_FLOW),
  work(5, 4, 'ladder', 'w_ladder_b', T_LADDER, S_DELOAD, true),
  rest(5, 5, R_DELOAD),
  work(5, 6, 'rounds', 'w_rounds_b', T_ROUNDS, S_DELOAD, true),
  rest(5, 7, R_DELOAD),

  /* Week 6 — the rest drops to a minute, the C variants land, the third reading. */
  work(6, 1, 'strength', 'w_strength_c', T_STRENGTH, S_STRENGTH_C),
  rest(6, 2, R_DEFAULT),
  work(6, 3, 'ladder', 'w_ladder_c', T_LADDER, S_LADDER),
  work(6, 4, 'cap', 'w_cap_c', T_CAP, S_CAP),
  rest(6, 5, R_BEFORE_GATE),
  gate(6, 6, l('Замер · третий раз, тот же список', 'Measurement · third time, same list')),
  rest(6, 7, R_SLEEP),

  /* Week 7 — peak week: everything at C. */
  work(7, 1, 'strength', 'w_strength_c', T_STRENGTH, S_STRENGTH_C),
  rest(7, 2, R_SORE),
  work(7, 3, 'ladder', 'w_ladder_c', T_LADDER, S_LADDER),
  work(7, 4, 'cap', 'w_cap_c', T_CAP, S_CAP),
  rest(7, 5, R_DEFAULT),
  work(7, 6, 'rounds', 'w_rounds_c', T_ROUNDS, S_ROUNDS),
  rest(7, 7, R_STREAK),

  /* Week 8 — one last strength day, the hardest rounds, an easy day, and the same five rounds. */
  work(8, 1, 'strength', 'w_strength_c', T_STRENGTH, S_STRENGTH_C),
  rest(8, 2, R_DEFAULT),
  work(8, 3, 'rounds', 'w_rounds_c', T_ROUNDS, S_ROUNDS),
  work(8, 4, 'flow', 'w_flow', T_FLOW, S_FLOW),
  rest(8, 5, R_SLEEP),
  rest(8, 6, R_BEFORE_GATE),
  gate(
    8,
    7,
    l(
      'Замер · те же пять кругов, восемь недель спустя',
      'Measurement · the same five rounds, eight weeks on',
    ),
  ),
];

/* ---------------------------------------------------------------------------------------- */
/* Course                                                                                     */
/* ---------------------------------------------------------------------------------------- */

export const COURSE_TEMPO: CourseInput = {
  id: 'tempo',
  order: 6,
  /*
   * Written and playable, but not on sale: at launch Forma offers the beginner course only.
   * See `published` in src/content/schema.ts for what the flag hides.
   */
  published: false,
  slug: { ru: 'v-tempe-plotnost-i-kontrol', en: 'bodyweight-tempo' },
  name: l(
    'Форма в темпе: плотность и контроль своим весом',
    'Forma. Tempo: bodyweight density and control',
  ),
  shortName: l('Форма в темпе', 'Forma. Tempo'),
  tagline: l(
    'Восемь недель для тех, кто уже уверенно двигается: тот же объём работы, всё меньше отдыха между подходами. Без инвентаря.',
    'Eight weeks for people who already move well: the same amount of work, less and less rest between sets. No gear.',
  ),
  description: l(
    'Курс про плотность: лестницы EMOM, работа на время против лимита, круги без пауз между ними и силовые дни, где отдых между подходами сокращается с 90 секунд до минуты. Дома, без оборудования — коврик, стул и скакалка по желанию.',
    'A course about density: EMOM ladders, work for time against a cap, rounds with no pause between them, and strength days where the rest between sets shrinks from ninety seconds to one minute. At home, no equipment — a mat, a chair and a jump rope if you have one.',
  ),
  longDescription: [
    l(
      'Это следующий шаг после «Формы своим весом» для тех, кто не собирается покупать железо. Штанги, гантелей и турника здесь нет — и курс не делает вид, что они не нужны. Без перекладины своим весом невозможно тренировать тягу, поэтому предмет курса другой: плотность и позиция. Сколько работы ты успеваешь сделать за единицу времени и насколько чисто держится техника, когда времени на восстановление всё меньше.',
      'This is the next step after Forma Bodyweight for people who are not going to buy iron. There is no barbell, no dumbbell and no pull-up bar here — and the course does not pretend they are unnecessary. Without a bar you cannot train pulling with bodyweight alone, so the subject is a different one: density and position. How much work you get done per unit of time, and how cleanly your form holds as the recovery between efforts shrinks.',
    ),
    l(
      'Механизм у курса один и он виден с первого дня: силовой день повторяется каждую неделю с теми же движениями и повторами, а отдых между подходами падает с 90 секунд до 75, а потом до 60. Всё остальное построено вокруг него — лестницы, где каждую минуту число растёт, пока движение не сменится; «крышка» — длинный список на время против лимита, который не обязательно закрывать; и круги на время, между которыми не заложено ни секунды отдыха.',
      'The course has one mechanism and it is visible from day one: the strength day repeats every week with the same movements and the same reps, while the rest between sets drops from 90 seconds to 75 and then to 60. Everything else is built around it — ladders where the number climbs every minute until the movement changes; the cap, a long list for time against a ceiling you are not obliged to close; and rounds for time with not one second of rest scheduled between them.',
    ),
    l(
      'Первая тренировка курса и последняя — одна и та же: пять кругов на время, которые не меняются ни от твоего уровня, ни от выбора «полегче / посложнее». Ты проходишь их четыре раза — на первой, третьей, шестой и восьмой неделе — и видишь ровно одну цифру, время, которая говорит всё. Пятая неделя разгрузочная: объём падает примерно на треть, чтобы тело усвоило первые четыре.',
      'The first session of the course and the last are the same one: five rounds for time that do not change with your level or with Easier and Harder. You meet them four times — in weeks 1, 3, 6 and 8 — and you get exactly one number, the clock, which says everything. Week five is a deload: volume drops by about a third so your body can absorb the first four.',
    ),
  ],
  forWhom: [
    l(
      'Ты прошёл «Форму своим весом» или тренируешься сам и уверенно держишь 20 отжиманий подряд и 2 минуты планки.',
      'You finished Forma Bodyweight or train on your own, and you comfortably hold 20 push-ups in a row and a two-minute plank.',
    ),
    l(
      'Ты не хочешь покупать инвентарь и не готов вешать турник — но тебе уже мало обычного домашнего комплекса.',
      'You do not want to buy gear and you are not going to mount a pull-up bar — but an ordinary home routine is no longer enough.',
    ),
    l(
      'Тебе интересна работа на время: EMOM, лимиты, круги — и то, как держать ровный темп, когда тяжело.',
      'You are interested in working against the clock: EMOMs, caps, rounds — and in holding an even pace when it gets hard.',
    ),
    l('У тебя есть 25–30 минут четыре раза в неделю.', 'You have 25–30 minutes four times a week.'),
  ],
  outcomes: [
    l(
      'Пройдёшь одни и те же пять кругов четыре раза за курс и увидишь, на сколько минут сдвинулось время.',
      'You run the same five rounds four times over the course and see how many minutes the clock moved.',
    ),
    l(
      'Будешь делать тот же объём силовой работы с отдыхом на треть короче, чем в первую неделю.',
      'You do the same volume of strength work on a third less rest than in week one.',
    ),
    l(
      'Освоишь прыжковые выпады, узкие отжимания, отжимания уголком, складку и прыжок с коленями к груди.',
      'You learn jumping lunges, diamond push-ups, pike push-ups, V-ups and tuck jumps.',
    ),
    l(
      'Научишься раскладывать силы на длинной работе: EMOM-лестницу, чиппер с лимитом и пять кругов без пауз.',
      'You learn to pace long work: an EMOM ladder, a chipper against a cap, and five rounds with no pauses.',
    ),
    l(
      'Подтянешь одностороннюю работу — выпады, тягу и мостик на одной ноге, боковую планку.',
      'You build up your single-side work — lunges, single-leg RDLs and bridges, side planks.',
    ),
  ],
  equipment: ['none', 'mat', 'chair', 'jump_rope'],
  level: 3,
  weeks: 8,
  sessionsPerWeek: 4,
  avgSessionMin: 25,
  tile: '#2a2a30', // --tile-5 — neutral; no programme colour yet
  price: { rub: 4990, usd: 49 },
  workouts: [
    W_GATE,
    W_STRENGTH_A,
    W_STRENGTH_B,
    W_STRENGTH_C,
    W_LADDER_A,
    W_LADDER_B,
    W_LADDER_C,
    W_CAP_A,
    W_CAP_B,
    W_CAP_C,
    W_ROUNDS_A,
    W_ROUNDS_B,
    W_ROUNDS_C,
    W_FLOW,
  ],
  nodes: NODES,
  faq: [
    {
      q: l('Что нужно из оборудования?', 'What equipment do I need?'),
      a: l(
        'Коврик и устойчивый стул без колёсиков — для отжиманий от опоры в лёгкий день. Скакалка по желанию: если её нет, приложение само заменит двойные прыжки на джампинг-джеки. Турник не нужен и нигде не используется.',
        'A mat and a sturdy chair without wheels — for the dips on the easy day. A jump rope is optional: without one the app swaps double-unders for jumping jacks. No pull-up bar is needed and none is used.',
      ),
    },
    {
      q: l(
        'Чем этот курс отличается от «Формы своим весом»?',
        'How is this different from Forma Bodyweight?',
      ),
      a: l(
        'Тот курс про то, чтобы научиться делать больше. Этот — про то, чтобы делать столько же за меньшее время. Силовой день здесь повторяется неизменным, а сокращается отдых между подходами: 90 секунд, потом 75, потом 60. Форматы тоже другие: лестницы EMOM, работа против лимита, круги без пауз между ними. И курс длиннее — восемь недель вместо шести.',
        'That course is about learning to do more. This one is about doing the same amount in less time. The strength day repeats unchanged here while the rest between sets shrinks: 90 seconds, then 75, then 60. The formats are different too: EMOM ladders, work against a cap, rounds with no pause between them. And it is longer — eight weeks instead of six.',
      ),
    },
    {
      q: l('Мне подойдёт этот курс?', 'Is this course right for me?'),
      a: l(
        'Ориентир: 20 отжиманий от пола подряд, 2 минуты планки, 40 приседаний без остановки и знакомство с бёрпи. Если это про тебя — заходи. Если пока нет, пройди «Форму своим весом»: там те же паттерны, но с бо́льшим отдыхом и без прыжковых выпадов.',
        'A rule of thumb: 20 full push-ups in a row, a two-minute plank, 40 unbroken squats and some familiarity with burpees. If that is you, come in. If not yet, do Forma Bodyweight first: same patterns, more rest and no jumping lunges.',
      ),
    },
    {
      q: l('Сколько времени занимает тренировка?', 'How long is a session?'),
      a: l(
        'Около 25–30 минут вместе с разминкой и заминкой. Разминка — суставная гимнастика, пять минут, она обязательна и не считается тренировкой. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.',
        'About 25–30 minutes including warm-up and cool-down. The warm-up is joint mobility, five minutes, mandatory and not counted as training. Before you start, the app shows the estimated duration for your own volume.',
      ),
    },
    {
      q: l('Что делать, если не укладываюсь в лимит?', 'What if I do not make the cap?'),
      a: l(
        'Ничего. «Крышка» на то и крышка: лимит стоит выше, чем возьмёт большинство, и закрывать его не обязательно. Не успел — доделай остаток в своём темпе, если хочешь, и запиши в отчёте, где тебя остановило время. Через две недели тот же список пойдёт быстрее — это и есть смысл курса.',
        'Nothing. That is what a cap is: the ceiling sits above what most people reach, and closing it is not required. If time runs out, finish the rest at your own pace if you want to, and note in the feedback where the clock stopped you. In two weeks the same list goes faster — that is the point of the course.',
      ),
    },
    {
      q: l('Как приложение подстраивает нагрузку?', 'How does the app adapt the load?'),
      a: l(
        'Стартовый объём считается по онбордингу. После каждой тренировки ты оцениваешь усилие и самочувствие, и приложение чуть двигает повторы на следующий раз. Перед тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее» — это меняет объём, число подходов и окна форматов, но не трогает отдых между подходами: отдых на этом курсе задан программой и меняется только по неделям. Пять кругов не меняются никогда.',
        'Your starting volume comes from onboarding. After every session you rate the effort and how you felt, and the app nudges the reps for next time. Before a session you can pick Easier, As usual or Harder — that moves the volume, the set count and the format windows, but never the rest between sets: on this course the rest is set by the programme and changes only by week. The five rounds never change at all.',
      ),
    },
  ],
};
