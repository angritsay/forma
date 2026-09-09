/**
 * Course "start" — Старт: кроссфит дома без оборудования / Start: home CrossFit basics.
 *
 * Level 1, 8 weeks, 3 sessions per week: the coach's own beginner programme, transcribed from
 * the 24 workouts he posted to his `‼️НОВИЧКИ‼️` channel (docs/COACH_SOURCE.md — each workout
 * below names the message it comes from). The app adds what the channel did not have: a
 * baseline test on day one and a retest at the end so the engine can set and check the load,
 * warm-up / cool-down blocks in the player, and rest days with a step goal in between.
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
 * - The two duplicated numbers in his channel (two "13"s, two "18"s) and the missing 19/20 are
 *   renumbered 1–24 in posting order; the original label is kept in the workout description.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type NodeInput = CourseInput['nodes'][number];

const l = (ru: string, en: string): L10n => ({ ru, en });

/* ---------------------------------------------------------------------------------------- */
/* Shared blocks                                                                             */
/* ---------------------------------------------------------------------------------------- */

/**
 * The coach's rule is "warm up before every session, no exceptions" and he gives three warm-ups
 * to rotate. These are the app's three, rotated in the same spirit.
 */

/** Warm-up 1: locomotion, shoulders, squat pattern, hinge pattern. */
function warmup1(): BlockInput {
  return {
    id: 'wu_1',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    title: l('Разминка 1', 'Warm-up 1'),
    description: l(
      'Два круга в спокойном темпе: разогрей суставы и вспомни движения, которые будут в тренировке. Разминка обязательна — без неё не начинаем.',
      'Two easy rounds: warm up the joints and rehearse the movements you are about to train. The warm-up is mandatory — we do not start without it.',
    ),
    items: [
      {
        exerciseId: 'jog_in_place',
        seconds: 45,
        note: l('Можно шагать на месте', 'March in place if you prefer'),
      },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'inchworm', reps: 4 },
    ],
  };
}

/** Warm-up 2: spine, hips, rotation. */
function warmup2(): BlockInput {
  return {
    id: 'wu_2',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    title: l('Разминка 2', 'Warm-up 2'),
    description: l(
      'Два круга без спешки. Разбуди спину и тазобедренные суставы. Разминка обязательна — без неё не начинаем.',
      'Two unhurried rounds. Wake up the spine and the hips. The warm-up is mandatory — we do not start without it.',
    ),
    items: [
      {
        exerciseId: 'jog_in_place',
        seconds: 45,
        note: l('Можно шагать на месте', 'March in place if you prefer'),
      },
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'leg_swing', reps: 8, perSide: true },
      { exerciseId: 'worlds_greatest_stretch', reps: 3, perSide: true },
    ],
  };
}

/** Warm-up 3: a little longer on the feet, then hips and squats — before timed work. */
function warmup3(): BlockInput {
  return {
    id: 'wu_3',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    title: l('Разминка 3', 'Warm-up 3'),
    description: l(
      'Два круга. Во втором круге чуть быстрее, чем в первом: пульс должен подняться до старта таймера. Разминка обязательна.',
      'Two rounds, the second slightly quicker than the first: your heart rate should be up before the clock starts. The warm-up is mandatory.',
    ),
    items: [
      {
        exerciseId: 'jog_in_place',
        seconds: 60,
        note: l('Можно шагать на месте', 'March in place if you prefer'),
      },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'leg_swing', reps: 8, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 6 },
    ],
  };
}

/** Light warm-up before the test: enough to be ready, not enough to steal reps. */
function warmupTest(): BlockInput {
  return {
    id: 'wu_test',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    description: l(
      'Лёгкая разминка. Не утомляйся: силы нужны для теста.',
      'A light warm-up. Do not tire yourself out: save your strength for the test.',
    ),
    items: [
      {
        exerciseId: 'jog_in_place',
        seconds: 45,
        note: l('Можно шагать на месте', 'March in place if you prefer'),
      },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'inchworm', reps: 3 },
    ],
  };
}

