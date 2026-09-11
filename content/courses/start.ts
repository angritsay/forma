/**
 * Course "start" — Старт: кроссфит дома без оборудования / Start: home CrossFit basics.
 *
 * Level 1, 4 weeks, 5 sessions per week: the coach's own beginner programme, transcribed from
 * the 20 workouts he posted to his `‼️НОВИЧКИ‼️` channel (docs/COACH_SOURCE.md — each workout
 * below names the message it comes from). The app adds what the channel did not have: a
 * retest at the end so the numbers can be compared with the onboarding self-tests, warm-up /
 * cool-down blocks in the player, and rest days with a step goal in between. There is no
 * max-effort test on day one: the coach's rule is that the first session must not destroy
 * anyone, and the onboarding already sets the starting load.
 *
 * Authoring rules for this course:
 * - Only movements the coach demonstrates on video (media/manifest.json) are used in the main
 *   work, so the whole programme plays with his own clips and nothing has to be re-shot. The
 *   one exception is the glute bridge (workout 4), which he programmed but never filmed.
 * - His alternatives are kept as notes on the item: sit-ups ↔ dead bug (diastasis), jumping
 *   jacks ↔ jump rope, toe reaches → sit-ups (the library has no toe reach; the sit-up clip is
 *   the nearest movement and the numbers are the sit-up numbers).
 * - Reps are authored at his "confident beginner" figure (scale 1.0). The engine multiplies
 *   them by the athlete's scale (a real beginner starts at 0.6–0.8), which lands on his
 *   "start from the minimum" advice without a separate beginner column.
 * - Where he posted a workout twice (the channel ran the programme for two intakes), the later,
 *   simpler version is used; the review page (npm run content:review) lists both.
 * - His channel numbered two workouts "13"; the duplicate (a 2-minute max-squat test) is dropped so
 *   the course is exactly his 20 sessions over 20 days, numbered 1–20.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type NodeInput = CourseInput['nodes'][number];

const l = (ru: string, en: string): L10n => ({ ru, en });

/* ---------------------------------------------------------------------------------------- */
/* Shared blocks                                                                             */
/* ---------------------------------------------------------------------------------------- */

/**
 * The coach's warm-up is joint mobility — «суставная гимнастика» from the top down: neck,
 * shoulders, elbows and wrists, trunk, hips, knees, ankles — never running. It is mandatory
 * before every session and is not counted as part of the session's work.
 */
function warmup(): BlockInput {
  return {
    id: 'wu_mobility',
    type: 'warmup',
    format: 'circuit',
    sets: 1,
    scalable: false,
    title: l('Разминка: суставная гимнастика', 'Warm-up: joint mobility'),
    description: l(
      'Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка.',
      'Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation.',
    ),
    items: [
      {
        exerciseId: 'neck_circles',
        seconds: 20,
        note: l(
          'Полукруги спереди, назад не запрокидываем',
          'Half-circles across the front, no dropping back',
        ),
      },
      {
        exerciseId: 'arm_circles',
        seconds: 20,
        note: l('Половину вперёд, половину назад', 'Half forward, half backward'),
      },
      { exerciseId: 'elbow_wrist_circles', seconds: 20 },
      { exerciseId: 'side_bend', seconds: 20 },
      { exerciseId: 'hip_circles', seconds: 20, note: l('В обе стороны', 'Both directions') },
      { exerciseId: 'leg_swing', reps: 6, perSide: true },
      {
        exerciseId: 'knee_circles',
        seconds: 20,
        note: l('Круги маленькие, пятки на полу', 'Small circles, heels down'),
      },
      { exerciseId: 'ankle_circles', seconds: 15, perSide: true },
      {
        exerciseId: 'squat_to_stand',
        reps: 5,
        note: l('Медленно, до комфортной глубины', 'Slowly, to a comfortable depth'),
      },
    ],
  };
}

