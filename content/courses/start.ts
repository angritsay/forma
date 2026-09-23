/**
 * Course "start" — Форма с нуля: кроссфит дома без оборудования / Forma. Start: home CrossFit basics.
 *
 * Level 1, twenty workouts in four blocks of five: the coach's own beginner programme as he wrote
 * it out for the app (his 20-workout spec of 10 September), which in turn grew out of the workouts
 * he posted to his `‼️НОВИЧКИ‼️` channel (docs/COACH_SOURCE.md; the review page pairs every
 * workout with the nearest channel message). The app adds only the warm-up / cool-down blocks in
 * the player. There is no retest and no max-effort test on day one: the coach's rule is that the
 * first session must not destroy anyone, and the onboarding already sets the starting load. His
 * own reference points are inside the programme — the inchworm ladder (19) and the finale that
 * mirrors workout 1 (20).
 *
 * Authoring rules for this course:
 * - Only movements the coach demonstrates on video (media/manifest.json) are used in the main
 *   work, so the whole programme plays with his own clips — the glute bridge included, which he
 *   filmed for the app.
 * - His alternatives are kept as notes on the item: sit-ups ↔ dead bug (diastasis).
 * - Reps are authored at his "confident beginner" figure (scale 1.0). The engine multiplies
 *   them by the athlete's scale (a real beginner starts at 0.6–0.8), which lands on his
 *   "start from the minimum" advice without a separate beginner column.
 * - Numbers that the difficulty choice moves (reps, AMRAP windows, caps, EMOM minutes, rounds)
 *   stay out of titles; texts quote them only for `scalable: false` blocks (the ladders and the
 *   two benchmarks), whose numbers are the same at every difficulty, and for workout 4's
 *   5 minutes (a one-item AMRAP is a max-reps block whose window never moves).
 * - His channel numbered two workouts "13"; the duplicate (a 2-minute max-squat test) is not
 *   part of his spec, so the course is exactly his 20 sessions, numbered 1–20.
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
      'Обязательно перед каждой тренировкой. Идём сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы. Спокойный темп, амплитуда растёт постепенно, без рывков. Разминка не входит в тренировку — это подготовка. Резкая боль — не норма: остановись.',
      'Mandatory before every session. Top to bottom: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles. Easy pace, the range grows gradually, no jerks. The warm-up is not part of the workout — it is preparation. Sharp pain is not normal: stop.',
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
      'Не пропускаем. Дыши медленно, тяни до приятного натяжения, не через боль. Потом потрать 2–3 минуты и отметь в приложении, как было: усилие, что далось легко, что оказалось тяжёлым, было ли что-то, что вызвало дискомфорт. Через несколько недель ты увидишь по этим записям, насколько легче стало тренироваться. А если в какой-то день потренироваться не получилось — не страшно, выйди на прогулку.',
      'Do not skip it. Breathe slowly, stretch to a pleasant pull, never into pain. Then take 2–3 minutes and record in the app how it went: the effort, what felt easy, what turned out hard, anything that caused discomfort. In a few weeks these notes will show you how much easier training has become. And on a day you could not train at all — no drama, go for a walk.',
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
  russian_twist: l(
    'Спина прямая, поворот от корпуса, а не руками. При диастазе — «мёртвый жук», вдвое больше',
    'Back straight, twist from the trunk, not the arms. With diastasis, dead bugs — twice the reps',
  ),
  glute_bridge: l(
    'Вверху сожми ягодицы, поясницу не прогибай',
    'Squeeze the glutes at the top, do not arch the lower back',
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

/**
 * Workout 3's rest after a pair: «старт раз в 2 минуты», one round, then «отдых 1 минута». The app
 * has no "start every N minutes" clock, so the rest is authored as what is left of the two minutes
 * after a pair at the authored numbers (about a minute of work) plus his extra minute.
 */
const S03_PAIR_REST = 120;
/**
 * Workout 10's rest: the two-minute window minus a round — about 55 s at the authored numbers,
 * nearer 40 s for a beginner at scale 0.7 — so 70 s sits between the two.
 */
const S10_ROUND_REST = 70;