/** The coach's "заминка / растяжка" after every session: hips, hamstrings, spine, rest pose. */
function cooldown(): BlockInput {
  return {
    id: 'cd_stretch',
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    title: l('Заминка и растяжка', 'Cool-down and stretch'),
    description: l(
      'Пульс должен успокоиться до конца заминки. Дыши медленно и не тяни через боль: растяжка должна быть приятной.',
      'Your heart rate should settle by the end of the cool-down. Breathe slowly and never stretch into pain: it should feel good.',
    ),
    items: [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'hip_flexor_stretch', seconds: 30, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 30, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

/* ---------------------------------------------------------------------------------------- */
/* Notes the coach repeats                                                                    */
/* ---------------------------------------------------------------------------------------- */

const NOTE_DEAD_BUG = l(
  'Если ситапы очень тяжело или есть диастаз — «мёртвый жук», в два раза больше повторений',
  'If sit-ups are very hard or you have diastasis, do dead bugs instead — twice the reps',
);
const NOTE_TOE_REACH = l(
  'У тренера это «тяга к носкам поочерёдно» — ситап с касанием носка. При диастазе — «мёртвый жук»',
  'The coach calls this "alternating toe reaches" — a sit-up reaching to one foot. With diastasis, do dead bugs',
);
const NOTE_ROPE = l('Или столько же прыжков на скакалке', 'Or the same number of rope skips');
const NOTE_KNEES = l(
  'С колен. Если уверенно — последние повторения с носков',
  'From the knees. If you are confident, do the last few from the toes',
);
const NOTE_LUNGE_TOTAL = l('Считаем в сумме на две ноги', 'Counted as the total for both legs');

/* ---------------------------------------------------------------------------------------- */
/* Workouts                                                                                  */
/* ---------------------------------------------------------------------------------------- */

const TEST_WORKOUT_ID = 'w_test_start';

const WORKOUTS: WorkoutInput[] = [
  /* --- Baseline test / retest ----------------------------------------------------------- */
  {
    id: TEST_WORKOUT_ID,
    name: l('Тест: отжимания, присед, планка', 'Test: push-ups, squats, plank'),
    focus: l('Точка отсчёта', 'Your baseline'),
    description: l(
      'Три простых теста, которые покажут, откуда ты стартуешь, и помогут приложению подобрать нагрузку. В конце курса ты повторишь их и сравнишь цифры. Не выкладывайся до тошноты — просто сделай честный максимум.',
      'Three simple tests that show where you are starting from and let the app set your load. At the end of the course you will repeat them and compare the numbers. Do not push to the point of nausea — just an honest max.',
    ),
    basePoints: 80,
    tags: ['test', 'push', 'squat', 'core'],
    blocks: [
      warmupTest(),
      {
        id: 'test_start',
        type: 'test',
        format: 'sets',
        sets: 1,
        scalable: false,
        title: l('Тест', 'Test'),
        description: l(
          'Три упражнения на максимум с отдыхом 90 секунд между ними. Не жертвуй техникой ради цифр: считаются только чистые повторения.',
          'Three max-effort tests with 90 seconds of rest between them. Do not trade technique for numbers: only clean reps count.',
        ),
        items: [
          {
            exerciseId: 'knee_push_up',
            seconds: 120,
            restAfterSec: 90,
            note: l(
              'Максимум повторений за 2 минуты. Можно отдыхать в верхней точке, но не ложиться',
              'Max reps in 2 minutes. You may pause at the top, but do not lie down',
            ),
          },
          {
            exerciseId: 'air_squat',
            seconds: 60,
            restAfterSec: 90,
            note: l(
              'Максимум приседаний за минуту, бёдра до параллели с полом',
              'Max squats in one minute, thighs down to parallel',
            ),
          },
          {
            exerciseId: 'plank',
            seconds: 300,
            restAfterSec: 90,
            note: l(
              'Держи, пока не начнёт проваливаться поясница. 5 минут — потолок таймера',
              'Hold until your lower back starts to sag. 5 minutes is the timer ceiling',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 1. Message 80 / 198–201 ---------------------------------------------------------- */
  {
    id: 'w_s01_sets',
    name: l('Отжимания, ситапы, приседания', 'Push-ups, sit-ups, squats'),
    focus: l('Большие группы мышц, включаемся в процесс', 'Big muscle groups, getting you going'),
    description: l(
      'Тренировка 1. Цель — проработать большие группы мышц и включить тебя в процесс. Три упражнения, после каждого минута отдыха, и такой круг два раза. Новичкам советую начать с минимальных цифр: лучше сделать меньше и чисто, чем больше и через силу.',
      'Workout 1. The goal is to work the big muscle groups and get you into the process. Three exercises with a minute of rest after each, and that round twice. Beginners: start at the minimum — fewer clean reps beat more forced ones.',
    ),
    basePoints: 100,
    tags: ['push', 'squat', 'core', 'beginner'],
    blocks: [
      warmup1(),
      {
        id: 's01_main',
        type: 'strength',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 60,
        title: l('2 круга', '2 rounds'),
        description: l(
          'Отжимания с колен — минута отдыха — ситапы или «жук» — минута отдыха — приседания — минута отдыха, и ещё раз такой же круг. Тренер: «5–15 отжиманий, 10–25 ситапов, 10–20 приседаний, по ощущениям».',
          'Knee push-ups — a minute of rest — sit-ups or dead bugs — a minute of rest — squats — a minute of rest, then the same round again. The coach: "5–15 push-ups, 10–25 sit-ups, 10–20 squats, by feel".',
        ),
        items: [
          { exerciseId: 'knee_push_up', reps: 8, restAfterSec: 60 },
          { exerciseId: 'sit_up', reps: 15, restAfterSec: 60, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 15 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 2. Message 84 / 207 -------------------------------------------------------------- */
  {
    id: 'w_s02_sets',
    name: l('Обратные отжимания, тяга к носкам, выпады', 'Dips, toe reaches, lunges'),
    focus: l('Трицепс, пресс и ноги', 'Triceps, abs and legs'),
    description: l(
      'Тренировка 2. Та же схема, что в первой, но другие упражнения: обратные отжимания от стула, тяга к носкам и выпады назад. После каждого упражнения минута отдыха, круг — два раза. Начинай с минимальных цифр.',
      'Workout 2. Same shape as the first, different movements: chair dips, toe reaches and reverse lunges. A minute of rest after each exercise, the round twice. Start at the minimum.',
    ),
    basePoints: 100,
    tags: ['push', 'lunge', 'core', 'beginner'],
    blocks: [
      warmup2(),
      {
        id: 's02_main',
        type: 'strength',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 60,
        title: l('2 круга', '2 rounds'),
        description: l(
          'Обратные отжимания — минута отдыха — тяга к носкам или «жук» — минута отдыха — выпады — минута отдыха, и ещё раз. Тренер: «10–20 обратных отжиманий, 20–40 тяг к носкам, 12–30 выпадов в сумме на две ноги».',
          'Dips — a minute of rest — toe reaches or dead bugs — a minute of rest — lunges — a minute of rest, then again. The coach: "10–20 dips, 20–40 toe reaches, 12–30 lunges total for both legs".',
        ),
        items: [
          {
            exerciseId: 'chair_dip',
            reps: 12,
            restAfterSec: 60,
            note: l('Стул без колёсиков, к стене', 'A chair without wheels, against the wall'),
          },
          { exerciseId: 'sit_up', reps: 15, restAfterSec: 60, note: NOTE_TOE_REACH },
          { exerciseId: 'reverse_lunge', reps: 16, note: NOTE_LUNGE_TOTAL },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 3. Message 88 / 213 -------------------------------------------------------------- */
  {
    id: 'w_s03_pairs',
    name: l('Три пары упражнений', 'Three pairs'),
    focus: l('Толкаем, приседаем, качаем пресс', 'Push, squat, abs'),
    description: l(
      'Тренировка 3. Три пары упражнений: жим, ноги, пресс. Каждую пару делаешь два круга подряд с минимальным отдыхом между упражнениями, а между парами — две минуты отдыха.',
      'Workout 3. Three pairs of exercises: push, legs, abs. Each pair is two rounds back to back with minimal rest between exercises, and two minutes of rest between pairs.',
    ),
    basePoints: 100,
    tags: ['push', 'squat', 'lunge', 'core', 'beginner'],
    blocks: [
      warmup1(),
      {
        id: 's03_push',
        type: 'strength',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Пара 1: жим', 'Pair 1: push'),
        description: l(
          'Два круга подряд: обратные отжимания и отжимания с колен, между упражнениями минимальный отдых. Тренер: «10–20 обратных, 5–15 с колен».',
          'Two rounds back to back: dips and knee push-ups with minimal rest between them. The coach: "10–20 dips, 5–15 knee push-ups".',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 12, restAfterSec: 15 },
          { exerciseId: 'knee_push_up', reps: 8 },
        ],
      },
      {
        id: 's03_legs',
        type: 'strength',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Пара 2: ноги', 'Pair 2: legs'),
        description: l(
          'Перед стартом отдохни 2 минуты. Потом два круга подряд: приседания и выпады назад. Тренер: «10–20 приседаний, 16–24 выпада».',
          'Rest 2 minutes before you start. Then two rounds back to back: squats and reverse lunges. The coach: "10–20 squats, 16–24 lunges".',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 15, restAfterSec: 15 },
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
        ],
      },
      {
        id: 's03_core',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 45,
        title: l('Пара 3: пресс', 'Pair 3: abs'),
        description: l(
          'Отдохни 2 минуты. Потом два круга: ситапы и «мёртвый жук». Тренер: «10–20 ситапов, 20–40 жуков». Здесь жук — не замена, а второе упражнение.',
          'Rest 2 minutes. Then two rounds: sit-ups and dead bugs. The coach: "10–20 sit-ups, 20–40 dead bugs". Here the dead bug is the second exercise, not a substitute.',
        ),
        items: [
          { exerciseId: 'sit_up', reps: 12, restAfterSec: 15 },
          { exerciseId: 'dead_bug', reps: 24 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 4. Message 221 ------------------------------------------------------------------- */
  {
    id: 'w_s04_bridges',
    name: l('200 ягодичных мостов', '200 glute bridges'),
    focus: l('Ягодицы на время', 'Glutes against the clock'),
    description: l(
      'Тренировка 4. Одно упражнение: 200 повторов ягодичного моста на время. «Крышка» — время, в которое нужно уложиться: 10 минут для новичков, 8 для уверенных. Не успел — доделываешь по собственному желанию.',
      'Workout 4. One exercise: 200 glute bridges for time. The cap is the time you need to fit into: 10 minutes for beginners, 8 for the confident. Not done in time? Finish at your own discretion.',
    ),
    basePoints: 100,
    tags: ['hinge', 'glutes', 'fortime', 'beginner'],
    blocks: [
      warmup2(),
      {
        id: 's04_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('200 мостов на время', '200 bridges for time'),
        description: l(
          'Крышка 10 минут. Разбивай на подходы как удобно — например, по 20–25, — но в верхней точке каждый раз сжимай ягодицы.',
          '10-minute cap. Break it into sets as you like — 20–25 at a time, say — but squeeze the glutes at the top of every rep.',
        ),
        items: [{ exerciseId: 'glute_bridge', reps: 200 }],
      },
      cooldown(),
    ],
  },

  /* --- 5 and 21. Messages 94 / 225 and 173 --------------------------------------------- */
  {
    id: 'w_s05_three_rounds',
    name: l('Три круга на время', 'Three rounds for time'),
    focus: l('Твой первый комплекс на время', 'Your first workout for time'),
    description: l(
      'Тренировка 5. Десять ситапов, десять приседаний, десять отжиманий с колен — три круга на время. Между кругами отдыхай, как тебе комфортно, но чем быстрее выполнишь, тем лучше. Запиши время: на седьмой неделе ты повторишь этот комплекс и сравнишь.',
      'Workout 5. Ten sit-ups, ten squats, ten knee push-ups — three rounds for time. Rest between rounds as much as you need, but the faster you finish, the better. Note your time: in week seven you will repeat this workout and compare.',
    ),
    basePoints: 100,
    tags: ['benchmark', 'fortime', 'full_body', 'beginner'],
    blocks: [
      warmup3(),
      {
        id: 's05_main',
        type: 'metcon',
        format: 'fortime',
        sets: 3,
        durationSec: 480,
        restBetweenRoundsSec: 60,
        title: l('3 круга на время', '3 rounds for time'),
        description: l(
          'Засеки время. Три круга, лимит 8 минут. Отдых между кругами — по ощущениям, 1–1,5 минуты; можешь отдыхать и меньше.',
          'Start the clock. Three rounds, 8-minute cap. Rest between rounds by feel, 1–1.5 minutes; less is fine.',
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

  /* --- 6. Message 98 / 230 -------------------------------------------------------------- */
  {
    id: 'w_s06_amrap8',
    name: l('AMRAP 8: ситапы, присед, отжимания', 'AMRAP 8: sit-ups, squats, push-ups'),
    focus: l('Максимум кругов за 8 минут', 'As many rounds as possible in 8 minutes'),
    description: l(
      'Тренировка 6. Тот же круг, что вчера, но теперь по кругу в течение 8 минут: столько кругов, сколько получится. Хороший результат — 6–8 кругов, цель — минимум 5.',
      'Workout 6. The same round as last time, but now on a loop for 8 minutes: as many rounds as you can. 6–8 rounds is a good result; the target is at least 5.',
    ),
    basePoints: 100,
    tags: ['amrap', 'full_body', 'beginner'],
    blocks: [
      warmup3(),
      {
        id: 's06_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Не спринтуй в первые две минуты: выбери темп, который сможешь держать всё время.',
          'As many rounds as possible in 8 minutes. Do not sprint the first two minutes: pick a pace you can hold the whole way.',
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

  /* --- 7. Message 102 ------------------------------------------------------------------- */
  {
    id: 'w_s07_hundred_situps',
    name: l('100 ситапов на время', '100 sit-ups for time'),
    focus: l('Пресс: одно упражнение на время', 'Abs: one exercise against the clock'),
    description: l(
      'Тренировка 7, для новичков и уверенных новичков. 100 ситапов на время или 200 «мёртвых жуков» — что-то одно. Отличный результат — из 5 минут; хороший для новичка — 100 ситапов из 9 минут или 200 жуков из 7.',
      'Workout 7, for beginners and confident beginners. 100 sit-ups for time, or 200 dead bugs — one or the other. Under 5 minutes is excellent; a good beginner result is 100 sit-ups under 9 minutes or 200 dead bugs under 7.',
    ),
    basePoints: 100,
    tags: ['core', 'fortime', 'beginner'],
    blocks: [
      warmup2(),
      {
        id: 's07_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('100 ситапов на время', '100 sit-ups for time'),
        description: l(
          'Крышка 10 минут. Разбивай на подходы, отдыхай лёжа, но не тяни себя за шею — поднимайся за счёт живота.',
          '10-minute cap. Break it into sets and rest lying down, but do not pull on your neck — lift with the abdominals.',
        ),
        items: [
          {
            exerciseId: 'sit_up',
            reps: 100,
            note: l('Или 200 «мёртвых жуков»', 'Or 200 dead bugs'),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 8. Message 104 / 235 / 238 ------------------------------------------------------- */
  {
    id: 'w_s08_emom_ladder',
    name: l('EMOM 8: лесенка', 'EMOM 8: the ladder'),
    focus: l('Каждую минуту новое упражнение', 'A new exercise every minute'),
    description: l(
      'Тренировка 8. Работаем по таймеру: каждую минуту начинаешь новое упражнение, выполняешь и до конца минуты отдыхаешь. Четыре упражнения по кругу — два круга, во втором к каждому упражнению +2 повтора. Чем быстрее делаешь — тем больше отдыха, но и устаёшь сильнее. Рассчитывай силы.',
      'Workout 8. On the clock: every minute you start a new exercise, do the reps and rest until the minute ends. Four exercises in a loop, two loops, with 2 more reps of each in the second loop. The faster you go, the longer you rest — and the harder you tire. Pace yourself.',
    ),
    basePoints: 100,
    tags: ['emom', 'full_body', 'beginner'],
    blocks: [
      warmup3(),
      {
        id: 's08_main',
        type: 'metcon',
        format: 'emom',
        rounds: 8,
        title: l('EMOM 8 мин', 'EMOM 8 min'),
        description: l(
          'Минута 1 — приседания, 2 — отжимания с колен, 3 — выпады, 4 — ситапы или «жук», и снова по кругу. Во втором круге прибавь по 2 повтора к каждому упражнению.',
          'Minute 1 squats, 2 knee push-ups, 3 lunges, 4 sit-ups or dead bugs, then round again. In the second loop add 2 reps to every exercise.',
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

  /* --- 9. Message 110 / 245 ------------------------------------------------------------- */
  {
    id: 'w_s09_chipper_x2',
    name: l('10-20-30-40-50, два круга', '10-20-30-40-50, two rounds'),
    focus: l('Длинный круг на время', 'A long round for time'),
    description: l(
      'Тренировка 9. Десять обратных отжиманий, двадцать приседаний, тридцать скалолазов, сорок выпадов, пятьдесят джампинг-джеков — два круга на время. Отдыхаешь, когда хочешь; задача — закрыть два круга как можно скорее, в идеале без отдыха между ними. Крышка 8 минут.',
      'Workout 9. Ten dips, twenty squats, thirty mountain climbers, forty lunges, fifty jumping jacks — two rounds for time. Rest whenever you want; the task is to close two rounds as fast as possible, ideally with no rest between them. 8-minute cap.',
    ),
    basePoints: 110,
    tags: ['fortime', 'conditioning', 'full_body'],
    blocks: [
      warmup3(),
      {
        id: 's09_main',
        type: 'metcon',
        format: 'fortime',
        sets: 2,
        durationSec: 480,
        title: l('2 круга на время', '2 rounds for time'),
        description: l(
          'Крышка 8 минут. Порядок и количество повторов не меняем. Скалолазы считаем по касаниям колена — каждое колено это повтор.',
          '8-minute cap. Keep the order and the reps. Mountain climbers count per knee — every knee drive is a rep.',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 10 },
          { exerciseId: 'air_squat', reps: 20 },
          { exerciseId: 'mountain_climber', reps: 30 },
          { exerciseId: 'reverse_lunge', reps: 40, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'jumping_jack', reps: 50, note: NOTE_ROPE },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 10. Message 115 / 253 ------------------------------------------------------------ */
  {
    id: 'w_s10_every_3_min',
    name: l('Круг раз в 3 минуты', 'A round every 3 minutes'),
    focus: l(
      'Уложи круг в 3 минуты, остальное — отдых',
      'Fit a round into 3 minutes, the rest is rest',
    ),
    description: l(
      'Тренировка 10. Круг из трёх упражнений — червячки, ситапы и приседания. Задача — укладывать круг в 3 минуты: выполнил — до конца трёх минут отдыхаешь. Три круга, всего 9 минут.',
      'Workout 10. A round of three exercises: inchworms, sit-ups and squats. The task is to fit each round into 3 minutes — done early, and you rest until the 3 minutes are up. Three rounds, 9 minutes in all.',
    ),
    basePoints: 100,
    tags: ['interval', 'full_body', 'beginner'],
    blocks: [
      warmup1(),
      {
        id: 's10_main',
        type: 'metcon',
        format: 'circuit',
        sets: 3,
        restBetweenRoundsSec: 75,
        title: l('3 круга, старт раз в 3 минуты', '3 rounds, start every 3 minutes'),
        description: l(
          'Круг без пауз между упражнениями, потом отдых до конца трёхминутки — примерно 1–1,5 минуты. Червячки — в спокойном темпе, шаг руками не слишком широкий.',
          'No pauses inside the round, then rest until the 3-minute mark — about 1–1.5 minutes. Inchworms at an easy pace, no over-long hand steps.',
        ),
        items: [
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'sit_up', reps: 10, note: NOTE_DEAD_BUG },
          { exerciseId: 'air_squat', reps: 15 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 11. Message 120 / 254 ------------------------------------------------------------ */
  {
    id: 'w_s11_emom8',
    name: l('EMOM 8: четыре упражнения', 'EMOM 8: four movements'),
    focus: l('Работа по минутам', 'Working by the minute'),
    description: l(
      'Тренировка 11. Снова по таймеру: каждую минуту новое упражнение, сделал — отдыхай до конца минуты. Отжимания с колен, приседания, ситапы, выпады — по 10 повторов, два круга. Чем быстрее делаешь, тем больше отдыха, но и устаёшь сильнее.',
      'Workout 11. On the clock again: a new exercise every minute, finish and rest until the minute ends. Knee push-ups, squats, sit-ups, lunges — 10 each, two loops. The faster you go, the longer you rest — and the more you tire.',
    ),
    basePoints: 100,
    tags: ['emom', 'full_body', 'beginner'],
    blocks: [
      warmup3(),
      {
        id: 's11_main',
        type: 'metcon',
        format: 'emom',
        rounds: 8,
        title: l('EMOM 8 мин', 'EMOM 8 min'),
        description: l(
          'Минута 1 — отжимания с колен, 2 — приседания, 3 — ситапы или «жук», 4 — выпады. Два круга.',
          'Minute 1 knee push-ups, 2 squats, 3 sit-ups or dead bugs, 4 lunges. Two loops.',
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

  /* --- 12. Message 126 ------------------------------------------------------------------ */
  {
    id: 'w_s12_step_ladder',
    name: l('Лесенка вниз: зашагивания и червячки', 'Descending ladder: step-ups and inchworms'),
    focus: l('Аккуратно и правильно, а не быстро', 'Careful and correct, not fast'),
    description: l(
      'Тренировка 12. Лесенка вниз: 10 зашагиваний на каждую ногу и 5 червячков, потом 8 и 4, 6 и 3, 4 и 2, 2 и 1. Работа на время, но на зашагиваниях не торопись: лучше аккуратно и правильно, чем быстро и непонятно как.',
      'Workout 12. A descending ladder: 10 step-ups per leg and 5 inchworms, then 8 and 4, 6 and 3, 4 and 2, 2 and 1. For time, but do not rush the step-ups: careful and correct beats fast and sloppy.',
    ),
    basePoints: 100,
    tags: ['fortime', 'lunge', 'full_body'],
    blocks: [
      warmup1(),
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

  /* --- 13. Message 128 ------------------------------------------------------------------ */
  {
    id: 'w_s13_amrap8_burpees',
    name: l('AMRAP 8: с бёрпи', 'AMRAP 8: with burpees'),
    focus: l('Первые бёрпи', 'Your first burpees'),
    description: l(
      'Тренировка 13. Чуть усложняем: появляются бёрпи. Восемь минут по кругу — 5 бёрпи, 6 ситапов, 7 отжиманий с колен, 8 выпадов, 9 приседаний. Отличный результат — 5 кругов, хороший — 4. Цель — 4 круга.',
      'Workout 13. A step up: burpees appear. Eight minutes on a loop — 5 burpees, 6 sit-ups, 7 knee push-ups, 8 lunges, 9 squats. 5 rounds is excellent, 4 is good. The target is 4 rounds.',
    ),
    basePoints: 110,
    tags: ['amrap', 'full_body', 'conditioning'],
    blocks: [
      warmup3(),
      {
        id: 's13_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Бёрпи — шагом назад и шагом вперёд, если прыжок пока не даётся.',
          'As many rounds as possible in 8 minutes. Step the burpees back and forward if the jump is not there yet.',
        ),
        items: [
          { exerciseId: 'burpee', reps: 5 },
          { exerciseId: 'sit_up', reps: 6, note: NOTE_DEAD_BUG },
          { exerciseId: 'knee_push_up', reps: 7 },
          { exerciseId: 'reverse_lunge', reps: 8, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'air_squat', reps: 9 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 14. Message 134 ------------------------------------------------------------------ */
  {
    id: 'w_s14_squats_4min',
    name: l('4 минуты приседаний', '4 minutes of squats'),
    focus: l('Короткий день: максимум приседаний', 'A short day: max squats'),
    description: l(
      'Тренировка 14. Короткая: в течение 4 минут — максимальное количество приседаний. Считай по десяткам и запиши число: это твоя точка отсчёта по ногам.',
      'Workout 14. A short one: as many squats as you can in 4 minutes. Count in tens and write the number down — it is your baseline for the legs.',
    ),
    basePoints: 80,
    tags: ['amrap', 'squat', 'beginner'],
    blocks: [
      warmup1(),
      {
        id: 's14_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 240,
        title: l('4 минуты приседаний', '4 minutes of squats'),
        description: l(
          'Один круг — 10 приседаний. Максимум кругов за 4 минуты; отдыхай стоя, когда нужно. Бёдра до параллели, пятки на полу.',
          'One round is 10 squats. As many rounds as possible in 4 minutes; rest standing when you need to. Thighs to parallel, heels down.',
        ),
        items: [{ exerciseId: 'air_squat', reps: 10 }],
      },
      cooldown(),
    ],
  },

  /* --- 15. Message 135 ------------------------------------------------------------------ */
  {
    id: 'w_s15_twenty_forty',
    name: l('20-20-20 и 40-40-40', '20-20-20 and 40-40-40'),
    focus: l('Выпады, отжимания, твист', 'Lunges, push-ups, twists'),
    description: l(
      'Тренировка 15. Два круга по 20 выпадов назад, 20 отжиманий с колен и 20 русских твистов без отдыха между кругами. Потом 2 минуты отдыха — и один круг, где всё по 40.',
      'Workout 15. Two rounds of 20 reverse lunges, 20 knee push-ups and 20 Russian twists with no rest between rounds. Then 2 minutes of rest — and one round with everything at 40.',
    ),
    basePoints: 110,
    tags: ['fortime', 'lunge', 'push', 'core'],
    blocks: [
      warmup2(),
      {
        id: 's15_two_rounds',
        type: 'metcon',
        format: 'fortime',
        sets: 2,
        durationSec: 420,
        title: l('2 круга по 20', '2 rounds of 20'),
        description: l(
          'Два круга без отдыха между ними. Твист — по касанию с каждой стороны, при диастазе вместо него 40 «жуков».',
          'Two rounds with no rest between them. Twists count per side; with diastasis do 40 dead bugs instead.',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'knee_push_up', reps: 20, note: NOTE_KNEES },
          { exerciseId: 'russian_twist', reps: 20 },
        ],
      },
      {
        id: 's15_one_round',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 420,
        title: l('1 круг по 40', '1 round of 40'),
        description: l(
          'Отдохни 2 минуты, потом один круг: всё по 40. Разбивай на подходы как удобно.',
          'Rest 2 minutes, then one round with everything at 40. Break the reps up as you like.',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 40, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'knee_push_up', reps: 40, note: NOTE_KNEES },
          { exerciseId: 'russian_twist', reps: 40 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 16. Message 139 ------------------------------------------------------------------ */
  {
    id: 'w_s16_amrap8_jacks',
    name: l('AMRAP 8: присед, скалолаз, джеки', 'AMRAP 8: squats, climbers, jacks'),
    focus: l('Дыхание и ноги', 'Breathing and legs'),
    description: l(
      'Тренировка 16. Восемь минут по кругу: 8 приседаний, 16 скалолазов, 32 джампинг-джека или прыжка на скакалке. Отличный результат — 8 кругов, хороший — 6. Цель — 5 кругов и больше.',
      'Workout 16. Eight minutes on a loop: 8 squats, 16 mountain climbers, 32 jumping jacks or rope skips. 8 rounds is excellent, 6 is good. The target is 5 rounds or more.',
    ),
    basePoints: 100,
    tags: ['amrap', 'conditioning', 'cardio'],
    blocks: [
      warmup3(),
      {
        id: 's16_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Не хочешь прыгать — шагай в стороны поочерёдно вместо джеков.',
          'As many rounds as possible in 8 minutes. Do not want to jump? Step out to alternate sides instead of jacks.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 8 },
          { exerciseId: 'mountain_climber', reps: 16 },
          { exerciseId: 'jumping_jack', reps: 32, note: NOTE_ROPE },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 17. Message 149 ------------------------------------------------------------------ */
  {
    id: 'w_s17_long_chipper',
    name: l('Длинный комплекс: 60-50-40-30-20-10', 'The long chipper: 60-50-40-30-20-10'),
    focus: l('Один длинный круг на время', 'One long round for time'),
    description: l(
      'Тренировка 17. Длинный комплекс на время: 60 приседаний, 50 тяг к носкам, 40 выпадов, 30 зашагиваний, 20 червячков, 10 бёрпи. Последовательность и повторы менять нельзя. Крышка 10 минут — чем быстрее выполнишь, тем раньше освободишься.',
      'Workout 17. A long chipper for time: 60 squats, 50 toe reaches, 40 lunges, 30 step-ups, 20 inchworms, 10 burpees. The order and the reps do not change. 10-minute cap — the faster you finish, the sooner you are free.',
    ),
    basePoints: 120,
    tags: ['fortime', 'chipper', 'full_body'],
    blocks: [
      warmup3(),
      {
        id: 's17_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 600,
        title: l('Комплекс на время', 'Chipper for time'),
        description: l(
          'Крышка 10 минут. Разбивай большие числа на подходы, но не меняй порядок. Тяга к носкам — по касанию, при диастазе 100 «жуков».',
          '10-minute cap. Break the big numbers into sets but keep the order. Toe reaches count per touch; with diastasis do 100 dead bugs.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 60 },
          { exerciseId: 'sit_up', reps: 50, note: NOTE_TOE_REACH },
          { exerciseId: 'reverse_lunge', reps: 40, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'step_up',
            reps: 30,
            note: l('В сумме на две ноги', 'Total for both legs'),
          },
          { exerciseId: 'inchworm', reps: 20 },
          { exerciseId: 'burpee', reps: 10 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 18. Message 157 (posted as "18") ------------------------------------------------- */
  {
    id: 'w_s18_buy_in',
    name: l('Входной билет и червячки', 'Buy-in and inchworms'),
    focus: l('Раз в 3 минуты: билет, потом максимум', 'Every 3 minutes: the buy-in, then max reps'),
    description: l(
      'Тренировка 18. «Входной билет» — фиксированное количество повторов, а в оставшееся время ты добираешь следующее упражнение. Раз в 3 минуты: 10 отжиманий, 20 приседаний, 30 джампинг-джеков, и до конца трёхминутки — максимум червячков. Два круга, между ними 3 минуты отдыха. Задача — чтобы в обоих кругах червячков было одинаково.',
      'Workout 18. The "buy-in" is a fixed number of reps; in the time left you add the next movement. Every 3 minutes: 10 push-ups, 20 squats, 30 jumping jacks, then max inchworms until the 3 minutes are up. Two rounds with 3 minutes of rest between them. The task: the same number of inchworms in both rounds.',
    ),
    basePoints: 100,
    tags: ['interval', 'full_body', 'conditioning'],
    blocks: [
      warmup3(),
      {
        id: 's18_main',
        type: 'metcon',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 180,
        title: l('2 круга по 3 минуты', '2 rounds of 3 minutes'),
        description: l(
          'Билет — без пауз, потом червячки до конца третьей минуты. Запомни число: во втором круге сделай столько же. Между кругами 3 минуты отдыха.',
          'The buy-in without pauses, then inchworms until the third minute ends. Remember the number and match it in round two. 3 minutes of rest between rounds.',
        ),
        items: [
          { exerciseId: 'knee_push_up', reps: 10, note: NOTE_KNEES },
          { exerciseId: 'air_squat', reps: 20 },
          { exerciseId: 'jumping_jack', reps: 30, note: NOTE_ROPE },
          {
            exerciseId: 'inchworm',
            reps: 6,
            note: l(
              'Максимум до конца трёхминутки; 6 — ориентир',
              'Max until the 3 minutes are up; 6 is the guide number',
            ),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 19. Message 163 (posted as "17") ------------------------------------------------- */
  {
    id: 'w_s19_three_windows',
    name: l('Три двухминутки', 'Three two-minute windows'),
    focus: l('Билет и максимум за 2 минуты', 'Buy-in and max reps in 2 minutes'),
    description: l(
      'Тренировка 19. Три окна по 2 минуты, между ними минута отдыха. Первое: 20 отжиманий и максимум червячков. Второе: 20 выпадов и максимум бёрпи. Третье: 10 отжиманий, 10 приседаний, а дальше червяк — бёрпи — червяк — бёрпи. Тренер: в первом окне червячков в идеале не меньше 13, во втором — не меньше 18 бёрпи, в третьем — червячков и бёрпи поровну.',
      'Workout 19. Three 2-minute windows with a minute of rest between them. First: 20 push-ups then max inchworms. Second: 20 lunges then max burpees. Third: 10 push-ups, 10 squats, then inchworm — burpee — inchworm — burpee. The coach: ideally 13+ inchworms in the first window, 18+ burpees in the second, and equal inchworms and burpees in the third.',
    ),
    basePoints: 110,
    tags: ['interval', 'full_body', 'conditioning'],
    blocks: [
      warmup3(),
      {
        id: 's19_window_1',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 120,
        title: l('Окно 1: 2 минуты', 'Window 1: 2 minutes'),
        description: l(
          '20 отжиманий, затем максимум червячков до конца двух минут. Запиши число.',
          '20 push-ups, then max inchworms until the 2 minutes are up. Write the number down.',
        ),
        items: [
          { exerciseId: 'knee_push_up', reps: 20, note: NOTE_KNEES },
          {
            exerciseId: 'inchworm',
            reps: 10,
            note: l('Максимум за оставшееся время', 'Max in the time left'),
          },
        ],
      },
      {
        id: 's19_window_2',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 120,
        title: l('Окно 2: 2 минуты', 'Window 2: 2 minutes'),
        description: l(
          'Отдохни минуту. Потом 20 выпадов и максимум бёрпи до конца двух минут.',
          'Rest a minute. Then 20 lunges and max burpees until the 2 minutes are up.',
        ),
        items: [
          { exerciseId: 'reverse_lunge', reps: 20, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'burpee',
            reps: 10,
            note: l('Максимум за оставшееся время', 'Max in the time left'),
          },
        ],
      },
      {
        id: 's19_window_3',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 120,
        title: l('Окно 3: 2 минуты', 'Window 3: 2 minutes'),
        description: l(
          'Отдохни минуту. Потом 10 отжиманий, 10 приседаний, а в оставшееся время чередуй: 1 червячок, 1 бёрпи, 1 червячок, 1 бёрпи.',
          'Rest a minute. Then 10 push-ups, 10 squats, and in the time left alternate: 1 inchworm, 1 burpee, 1 inchworm, 1 burpee.',
        ),
        items: [
          { exerciseId: 'knee_push_up', reps: 10 },
          { exerciseId: 'air_squat', reps: 10 },
          {
            exerciseId: 'inchworm',
            reps: 4,
            note: l('Чередуй с бёрпи до конца времени', 'Alternate with burpees until time'),
          },
          {
            exerciseId: 'burpee',
            reps: 4,
            note: l('Чередуй с червячками до конца времени', 'Alternate with inchworms until time'),
          },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 20. Message 168 (posted as "18") ------------------------------------------------- */
  {
    id: 'w_s20_burpee_ladder',
    name: l('Лесенка бёрпи: EMOM 12', 'Burpee ladder: EMOM 12'),
    focus: l('Точка отсчёта на месяц-два вперёд', 'A reference point for the next month or two'),
    description: l(
      'Тренировка 20. Первая минута — 1 бёрпи и отдых до конца минуты, вторая — 2 бёрпи, третья — 3, и так до двенадцатой. Делаешь, пока укладываешься в минуту; закрыть все 12 не обязательно. Не уложился — запиши, на какой минуте и сколько сделал: через месяц-два будет похожая тренировка, и ты сравнишь.',
      'Workout 20. Minute one: 1 burpee and rest until the minute ends; minute two: 2 burpees; three: 3, and so on to twelve. Keep going while you fit inside the minute; closing all 12 is not required. When you fall off, note the minute and the count: a similar workout comes in a month or two, and you will compare.',
    ),
    basePoints: 120,
    tags: ['emom', 'burpee', 'benchmark', 'conditioning'],
    blocks: [
      warmup3(),
      {
        id: 's20_main',
        type: 'metcon',
        format: 'emom',
        rounds: 12,
        title: l('EMOM 12: лесенка бёрпи', 'EMOM 12: burpee ladder'),
        description: l(
          'Каждую минуту на одно бёрпи больше. Бёрпи — шагом, если прыжок пока не даётся. Как только не уложился в минуту — дальше можно просто отдыхать до конца таймера.',
          'One more burpee every minute. Step the burpees if the jump is not there yet. Once you miss a minute, you may simply rest to the end of the clock.',
        ),
        items: [
          { exerciseId: 'burpee', reps: 1 },
          { exerciseId: 'burpee', reps: 2 },
          { exerciseId: 'burpee', reps: 3 },
          { exerciseId: 'burpee', reps: 4 },
          { exerciseId: 'burpee', reps: 5 },
          { exerciseId: 'burpee', reps: 6 },
          { exerciseId: 'burpee', reps: 7 },
          { exerciseId: 'burpee', reps: 8 },
          { exerciseId: 'burpee', reps: 9 },
          { exerciseId: 'burpee', reps: 10 },
          { exerciseId: 'burpee', reps: 11 },
          { exerciseId: 'burpee', reps: 12 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 22. Message 179 ------------------------------------------------------------------ */
  {
    id: 'w_s22_chipper_x2',
    name: l('15-25-30-25-15, два круга', '15-25-30-25-15, two rounds'),
    focus: l('Круг на время без отдыха', 'A round for time, no rest'),
    description: l(
      'Тренировка 22. Пятнадцать обратных отжиманий, 25 приседаний, 30 скалолазов, 25 выпадов назад, 15 отжиманий с колен — два круга на время, между кругами нет отдыха. Крышка 10 минут.',
      'Workout 22. Fifteen dips, 25 squats, 30 mountain climbers, 25 reverse lunges, 15 knee push-ups — two rounds for time with no rest between rounds. 10-minute cap.',
    ),
    basePoints: 110,
    tags: ['fortime', 'conditioning', 'full_body'],
    blocks: [
      warmup3(),
      {
        id: 's22_main',
        type: 'metcon',
        format: 'fortime',
        sets: 2,
        durationSec: 600,
        title: l('2 круга на время', '2 rounds for time'),
        description: l(
          'Крышка 10 минут. Отдыхай, когда нужно, но не между кругами — второй круг начинается сразу.',
          '10-minute cap. Rest when you need to, but not between rounds — the second round starts straight away.',
        ),
        items: [
          { exerciseId: 'chair_dip', reps: 15 },
          { exerciseId: 'air_squat', reps: 25 },
          { exerciseId: 'mountain_climber', reps: 30 },
          { exerciseId: 'reverse_lunge', reps: 25, note: NOTE_LUNGE_TOTAL },
          { exerciseId: 'knee_push_up', reps: 15, note: NOTE_KNEES },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 23. Message 184 ------------------------------------------------------------------ */
  {
    id: 'w_s23_amrap8_worms',
    name: l('AMRAP 8: червячки и бёрпи', 'AMRAP 8: inchworms and burpees'),
    focus: l('Максимум кругов, цель — три', 'As many rounds as possible, target three'),
    description: l(
      'Тренировка 23. Восемь минут по кругу: 5 червячков, 6 тяг к носкам, 7 отжиманий с колен, 8 приседаний, 9 бёрпи. Отличный результат — 4 круга, хороший — 3. Цель — 3 круга.',
      'Workout 23. Eight minutes on a loop: 5 inchworms, 6 toe reaches, 7 knee push-ups, 8 squats, 9 burpees. 4 rounds is excellent, 3 is good. The target is 3 rounds.',
    ),
    basePoints: 110,
    tags: ['amrap', 'full_body', 'conditioning'],
    blocks: [
      warmup3(),
      {
        id: 's23_main',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Девять бёрпи в конце круга — самое тяжёлое место: не спринтуй до них.',
          'As many rounds as possible in 8 minutes. Nine burpees at the end of the round is the hard part: do not sprint to get there.',
        ),
        items: [
          { exerciseId: 'inchworm', reps: 5 },
          { exerciseId: 'sit_up', reps: 6, note: NOTE_TOE_REACH },
          { exerciseId: 'knee_push_up', reps: 7 },
          { exerciseId: 'air_squat', reps: 8 },
          { exerciseId: 'burpee', reps: 9 },
        ],
      },
      cooldown(),
    ],
  },

  /* --- 24. Message 189 ------------------------------------------------------------------ */
  {
    id: 'w_s24_steps_and_jumps',
    name: l('Зашагивания, выпады, прыжки', 'Step-ups, lunges, jumps'),
    focus: l('Ноги и дыхание в трёх кругах', 'Legs and breathing in three rounds'),
    description: l(
      'Тренировка 24, последняя в программе. Три разных круга с минутой отдыха между ними: 20 зашагиваний и 100 прыжков; 30 выпадов назад и 100 прыжков; 20 зашагиваний, 30 выпадов и 200 прыжков. Прыжки — на скакалке или джампинг-джеки.',
      'Workout 24, the last of the programme. Three different rounds with a minute of rest between them: 20 step-ups and 100 jumps; 30 reverse lunges and 100 jumps; 20 step-ups, 30 lunges and 200 jumps. Jumps are rope skips or jumping jacks.',
    ),
    basePoints: 110,
    tags: ['fortime', 'lunge', 'cardio'],
    blocks: [
      warmup3(),
      {
        id: 's24_main',
        type: 'metcon',
        format: 'fortime',
        sets: 1,
        durationSec: 720,
        title: l('Три круга на время', 'Three rounds for time'),
        description: l(
          'Крышка 12 минут. После второго и четвёртого упражнения — минута отдыха, потом следующий круг. 60 джампинг-джеков ≈ 100 прыжков на скакалке.',
          '12-minute cap. After the second and the fourth exercise, rest a minute, then the next round. 60 jumping jacks ≈ 100 rope skips.',
        ),
        items: [
          {
            exerciseId: 'step_up',
            reps: 20,
            note: l('В сумме на две ноги', 'Total for both legs'),
          },
          {
            exerciseId: 'jumping_jack',
            reps: 60,
            note: l(
              'Или 100 прыжков на скакалке, потом минута отдыха',
              'Or 100 rope skips, then rest a minute',
            ),
          },
          { exerciseId: 'reverse_lunge', reps: 30, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'jumping_jack',
            reps: 60,
            note: l(
              'Или 100 прыжков на скакалке, потом минута отдыха',
              'Or 100 rope skips, then rest a minute',
            ),
          },
          {
            exerciseId: 'step_up',
            reps: 20,
            note: l('В сумме на две ноги', 'Total for both legs'),
          },
          { exerciseId: 'reverse_lunge', reps: 30, note: NOTE_LUNGE_TOTAL },
          {
            exerciseId: 'jumping_jack',
            reps: 120,
            note: l('Или 200 прыжков на скакалке', 'Or 200 rope skips'),
          },
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
    stepsGoal: 7000,
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
  '7000 шагов и сон — так растёт сила',
  '7,000 steps and sleep — that is how strength grows',
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
  /* Week 1 */
  {
    id: 'w1_d1_test',
    week: 1,
    day: 1,
    kind: 'test',
    workoutId: TEST_WORKOUT_ID,
    title: l('Входной тест', 'Baseline test'),
    subtitle: l('Отжимания, приседания, планка', 'Push-ups, squats, plank'),
  },
  restNode(1, 2, REST_STEPS),
  workoutNode(1, 3, 1, 'w_s01_sets', l('2 круга, минута отдыха', '2 rounds, a minute of rest')),
  restNode(1, 4, REST_SORENESS),
  workoutNode(1, 5, 2, 'w_s02_sets', l('2 круга, минута отдыха', '2 rounds, a minute of rest')),
  restNode(1, 6, REST_RECOVERY),
  workoutNode(1, 7, 3, 'w_s03_pairs', l('Три пары по 2 круга', 'Three pairs, 2 rounds each')),

  /* Week 2 */
  restNode(2, 1, REST_STEPS),
  workoutNode(2, 2, 4, 'w_s04_bridges', l('200 мостов, крышка 10 мин', '200 bridges, 10-min cap')),
  restNode(2, 3, REST_SORENESS),
  workoutNode(
    2,
    4,
    5,
    'w_s05_three_rounds',
    l('3 круга на время — запиши время', '3 rounds for time — note the time'),
    'benchmark',
  ),
  restNode(2, 5, REST_RECOVERY),
  workoutNode(2, 6, 6, 'w_s06_amrap8', l('AMRAP 8 мин', 'AMRAP 8 min')),
  restNode(2, 7, REST_STEPS),

  /* Week 3 */
  workoutNode(3, 1, 7, 'w_s07_hundred_situps', l('100 ситапов на время', '100 sit-ups for time')),
  restNode(3, 2, REST_SORENESS),
  workoutNode(3, 3, 8, 'w_s08_emom_ladder', l('EMOM 8, лесенка +2', 'EMOM 8, +2 ladder')),
  restNode(3, 4, REST_RECOVERY),
  workoutNode(3, 5, 9, 'w_s09_chipper_x2', l('10-20-30-40-50 × 2', '10-20-30-40-50 × 2')),
  restNode(3, 7, REST_WEEKEND),

  /* Week 4 */
  workoutNode(4, 1, 10, 'w_s10_every_3_min', l('3 круга раз в 3 минуты', '3 rounds every 3 min')),
  restNode(4, 2, REST_STEPS),
  workoutNode(4, 3, 11, 'w_s11_emom8', l('EMOM 8 мин', 'EMOM 8 min')),
  restNode(4, 4, REST_SORENESS),
  workoutNode(4, 5, 12, 'w_s12_step_ladder', l('Лесенка вниз', 'Descending ladder')),
  restNode(4, 7, REST_WEEKEND),

  /* Week 5 */
  workoutNode(5, 1, 13, 'w_s13_amrap8_burpees', l('AMRAP 8 с бёрпи', 'AMRAP 8 with burpees')),
  restNode(5, 2, REST_RECOVERY),
  workoutNode(5, 3, 14, 'w_s14_squats_4min', l('4 минуты приседаний', '4 minutes of squats')),
  restNode(5, 4, REST_STEPS),
  workoutNode(
    5,
    5,
    15,
    'w_s15_twenty_forty',
    l('20-20-20 × 2, потом 40-40-40', '20-20-20 × 2, then 40-40-40'),
  ),
  restNode(5, 7, REST_WEEKEND),

  /* Week 6 */
  workoutNode(
    6,
    1,
    16,
    'w_s16_amrap8_jacks',
    l('AMRAP 8: присед, скалолаз, джеки', 'AMRAP 8: squats, climbers, jacks'),
  ),
  restNode(6, 2, REST_SORENESS),
  workoutNode(
    6,
    3,
    17,
    'w_s17_long_chipper',
    l('60-50-40-30-20-10, крышка 10 мин', '60-50-40-30-20-10, 10-min cap'),
  ),
  restNode(6, 4, REST_RECOVERY),
  workoutNode(6, 5, 18, 'w_s18_buy_in', l('2 круга по 3 минуты', '2 rounds of 3 minutes')),
  restNode(6, 7, REST_WEEKEND),

  /* Week 7 */
  workoutNode(7, 1, 19, 'w_s19_three_windows', l('Три двухминутки', 'Three 2-minute windows')),
  restNode(7, 2, REST_STEPS),
  workoutNode(
    7,
    3,
    20,
    'w_s20_burpee_ladder',
    l('Лесенка бёрпи, EMOM 12', 'Burpee ladder, EMOM 12'),
  ),
  restNode(7, 4, REST_SORENESS),
  workoutNode(
    7,
    5,
    21,
    'w_s05_three_rounds',
    l('Тот же комплекс, что в 5-й: сравни время', 'Same as workout 5: compare the time'),
    'benchmark',
  ),
  restNode(7, 7, REST_WEEKEND),

  /* Week 8 */
  workoutNode(8, 1, 22, 'w_s22_chipper_x2', l('15-25-30-25-15 × 2', '15-25-30-25-15 × 2')),
  restNode(8, 2, REST_RECOVERY),
  workoutNode(
    8,
    3,
    23,
    'w_s23_amrap8_worms',
    l('AMRAP 8: червячки и бёрпи', 'AMRAP 8: inchworms and burpees'),
  ),
  restNode(8, 4, REST_STEPS),
  workoutNode(
    8,
    5,
    24,
    'w_s24_steps_and_jumps',
    l('Три круга: зашагивания, выпады, прыжки', 'Three rounds: step-ups, lunges, jumps'),
  ),
  restNode(8, 6, REST_BEFORE_TEST),
  {
    id: 'w8_d7_retest',
    week: 8,
    day: 7,
    kind: 'test',
    workoutId: TEST_WORKOUT_ID,
    title: l('Повторный тест', 'Retest'),
    subtitle: l('Те же три упражнения — сравни цифры', 'Same three moves — compare the numbers'),
  },
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
  name: l('Старт: кроссфит дома без оборудования', 'Start: home CrossFit basics'),
  tagline: l(
    'Восемь недель по программе тренера для новичков: коротко, по кругу, без оборудования.',
    'Eight weeks of the coach’s own beginner programme: short, in rounds, with no equipment.',
  ),
  description: l(
    'Программа для тех, кто начинает с нуля или возвращается после долгого перерыва. Двадцать четыре короткие тренировки — те самые, по которым тренер ведёт новичков: отжимания с колен, приседания, ситапы, выпады и первые бёрпи. Три раза в неделю по 15–20 минут, нагрузка подстраивается под тебя.',
    'A programme for complete beginners and anyone coming back after a long break. Twenty-four short sessions — the same ones the coach runs his beginners through: knee push-ups, squats, sit-ups, lunges and your first burpees. Three times a week, 15–20 minutes each, and the load adapts to you.',
  ),
  longDescription: [
    l(
      '«Старт» — это программа для новичков, которую тренер ведёт в своей группе, перенесённая в приложение без изменений в сути: те же 24 тренировки, тот же порядок, те же слова. Цель первых недель — проработать большие группы мышц и включить тебя в процесс, а не выжать до предела. Каждую тренировку тренер показывает сам: на каждое движение есть его видео.',
      'Start is the beginner programme the coach runs with his own group, moved into the app without changing what matters: the same 24 sessions, the same order, the same words. The aim of the first weeks is to work the big muscle groups and get you into the process, not to wring you out. The coach demonstrates every session himself: every movement has his video.',
    ),
    l(
      'Первые недели — простые круги с минутой отдыха после каждого упражнения. Потом форматы кроссфита по одному: три круга на время, AMRAP, EMOM, работа по минутам, лесенки и длинный комплекс на время. Бёрпи появляются только на пятой неделе. Между тренировками — дни отдыха с целью 7000 шагов: мышцы восстанавливаются лучше, когда ты двигаешься, а не лежишь.',
      'The first weeks are simple rounds with a minute of rest after every exercise. Then the CrossFit formats arrive one at a time: three rounds for time, AMRAP, EMOM, work by the minute, ladders and a long chipper for time. Burpees only appear in week five. Between sessions are rest days with a 7,000-step goal — muscles recover better when you move than when you lie still.',
    ),
    l(
      'Тренировки короткие — 15–20 минут вместе с разминкой и заминкой, самая длинная около 25. Из инвентаря нужны коврик и устойчивый стул: от него ты будешь отжиматься и на него зашагивать. Приложение считает, сколько повторений тебе делать сегодня, по результатам прошлой тренировки — было тяжело, легко или в самый раз. Тяжёлые упражнения заменяются простыми: ситапы — «мёртвым жуком», прыжки — шагом.',
      'Sessions are short — 15–20 minutes including warm-up and cool-down, the longest around 25. You need a mat and a sturdy chair: you will do dips off it and step-ups onto it. The app works out how many reps you should do today from how your last session went — too hard, too easy or just right. Hard movements swap for simple ones: sit-ups for dead bugs, jumps for steps.',
    ),
    l(
      'В начале и в конце курса — один и тот же тест: отжимания с колен за 2 минуты, приседания за минуту и планка на максимум. А внутри программы у тренера свои точки отсчёта: три круга на время во второй неделе, которые ты повторишь в седьмой, и лесенка бёрпи, к которой вернёшься через месяц-два.',
      'The course opens and closes with the same test: knee push-ups in 2 minutes, squats in 1 minute and a max plank hold. Inside the programme the coach has his own reference points: three rounds for time in week two that you repeat in week seven, and a burpee ladder you will come back to in a month or two.',
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
      'Есть 15–20 минут три раза в неделю и желание не бросить через две.',
      'You can find 15–20 minutes three times a week and want to still be going in week three.',
    ),
  ],
  outcomes: [
    l(
      'Уверенная техника базовых движений: присед, отжимание с колен, ситап, выпад, зашагивание.',
      'Confident technique in the base movements: squat, knee push-up, sit-up, lunge, step-up.',
    ),
    l(
      'Первые бёрпи — и лесенка до 12 минут, к которой ты вернёшься, чтобы увидеть прогресс.',
      'Your first burpees — and a 12-minute ladder you will come back to and see the difference.',
    ),
    l(
      'Привычка тренироваться три раза в неделю и ходить в дни отдыха.',
      'A habit of training three times a week and walking on rest days.',
    ),
    l(
      'Знакомство со всеми форматами кроссфита: круги, «на время», AMRAP, EMOM, лесенки, длинный комплекс.',
      'A working knowledge of every CrossFit format: rounds, for-time, AMRAP, EMOM, ladders, the chipper.',
    ),
    l(
      'Твои личные цифры: тест в начале и в конце, время трёх кругов во второй и седьмой неделе.',
      'Your own numbers: the test at the start and the end, and your three-round time in weeks two and seven.',
    ),
    l(
      'Готовность перейти к курсу «Своим весом» или к тренировкам с гантелями.',
      'Readiness to move on to the Bodyweight Engine course or to dumbbell training.',
    ),
  ],
  equipment: ['none', 'mat', 'chair'],
  level: 1,
  weeks: 8,
  sessionsPerWeek: 3,
  avgSessionMin: 18,
  accent: '#B9F3E0',
  gradient: ['#B9F3E0', '#C9D6FF'],
  price: { rub: 2990, usd: 29 },
  workouts: WORKOUTS,
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
        'Курс написан именно для этого. Тренер советует новичкам начинать с минимальных цифр — и приложение делает это за тебя: после входного теста оно уменьшает количество повторений, а после каждой тренировки спрашивает, как было, и корректирует следующую. Если тяжело — выбирай режим «Полегче»: это не поражение, а часть плана. Ситапы можно всегда заменить «мёртвым жуком», а бёрпи делать шагом.',
        'That is exactly who this course is for. The coach tells beginners to start at the minimum — and the app does it for you: after the baseline test it lowers the rep counts, then asks how each session felt and adjusts the next one. If it is hard, pick "Easier" — that is not failure, it is part of the plan. Sit-ups can always become dead bugs, and burpees can be stepped.',
      ),
    },
    {
      q: l('Сколько времени занимает тренировка?', 'How long is a session?'),
      a: l(
        'В среднем около 18 минут вместе с разминкой и заминкой. Самые короткие — 4 минуты приседаний и 100 ситапов, около 12–15 минут; самые длинные — длинный комплекс и лесенка бёрпи, около 20–25 минут. Перед стартом приложение показывает расчётное время для каждого режима сложности.',
        'About 18 minutes on average including warm-up and cool-down. The shortest are the 4 minutes of squats and the 100 sit-ups at around 12–15 minutes; the longest are the chipper and the burpee ladder at around 20–25. Before you start, the app shows the estimated time for each difficulty option.',
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