/** The coach's «заминка / растяжка» after every session: spine, legs, hips, a rest pose. */
function cooldown(): BlockInput {
  return {
    id: 'cd_stretch',
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    title: l('Заминка и растяжка', 'Cool-down and stretch'),
    description: l(
      'Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться.',
      'Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become.',
    ),
    items: [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'quad_stretch', seconds: 30, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 25, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 20, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

/* ---------------------------------------------------------------------------------------- */
/* Notes the coach repeats                                                                    */
/* ---------------------------------------------------------------------------------------- */

const NOTE_DEAD_BUG = l(
  'Не тяни себя за шею — поднимайся животом. Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений',
  'Do not pull on your neck — lift with the abdominals. If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps',
);
const NOTE_ROPE = l(
  'Или столько же прыжков на скакалке. Мягко на носки; не хочешь прыгать — шагай в стороны',
  'Or the same number of rope skips. Land softly on the toes; do not want to jump? Step out to the sides',
);
const NOTE_LUNGE_TOTAL = l(
  'Считаем в сумме на две ноги. Шаг назад, колено мягко к полу, корпус прямой',
  'Counted as the total for both legs. Step back, knee softly to the floor, trunk upright',
);

/**
 * The coach writes a technique reminder under every movement. These are his cues, applied by
 * `withCues()` to every main-work item that has no note of its own, so no movement in the
 * course is ever shown as a bare number.
 */
const CUES: Record<string, L10n> = {
  knee_push_up: l(
    'Корпус ровно, живот напряжён, таз не проваливаем, локти не разводим широко. Тяжело — от высокой опоры',
    'Body straight, belly braced, hips do not sag, elbows not flared. Too hard? Push up from a high surface',
  ),
  air_squat: l(
    'Пятки на полу, колени в стороны, глубина комфортная — не садись ниже, чем держится техника',
    'Heels down, knees out, comfortable depth — no lower than your technique holds',
  ),
  sit_up: NOTE_DEAD_BUG,
  dead_bug: l(
    'Поясница прижата к полу, движения медленные, корпус под контролем',
    'Lower back pressed into the floor, slow movements, trunk under control',
  ),
  reverse_lunge: l(
    'Шаг назад, колено мягко к полу, корпус прямой. Можно держаться за стул',
    'Step back, knee softly to the floor, trunk upright. Hold a chair if you need to',
  ),
  chair_dip: l(
    'Стул без колёсиков, к стене. Локти назад, плечи вниз, опускайся до комфортной глубины',
    'A chair without wheels, against the wall. Elbows back, shoulders down, lower to a comfortable depth',
  ),
  step_up: l(
    'Вставай через пятку, наверху выпрямись полностью, спускайся под контролем',
    'Drive through the heel, stand up fully at the top, step down under control',
  ),
  inchworm: l(
    'Шагай руками спокойно, спина ровная, колени можно чуть согнуть',
    'Walk the hands calmly, back flat, knees may bend a little',
  ),
  mountain_climber: l(
    'Плечи над кистями, таз не задираем. Считаем по коленям — каждое колено это повтор',
    'Shoulders over the wrists, hips not piked. Count per knee — every knee drive is a rep',
  ),
  jumping_jack: NOTE_ROPE,
  burpee: l(
    'Шагом назад и вперёд, если прыжок пока не даётся. Темп — такой, который держится до конца',
    'Step back and forward if the jump is not there yet. A pace you can hold to the end',
  ),
  russian_twist: l(
    'Спина прямая, поворот от корпуса, а не руками. При диастазе — «мёртвый жук», вдвое больше',
    'Back straight, twist from the trunk, not the arms. With diastasis, dead bugs — twice the reps',
  ),
  glute_bridge: l(
    'Вверху сожми ягодицы на секунду, поясницу не прогибай',
    'Squeeze the glutes for a second at the top, do not arch the lower back',
  ),
  push_up: l(
    'Корпус ровно, локти назад под 45°, грудь к полу. Тяжело — с колен или от высокой опоры',
    'Body straight, elbows back at 45 degrees, chest to the floor. Too hard? From the knees or a high surface',
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
/* Workouts                                                                                  */
/* ---------------------------------------------------------------------------------------- */

const WORKOUTS: WorkoutInput[] = [
  /* --- 1 — по таймеру, каждую минуту новое движение ------------------------------------- */
  {
    id: 'w_s01_emom',
    name: l('Отжимания, приседания, «жук»', 'Push-ups, squats, dead bugs'),
    focus: l('Знакомим тело с тренировками', 'Introducing the body to training'),
    description: l(
      'Тренировка 1. Работаем по таймеру: каждую минуту — новое упражнение, выполнил и до конца минуты отдыхаешь. 1-я минута — отжимания с колен, 2-я — приседания, 3-я — «мёртвый жук», 4-я — отдых. Цель — включить в работу большие группы мышц и просто начать. Не спеши и не гонись за максимумом: техника и комфортная нагрузка важнее цифр. Первая тренировка не должна тебя уничтожить — она должна помочь захотеть прийти на вторую.',
      'Workout 1. Work by the timer: every minute a new exercise — do it, then rest until the minute is up. Minute 1 knee push-ups, 2 squats, 3 dead bugs, 4 rest. The goal is to switch on the big muscle groups and simply begin. No rush, no maximum: technique and a comfortable load matter more than numbers.',
    ),
    basePoints: 90,
    tags: ['emom', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's01_main',
        type: 'metcon',
        format: 'emom',
        rounds: 3,
        title: l('По минутам', 'By the minute'),
        description: l(
          'Каждую минуту — новое движение, потом отдых до конца минуты. После трёх минут — минута отдыха. Спокойный темп, аккуратная техника.',
          'A new movement every minute, then rest until the minute is up. After the three minutes, take a rest minute. Easy pace, careful technique.',
        ),
        items: [
          {
            exerciseId: 'knee_push_up',
            reps: 8,
            note: l(
              'Тренер: 5–10, совсем новичок — с 5. Корпус ровно, локти не разводим; если и 5 тяжело — от высокой опоры',
              'The coach: 5–10, complete beginners start at 5. Body straight, elbows in; if even 5 is hard, from a high surface',
            ),
          },
          {
            exerciseId: 'air_squat',
            reps: 13,
            note: l(
              'Тренер: 10–15. Пятки на полу, глубина комфортная',
              'The coach: 10–15. Heels down, comfortable depth',
            ),
          },
          {
            exerciseId: 'dead_bug',
            reps: 13,
            note: l(
              'Тренер: 10–15, суммарно. Поясница прижата к полу, движения медленные. Уверенно и без диастаза — можно ситапы',
              'The coach: 10–15 total. Lower back pressed down, slow. Confident and no diastasis? Sit-ups instead',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 2 — по таймеру: трицепс, ноги, пресс -------------------------------------------- */
  {
    id: 'w_s02_emom',
    name: l('Обратные отжимания, выпады, «жук»', 'Dips, lunges, dead bugs'),
    focus: l('Трицепс, ноги и пресс', 'Triceps, legs and abs'),
    description: l(
      'Тренировка 2. Та же схема, что в первой, но другие движения: обратные отжимания от стула, выпады назад и «жук». Каждую минуту новое упражнение, 4-я минута — отдых. Не гонимся за количеством: выбирай число, при котором последние повторения ощущаются, а техника остаётся хорошей.',
      'Workout 2. Same scheme as workout 1 with new movements: chair dips, reverse lunges and dead bugs. A new exercise every minute, minute 4 is rest. Do not chase reps: pick a number where the last reps are felt but the technique holds.',
    ),
    basePoints: 90,
    tags: ['emom', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's02_main',
        type: 'metcon',
        format: 'emom',
        rounds: 3,
        title: l('По минутам', 'By the minute'),
        description: l(
          'Минута 1 — обратные отжимания, 2 — выпады, 3 — «жук», 4 — отдых. Выполнил движение — отдыхаешь до конца минуты.',
          'Minute 1 dips, 2 lunges, 3 dead bugs, 4 rest. Do the movement, then rest until the minute is up.',
        ),
        items: [
          {
            exerciseId: 'chair_dip',
            reps: 12,
            note: l(
              'Тренер: 8–16. Стул к стене, локти назад, плечи вниз',
              'The coach: 8–16. Chair to the wall, elbows back, shoulders down',
            ),
          },
          {
            exerciseId: 'reverse_lunge',
            reps: 12,
            note: l(
              'Тренер: 8–16 в сумме на две ноги. Колено мягко к полу',
              'The coach: 8–16 total for both legs. Knee softly to the floor',
            ),
          },
          {
            exerciseId: 'dead_bug',
            reps: 12,
            note: l(
              'Тренер: 8–16, суммарно. Медленно, поясница прижата',
              'The coach: 8–16 total. Slow, lower back pressed down',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 3 — три пары, старт раз в 2 минуты ---------------------------------------------- */
  {
    id: 'w_s03_pairs',
    name: l('Три пары: верх, ноги, пресс', 'Three pairs: upper, legs, core'),
    focus: l('Прорабатываем большие группы мышц', 'Working the big muscle groups'),
    description: l(
      'Тренировка 3. Три пары упражнений, старт каждой пары раз в 2 минуты: сделал круг — до конца двух минут отдыхаешь, потом минута отдыха и следующая пара. Пара 1 — обратные отжимания и отжимания с колен, пара 2 — приседания и выпады назад, пара 3 — ситапы и «мёртвый жук». По одному кругу на каждую пару.',
      'Workout 3. Three pairs of exercises, each pair starting every 2 minutes: do the round, rest until the two minutes are up, then a rest minute and the next pair. Pair 1 dips and knee push-ups, pair 2 squats and reverse lunges, pair 3 sit-ups and dead bugs. One round per pair.',
    ),
    basePoints: 100,
    tags: ['circuit', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's03_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 540,
        title: l('Три пары', 'Three pairs'),
        description: l(
          'По одному кругу на каждую пару, между парами — минута отдыха. Не торопись: техника важнее скорости.',
          'One round per pair, a minute of rest between pairs. Do not rush: technique beats speed.',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 15, note: l('Тренер: 10–20', 'The coach: 10–20') },
          {
            exerciseId: 'knee_push_up',
            reps: 13,
            restAfterSec: 60,
            note: l('Тренер: 10–15', 'The coach: 10–15'),
          },
          { exerciseId: 'air_squat', reps: 15, note: l('Тренер: 10–20', 'The coach: 10–20') },
          {
            exerciseId: 'reverse_lunge',
            reps: 15,
            restAfterSec: 60,
            note: l('Тренер: 10–20 в сумме на две ноги', 'The coach: 10–20 total for both legs'),
          },
          {
            exerciseId: 'sit_up',
            reps: 8,
            note: l(
              'Тренер: 5–10. При диастазе — «жук»',
              'The coach: 5–10. With diastasis, dead bugs',
            ),
          },
          {
            exerciseId: 'dead_bug',
            reps: 30,
            note: l('Тренер: 20–40, суммарно', 'The coach: 20–40 total'),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 4 — максимум ягодичных мостов за 5 минут ---------------------------------------- */
  {
    id: 'w_s04_bridges',
    name: l('Ягодичный мост, 5 минут', 'Glute bridge, 5 minutes'),
    focus: l('Максимум мостов, цель 100', 'As many bridges as possible, target 100'),
    description: l(
      'Тренировка 4. Одно движение — ягодичный мост. Набери максимум повторений за 5 минут, цель — 100. Разбивай на подходы как удобно и в верхней точке каждый раз на секунду сжимай ягодицы.',
      'Workout 4. One movement — the glute bridge. As many reps as possible in 5 minutes, target 100. Break it into sets as you like and squeeze the glutes for a second at the top of every rep.',
    ),
    basePoints: 90,
    tags: ['amrap', 'glutes', 'hinge', 'beginner'],
    blocks: [
      warmup(),
      {
        id: 's04_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 300,
        title: l('5 минут, цель 100', '5 minutes, target 100'),
        description: l(
          'Максимум мостов за 5 минут. Разбивай на подходы по 20–25, отдыхай сколько нужно; цель — сто повторений.',
          'As many bridges as possible in 5 minutes. Break it into sets of 20–25, rest as needed; the target is one hundred.',
        ),
        items: [{ exerciseId: 'glute_bridge', reps: 25 }],
      },
      cooldown(),
    ],
  },

  /* --- 5 — три круга, крышка 10 минут -------------------------------------------------- */
  {
    id: 'w_s05_three_rounds',
    name: l('Три круга: пресс, ноги, верх', 'Three rounds: core, legs, upper'),
    focus: l('Первый комплекс на время', 'Your first workout for time'),
    description: l(
      'Тренировка 5. Три круга: ситапы, приседания и отжимания с колен. Во втором круге отжиманий чуть больше. Крышка 10 минут, отдыхай как комфортно. Запиши время и ощущения — в конце курса сравнишь с этой тренировкой.',
      'Workout 5. Three rounds: sit-ups, squats and knee push-ups. A few more push-ups in the second round. 10-minute cap, rest as you like. Note your time and how it felt — you will compare at the end of the course.',
    ),
    basePoints: 100,
    tags: ['fortime', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's05_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('3 круга на время', '3 rounds for time'),
        description: l(
          'Крышка 10 минут. Ситапы можно заменить «жуком» (вдвое больше). Отдыхай между кругами как комфортно.',
          '10-minute cap. Sit-ups can be swapped for dead bugs (twice the reps). Rest between rounds as you like.',
        ),
        items: [
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'knee_push_up', reps: 10 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'knee_push_up', reps: 15 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'knee_push_up', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 6 — AMRAP 8 --------------------------------------------------------------------- */
  {
    id: 'w_s06_amrap8',
    name: l('AMRAP 8: пресс, присед, отжимания', 'AMRAP 8: core, squat, push-ups'),
    focus: l('Максимум кругов за 8 минут', 'As many rounds as possible in 8 minutes'),
    description: l(
      'Тренировка 6. Тот же круг, что в пятой, но теперь по кругу в течение 8 минут в спокойном темпе: столько кругов, сколько получится. Не спринтуй первые две минуты — выбери темп, который сможешь держать всё время.',
      'Workout 6. The same round as workout 5, now on a loop for 8 minutes at an easy pace: as many rounds as you can. Do not sprint the first two minutes — pick a pace you can hold.',
    ),
    basePoints: 100,
    tags: ['amrap', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's06_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут в ровном темпе. Ситапы можно заменить «жуком» (вдвое больше).',
          'As many rounds as possible in 8 minutes at an even pace. Sit-ups can be swapped for dead bugs (twice the reps).',
        ),
        items: [
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'knee_push_up', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 7 — EMOM, 2 круга, +2 повтора --------------------------------------------------- */
  {
    id: 'w_s07_emom_ladder',
    name: l('EMOM: присед, отжимания, выпады, пресс', 'EMOM: squat, push-ups, lunges, core'),
    focus: l(
      'Работа по минутам, прибавка во втором круге',
      'By the minute, more in the second loop',
    ),
    description: l(
      'Тренировка 7. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений: приседания, отжимания с колен, выпады, ситапы. Во втором круге добавь по 2 повтора к каждому. Всего два круга — восемь минут.',
      'Workout 7. A new exercise every minute, do it and rest until the minute is up. A round of four: squats, knee push-ups, lunges, sit-ups. In the second loop add 2 reps to each. Two loops, eight minutes.',
    ),
    basePoints: 100,
    tags: ['emom', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's07_main',
        type: 'metcon',
        format: 'emom',
        rounds: 8,
        title: l('EMOM 8, +2 во втором круге', 'EMOM 8, +2 in the second loop'),
        description: l(
          'Минуты 1–4 — по 12 повторений, минуты 5–8 — по 14. Выполнил движение — отдыхаешь до конца минуты.',
          'Minutes 1–4 twelve reps, minutes 5–8 fourteen. Do the movement, then rest until the minute is up.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 12 },
          { exerciseId: 'knee_push_up', reps: 12 },
          { exerciseId: 'reverse_lunge', reps: 12, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'sit_up', reps: 12, note: NOTE_DEAD_BUG },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 8 — два круга, крышка 10 минут -------------------------------------------------- */
  {
    id: 'w_s08_two_rounds',
    name: l('Два круга: верх, ноги, кор', 'Two rounds: upper, legs, core'),
    focus: l('Длиннее круг, отдых по желанию', 'A longer round, rest as you like'),
    description: l(
      'Тренировка 8. Круг из четырёх движений по 20 повторений: обратные отжимания, приседания, скалолазы, выпады назад. Два круга, крышка 10 минут, отдыхаешь когда хочешь. Держи ровный темп и не жертвуй техникой ради секунд.',
      'Workout 8. A round of four at 20 reps each: dips, squats, mountain climbers, reverse lunges. Two rounds, 10-minute cap, rest whenever you want. Keep an even pace and do not trade technique for seconds.',
    ),
    basePoints: 110,
    tags: ['fortime', 'conditioning', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's08_main',
        type: 'metcon',
        format: 'fortime',
        sets: 2,
        durationSec: 600,
        title: l('2 круга на время', '2 rounds for time'),
        description: l(
          'Крышка 10 минут. Скалолазы считаем по коленям. Отдыхаешь когда хочешь — задача закрыть два круга.',
          '10-minute cap. Count mountain climbers per knee. Rest whenever — the task is to close two rounds.',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 20 },
          { exerciseId: 'air_squat', reps: 20 },
          { exerciseId: 'mountain_climber', reps: 20 },
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 9 — два круга на время, крышка 8 ------------------------------------------------ */
  {
    id: 'w_s09_for_time',
    name: l('Пресс и скалолазы на время', 'Core and climbers for time'),
    focus: l('Чем быстрее, тем быстрее освободишься', 'The faster you go, the sooner you are done'),
    description: l(
      'Тренировка 9. Два круга на время: 15 ситапов, 30 скалолазов, 30 «жуков», 15 ситапов. Работа на время — чем быстрее сделаешь, тем быстрее освободишься; отдыхаешь когда хочешь, задача закрыть два круга как можно скорее. Крышка 8 минут.',
      'Workout 9. Two rounds for time: 15 sit-ups, 30 mountain climbers, 30 dead bugs, 15 sit-ups. The faster you finish, the sooner you are free; rest whenever, close the two rounds as fast as you can. 8-minute cap.',
    ),
    basePoints: 100,
    tags: ['fortime', 'core', 'conditioning'],
    blocks: [
      warmup(),
      {
        id: 's09_main',
        type: 'metcon',
        format: 'fortime',
        sets: 2,
        durationSec: 480,
        title: l('2 круга на время', '2 rounds for time'),
        description: l(
          'Крышка 8 минут. Скалолазы по коленям, «жук» медленно и под контролем. Ситапы при диастазе — «жук», вдвое больше.',
          '8-minute cap. Climbers per knee, dead bugs slow and controlled. Sit-ups with diastasis: dead bugs, twice the reps.',
        ),
        items: [
          { exerciseId: 'sit_up', reps: 15, note: NOTE_DEAD_BUG },
          { exerciseId: 'mountain_climber', reps: 30 },
          { exerciseId: 'dead_bug', reps: 30 },
          { exerciseId: 'sit_up', reps: 15, note: NOTE_DEAD_BUG },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 10 — старт раз в 2 минуты, 4 круга ---------------------------------------------- */
  {
    id: 'w_s10_every_2min',
    name: l('Червячки и приседания', 'Inchworms and squats'),
    focus: l(
      'Уложи круг в 2 минуты, остальное — отдых',
      'Fit the round into 2 minutes, the rest is rest',
    ),
    description: l(
      'Тренировка 10. Короткий круг — 5 червячков и 10 приседаний. Старт раз в 2 минуты: выполнил круг — до конца двухминутки отдыхаешь. Четыре круга, всего восемь минут. Червячки — в спокойном темпе, шаг руками не слишком широкий.',
      'Workout 10. A short round — 5 inchworms and 10 squats. Start every 2 minutes: done early, rest until the 2 minutes are up. Four rounds, eight minutes. Inchworms at an easy pace, hand steps not too wide.',
    ),
    basePoints: 100,
    tags: ['interval', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's10_main',
        type: 'metcon',
        format: 'fortime',
        sets: 4,
        durationSec: 480,
        title: l('4 круга, старт раз в 2 минуты', '4 rounds, start every 2 minutes'),
        description: l(
          'Круг без пауз, потом отдых до конца двухминутки — около 1–1,5 минуты. Не торопись на червячках.',
          'No pauses inside the round, then rest until the 2-minute mark — about 1–1.5 minutes. Do not rush the inchworms.',
        ),
        items: [
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'air_squat', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 11 — EMOM, 4 движения, 2 круга -------------------------------------------------- */
  {
    id: 'w_s11_emom8',
    name: l('EMOM 8: отжимания, присед, пресс, выпады', 'EMOM 8: push-ups, squat, core, lunges'),
    focus: l('Работа по минутам, восемь минут', 'By the minute, eight minutes'),
    description: l(
      'Тренировка 11. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений по 10 повторений: отжимания с колен, приседания, ситапы (или 20 «жуков»), выпады. Два круга — восемь минут.',
      'Workout 11. A new exercise every minute, do it and rest until the minute is up. A round of four at 10 reps: knee push-ups, squats, sit-ups (or 20 dead bugs), lunges. Two loops, eight minutes.',
    ),
    basePoints: 100,
    tags: ['emom', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's11_main',
        type: 'metcon',
        format: 'emom',
        rounds: 8,
        title: l('EMOM 8 мин', 'EMOM 8 min'),
        description: l(
          'Минута 1 — отжимания, 2 — приседания, 3 — ситапы или «жук», 4 — выпады, и снова по кругу.',
          'Minute 1 push-ups, 2 squats, 3 sit-ups or dead bugs, 4 lunges, then round again.',
        ),
        items: [
          { exerciseId: 'knee_push_up', reps: 10 },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'reverse_lunge', reps: 10, note: NOTE_LUNGE_TOTAL },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 12 — лесенка вниз: зашагивания и червячки --------------------------------------- */
  {
    id: 'w_s12_step_ladder',
    name: l('Лесенка вниз: зашагивания и червячки', 'Descending ladder: step-ups and inchworms'),
    focus: l('Аккуратно и правильно, а не быстро', 'Careful and correct, not fast'),
    description: l(
      'Тренировка 12. Лесенка вниз: 10 зашагиваний на каждую ногу и 5 червячков, потом 8 и 4, 6 и 3, 4 и 2, 2 и 1. Работа на время, но на зашагиваниях не торопись — лучше аккуратно и правильно, чем быстро и непонятно как.',
      'Workout 12. A descending ladder: 10 step-ups per leg and 5 inchworms, then 8 and 4, 6 and 3, 4 and 2, 2 and 1. For time, but do not rush the step-ups: careful and correct beats fast and sloppy.',
    ),
    basePoints: 100,
    tags: ['fortime', 'lunge', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's12_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('Лесенка на время', 'The ladder for time'),
        description: l(
          'Крышка 10 минут. Зашагивания — на стул без колёсиков или на ступеньку; вставай через пятку и полностью выпрямляйся наверху.',
          '10-minute cap. Step-ups onto a chair without wheels or a stair step; drive through the heel and stand up fully at the top.',
        ),
        items: [
          { exerciseId: 'step_up', reps: 10, perSide: true },
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'step_up', reps: 8, perSide: true },
          { exerciseId: 'inchworm', reps: 4 },
          { exerciseId: 'step_up', reps: 6, perSide: true },
          { exerciseId: 'inchworm', reps: 3 },
          { exerciseId: 'step_up', reps: 4, perSide: true },
          { exerciseId: 'inchworm', reps: 2 },
          { exerciseId: 'step_up', reps: 2, perSide: true },
          { exerciseId: 'inchworm', reps: 1 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 13 — лесенка из пяти движений, максимум кругов ---------------------------------- */
  {
    id: 'w_s13_ladder5',
    name: l('Пять движений, максимум кругов', 'Five movements, as many rounds as possible'),
    focus: l('Чуть усложняем', 'Stepping it up a little'),
    description: l(
      'Тренировка 13. Немного усложняем: круг из пяти движений — 5 червячков, 6 ситапов, 7 отжиманий с колен, 8 выпадов, 9 приседаний. За отведённое время — максимум кругов, ориентир три круга. Ровный темп важнее скорости.',
      'Workout 13. A little harder: a round of five — 5 inchworms, 6 sit-ups, 7 knee push-ups, 8 lunges, 9 squats. As many rounds as possible in the time, three is a good mark. An even pace beats speed.',
    ),
    basePoints: 100,
    tags: ['amrap', 'full_body', 'conditioning'],
    blocks: [
      warmup(),
      {
        id: 's13_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8, цель 3 круга', 'AMRAP 8, target 3 rounds'),
        description: l(
          'Максимум кругов за 8 минут, ориентир — три круга. Выпады считаем в сумме на две ноги.',
          'As many rounds as possible in 8 minutes, three is the mark. Lunges counted as the total for both legs.',
        ),
        items: [
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'sit_up', reps: 6, note: NOTE_DEAD_BUG },
          { exerciseId: 'knee_push_up', reps: 7 },
          { exerciseId: 'reverse_lunge', reps: 8, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'air_squat', reps: 9 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 14 — два круга: 20 и 40 -------------------------------------------------------- */
  {
    id: 'w_s14_double',
    name: l('Выпады, отжимания, твисты: 20 и 40', 'Lunges, push-ups, twists: 20 and 40'),
    focus: l('Два круга: сначала по 20, потом по 40', 'Two rounds: 20s, then 40s'),
    description: l(
      'Тренировка 14. Два круга. Первый — по 20: выпады назад, отжимания с колен, русские твисты (или 40 «жуков»). Отдых 2 минуты. Второй — по 40: те же движения. Второй круг длинный, разбивай на подходы и держи технику.',
      'Workout 14. Two rounds. The first at 20: reverse lunges, knee push-ups, Russian twists (or 40 dead bugs). Rest 2 minutes. The second at 40: the same movements. The second round is long — break it into sets and keep the technique.',
    ),
    basePoints: 110,
    tags: ['fortime', 'core', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's14_first',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 360,
        title: l('Круг по 20', 'Round of 20'),
        description: l(
          'По 20 повторений каждого движения, потом отдых 2 минуты перед вторым кругом.',
          '20 reps of each movement, then rest 2 minutes before the second round.',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'knee_push_up', reps: 20 },
          { exerciseId: 'russian_twist', reps: 20 },
        ],
      },
      {
        id: 's14_second',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('Круг по 40', 'Round of 40'),
        description: l(
          'После двух минут отдыха — по 40 каждого. Разбивай на подходы, техника важнее скорости.',
          'After two minutes of rest — 40 of each. Break it into sets, technique over speed.',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 40, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'knee_push_up', reps: 40 },
          { exerciseId: 'russian_twist', reps: 40 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 15 — AMRAP 8: отжимания, присед, скалолазы -------------------------------------- */
  {
    id: 'w_s15_amrap8',
    name: l('AMRAP 8: отжимания, присед, скалолазы', 'AMRAP 8: push-ups, squat, climbers'),
    focus: l('Максимум кругов за 8 минут', 'As many rounds as possible in 8 minutes'),
    description: l(
      'Тренировка 15. По кругу в течение 8 минут: 8 отжиманий, 16 приседаний, 32 скалолаза. Обычные отжимания — тяжело, делай с колен. Ровный темп: столько кругов, сколько получится держать до конца.',
      'Workout 15. On a loop for 8 minutes: 8 push-ups, 16 squats, 32 mountain climbers. Full push-ups hard? Do them from the knees. Even pace: as many rounds as you can hold to the end.',
    ),
    basePoints: 100,
    tags: ['amrap', 'conditioning', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's15_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Скалолазы по коленям. Отжимания тяжело — с колен.',
          'As many rounds as possible in 8 minutes. Climbers per knee. Push-ups hard? From the knees.',
        ),
        items: [
          { exerciseId: 'push_up', reps: 8 },
          { exerciseId: 'air_squat', reps: 16 },
          { exerciseId: 'mountain_climber', reps: 32 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 16 — чиппер на время, крышка 13 ------------------------------------------------- */
  {
    id: 'w_s16_chipper',
    name: l(
      'Чиппер: присед, выпады, зашагивания, червячки',
      'Chipper: squats, lunges, step-ups, inchworms',
    ),
    focus: l('Один длинный список сверху вниз', 'One long list, top to bottom'),
    description: l(
      'Тренировка 16. Длинный список на время: 60 приседаний, 40 выпадов, 30 зашагиваний, 20 червячков. Порядок и количество менять нельзя — идём сверху вниз. Крышка 13 минут; разбивай на подходы, но не меняй последовательность.',
      'Workout 16. A long list for time: 60 squats, 40 lunges, 30 step-ups, 20 inchworms. Order and reps are fixed — top to bottom. 13-minute cap; break it into sets but keep the order.',
    ),
    basePoints: 120,
    tags: ['fortime', 'chipper', 'lower'],
    blocks: [
      warmup(),
      {
        id: 's16_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 780,
        title: l('Чиппер на время', 'The chipper for time'),
        description: l(
          'Крышка 13 минут. Выпады и зашагивания считаем в сумме на две ноги. Порядок менять нельзя.',
          '13-minute cap. Lunges and step-ups counted as the total for both legs. Do not change the order.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 60 },
          { exerciseId: 'reverse_lunge', reps: 40, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'step_up',
            reps: 30,
            note: l('В сумме на две ноги', 'Total for both legs'),
          },
          { exerciseId: 'inchworm', reps: 20 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 17 — входной билет раз в 3 минуты, максимум червячков --------------------------- */
  {
    id: 'w_s17_buyin',
    name: l('Входной билет и червячки', 'Buy-in, then inchworms'),
    focus: l('Сделал обязательное — остальное максимум', 'Do the fixed part, then max out'),
    description: l(
      'Тренировка 17. Раз в 3 минуты выполни входной билет: 10 отжиманий, 10 приседаний, 10 ситапов, а в оставшееся время — максимум червячков. Два круга, между кругами 3 минуты отдыха. Червячки не торопи.',
      'Workout 17. Every 3 minutes do the buy-in: 10 push-ups, 10 squats, 10 sit-ups, and in the time left, max inchworms. Two rounds, 3 minutes of rest between them. Do not rush the inchworms.',
    ),
    basePoints: 110,
    tags: ['interval', 'full_body', 'conditioning'],
    blocks: [
      warmup(),
      {
        id: 's17_main',
        type: 'metcon',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 180,
        title: l('2 круга раз в 3 минуты', '2 rounds every 3 minutes'),
        description: l(
          'Входной билет — 10/10/10, оставшееся время трёхминутки — максимум червячков. Между кругами 3 минуты отдыха. Отжимания тяжело — с колен.',
          'The buy-in is 10/10/10; spend the rest of the 3 minutes on max inchworms. 3 minutes of rest between rounds. Push-ups hard? From the knees.',
        ),
        items: [
          { exerciseId: 'push_up', reps: 10 },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          {
            exerciseId: 'inchworm',
            reps: 8,
            note: l(
              'Максимум за оставшееся время трёхминутки',
              'As many as possible in the time left in the 3 minutes',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 18 — два интервала по 2 минуты -------------------------------------------------- */
  {
    id: 'w_s18_intervals',
    name: l('Два интервала: верх и низ', 'Two intervals: upper and lower'),
    focus: l('Обязательное, потом максимум', 'The fixed part, then max out'),
    description: l(
      'Тренировка 18. Два интервала по 2 минуты. Первый: 15 отжиманий, в оставшееся время — максимум червячков. Минута отдыха. Второй: 20 выпадов, в оставшееся время — максимум ситапов. Отжимания тяжело — с колен.',
      'Workout 18. Two 2-minute intervals. First: 15 push-ups, then max inchworms in the time left. One minute of rest. Second: 20 lunges, then max sit-ups. Push-ups hard? From the knees.',
    ),
    basePoints: 100,
    tags: ['interval', 'full_body', 'conditioning'],
    blocks: [
      warmup(),
      {
        id: 's18_first',
        type: 'metcon',
        format: 'amrap',
        durationSec: 120,
        title: l('2 минуты: отжимания + червячки', '2 minutes: push-ups + inchworms'),
        description: l(
          '15 отжиманий, потом до конца двух минут — максимум червячков. Затем минута отдыха.',
          '15 push-ups, then max inchworms until the 2 minutes are up. Then one minute of rest.',
        ),
        items: [
          { exerciseId: 'push_up', reps: 15 },
          {
            exerciseId: 'inchworm',
            reps: 8,
            note: l('Максимум за оставшееся время', 'As many as possible in the time left'),
          },
        ],
      },
      {
        id: 's18_second',
        type: 'metcon',
        format: 'amrap',
        durationSec: 120,
        title: l('2 минуты: выпады + ситапы', '2 minutes: lunges + sit-ups'),
        description: l(
          'После минуты отдыха: 20 выпадов, потом до конца двух минут — максимум ситапов (или «жука», вдвое больше).',
          'After a minute of rest: 20 lunges, then max sit-ups until the 2 minutes are up (or dead bugs, twice the reps).',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'sit_up',
            reps: 10,
            note: l(
              'Максимум за оставшееся время. При диастазе — «жук»',
              'As many as possible in the time left. With diastasis, dead bugs',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 19 — лесенка червячков, точка отсчёта ------------------------------------------- */
  {
    id: 'w_s19_inchworm_ladder',
    name: l('Лесенка червячков: точка отсчёта', 'Inchworm ladder: a benchmark'),
    focus: l('Каждую минуту на один больше', 'One more every minute'),
    description: l(
      'Тренировка 19. Точка отсчёта. Каждую минуту — на одного червячка больше: 1-я минута 1, 2-я 2, и так до 10-й. Делаешь, пока укладываешься в минуту; закрыть все десять не обязательно. Запиши, на какой минуте остановился — через месяц-два повторишь и сравнишь.',
      'Workout 19. A benchmark. One more inchworm each minute: minute 1 is 1, minute 2 is 2, up to minute 10. Keep going while you fit the minute; you do not have to finish all ten. Note where you stopped — repeat it in a month or two and compare.',
    ),
    basePoints: 90,
    tags: ['benchmark', 'core', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's19_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('Лесенка червячков', 'The inchworm ladder'),
        description: l(
          'По минутам, каждую на один больше. Это ориентир, а не тест на разрыв: остановись, где перестанешь укладываться, и запиши минуту.',
          'By the minute, one more each time. A reference, not a test to failure: stop where you stop fitting the minute and note it.',
        ),
        items: [
          { exerciseId: 'inchworm', reps: 1 },
          { exerciseId: 'inchworm', reps: 2 },
          { exerciseId: 'inchworm', reps: 3 },
          { exerciseId: 'inchworm', reps: 4 },
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'inchworm', reps: 6 },
          { exerciseId: 'inchworm', reps: 7 },
          { exerciseId: 'inchworm', reps: 8 },
          { exerciseId: 'inchworm', reps: 9 },
          { exerciseId: 'inchworm', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 20 — три круга, сравни с первой тренировкой ------------------------------------- */
  {
    id: 'w_s20_finisher',
    name: l('Три круга: «жук», присед, отжимания', 'Three rounds: dead bugs, squat, push-ups'),
    focus: l('Сравни ощущения с первой тренировкой', 'Compare with your first session'),
    description: l(
      'Тренировка 20. Финал курса: три круга — 20 «жуков», 10 приседаний, 10 отжиманий с колен. Спокойный темп, чистая техника. А теперь сравни ощущения после этой тренировки и после самой первой — почувствуй, насколько легче стало.',
      'Workout 20. The finish: three rounds — 20 dead bugs, 10 squats, 10 knee push-ups. Easy pace, clean technique. Now compare how this felt with your very first session — feel how much easier it has become.',
    ),
    basePoints: 100,
    tags: ['fortime', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's20_main',
        type: 'metcon',
        format: 'fortime',
        sets: 3,
        durationSec: 600,
        title: l('3 круга', '3 rounds'),
        description: l(
          'Три круга в спокойном темпе. «Жук» медленно, поясница прижата; приседания и отжимания — чисто.',
          'Three rounds at an easy pace. Dead bugs slow, lower back pressed down; squats and push-ups clean.',
        ),
        items: [
          { exerciseId: 'dead_bug', reps: 20 },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'knee_push_up', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },
];

/* ---------------------------------------------------------------------------------------- */
/* Nodes (the path)                                                                          */
/* ---------------------------------------------------------------------------------------- */

function restNode(week: number, day: number, subtitle: L10n): NodeInput {
  return {
    id: `w${week}_d${day}_rest`,
    week,
    day,
    kind: 'rest',
    stepsGoal: 10000,
    title: l('Отдых и прогулка', 'Rest & walk'),
    subtitle,
  };
}

function workoutNode(
  week: number,
  day: number,
  number: number,
  workoutId: string,
  subtitle: L10n,
  kind: 'workout' | 'benchmark' = 'workout',
): NodeInput {
  return {
    id: `w${week}_d${day}_s${String(number).padStart(2, '0')}`,
    week,
    day,
    kind,
    workoutId,
    title: l(`Тренировка ${number}`, `Workout ${number}`),
    subtitle,
  };
}

/** The coach's rest-day line under every workout: "👣 alternative — 10 000 steps". */
const REST_STEPS = l(
  '10000 шагов и сон — так растёт сила',
  '10,000 steps and sleep — that is how strength grows',
);
const REST_SORENESS = l(
  'Пройдись: лёгкое движение снимает крепатуру',
  'Go for a walk: gentle movement eases soreness',
);
const REST_RECOVERY = l(
  'Восстановление — часть тренировки, а не пауза в ней',
  'Recovery is part of the training, not a break from it',
);
const REST_WEEKEND = l(
  'Выходные: два дня прогулок, сна и нормальной еды',
  'Weekend: two days of walks, sleep and proper food',
);
const REST_BEFORE_TEST = l(
  'Завтра повторный тест. Пройдись, выспись, не переедай',
  'Retest tomorrow. Walk, sleep well, do not overeat',
);

const NODES: NodeInput[] = [
  /* Week 1 — the coach's first session is deliberately the first session, no baseline test. */
  workoutNode(1, 1, 1, 'w_s01_emom', l('По таймеру, 3 движения', 'By the timer, 3 movements')),
  workoutNode(1, 2, 2, 'w_s02_emom', l('По таймеру, 3 движения', 'By the timer, 3 movements')),
  workoutNode(
    1,
    3,
    3,
    'w_s03_pairs',
    l('Три пары, старт раз в 2 мин', 'Three pairs, start every 2 min'),
  ),
  workoutNode(1, 4, 4, 'w_s04_bridges', l('Мосты 5 мин, цель 100', 'Bridges 5 min, target 100')),
  workoutNode(1, 5, 5, 'w_s05_three_rounds', l('3 круга на время', '3 rounds for time')),
  restNode(1, 6, REST_SORENESS),
  restNode(1, 7, REST_WEEKEND),

  /* Week 2 */
  workoutNode(2, 1, 6, 'w_s06_amrap8', l('AMRAP 8 мин', 'AMRAP 8 min')),
  workoutNode(2, 2, 7, 'w_s07_emom_ladder', l('EMOM 8, +2 во 2-м круге', 'EMOM 8, +2 in loop 2')),
  workoutNode(2, 3, 8, 'w_s08_two_rounds', l('2 круга, крышка 10 мин', '2 rounds, 10-min cap')),
  workoutNode(
    2,
    4,
    9,
    'w_s09_for_time',
    l('2 круга на время, крышка 8', '2 rounds for time, cap 8'),
  ),
  workoutNode(2, 5, 10, 'w_s10_every_2min', l('4 круга раз в 2 минуты', '4 rounds every 2 min')),
  restNode(2, 6, REST_STEPS),
  restNode(2, 7, REST_WEEKEND),

  /* Week 3 */
  workoutNode(3, 1, 11, 'w_s11_emom8', l('EMOM 8 мин', 'EMOM 8 min')),
  workoutNode(3, 2, 12, 'w_s12_step_ladder', l('Лесенка вниз', 'Descending ladder')),
  workoutNode(
    3,
    3,
    13,
    'w_s13_ladder5',
    l('5 движений, максимум кругов', '5 movements, max rounds'),
  ),
  workoutNode(3, 4, 14, 'w_s14_double', l('Два круга: 20 и 40', 'Two rounds: 20 and 40')),
  workoutNode(3, 5, 15, 'w_s15_amrap8', l('AMRAP 8 мин', 'AMRAP 8 min')),
  restNode(3, 6, REST_STEPS),
  restNode(3, 7, REST_WEEKEND),

  /* Week 4 — ends on the benchmark finale (day 20), the course's last node. */
  workoutNode(4, 1, 16, 'w_s16_chipper', l('Чиппер, крышка 13 мин', 'Chipper, 13-min cap')),
  workoutNode(4, 2, 17, 'w_s17_buyin', l('Входной билет + червячки', 'Buy-in + inchworms')),
  workoutNode(4, 3, 18, 'w_s18_intervals', l('Два интервала по 2 мин', 'Two 2-min intervals')),
  restNode(4, 4, REST_RECOVERY),
  workoutNode(
    4,
    5,
    19,
    'w_s19_inchworm_ladder',
    l('Лесенка червячков — точка отсчёта', 'Inchworm ladder — a benchmark'),
    'benchmark',
  ),
  restNode(4, 6, REST_BEFORE_TEST),
  workoutNode(
    4,
    7,
    20,
    'w_s20_finisher',
    l('3 круга — сравни с первой', '3 rounds — compare to workout 1'),
    'benchmark',
  ),
];

/* ---------------------------------------------------------------------------------------- */
/* Course                                                                                    */
/* ---------------------------------------------------------------------------------------- */

export const COURSE_START: CourseInput = {
  id: 'start',
  order: 1,
  slug: {
    ru: 'start-krossfit-doma-bez-oborudovaniya',
    en: 'start-home-crossfit-basics',
  },
  name: l('Форма с нуля: кроссфит дома без оборудования', 'Forma. Start: home CrossFit basics'),
  tagline: l(
    'Четыре недели по программе тренера для новичков: коротко, по кругу, без оборудования.',
    'Four weeks of the coach’s own beginner programme: short, in rounds, no equipment.',
  ),
  description: l(
    'Программа для тех, кто начинает с нуля или возвращается после долгого перерыва. Двадцать коротких тренировок за двадцать дней — те самые, по которым тренер ведёт новичков: отжимания с колен, приседания, ситапы, выпады, зашагивания и червячки. Пять раз в неделю по 15–20 минут вместе с разминкой и заминкой, нагрузка подстраивается под тебя.',
    'A programme for complete beginners and anyone coming back after a long break. Twenty short sessions over twenty days — the same ones the coach runs his beginners through: knee push-ups, squats, sit-ups, lunges, step-ups and inchworms. Five times a week, 15–20 minutes each including warm-up and cool-down, and the load adapts to you.',
  ),
  longDescription: [
    l(
      '«Форма с нуля» — это программа для новичков, которую тренер ведёт в своей группе, перенесённая в приложение без изменений в сути: те же 20 тренировок, тот же порядок, те же слова. Цель первых недель — проработать большие группы мышц и включить тебя в процесс, а не выжать до предела. Каждую тренировку тренер показывает сам: на каждое движение есть его видео.',
      'Start is the beginner programme the coach runs with his own group, moved into the app without changing what matters: the same 20 sessions, the same order, the same words. The aim of the first weeks is to work the big muscle groups and get you into the process, not to wring you out. The coach demonstrates every session himself: every movement has his video.',
    ),
    l(
      'Первые тренировки — работа по таймеру: каждую минуту новое движение, потом простые круги с минутой отдыха. Дальше форматы кроссфита по одному: три круга на время, AMRAP, EMOM, старт раз в 2–3 минуты, лесенки и длинный комплекс на время. Пять тренировок в неделю, два дня — отдых с целью 10000 шагов: мышцы восстанавливаются лучше, когда ты двигаешься, а не лежишь.',
      'The first sessions are work by the timer — a new movement every minute — then simple rounds with a minute of rest. The CrossFit formats arrive one at a time: three rounds for time, AMRAP, EMOM, starts every 2–3 minutes, ladders and a long chipper for time. Five sessions a week, two rest days with a 10,000-step goal — muscles recover better when you move than when you lie still.',
    ),
    l(
      'Тренировки короткие — 15–20 минут вместе с разминкой и заминкой, самая длинная около 23. Сама работа — 5–15 минут, как у тренера; разминка — суставная гимнастика сверху вниз, без бега — и растяжка в конце в это время не входят. Из инвентаря нужны коврик и устойчивый стул: от него ты будешь отжиматься и на него зашагивать. Приложение считает, сколько повторений тебе делать сегодня, по результатам прошлой тренировки — было тяжело, легко или в самый раз. Тяжёлые упражнения заменяются простыми: ситапы — «мёртвым жуком», прыжки — шагом.',
      'Sessions are short — 15–20 minutes including warm-up and cool-down, the longest around 23. The work itself is 5–15 minutes, as the coach runs it; the warm-up — top-to-bottom joint mobility, no running — and the stretch at the end are not counted in that. You need a mat and a sturdy chair: you will do dips off it and step-ups onto it. The app works out how many reps you should do today from how your last session went — too hard, too easy or just right. Hard movements swap for simple ones: sit-ups for dead bugs, jumps for steps.',
    ),
    l(
      'Первый день — это первая тренировка, а не тест на максимум: тренер считает, что первое занятие не должно тебя уничтожить. Стартовую нагрузку задаёт анкета при первом входе. Внутри программы у тренера свои точки отсчёта: лесенка червячков в предпоследней тренировке, к которой вернёшься через месяц-два, и финальные три круга, где сравнишь ощущения с самой первой тренировкой.',
      'Day one is the first workout, not a max-effort test: the coach believes the first session must not destroy you. Your starting load comes from the onboarding on first login. Inside the programme the coach has his own reference points: an inchworm ladder in the penultimate session that you come back to in a month or two, and a final three rounds where you compare how it feels with your very first workout.',
    ),
  ],
  forWhom: [
    l(
      'Ты начинаешь с нуля или возвращаешься после долгого перерыва — год и больше.',
      'You are starting from zero or coming back after a long break — a year or more.',
    ),
    l(
      'Хочешь тренироваться по программе живого тренера, а не по подборке упражнений из интернета.',
      'You want a real coach’s programme, not a list of exercises off the internet.',
    ),
    l(
      'Нет инвентаря и места: только коврик, стул и два квадратных метра.',
      'You have no gear and little space: a mat, a chair and two square metres.',
    ),
    l(
      'Есть 15–20 минут пять раз в неделю и желание не бросить через две.',
      'You can find 15–20 minutes five times a week and want to still be going in week three.',
    ),
  ],
  outcomes: [
    l(
      'Уверенная техника базовых движений: присед, отжимание с колен, ситап, выпад, зашагивание.',
      'Confident technique in the base movements: squat, knee push-up, sit-up, lunge, step-up.',
    ),
    l(
      'Все форматы кроссфита в лёгких дозах — и лесенка червячков, к которой ты вернёшься, чтобы увидеть прогресс.',
      'Every CrossFit format in gentle doses — and an inchworm ladder you will come back to and see the difference.',
    ),
    l(
      'Привычка тренироваться пять раз в неделю и ходить в дни отдыха.',
      'A habit of training five times a week and walking on rest days.',
    ),
    l(
      'Знакомство со всеми форматами кроссфита: круги, «на время», AMRAP, EMOM, лесенки, длинный комплекс.',
      'A working knowledge of every CrossFit format: rounds, for-time, AMRAP, EMOM, ladders, the chipper.',
    ),
    l(
      'Твои личные цифры: точки отсчёта тренера — лесенка червячков и финальные три круга против самой первой тренировки.',
      'Your own numbers: the coach’s reference points — the inchworm ladder and the final three rounds against your very first workout.',
    ),
    l(
      'Готовность перейти к курсу «Форма своим весом» или к тренировкам с гантелями.',
      'Readiness to move on to Forma Bodyweight or to dumbbell training.',
    ),
  ],
  equipment: ['none', 'mat', 'chair'],
  level: 1,
  weeks: 4,
  sessionsPerWeek: 5,
  avgSessionMin: 18,
  tile: '#1a2634', // --tile-1
  price: { rub: 2990, usd: 29 },
  workouts: WORKOUTS.map(withCues),
  nodes: NODES,
  faq: [
    {
      q: l('Что нужно из оборудования?', 'What equipment do I need?'),
      a: l(
        'Коврик и устойчивый стул без колёсиков — от него ты будешь делать обратные отжимания и на него зашагивать. Если стула нет, зашагивай на ступеньку, а обратные отжимания замени на отжимания от подоконника. Скакалка — по желанию: везде, где она есть, можно делать джампинг-джеки.',
        'A mat and a sturdy chair without wheels — you will do dips off it and step-ups onto it. No chair? Use a stair step for step-ups and a windowsill for the dips. A jump rope is optional: wherever it appears, jumping jacks do the same job.',
      ),
    },
    {
      q: l('Я совсем не в форме. Точно получится?', 'I am completely out of shape. Will I cope?'),
      a: l(
        'Курс написан именно для этого. Тренер советует новичкам начинать с минимальных цифр — и приложение делает это за тебя: после анкеты при первом входе оно уменьшает количество повторений, а после каждой тренировки спрашивает, как было, и корректирует следующую. Если тяжело — выбирай режим «Полегче»: это не поражение, а часть плана. Ситапы можно всегда заменить «мёртвым жуком».',
        'That is exactly who this course is for. The coach tells beginners to start at the minimum — and the app does it for you: after the onboarding on first login it lowers the rep counts, then asks how each session felt and adjusts the next one. If it is hard, pick "Easier" — that is not failure, it is part of the plan. Sit-ups can always become dead bugs.',
      ),
    },
    {
      q: l('Сколько времени занимает тренировка?', 'How long is a session?'),
      a: l(
        'В среднем около 18 минут вместе с разминкой и заминкой — по 5 минут на суставную гимнастику и растяжку и 5–15 минут работы. Самые короткие — первые тренировки по таймеру, около 14–15 минут; самые длинные — чиппер и два длинных круга, около 22–23 минут. Перед стартом приложение показывает расчётное время для каждого режима сложности.',
        'About 18 minutes on average including warm-up and cool-down — 5 minutes each of joint mobility and stretching plus 5–15 minutes of work. The shortest are the first timer sessions at around 14–15 minutes; the longest are the chipper and the two long rounds at around 22–23. Before you start, the app shows the estimated time for each difficulty option.',
      ),
    },
    {
      q: l('Пропустил тренировку — что делать?', 'I missed a session — what now?'),
      a: l(
        'Ничего страшного: сделай её на следующий день и сдвинь остальные. Не пытайся нагнать две за один день — у новичков это заканчивается крепатурой и пропуском ещё одной недели. Если совсем нет сил или времени, у тренера есть альтернатива на любой день: 10 000 шагов.',
        'No drama: do it the next day and shift the rest. Do not try to squeeze two into one day — for beginners that ends in soreness and another week off. And if there is no energy or time at all, the coach has an alternative for any day: 10,000 steps.',
      ),
    },
    {
      q: l('У меня диастаз. Можно ли делать ситапы?', 'I have diastasis. Can I do sit-ups?'),
      a: l(
        'Тренер не рекомендует ситапы, русский твист и тягу к носкам при диастазе. Везде, где они есть, делай «мёртвого жука» — в два раза больше повторений. В приложении это написано прямо в упражнении, а при ограничении «беременность» замена происходит автоматически.',
        'The coach advises against sit-ups, Russian twists and toe reaches with diastasis. Wherever they appear, do dead bugs — twice the reps. The app says so right on the exercise, and with the "pregnancy" limitation set the swap happens automatically.',
      ),
    },
    {
      q: l('Мышцы болят после тренировки. Это нормально?', 'My muscles are sore. Is that normal?'),
      a: l(
        'Лёгкая боль на второй день после новой нагрузки — норма, особенно в первые две недели. Помогают прогулка, вода и сон. Если боль острая, в суставе или не проходит три дня — отдохни и при необходимости покажись врачу. В отзыве о тренировке отметь «Боль»: приложение снизит нагрузку.',
        'Mild soreness a day or two after a new load is normal, especially in the first two weeks. Walking, water and sleep help. If the pain is sharp, in a joint, or lasts more than three days, rest and see a professional if needed. Mark "Pain" in the session feedback: the app will reduce the load.',
      ),
    },
  ],
};