/** Workout 7 plays the sit-up every fourth minute: the dead-bug swap keeps the count, not ×2. */
const NOTE_S07_SIT_UP = l(
  'Не тяни себя за шею — поднимайся животом. Ситапы тяжело или есть диастаз — «мёртвый жук», столько же повторений: тренер даёт 12–14 за минуту',
  'Do not pull on your neck — lift with the abdominals. Sit-ups hard or diastasis? Dead bugs, the same count: the coach gives 12–14 in the minute',
);

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
              'Тренер: 10–20. Стул к стене, локти назад, плечи вниз',
              'The coach: 10–20. Chair to the wall, elbows back, shoulders down',
            ),
          },
          {
            exerciseId: 'reverse_lunge',
            reps: 12,
            note: l(
              'Тренер: 10–18 в сумме на две ноги. Колено мягко к полу',
              'The coach: 10–18 total for both legs. Knee softly to the floor',
            ),
          },
          {
            exerciseId: 'dead_bug',
            reps: 12,
            note: l(
              'Тренер: 10–16, суммарно. Медленно, поясница прижата',
              'The coach: 10–16 total. Slow, lower back pressed down',
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
      'Тренировка 3. Три пары упражнений, старт каждой пары раз в 2 минуты: сделал пару — до конца двух минут отдыхаешь, потом ещё минута отдыха и следующая пара. Пара 1 — обратные отжимания и отжимания с колен, пара 2 — приседания и выпады назад, пара 3 — ситапы и «мёртвый жук». Отдых после пары приложение отсчитывает само.',
      'Workout 3. Three pairs of exercises, each pair starting every 2 minutes: do the pair, rest until the two minutes are up, then one more minute of rest and the next pair. Pair 1 dips and knee push-ups, pair 2 squats and reverse lunges, pair 3 sit-ups and dead bugs. The app counts the rest after each pair for you.',
    ),
    basePoints: 100,
    tags: ['circuit', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's03_main',
        type: 'metcon',
        format: 'circuit',
        sets: 1,
        title: l('Три пары', 'Three pairs'),
        description: l(
          'Пару делаешь без пауз, потом отдых — остаток двухминутки и ещё минута, таймер ведёт его сам. Не торопись: техника важнее скорости.',
          'Do each pair without a pause, then rest — what is left of the 2 minutes plus one more minute; the timer runs it. Do not rush: technique beats speed.',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 15, note: l('Тренер: 10–20', 'The coach: 10–20') },
          {
            exerciseId: 'knee_push_up',
            reps: 13,
            restAfterSec: S03_PAIR_REST,
            note: l('Тренер: 10–15', 'The coach: 10–15'),
          },
          { exerciseId: 'air_squat', reps: 15, note: l('Тренер: 10–20', 'The coach: 10–20') },
          {
            /*
             * 16, not 15: his own note says the count is the total across both legs, and an odd
             * total is one extra rep on whichever leg goes first. Still inside the 10–20 he wrote.
             */
            exerciseId: 'reverse_lunge',
            reps: 16,
            restAfterSec: S03_PAIR_REST,
            note: l('Тренер: 10–20 в сумме на две ноги', 'The coach: 10–20 total for both legs'),
          },
          {
            exerciseId: 'sit_up',
            reps: 8,
            note: l(
              'Тренер: 10–20. При диастазе — «жук»',
              'The coach: 10–20. With diastasis, dead bugs',
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
    focus: l('Одно движение, максимум повторений', 'One movement, as many reps as possible'),
    description: l(
      'Тренировка 4. Одно движение — ягодичный мост. Набери максимум повторений за 5 минут; ориентир приложение показывает под тебя. Разбивай на подходы как удобно и сжимай ягодицы вверху.',
      'Workout 4. One movement — the glute bridge. As many reps as possible in 5 minutes; the app shows a target fitted to you. Break it into sets as you like and squeeze the glutes at the top.',
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
        title: l('Максимум мостов за 5 минут', 'Max bridges in 5 minutes'),
        description: l(
          'Сколько успеешь за 5 минут. Ориентир — сто. Разбивай на подходы по 20–25 и отдыхай сколько нужно.',
          'As many as you can in 5 minutes. The target is one hundred. Break it into sets of 20–25 and rest as needed.',
        ),
        /*
         * One item in an AMRAP is a "max reps" block: the reps are the TOTAL target (scaled with
         * difficulty), and the 5-minute window is never scaled.
         */
        items: [{ exerciseId: 'glute_bridge', reps: 100 }],
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
      'Тренировка 5. Три круга: ситапы, приседания и отжимания с колен. Во втором круге отжиманий чуть больше. Работа на время с крышкой, отдыхай как комфортно. Запиши время и ощущения.',
      'Workout 5. Three rounds: sit-ups, squats and knee push-ups. A few more push-ups in the second round. For time with a cap, rest as you like. Note your time and how it felt.',
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
          'Крышка — на таймере. Ситапы можно заменить «жуком» (вдвое больше). Отдыхай между кругами как комфортно.',
          'The cap is on the timer. Sit-ups can be swapped for dead bugs (twice the reps). Rest between rounds as you like.',
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
    name: l('AMRAP: пресс, присед, отжимания', 'AMRAP: core, squat, push-ups'),
    focus: l('Максимум кругов за отведённое время', 'As many rounds as possible in the time'),
    description: l(
      'Тренировка 6. Тот же круг, что в пятой, но теперь по кругу, пока идёт таймер, в спокойном темпе: столько кругов, сколько получится. Не спринтуй первые две минуты — выбери темп, который сможешь держать всё время.',
      'Workout 6. The same round as workout 5, now on a loop while the timer runs, at an easy pace: as many rounds as you can. Do not sprint the first two minutes — pick a pace you can hold.',
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
        title: l('Максимум кругов', 'As many rounds as possible'),
        description: l(
          'Максимум кругов за отведённое время в ровном темпе. Ситапы можно заменить «жуком» (вдвое больше).',
          'As many rounds as possible in the time at an even pace. Sit-ups can be swapped for dead bugs (twice the reps).',
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
      'Тренировка 7. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений: приседания, отжимания с колен, выпады, ситапы. Во втором круге каждое движение — на пару повторов больше; приложение уже посчитало, сколько.',
      'Workout 7. A new exercise every minute, do it and rest until the minute is up. A round of four: squats, knee push-ups, lunges, sit-ups. In the second loop every movement gets a couple more reps; the app has already worked out how many.',
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
        title: l('EMOM, прибавка во втором круге', 'EMOM, more in the second loop'),
        description: l(
          'Первый круг — четыре минуты по базовому числу, второй — те же движения, на пару повторов больше. Выполнил движение — отдыхаешь до конца минуты.',
          'The first loop is four minutes at the base count, the second the same movements with a couple more reps. Do the movement, then rest until the minute is up.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 12 },
          { exerciseId: 'knee_push_up', reps: 12 },
          { exerciseId: 'reverse_lunge', reps: 12, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'sit_up', reps: 12, note: NOTE_S07_SIT_UP },
          { exerciseId: 'air_squat', reps: 14 },
          { exerciseId: 'knee_push_up', reps: 14 },
          { exerciseId: 'reverse_lunge', reps: 14, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'sit_up', reps: 14, note: NOTE_S07_SIT_UP },
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
      'Тренировка 8. Круг из четырёх движений, в каждом одинаковое число повторений: обратные отжимания, приседания, скалолазы, выпады назад. Два круга на время с крышкой, отдыхаешь когда хочешь. Держи ровный темп и не жертвуй техникой ради секунд.',
      'Workout 8. A round of four movements, the same count for each: dips, squats, mountain climbers, reverse lunges. Two rounds for time with a cap, rest whenever you want. Keep an even pace and do not trade technique for seconds.',
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
          'Крышка — на таймере. Скалолазы считаем по коленям. Отдыхаешь когда хочешь — задача закрыть два круга.',
          'The cap is on the timer. Count mountain climbers per knee. Rest whenever — the task is to close two rounds.',
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
      'Тренировка 9. Два круга на время: ситапы, скалолазы, «жуки» и снова ситапы — скалолазов и «жуков» вдвое больше, чем ситапов. Работа на время — чем быстрее сделаешь, тем быстрее освободишься; отдыхаешь когда хочешь, задача закрыть два круга как можно скорее. Крышка — на таймере.',
      'Workout 9. Two rounds for time: sit-ups, mountain climbers, dead bugs and sit-ups again — twice as many climbers and dead bugs as sit-ups. The faster you finish, the sooner you are free; rest whenever, close the two rounds as fast as you can. The cap is on the timer.',
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
          'Крышка — на таймере. Скалолазы по коленям, «жук» медленно и под контролем. Ситапы при диастазе — «жук», вдвое больше.',
          'The cap is on the timer. Climbers per knee, dead bugs slow and controlled. Sit-ups with diastasis: dead bugs, twice the reps.',
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
      'Тренировка 10. Короткий круг — червячки и вдвое больше приседаний. Старт раз в 2 минуты: выполнил круг — до конца двухминутки отдыхаешь, приложение отсчитывает отдых само. Червячки — в спокойном темпе, шаг руками не слишком широкий.',
      'Workout 10. A short round — inchworms and twice as many squats. Start every 2 minutes: done early, rest until the 2 minutes are up; the app counts the rest for you. Inchworms at an easy pace, hand steps not too wide.',
    ),
    basePoints: 100,
    tags: ['interval', 'beginner', 'full_body'],
    blocks: [
      warmup(),
      {
        id: 's10_main',
        type: 'metcon',
        format: 'circuit',
        sets: 4,
        restBetweenRoundsSec: S10_ROUND_REST,
        title: l('Старт раз в 2 минуты', 'Start every 2 minutes'),
        description: l(
          'Круг без пауз, потом отдых до конца двухминутки — таймер ведёт его сам. Не торопись на червячках.',
          'No pauses inside the round, then rest until the 2-minute mark — the timer runs it. Do not rush the inchworms.',
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
    name: l('EMOM: отжимания, присед, пресс, выпады', 'EMOM: push-ups, squat, core, lunges'),
    focus: l('Работа по минутам, два круга', 'By the minute, two loops'),
    description: l(
      'Тренировка 11. Каждую минуту новое упражнение, выполнил — отдыхаешь до конца минуты. Круг из четырёх движений, у всех одинаковое число повторений: отжимания с колен, приседания, ситапы (или вдвое больше «жуков»), выпады. Два круга.',
      'Workout 11. A new exercise every minute, do it and rest until the minute is up. A round of four, the same count for each: knee push-ups, squats, sit-ups (or twice as many dead bugs), lunges. Two loops.',
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
        title: l('Каждую минуту — новое движение', 'A new movement every minute'),
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
        // The ladder is the workout: scaling each rung would bend 10-8-6-4-2 out of shape.
        scalable: false,
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
        // 5-6-7-8-9 is a ladder: the same numbers and window at every difficulty.
        scalable: false,
        title: l('Максимум кругов', 'As many rounds as possible'),
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
    name: l('Выпады, отжимания, твисты: два круга', 'Lunges, push-ups, twists: two rounds'),
    focus: l('Короткий круг, потом вдвое длиннее', 'A short round, then one twice as long'),
    description: l(
      'Тренировка 14. Два круга. Первый: выпады назад, отжимания с колен, русские твисты (или вдвое больше «жуков»). Отдых 2 минуты. Второй — те же движения, но каждого вдвое больше. Второй круг длинный, разбивай на подходы и держи технику.',
      'Workout 14. Two rounds. The first: reverse lunges, knee push-ups, Russian twists (or twice as many dead bugs). Rest 2 minutes. The second: the same movements, twice as many of each. The second round is long — break it into sets and keep the technique.',
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
        restAfterSec: 120,
        title: l('Первый круг', 'The first round'),
        description: l(
          'Каждое движение по разу, потом отдых 2 минуты перед вторым кругом.',
          'Each movement once, then rest 2 minutes before the second round.',
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
        title: l('Второй круг, вдвое длиннее', 'The second round, twice as long'),
        description: l(
          'После двух минут отдыха — каждого движения вдвое больше. Разбивай на подходы, техника важнее скорости.',
          'After two minutes of rest — twice as many of each. Break it into sets, technique over speed.',
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
    name: l('AMRAP: отжимания, присед, скалолазы', 'AMRAP: push-ups, squat, climbers'),
    focus: l('Максимум кругов за отведённое время', 'As many rounds as possible in the time'),
    description: l(
      'Тренировка 15. По кругу, пока идёт таймер: отжимания, вдвое больше приседаний и ещё вдвое больше скалолазов. Обычные отжимания — тяжело, делай с колен. Ровный темп: столько кругов, сколько получится держать до конца.',
      'Workout 15. On a loop while the timer runs: push-ups, twice as many squats and twice as many again mountain climbers. Full push-ups hard? Do them from the knees. Even pace: as many rounds as you can hold to the end.',
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
        title: l('Максимум кругов', 'As many rounds as possible'),
        description: l(
          'Максимум кругов за отведённое время. Скалолазы по коленям. Отжимания тяжело — с колен.',
          'As many rounds as possible in the time. Climbers per knee. Push-ups hard? From the knees.',
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
      'Тренировка 16. Длинный список на время: приседания, выпады, зашагивания, червячки — от самого большого числа к самому маленькому. Порядок менять нельзя — идём сверху вниз. Крышка — на таймере; разбивай на подходы, но не меняй последовательность.',
      'Workout 16. A long list for time: squats, lunges, step-ups, inchworms — from the biggest number to the smallest. The order is fixed — top to bottom. The cap is on the timer; break it into sets but keep the order.',
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
          'Крышка — на таймере. Выпады и зашагивания считаем в сумме на две ноги. Порядок менять нельзя.',
          'The cap is on the timer. Lunges and step-ups counted as the total for both legs. Do not change the order.',
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
      'Тренировка 17. Круг — это входной билет (отжимания, приседания, ситапы поровну), а за ним червячки. После круга — 3 минуты отдыха, и следующий круг. Червячки не торопи: тренер просит, чтобы в каждом круге их выходило одинаково.',
      'Workout 17. A round is the buy-in (push-ups, squats and sit-ups, the same count each), then inchworms. After the round, 3 minutes of rest, then the next round. Do not rush the inchworms: the coach wants the same number of them in every round.',
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
        title: l('Круги: 3 минуты отдыха после круга', 'Rounds: 3 minutes of rest after each'),
        description: l(
          'Входной билет, потом червячки. После круга — 3 минуты отдыха, таймер ведёт его сам. Отжимания тяжело — с колен.',
          'The buy-in, then inchworms. After the round, 3 minutes of rest — the timer runs it. Push-ups hard? From the knees.',
        ),
        items: [
          { exerciseId: 'push_up', reps: 10 },
          { exerciseId: 'air_squat', reps: 10 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          {
            exerciseId: 'inchworm',
            reps: 8,
            note: l(
              'Ровный темп: в каждом круге — одинаковое число червячков',
              'An even pace: the same number of inchworms in every round',
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
      'Тренировка 18. Два интервала по 2 минуты. Первый: входной билет — отжимания, в оставшееся время — максимум червячков. Минута отдыха. Второй: входной билет — выпады, в оставшееся время — максимум ситапов. Отжимания тяжело — с колен.',
      'Workout 18. Two 2-minute intervals. First: a buy-in of push-ups, then max inchworms in the time left. One minute of rest. Second: a buy-in of lunges, then max sit-ups. Push-ups hard? From the knees.',
    ),
    basePoints: 100,
    tags: ['interval', 'full_body', 'conditioning'],
    blocks: [
      warmup(),
      /*
       * Each 2-minute interval is two blocks: the buy-in, then an AMRAP of the "max" movement
       * alone. As one AMRAP the loop went back to the buy-in once the max movement's number was
       * done, which is not what he wrote. The buy-in is a one-round for-time with a minute's cap
       * (a circuit would gain a second round on «Посложнее»); the AMRAP is the minute that is left.
       */
      {
        id: 's18_first',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 60,
        title: l('Интервал 1: отжимания', 'Interval 1: push-ups'),
        description: l(
          'Входной билет — отжимания. Сделал — сразу к червячкам.',
          'The buy-in is push-ups. Done — straight on to the inchworms.',
        ),
        items: [{ exerciseId: 'push_up', reps: 15 }],
      },
      {
        id: 's18_first_max',
        type: 'metcon',
        format: 'amrap',
        durationSec: 60,
        restAfterSec: 60,
        title: l('Интервал 1: максимум червячков', 'Interval 1: max inchworms'),
        description: l(
          'До конца интервала — максимум червячков. Потом минута отдыха.',
          'Max inchworms until the interval is up. Then one minute of rest.',
        ),
        items: [
          {
            exerciseId: 'inchworm',
            reps: 8,
            note: l(
              'Максимум за оставшееся время, спина ровная',
              'As many as possible in the time left, back flat',
            ),
          },
        ],
      },
      {
        id: 's18_second',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 60,
        title: l('Интервал 2: выпады', 'Interval 2: lunges'),
        description: l(
          'После минуты отдыха — входной билет: выпады. Сделал — сразу к ситапам.',
          'After a minute of rest, the buy-in: lunges. Done — straight on to the sit-ups.',
        ),
        items: [{ exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL }],
      },
      {
        id: 's18_second_max',
        type: 'metcon',
        format: 'amrap',
        durationSec: 60,
        title: l('Интервал 2: максимум ситапов', 'Interval 2: max sit-ups'),
        description: l(
          'До конца интервала — максимум ситапов (или «жука», вдвое больше).',
          'Max sit-ups until the interval is up (or dead bugs, twice the reps).',
        ),
        items: [
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
        format: 'emom',
        rounds: 10,
        // A benchmark: the same ladder at every difficulty, one rung per minute.
        scalable: false,
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
        // The finale is compared with workout 1: the same numbers at every difficulty.
        scalable: false,
        title: l('Финальные круги', 'The final rounds'),
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

/*
 * **The path is the twenty workouts and nothing else.**
 *
 * It used to hold eight more nodes — «Отдых и прогулка», one for every day of the week Sergey did
 * not schedule a session on — so a four-week course was twenty-eight steps and a person opening it
 * saw a calendar they had to keep up with. The owner ended that: «там сейчас не на каждый день в
 * итоге должны быть тренировки, а просто путь тренировок, который написал Серёжа изначально».
 *
 * She is describing what the coach actually wrote. His programme is twenty sessions in four blocks
 * of five; the rest days were added here, by us, to turn his list into a diary. They cost more than
 * they gave: a node you cannot fail sitting between the ones you can, a tap to mark that you did
 * nothing, and — since the step feature went — one of them still advising «10 000 шагов и сон»,
 * which nothing in the app can see any more.
 *
 * Rest has not stopped mattering, and the course still says so where it belongs: in `outcomes` and
 * in the coach's own description of how to space the sessions. It is simply not a step on a path.
 *
 * `day` is now the position of the session inside its block, 1…5, and no longer a day of the week.
 * Two node ids moved with it — `w4_d5_s19` → `w4_d4_s19` and `w4_d7_s20` → `w4_d5_s20` — because
 * the two benchmarks used to have rest days between them. Nobody who has not already finished the
 * fourth week is affected, and the two would re-open as undone for anyone who has.
 */
const NODES: NodeInput[] = [
  /* Block 1 — the coach's first session is deliberately the first session, no baseline test. */
  workoutNode(1, 1, 1, 'w_s01_emom', l('По таймеру, 3 движения', 'By the timer, 3 movements')),
  workoutNode(1, 2, 2, 'w_s02_emom', l('По таймеру, 3 движения', 'By the timer, 3 movements')),
  workoutNode(
    1,
    3,
    3,
    'w_s03_pairs',
    l('Три пары, старт раз в 2 мин', 'Three pairs, start every 2 min'),
  ),
  workoutNode(1, 4, 4, 'w_s04_bridges', l('Мосты, 5 минут', 'Bridges, 5 minutes')),
  workoutNode(1, 5, 5, 'w_s05_three_rounds', l('3 круга на время', '3 rounds for time')),

  /* Block 2 */
  workoutNode(2, 1, 6, 'w_s06_amrap8', l('AMRAP: максимум кругов', 'AMRAP: max rounds')),
  workoutNode(
    2,
    2,
    7,
    'w_s07_emom_ladder',
    l('EMOM, прибавка во 2-м круге', 'EMOM, more in loop 2'),
  ),
  workoutNode(2, 3, 8, 'w_s08_two_rounds', l('2 круга на время', '2 rounds for time')),
  workoutNode(
    2,
    4,
    9,
    'w_s09_for_time',
    l('Пресс и скалолазы на время', 'Core and climbers for time'),
  ),
  workoutNode(2, 5, 10, 'w_s10_every_2min', l('Круги раз в 2 минуты', 'Rounds every 2 min')),

  /* Block 3 */
  workoutNode(3, 1, 11, 'w_s11_emom8', l('EMOM, 4 движения', 'EMOM, 4 movements')),
  workoutNode(3, 2, 12, 'w_s12_step_ladder', l('Лесенка вниз', 'Descending ladder')),
  workoutNode(
    3,
    3,
    13,
    'w_s13_ladder5',
    l('5 движений, максимум кругов', '5 movements, max rounds'),
  ),
  workoutNode(
    3,
    4,
    14,
    'w_s14_double',
    l('Два круга: короткий и длинный', 'Two rounds: short and long'),
  ),
  workoutNode(3, 5, 15, 'w_s15_amrap8', l('AMRAP: максимум кругов', 'AMRAP: max rounds')),

  /* Block 4 — ends on the benchmark finale (workout 20), the course's last node. */
  workoutNode(4, 1, 16, 'w_s16_chipper', l('Чиппер на время', 'Chipper for time')),
  workoutNode(4, 2, 17, 'w_s17_buyin', l('Входной билет + червячки', 'Buy-in + inchworms')),
  workoutNode(4, 3, 18, 'w_s18_intervals', l('Два интервала по 2 мин', 'Two 2-min intervals')),
  workoutNode(
    4,
    4,
    19,
    'w_s19_inchworm_ladder',
    l('Лесенка червячков — точка отсчёта', 'Inchworm ladder — a benchmark'),
    'benchmark',
  ),
  workoutNode(
    4,
    5,
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
  shortName: l('Форма с нуля', 'Forma. Start'),
  tagline: l(
    'Двадцать тренировок по программе тренера для новичков: коротко, по кругу, без оборудования.',
    'Twenty workouts from the coach’s own beginner programme: short, in rounds, no equipment.',
  ),
  description: l(
    'Программа для тех, кто начинает с нуля или возвращается после долгого перерыва. Двадцать коротких тренировок — те самые, по которым тренер ведёт новичков: отжимания с колен, приседания, ситапы, выпады, зашагивания и червячки. Около 17 минут вместе с разминкой и заминкой, в своём темпе, нагрузка подстраивается под тебя.',
    'A programme for complete beginners and anyone coming back after a long break. Twenty short workouts — the same ones the coach runs his beginners through: knee push-ups, squats, sit-ups, lunges, step-ups and inchworms. About 17 minutes each including warm-up and cool-down, at your own pace, and the load adapts to you.',
  ),
  longDescription: [
    l(
      '«Форма с нуля» — это программа для новичков, которую тренер ведёт в своей группе, перенесённая в приложение без изменений в сути: те же 20 тренировок, тот же порядок, те же слова. Цель первых недель — проработать большие группы мышц и включить тебя в процесс, а не выжать до предела. Каждую тренировку тренер показывает сам: на каждое движение есть его видео.',
      'Start is the beginner programme the coach runs with his own group, moved into the app without changing what matters: the same 20 sessions, the same order, the same words. The aim of the first weeks is to work the big muscle groups and get you into the process, not to wring you out. The coach demonstrates every session himself: every movement has his video.',
    ),
    l(
      'Первые тренировки — работа по таймеру: каждую минуту новое движение, потом простые круги с минутой отдыха. Дальше форматы кроссфита по одному: три круга на время, AMRAP, EMOM, старт раз в 2–3 минуты, лесенки и длинный комплекс на время. Двадцать тренировок подряд, четыре блока по пять. Тренер советует пять в неделю, но путь не привязан к календарю: идёшь в своём темпе, а пропущенный день ничего не ломает — следующая тренировка ждёт на том же месте.',
      'The first sessions are work by the timer — a new movement every minute — then simple rounds with a minute of rest. The CrossFit formats arrive one at a time: three rounds for time, AMRAP, EMOM, starts every 2–3 minutes, ladders and a long chipper for time. Twenty workouts in a row, four blocks of five. The coach suggests five a week, but the path is not tied to a calendar: you go at your own pace, and a missed day breaks nothing — the next workout waits where you left it.',
    ),
    l(
      'Тренировки короткие — 13–20 минут вместе с разминкой и заминкой, в среднем около 17. Сама работа — от 3 до 10 минут; разминка — суставная гимнастика сверху вниз, без бега — и растяжка в конце в это время не входят. Оборудование не нужно — нужен устойчивый стул и коврик: от стула ты будешь отжиматься и на него зашагивать. Прыжков и бёрпи в курсе нет. Приложение считает, сколько повторений тебе делать сегодня, по результатам прошлой тренировки — было тяжело, легко или в самый раз. Если движение пока не даётся, есть замена попроще: ситапы — «мёртвый жук», отжимания — с колен.',
      'Sessions are short — 13–20 minutes including warm-up and cool-down, about 17 on average. The work itself is 3 to 10 minutes; the warm-up — top-to-bottom joint mobility, no running — and the stretch at the end are not counted in that. No equipment — you need a sturdy chair and a mat: you will do dips off the chair and step-ups onto it. There are no jumps or burpees in the course. The app works out how many reps you should do today from how your last session went — too hard, too easy or just right. If a movement is not there yet, there is a simpler one: dead bugs for sit-ups, push-ups from the knees.',
    ),
    l(
      'Первый день — это первая тренировка, а не тест на максимум: тренер считает, что первое занятие не должно тебя уничтожить. Стартовую нагрузку задаёт анкета при первом входе, а после второй тренировки приложение предложит короткий тест и уточнит её. Внутри программы у тренера свои точки отсчёта: лесенка червячков в предпоследней тренировке, к которой вернёшься через месяц-два, и финальные три круга, где сравнишь ощущения с самой первой тренировкой.',
      'Day one is the first workout, not a max-effort test: the coach believes the first session must not destroy you. Your starting load comes from the onboarding on first login, and after the second workout the app offers a short test to fine-tune it. Inside the programme the coach has his own reference points: an inchworm ladder in the penultimate session that you come back to in a month or two, and a final three rounds where you compare how it feels with your very first workout.',
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
      'Есть 15–20 минут несколько раз в неделю и желание не бросить через две.',
      'You can find 15–20 minutes a few times a week and want to still be going in week three.',
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
      'Привычка возвращаться к тренировке — не раз в год по запалу, а регулярно и спокойно.',
      'The habit of coming back — not once a year on a burst of enthusiasm, but regularly and calmly.',
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
      'Готовность идти дальше: повторить курс с большей нагрузкой или перейти к более сложным тренировкам.',
      'Readiness for the next step: repeat the course at a higher load or move on to harder training.',
    ),
  ],
  equipment: ['none', 'mat', 'chair'],
  level: 1,
  weeks: 4,
  sessionsPerWeek: 5,
  avgSessionMin: 17,
  /*
   * The programme's colour, and it is cyan now rather than the brand yellow.
   *
   * The owner's mockup of «Курсы» gives this course `#9FEFF7` and «Forma с гантелями» `#E0F89A`,
   * and on that screen the colour is *type* — the card's rule, its figure, its name and its button
   * — laid on a photograph. Yellow at `#f2f52d` is the most saturated thing in the system and was
   * drawn to be a fill; as type over a grey picture it fizzes.
   *
   * **This hex is the single source of truth for the programme's colour everywhere**, so the
   * change reaches the site too: the landing's course card, the course's own page, the exercise
   * cards tagged to it and the SEO link cards all stop being brand yellow. The owner asked for the mockup, not for the landing; if she wants the site
   * kept yellow, that is a second colour for one programme and it needs a field of its own.
   *
   * **Third palette: Portland orange.** Owner: «наш курс для новичков будет оранжевый». Ink on it
   * is near-black (6.04) — `tileInk()` measures it; the old lightness cutoff would have put white
   * on it at 3.13. As type on charcoal it reads at 5.56.
   */
  tile: '#ff5a00', // programme colour: beginners — Portland orange
  /*
   * The owner's artwork: the coach walking out of the pool, monochrome, with «ФОРМА С НУЛЯ» drawn
   * across it in the programme yellow above. Vendored under `public/` rather than uploaded to the
   * `images` bucket because it is 217 KB of art that belongs to a course file in this repository —
   * a landing page built once should not have to reach a bucket for it, and `public/coach/` and
   * `public/results/` already hold the site's other owned pictures.
   *
   * 4:3, so it survives both crops it is put through: the ticket's 2:1 band keeps the middle two
   * thirds and the landing card's 16:10 keeps five sixths, and the lettering sits inside both.
   * Because the art carries the name, `CourseTicket` stops printing the title over it.
   */
  cover: '/covers/start.jpg',
  price: { rub: 2990, usd: 29 },
  paymentUrl: { ru: 'https://payform.ru/jfcyh1M/' },
  workouts: WORKOUTS.map(withCues),
  nodes: NODES,
  faq: [
    {
      q: l('Что нужно из оборудования?', 'What equipment do I need?'),
      a: l(
        'Оборудование не нужно — нужен устойчивый стул без колёсиков и коврик. От стула ты будешь делать обратные отжимания и на него зашагивать. Если стула нет, зашагивай на ступеньку, а обратные отжимания замени на отжимания от подоконника.',
        'No equipment — you need a sturdy chair without wheels and a mat. You will do dips off the chair and step-ups onto it. No chair? Use a stair step for step-ups and a windowsill for the dips.',
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
        'В среднем около 17 минут вместе с разминкой и заминкой — по 5 минут на суставную гимнастику и растяжку и от 3 до 10 минут работы. Самые короткие — первые тренировки по таймеру, около 13 минут; самые длинные — лесенка червячков, чиппер и три пары, около 19–20 минут. Перед стартом приложение показывает расчётное время для каждого режима сложности.',
        'About 17 minutes on average including warm-up and cool-down — 5 minutes each of joint mobility and stretching plus 3 to 10 minutes of work. The shortest are the first timer sessions at around 13 minutes; the longest are the inchworm ladder, the chipper and the three pairs at around 19–20. Before you start, the app shows the estimated time for each difficulty option.',
      ),
    },
    {
      q: l('Пропустил тренировку — что делать?', 'I missed a session — what now?'),
      a: l(
        'Ничего страшного: сделай её на следующий день и сдвинь остальные. Не пытайся нагнать две за один день — у новичков это заканчивается крепатурой и пропуском ещё одной недели. Если совсем нет сил или времени, у тренера есть альтернатива на любой день: прогулка, до 10 000 шагов.',
        'No drama: do it the next day and shift the rest. Do not try to squeeze two into one day — for beginners that ends in soreness and another week off. And if there is no energy or time at all, the coach has an alternative for any day: a walk, up to 10,000 steps.',
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
