/**
 * Course "start" — Старт: кроссфит дома без оборудования / Start: home CrossFit basics.
 *
 * Level 1, 4 weeks, 3 sessions per week (13 sessions incl. baseline test and retest).
 * Week template: D1 squat & press, D3 hinge & core, D5 conditioning; rest nodes between
 * sessions and at the end of every week. No jumping in weeks 1–2; every later jump has a
 * step-based option in its note. Authored for a complete beginner at scale 1.0 — the
 * training engine scales reps from the athlete's test and feedback.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type NodeInput = CourseInput['nodes'][number];

const l = (ru: string, en: string): L10n => ({ ru, en });

/* ---------------------------------------------------------------------------------------- */
/* Shared blocks                                                                             */
/* ---------------------------------------------------------------------------------------- */

/** Warm-up for squat & press days: locomotion, shoulders, squat pattern, hinge pattern. */
function warmupSquatPush(): BlockInput {
  return {
    id: 'wu_squat_push',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    description: l(
      'Два круга в спокойном темпе: разогрей суставы и вспомни движения, которые будут в тренировке.',
      'Two easy rounds: warm up the joints and rehearse the movements you are about to train.',
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

/** Warm-up for hinge & core days: spine, hips, rotation. */
function warmupHingeCore(): BlockInput {
  return {
    id: 'wu_hinge_core',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    description: l(
      'Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.',
      'Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.',
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

/** Warm-up for conditioning days: a little longer on the feet, then hips and squats. */
function warmupConditioning(): BlockInput {
  return {
    id: 'wu_conditioning',
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    description: l(
      'Два круга. Во втором круге чуть быстрее, чем в первом: пульс должен подняться до старта.',
      'Two rounds, the second slightly quicker than the first: your heart rate should be up before the clock starts.',
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

/** Cool-down after squat & press: hips, hamstrings, a deep squat and a rest pose. */
function cooldownSquatPush(): BlockInput {
  return {
    id: 'cd_squat_push',
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    description: l(
      'Дыши медленно и не тяни через боль: растяжка должна быть приятной.',
      'Breathe slowly and never stretch into pain: it should feel good.',
    ),
    items: [
      { exerciseId: 'squat_hold', seconds: 30 },
      { exerciseId: 'hip_flexor_stretch', seconds: 30, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 30, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

/** Cool-down after hinge & core: spine mobility, hamstrings, hip flexors, rest pose. */
function cooldownHingeCore(): BlockInput {
  return {
    id: 'cd_hinge_core',
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    description: l(
      'Спокойно верни спину и таз в нейтраль. Без рывков, длинный выдох в каждой позе.',
      'Gently bring the spine and hips back to neutral. No bouncing, a long exhale in every position.',
    ),
    items: [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 30, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

/** Cool-down after conditioning and tests: bring the heart rate down, open the hips. */
function cooldownConditioning(): BlockInput {
  return {
    id: 'cd_conditioning',
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    description: l(
      'Пульс должен успокоиться до конца заминки. Если ещё тяжело дышать — постой минуту, потом тянись.',
      'Your heart rate should settle by the end of the cool-down. Still breathing hard? Stand for a minute first, then stretch.',
    ),
    items: [
      { exerciseId: 'hip_flexor_stretch', seconds: 30, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 30, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
  };
}

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
      cooldownConditioning(),
    ],
  },

  /* --- Week 1 --------------------------------------------------------------------------- */
  {
    id: 'w_squat_push_1',
    name: l('Присед и жим: основа', 'Squat & press: the base'),
    focus: l('Техника приседа и отжиманий от опоры', 'Squat technique and incline push-ups'),
    description: l(
      'Первая тренировка курса. Учим два главных движения — присед и отжимание — в самой простой версии, добавляем удержание у стены и короткий круг на корпус. Цель — чистая техника, а не усталость.',
      'The first session of the course. We learn the two key movements — the squat and the push-up — in their simplest form, add a wall sit and a short core circuit. The goal is clean technique, not fatigue.',
    ),
    basePoints: 100,
    tags: ['squat', 'push', 'technique', 'beginner'],
    blocks: [
      warmupSquatPush(),
      {
        id: 'st_squat_push_1',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода каждого упражнения, отдых 60 секунд. Темп медленный: две секунды вниз, секунда вверх. Если техника ломается — остановись раньше.',
          'Three sets of each exercise, 60 seconds of rest. Slow tempo: two seconds down, one up. If your form breaks, stop the set early.',
        ),
        items: [
          {
            exerciseId: 'air_squat',
            reps: 10,
            note: l('Пятки на полу, колени в стороны', 'Heels down, knees pushed out'),
          },
          {
            exerciseId: 'incline_push_up',
            reps: 8,
            note: l(
              'Руки на сиденье стула, тело — одна прямая линия',
              'Hands on the chair seat, body in one straight line',
            ),
          },
          {
            exerciseId: 'wall_sit',
            seconds: 20,
            note: l(
              'Бёдра параллельно полу или чуть выше',
              'Thighs parallel to the floor or slightly higher',
            ),
          },
        ],
      },
      {
        id: 'core_squat_push_1',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Кор', 'Core'),
        description: l(
          'Два круга. Главное — не прогибать поясницу: живот подтянут, дыхание ровное.',
          'Two rounds. Priority: no sagging in the lower back — belly braced, breathing even.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 20 },
          { exerciseId: 'dead_bug', reps: 10 },
          { exerciseId: 'bird_dog', reps: 10 },
        ],
      },
      cooldownSquatPush(),
    ],
  },
  {
    id: 'w_hinge_core_1',
    name: l('Наклон и корпус: основа', 'Hinge & core: the base'),
    focus: l('Наклон, ягодицы и задняя поверхность бедра', 'Hinge, glutes and the posterior chain'),
    description: l(
      'День наклона: учимся включать ягодицы и заднюю поверхность бедра — мостик, супермен и обратные выпады. Затем короткий круг на корпус. Это фундамент для становой тяги и махов гирей, если когда-нибудь до них дойдёшь.',
      'Hinge day: we learn to switch on the glutes and hamstrings — bridges, supermans and reverse lunges — then a short core circuit. This is the foundation for deadlifts and kettlebell swings, if you ever get there.',
    ),
    basePoints: 100,
    tags: ['hinge', 'core', 'technique', 'beginner'],
    blocks: [
      warmupHingeCore(),
      {
        id: 'st_hinge_core_1',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Каждое повторение — с паузой в верхней точке: почувствуй, что работают именно ягодицы.',
          'Three sets, 60 seconds of rest. Pause at the top of every rep: make sure it is the glutes doing the work.',
        ),
        items: [
          {
            exerciseId: 'glute_bridge',
            reps: 12,
            note: l(
              'Вверху сожми ягодицы на секунду',
              'Squeeze the glutes for a second at the top',
            ),
          },
          {
            exerciseId: 'superman',
            reps: 10,
            note: l(
              'Поднимай руки и ноги невысоко, без рывка',
              'Lift arms and legs just a little, no jerking',
            ),
          },
          {
            exerciseId: 'reverse_lunge',
            reps: 10,
            note: l(
              '10 повторений — это по 5 на каждую ногу. Можно держаться за стул',
              '10 reps means 5 per leg. Hold the chair for balance if you need to',
            ),
          },
        ],
      },
      {
        id: 'core_hinge_core_1',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Кор', 'Core'),
        description: l(
          'Два круга в спокойном темпе. В ситапах не тяни себя за шею — поднимайся за счёт живота.',
          'Two easy rounds. In the sit-ups do not pull on your neck — lift with the abdominals.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 20 },
          { exerciseId: 'sit_up', reps: 8 },
          { exerciseId: 'dead_bug', reps: 10 },
        ],
      },
      cooldownHingeCore(),
    ],
  },

  /* --- Week 2 --------------------------------------------------------------------------- */
  {
    id: 'w_squat_push_2',
    name: l('Присед и жим: объём', 'Squat & press: volume'),
    focus: l('Больше повторений, тот же темп', 'More reps, same tempo'),
    description: l(
      'Та же структура, что на первой неделе, но на пару повторений больше, а вместо стульчика у стены — зашагивания на стул. Следи, чтобы техника не портилась к третьему подходу.',
      'Same structure as week one, a couple more reps, and step-ups replace the wall sit. Watch that your technique does not slip by the third set.',
    ),
    basePoints: 100,
    tags: ['squat', 'push', 'lunge', 'beginner'],
    blocks: [
      warmupSquatPush(),
      {
        id: 'st_squat_push_2',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Темп прежний: две секунды вниз, секунда вверх.',
          'Three sets, 60 seconds of rest. Same tempo: two seconds down, one second up.',
        ),
        items: [
          {
            exerciseId: 'air_squat',
            reps: 12,
            note: l('Пятки на полу, взгляд вперёд', 'Heels down, eyes forward'),
          },
          {
            exerciseId: 'incline_push_up',
            reps: 10,
            note: l(
              'Грудь к краю сиденья, локти назад под 45°',
              'Chest to the edge of the seat, elbows back at 45°',
            ),
          },
          {
            exerciseId: 'step_up',
            reps: 6,
            perSide: true,
            note: l(
              'Стул без колёсиков. Если он высокий — используй низкую табуретку или ступеньку',
              'A chair without wheels. If it is tall, use a low stool or a stair step',
            ),
          },
        ],
      },
      {
        id: 'core_squat_push_2',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Кор', 'Core'),
        description: l(
          'Два круга. Планка на пять секунд дольше, чем на прошлой неделе.',
          'Two rounds. The plank is five seconds longer than last week.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 25 },
          { exerciseId: 'dead_bug', reps: 12 },
          { exerciseId: 'bird_dog', reps: 10 },
        ],
      },
      cooldownSquatPush(),
    ],
  },
  {
    id: 'w_hinge_core_2',
    name: l('Наклон и корпус: объём', 'Hinge & core: volume'),
    focus: l('Объём наклона и корпуса', 'Hinge and core volume'),
    description: l(
      'Повторяем первую неделю с чуть большим объёмом: по два-три повторения сверху в каждом упражнении и на пять секунд дольше планка. Именно так работает прогрессия — маленькими шагами каждую неделю.',
      'Week one again with a bit more volume: two or three extra reps per exercise and five more seconds of plank. That is how progression works — small steps every week.',
    ),
    basePoints: 100,
    tags: ['hinge', 'core', 'lunge', 'beginner'],
    blocks: [
      warmupHingeCore(),
      {
        id: 'st_hinge_core_2',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Мостик — с паузой наверху, выпады — с касанием коленом пола, но без удара.',
          'Three sets, 60 seconds of rest. Pause at the top of the bridge; in the lunges the knee kisses the floor, no banging.',
        ),
        items: [
          { exerciseId: 'glute_bridge', reps: 15 },
          { exerciseId: 'superman', reps: 12 },
          {
            exerciseId: 'reverse_lunge',
            reps: 12,
            note: l('По 6 на каждую ногу', '6 per leg'),
          },
        ],
      },
      {
        id: 'core_hinge_core_2',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Кор', 'Core'),
        description: l(
          'Два круга. В «мёртвом жуке» поясница прижата к полу всё время.',
          'Two rounds. In the dead bug keep the lower back pressed into the floor throughout.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 25 },
          { exerciseId: 'sit_up', reps: 10 },
          { exerciseId: 'dead_bug', reps: 12 },
        ],
      },
      cooldownHingeCore(),
    ],
  },
  {
    id: 'w_circuit_no_jump',
    name: l('Круговая без прыжков', 'No-jump circuit'),
    focus: l('Выносливость без ударной нагрузки', 'Conditioning without impact'),
    description: l(
      'Первый день выносливости: пять простых упражнений по кругу, без единого прыжка. Задача — держать ровный темп и не останавливаться внутри круга. Это первый шаг к настоящим кроссфит-комплексам.',
      'Your first conditioning day: five simple exercises in a loop, without a single jump. The task is to hold a steady pace and not stop inside a round. It is the first step towards real CrossFit workouts.',
    ),
    basePoints: 100,
    tags: ['conditioning', 'circuit', 'low_impact', 'beginner'],
    blocks: [
      warmupConditioning(),
      {
        id: 'mc_circuit_no_jump',
        type: 'metcon',
        format: 'circuit',
        sets: 3,
        restBetweenRoundsSec: 60,
        title: l('Круговая: 3 круга', 'Circuit: 3 rounds'),
        description: l(
          'Три круга. Между упражнениями — короткая пауза, между кругами — минута. Темп ровный: дыхание учащённое, но ты можешь сказать короткую фразу.',
          'Three rounds. A short pause between exercises, a minute between rounds. Even pace: breathing is faster, but you could still say a short sentence.',
        ),
        items: [
          {
            exerciseId: 'step_up',
            reps: 6,
            perSide: true,
            restAfterSec: 10,
            note: l('Вставай через пятку', 'Drive through the heel'),
          },
          { exerciseId: 'incline_push_up', reps: 8, restAfterSec: 10 },
          { exerciseId: 'air_squat', reps: 12, restAfterSec: 10 },
          { exerciseId: 'glute_bridge', reps: 12, restAfterSec: 10 },
          {
            exerciseId: 'jog_in_place',
            seconds: 40,
            restAfterSec: 10,
            note: l(
              'Или марш на месте с высоким коленом',
              'Or march in place lifting the knees high',
            ),
          },
        ],
      },
      cooldownConditioning(),
    ],
  },

  /* --- Week 3 --------------------------------------------------------------------------- */
  {
    id: 'w_squat_push_3',
    name: l('Присед и жим: шаг вперёд', 'Squat & press: a step up'),
    focus: l('Отжимания с колен и первый AMRAP', 'Knee push-ups and your first AMRAP'),
    description: l(
      'Отжимания переезжают с опоры на пол — с колен. Приседания становятся медленнее и глубже. А в конце — первый AMRAP: шесть минут, три упражнения, столько кругов, сколько получится.',
      'Push-ups move from the chair to the floor — on the knees. Squats get slower and deeper. And to finish, your first AMRAP: six minutes, three exercises, as many rounds as you can.',
    ),
    basePoints: 100,
    tags: ['squat', 'push', 'amrap', 'beginner'],
    blocks: [
      warmupSquatPush(),
      {
        id: 'st_squat_push_3',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Присед — три секунды вниз, пауза внизу, быстро вверх.',
          'Three sets, 60 seconds of rest. Squat: three seconds down, pause at the bottom, fast up.',
        ),
        items: [
          {
            exerciseId: 'air_squat',
            reps: 12,
            note: l(
              'Три секунды вниз, секунда паузы внизу',
              'Three seconds down, a one-second pause at the bottom',
            ),
          },
          {
            exerciseId: 'knee_push_up',
            reps: 8,
            note: l(
              'Если пока тяжело — от стула, но попробуй хотя бы 2–3 с колен',
              'If it is still too hard, use the chair — but try at least 2–3 from the knees',
            ),
          },
          { exerciseId: 'step_up', reps: 8, perSide: true },
        ],
      },
      {
        id: 'mc_amrap6_squat_push',
        type: 'metcon',
        format: 'amrap',
        durationSec: 360,
        title: l('AMRAP 6 мин', 'AMRAP 6 min'),
        description: l(
          'Максимум кругов за 6 минут. Это не спринт: выбери темп, который сможешь держать всё время, и не останавливайся дольше чем на пару вдохов.',
          'As many rounds as possible in 6 minutes. Not a sprint: pick a pace you can hold the whole way and never stop for more than a couple of breaths.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 8 },
          { exerciseId: 'incline_push_up', reps: 6 },
          { exerciseId: 'sit_up', reps: 10 },
        ],
      },
      cooldownSquatPush(),
    ],
  },
  {
    id: 'w_hinge_core_3',
    name: l('Наклон и корпус: баланс', 'Hinge & core: balance'),
    focus: l('Баланс и наклон на одной ноге', 'Balance and the single-leg hinge'),
    description: l(
      'Добавляем румынскую тягу на одной ноге — без веса, только баланс и контроль. Это самый честный тест наклона: если спина округляется, ты это сразу почувствуешь. В блоке на корпус появляется боковая планка.',
      'We add the single-leg Romanian deadlift — no weight, just balance and control. It is the most honest hinge test: if your back rounds, you will feel it straight away. The core block gains the side plank.',
    ),
    basePoints: 100,
    tags: ['hinge', 'core', 'unilateral', 'balance'],
    blocks: [
      warmupHingeCore(),
      {
        id: 'st_hinge_core_3',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. В тяге на одной ноге можно касаться стула пальцами для равновесия — но не опираться.',
          'Three sets, 60 seconds of rest. In the single-leg deadlift you may touch the chair with your fingertips for balance — but not lean on it.',
        ),
        items: [
          {
            exerciseId: 'single_leg_rdl',
            reps: 6,
            perSide: true,
            note: l(
              'Без веса. Спина прямая, колено опорной ноги мягкое, таз не разворачивается',
              'No weight. Back flat, a soft knee on the standing leg, hips stay square',
            ),
          },
          {
            exerciseId: 'glute_bridge',
            reps: 15,
            note: l('Пауза 2 секунды наверху', 'Hold 2 seconds at the top'),
          },
          { exerciseId: 'superman', reps: 12 },
        ],
      },
      {
        id: 'core_hinge_core_3',
        type: 'core',
        format: 'circuit',
        sets: 2,
        restBetweenRoundsSec: 30,
        title: l('Кор', 'Core'),
        description: l(
          'Два круга. Боковая планка — новое упражнение: таз не проваливается, тело в одной линии.',
          'Two rounds. The side plank is new: hips do not drop, body in one line.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 30 },
          {
            exerciseId: 'side_plank',
            seconds: 15,
            perSide: true,
            note: l(
              'Тяжело — поставь нижнее колено на пол',
              'Too hard? Put the bottom knee on the floor',
            ),
          },
          { exerciseId: 'dead_bug', reps: 12 },
        ],
      },
      cooldownHingeCore(),
    ],
  },
  {
    id: 'w_benchmark_four_rounds',
    name: l('Бенчмарк: четыре круга', 'Benchmark: four rounds'),
    focus: l('Первый бенчмарк на время', 'Your first benchmark for time'),
    description: l(
      'Твой первый кроссфит-бенчмарк: четыре круга из полубёрпи, отжиманий с колен, приседаний и ситапов на время. Это не просто тренировка, а точка отсчёта: повтори её через месяц-два и увидишь прогресс в секундах.',
      'Your first CrossFit benchmark: four rounds of half burpees, knee push-ups, squats and sit-ups against the clock. It is more than a workout — it is a reference point. Repeat it in a month or two and see your progress in seconds.',
    ),
    basePoints: 150,
    tags: ['benchmark', 'fortime', 'conditioning', 'full_body'],
    blocks: [
      warmupConditioning(),
      {
        id: 'mc_benchmark_four_rounds',
        type: 'metcon',
        format: 'fortime',
        rounds: 4,
        durationSec: 720,
        title: l('4 круга на время', '4 rounds for time'),
        description: l(
          'Засеки время. Четыре круга как можно быстрее, лимит 12 минут. Отдыхай, когда нужно, но не бросай. Запиши результат — ты его ещё побьёшь.',
          'Start the clock. Four rounds as fast as you can, 12-minute cap. Rest when you need to, but do not quit. Note the time — you will beat it later.',
        ),
        items: [
          {
            exerciseId: 'half_burpee',
            reps: 5,
            note: l('Шагом назад и вперёд, без прыжка', 'Step back and forward, no jump'),
          },
          { exerciseId: 'knee_push_up', reps: 8 },
          { exerciseId: 'air_squat', reps: 12 },
          { exerciseId: 'sit_up', reps: 15 },
        ],
      },
      cooldownConditioning(),
    ],
  },

  /* --- Week 4 --------------------------------------------------------------------------- */
  {
    id: 'w_squat_push_4',
    name: l('Присед и жим: пик', 'Squat & press: peak'),
    focus: l('Пиковая неделя: подходы и AMRAP 8', 'Peak week: sets and AMRAP 8'),
    description: l(
      'Последний день приседа и жима. Пятнадцать приседаний в подходе и десять отжиманий с колен — в полтора раза больше, чем в первую неделю. Финальный AMRAP на восемь минут: держи технику до последней секунды.',
      'The final squat & press day. Fifteen squats per set and ten knee push-ups — one and a half times week one. The closing AMRAP is eight minutes: keep the technique to the last second.',
    ),
    basePoints: 100,
    tags: ['squat', 'push', 'amrap', 'peak'],
    blocks: [
      warmupSquatPush(),
      {
        id: 'st_squat_push_4',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Два упражнения — зато с полным вниманием к каждому повторению.',
          'Three sets, 60 seconds of rest. Only two exercises — but full attention on every rep.',
        ),
        items: [
          {
            exerciseId: 'air_squat',
            reps: 15,
            note: l('Две секунды вниз, быстро вверх', 'Two seconds down, fast up'),
          },
          {
            exerciseId: 'knee_push_up',
            reps: 10,
            note: l(
              'Если можешь — последние 1–2 повторения в подходе сделай с носков',
              'If you can, do the last 1–2 reps of each set from the toes',
            ),
          },
        ],
      },
      {
        id: 'mc_amrap8_squat_push',
        type: 'metcon',
        format: 'amrap',
        durationSec: 480,
        title: l('AMRAP 8 мин', 'AMRAP 8 min'),
        description: l(
          'Максимум кругов за 8 минут. Стартуй чуть медленнее, чем хочется, — на седьмой минуте скажешь себе спасибо.',
          'As many rounds as possible in 8 minutes. Start a little slower than you want to — you will thank yourself in minute seven.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 8 },
          { exerciseId: 'knee_push_up', reps: 5 },
          {
            exerciseId: 'reverse_lunge',
            reps: 8,
            note: l('По 4 на каждую ногу', '4 per leg'),
          },
          { exerciseId: 'sit_up', reps: 10 },
        ],
      },
      cooldownSquatPush(),
    ],
  },
  {
    id: 'w_hinge_core_4',
    name: l('Наклон и корпус: сила', 'Hinge & core: strength'),
    focus: l('Сила на одной ноге и планки', 'Single-leg strength and planks'),
    description: l(
      'Финальный день наклона: румынская тяга и мостик на одной ноге, затем три круга планок и супермена. Нагрузка на корпус здесь выше, чем за весь курс, — это подготовка к планке на максимум в повторном тесте.',
      'The final hinge day: single-leg Romanian deadlifts and single-leg bridges, then three rounds of planks and supermans. The core load is the highest of the course — it is the set-up for the max plank in your retest.',
    ),
    basePoints: 100,
    tags: ['hinge', 'core', 'unilateral', 'peak'],
    blocks: [
      warmupHingeCore(),
      {
        id: 'st_hinge_core_4',
        type: 'strength',
        format: 'sets',
        sets: 3,
        restBetweenSetsSec: 60,
        title: l('Сила', 'Strength'),
        description: l(
          'Три подхода, отдых 60 секунд. Оба упражнения — на одной ноге: медленно, под контролем, без раскачки.',
          'Three sets, 60 seconds of rest. Both exercises are single-leg: slow, controlled, no swinging.',
        ),
        items: [
          {
            exerciseId: 'single_leg_rdl',
            reps: 8,
            perSide: true,
            note: l(
              'Без веса. Наклон до лёгкого натяжения сзади бедра',
              'No weight. Hinge until you feel a light stretch in the hamstring',
            ),
          },
          {
            exerciseId: 'single_leg_glute_bridge',
            reps: 8,
            perSide: true,
            note: l(
              'Свободная нога прямая или прижата к груди. Таз не заваливается',
              'Free leg straight or pulled to the chest. Hips stay level',
            ),
          },
        ],
      },
      {
        id: 'core_hinge_core_4',
        type: 'core',
        format: 'circuit',
        sets: 3,
        restBetweenRoundsSec: 30,
        title: l('Кор: 3 круга', 'Core: 3 rounds'),
        description: l(
          'Три круга. Самый большой объём на корпус за курс — держи планку, пока техника чистая, и не задерживай дыхание.',
          'Three rounds. The biggest core volume of the course — hold the plank only while your form is clean, and do not hold your breath.',
        ),
        items: [
          { exerciseId: 'plank', seconds: 30 },
          { exerciseId: 'side_plank', seconds: 15, perSide: true },
          { exerciseId: 'superman', reps: 10 },
        ],
      },
      cooldownHingeCore(),
    ],
  },
  {
    id: 'w_emom_12',
    name: l('EMOM 12: чисто и быстро', 'EMOM 12: clean and quick'),
    focus: l('EMOM: темп и чистые повторения', 'EMOM: pacing and clean reps'),
    description: l(
      'Последняя тренировка на выносливость — и первое знакомство с EMOM. Работа по минутам учит распределять силы: чем быстрее сделал, тем дольше отдыхаешь. Нагрузка умеренная — чтобы через два дня выйти на повторный тест свежим.',
      'The last conditioning session — and your first EMOM. Working by the minute teaches pacing: the faster you finish, the longer you rest. The load is moderate on purpose, so you come into the retest two days later feeling fresh.',
    ),
    basePoints: 100,
    tags: ['conditioning', 'emom', 'beginner'],
    blocks: [
      warmupConditioning(),
      {
        id: 'mc_emom_12',
        type: 'metcon',
        format: 'emom',
        rounds: 12,
        title: l('EMOM 12 мин', 'EMOM 12 min'),
        description: l(
          'Каждую минуту — новое упражнение. Сделал — отдыхай до конца минуты. Четыре упражнения по кругу, три круга. Если не успеваешь за 40 секунд, в следующем круге сделай меньше повторений.',
          'A new exercise every minute. Finish it, then rest until the minute ends. Four exercises in a loop, three loops. If a set takes longer than 40 seconds, do fewer reps in the next loop.',
        ),
        items: [
          { exerciseId: 'air_squat', reps: 12 },
          {
            exerciseId: 'jumping_jack',
            reps: 20,
            note: l(
              'Не хочешь прыгать — шагай в стороны поочерёдно',
              'Do not want to jump? Step out to alternate sides instead',
            ),
          },
          { exerciseId: 'sit_up', reps: 12 },
          { exerciseId: 'plank', seconds: 30 },
        ],
      },
      cooldownConditioning(),
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
  {
    id: 'w1_d3_squat_push',
    week: 1,
    day: 3,
    kind: 'workout',
    workoutId: 'w_squat_push_1',
    title: l('Присед и жим', 'Squat & press'),
    subtitle: l('3 подхода, техника', '3 sets, technique'),
  },
  restNode(1, 4, REST_SORENESS),
  {
    id: 'w1_d5_hinge_core',
    week: 1,
    day: 5,
    kind: 'workout',
    workoutId: 'w_hinge_core_1',
    title: l('Наклон и корпус', 'Hinge & core'),
    subtitle: l('3 подхода + круг на кор', '3 sets + core circuit'),
  },
  restNode(1, 7, REST_WEEKEND),

  /* Week 2 */
  {
    id: 'w2_d1_squat_push',
    week: 2,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_2',
    title: l('Присед и жим', 'Squat & press'),
    subtitle: l('3 подхода, больше объёма', '3 sets, more volume'),
  },
  restNode(2, 2, REST_RECOVERY),
  {
    id: 'w2_d3_hinge_core',
    week: 2,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_2',
    title: l('Наклон и корпус', 'Hinge & core'),
    subtitle: l('3 подхода, больше объёма', '3 sets, more volume'),
  },
  restNode(2, 4, REST_STEPS),
  {
    id: 'w2_d5_circuit',
    week: 2,
    day: 5,
    kind: 'workout',
    workoutId: 'w_circuit_no_jump',
    title: l('Круговая без прыжков', 'No-jump circuit'),
    subtitle: l('3 круга', '3 rounds'),
  },
  restNode(2, 7, REST_WEEKEND),

  /* Week 3 */
  {
    id: 'w3_d1_squat_push',
    week: 3,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_3',
    title: l('Присед и жим', 'Squat & press'),
    subtitle: l('Подходы + AMRAP 6 мин', 'Sets + AMRAP 6 min'),
  },
  restNode(3, 2, REST_SORENESS),
  {
    id: 'w3_d3_hinge_core',
    week: 3,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_3',
    title: l('Наклон и корпус', 'Hinge & core'),
    subtitle: l('Баланс на одной ноге', 'Single-leg balance'),
  },
  restNode(3, 4, REST_RECOVERY),
  {
    id: 'w3_d5_benchmark',
    week: 3,
    day: 5,
    kind: 'benchmark',
    workoutId: 'w_benchmark_four_rounds',
    title: l('Бенчмарк', 'Benchmark'),
    subtitle: l('4 круга на время, лимит 12 мин', '4 rounds for time, 12-min cap'),
  },
  restNode(3, 7, REST_WEEKEND),

  /* Week 4 */
  {
    id: 'w4_d1_squat_push',
    week: 4,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_4',
    title: l('Присед и жим', 'Squat & press'),
    subtitle: l('Подходы + AMRAP 8 мин', 'Sets + AMRAP 8 min'),
  },
  restNode(4, 2, REST_STEPS),
  {
    id: 'w4_d3_hinge_core',
    week: 4,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_4',
    title: l('Наклон и корпус', 'Hinge & core'),
    subtitle: l('Сила и планки', 'Strength & planks'),
  },
  restNode(4, 4, REST_SORENESS),
  {
    id: 'w4_d5_emom',
    week: 4,
    day: 5,
    kind: 'workout',
    workoutId: 'w_emom_12',
    title: l('EMOM 12', 'EMOM 12'),
    subtitle: l('Каждую минуту — новое упражнение', 'A new move every minute'),
  },
  restNode(4, 6, REST_BEFORE_TEST),
  {
    id: 'w4_d7_retest',
    week: 4,
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
    'Первые четыре недели: техника, короткие круги и ноль оборудования.',
    'Your first four weeks: technique, short circuits and zero equipment.',
  ),
  description: l(
    'Программа для тех, кто начинает с нуля или возвращается после долгого перерыва. Три короткие тренировки в неделю: присед, наклон, отжимания и планка — без прыжков в первые две недели, нагрузка подстраивается под тебя.',
    'A program for complete beginners and anyone coming back after a long break. Three short sessions a week: squat, hinge, push-ups and plank — no jumping in the first two weeks, and the load adapts to you.',
  ),
  longDescription: [
    l(
      '«Старт» — это четыре недели, за которые ты научишься главному: правильно приседать, наклоняться, отжиматься и держать планку. Именно эти четыре движения лежат в основе любого кроссфита — и любой другой силовой тренировки. Мы не гонимся за потом и одышкой в первый же день: сначала техника, потом объём и только потом темп.',
      'Start is four weeks to learn what matters most: how to squat, hinge, push and hold a plank properly. Those four movements sit underneath every CrossFit workout — and every other kind of strength training. We do not chase sweat and gasping on day one: technique first, then volume, then pace.',
    ),
    l(
      'Каждая неделя построена одинаково: день приседа и жима, день наклона и корпуса, день выносливости. Между ними — дни отдыха с целью 7000 шагов: мышцы восстанавливаются лучше, когда ты двигаешься, а не лежишь. В первые две недели прыжков нет вообще, дальше они появляются в мягком варианте и всегда с заменой на шаг.',
      'Every week follows the same shape: a squat & press day, a hinge & core day and a conditioning day. In between are rest days with a 7,000-step goal — muscles recover better when you move than when you lie still. There is no jumping at all in the first two weeks; later it appears in a gentle form, always with a step-based option.',
    ),
    l(
      'Тренировки короткие — около 20–25 минут вместе с разминкой и заминкой. Из инвентаря нужны только коврик и устойчивый стул: от него ты будешь отжиматься и на него зашагивать. Приложение считает, сколько повторений тебе делать сегодня, по результатам прошлой тренировки — было тяжело, легко или в самый раз.',
      'Sessions are short — about 20–25 minutes including warm-up and cool-down. The only gear you need is a mat and a sturdy chair: you will do incline push-ups off it and step-ups onto it. The app works out how many reps you should do today from how your last session went — too hard, too easy or just right.',
    ),
    l(
      'В начале и в конце курса — один и тот же тест: отжимания с колен за 2 минуты, приседания за минуту и планка на максимум. Сравнишь цифры и увидишь, что изменилось за месяц. А в третью неделю ждёт первый бенчмарк — четыре круга на время, которые потом можно повторять и бить свой результат.',
      'The course opens and closes with the same test: knee push-ups in 2 minutes, squats in 1 minute and a max plank hold. Compare the numbers and see what a month changed. And in week three comes your first benchmark — four rounds for time you can repeat later and beat.',
    ),
  ],
  forWhom: [
    l(
      'Ты начинаешь с нуля или возвращаешься после долгого перерыва — год и больше.',
      'You are starting from zero or coming back after a long break — a year or more.',
    ),
    l(
      'Хочешь научиться приседать и отжиматься правильно, прежде чем брать гантели или гирю.',
      'You want to learn to squat and push up properly before picking up dumbbells or a kettlebell.',
    ),
    l(
      'Нет инвентаря и места: только коврик, стул и два квадратных метра.',
      'You have no gear and little space: a mat, a chair and two square metres.',
    ),
    l(
      'Не любишь прыжки или бережёшь колени и соседей снизу.',
      'You do not like jumping — or you are protecting your knees (and your downstairs neighbours).',
    ),
    l('Есть 20–25 минут три раза в неделю.', 'You can find 20–25 minutes three times a week.'),
  ],
  outcomes: [
    l(
      'Уверенная техника четырёх базовых движений: присед, наклон, отжимание, планка.',
      'Confident technique in the four base movements: squat, hinge, push-up, plank.',
    ),
    l(
      'Прогресс от отжиманий с опоры к отжиманиям с колен — и, возможно, к первому полному.',
      'Progress from incline to knee push-ups — and maybe your first full push-up.',
    ),
    l(
      'Привычка тренироваться три раза в неделю и ходить в дни отдыха.',
      'A habit of training three times a week and walking on rest days.',
    ),
    l(
      'Знакомство с форматами кроссфита: подходы, круговая, AMRAP, EMOM и «на время».',
      'A working knowledge of CrossFit formats: sets, circuits, AMRAP, EMOM and for-time.',
    ),
    l(
      'Твои личные цифры: результаты теста в начале и в конце и время первого бенчмарка.',
      'Your own numbers: test results at the start and the end, plus your first benchmark time.',
    ),
    l(
      'Готовность перейти к курсу «Своим весом» или к тренировкам с гантелями.',
      'Readiness to move on to the Bodyweight Engine course or to dumbbell training.',
    ),
  ],
  equipment: ['none', 'mat', 'chair'],
  level: 1,
  weeks: 4,
  sessionsPerWeek: 3,
  avgSessionMin: 22,
  accent: '#B9F3E0',
  gradient: ['#B9F3E0', '#C9D6FF'],
  price: { rub: 2990, usd: 29 },
  workouts: WORKOUTS,
  nodes: NODES,
  faq: [
    {
      q: l('Что нужно из оборудования?', 'What equipment do I need?'),
      a: l(
        'Коврик и устойчивый стул без колёсиков — от него ты будешь отжиматься и на него зашагивать. Если стула нет, отжимайся от дивана или подоконника, а зашагивания замени на приседания или обратные выпады.',
        'A mat and a sturdy chair without wheels — you will do incline push-ups off it and step-ups onto it. No chair? Use a sofa or a windowsill for push-ups and swap step-ups for squats or reverse lunges.',
      ),
    },
    {
      q: l('Я совсем не в форме. Точно получится?', 'I am completely out of shape. Will I cope?'),
      a: l(
        'Курс написан именно для этого. В первую неделю — только техника и небольшой объём, прыжков нет вообще. Приложение подбирает количество повторений по твоему тесту, а после каждой тренировки спрашивает, как было, и корректирует следующую. Если тяжело — выбирай режим «Полегче»: это не поражение, а часть плана.',
        'That is exactly who this course is for. Week one is technique and modest volume with no jumping at all. The app sets your rep counts from your test, then asks how each session felt and adjusts the next one. If it is hard, pick "Easier" — that is not failure, it is part of the plan.',
      ),
    },
    {
      q: l('Сколько времени занимает тренировка?', 'How long is a session?'),
      a: l(
        'В среднем около 22 минут вместе с разминкой и заминкой. Самые короткие — тест и EMOM, самые длинные — дни с AMRAP и круговая, около 25 минут. Перед стартом приложение показывает расчётное время для каждого режима сложности.',
        'About 22 minutes on average including warm-up and cool-down. The test and the EMOM are the shortest; AMRAP and circuit days are the longest at around 25 minutes. Before you start, the app shows the estimated time for each difficulty option.',
      ),
    },
    {
      q: l('Пропустил тренировку — что делать?', 'I missed a session — what now?'),
      a: l(
        'Ничего страшного: сделай её на следующий день и сдвинь остальные. Не пытайся нагнать две за один день — у новичков это заканчивается крепатурой и пропуском ещё одной недели. Если пропустил больше недели, вернись на одну тренировку назад.',
        'No drama: do it the next day and shift the rest. Do not try to squeeze two into one day — for beginners that ends in soreness and another week off. If you missed more than a week, go back one session.',
      ),
    },
    {
      q: l('Мышцы болят после тренировки. Это нормально?', 'My muscles are sore. Is that normal?'),
      a: l(
        'Лёгкая боль на второй день после новой нагрузки — норма, особенно в первые две недели. Помогают прогулка, вода и сон. Если боль острая, в суставе или не проходит три дня — отдохни и при необходимости покажись врачу. В отзыве о тренировке отметь «Боль»: приложение снизит нагрузку.',
        'Mild soreness a day or two after a new load is normal, especially in the first two weeks. Walking, water and sleep help. If the pain is sharp, in a joint, or lasts more than three days, rest and see a professional if needed. Mark "Pain" in the session feedback: the app will reduce the load.',
      ),
    },
    {
      q: l('Как приложение подбирает нагрузку?', 'How does the app scale the load?'),
      a: l(
        'После входного теста ты получаешь индекс формы и стартовый коэффициент объёма. Дальше после каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и отмечаешь самочувствие: было легко и всё выполнено — в следующий раз чуть больше, было тяжело — чуть меньше. Упражнения, которые пока не по силам, автоматически заменяются более простыми версиями.',
        'After the baseline test you get a fitness index and a starting volume multiplier. Then after every session you rate the effort from 1 to 10 and say how you feel: easy and fully completed — a little more next time, hard — a little less. Exercises you cannot do yet are automatically replaced with simpler versions.',
      ),
    },
  ],
};
