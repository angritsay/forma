/**
 * Course "engine" — «Своим весом: сила и выносливость» / "Bodyweight Engine".
 *
 * Six weeks, four sessions a week, level 2, no equipment beyond a chair, a mat and an
 * optional jump rope (the engine substitutes single-unders with jumping jacks when the
 * athlete has no rope).
 *
 * Weekly skeleton (D = day of week):
 *   D1 squat & push · D2 rest · D3 hinge & core · D4 engine (AMRAP/EMOM/Tabata) ·
 *   D5 rest · D6 full-body chipper / benchmark · D7 rest
 * Week 1 opens with the baseline test, week 3 ends with 100 burpees for time, week 4 is a
 * deload (volume ×0.65 by the engine), week 6 holds the Cindy-style AMRAP and the retest.
 *
 * Numbers are authored for a level-2 athlete at scale 1.0; the training engine scales
 * every block marked `scalable` by the athlete's course scale and difficulty choice.
 *
 * Engine facts this file relies on: a `fortime` block takes its round count from `sets`
 * (omitted = one pass); an `emom` block rotates its items minute by minute (four items over
 * 12 minutes = three cycles); a `tabata` block runs all `rounds` of item 1, then item 2, so
 * two items × 4 rounds = the eight 20/10 intervals of one four-minute Tabata.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type ItemInput = BlockInput['items'][number];
type NodeInput = CourseInput['nodes'][number];

/* ------------------------------------------------------------------------------------ */
/* Shared building blocks                                                                */
/* ------------------------------------------------------------------------------------ */

function warmup(id: string, items: ItemInput[]): BlockInput {
  return {
    id,
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    title: { ru: 'Разминка', en: 'Warm-up' },
    description: {
      ru: 'Два круга в спокойном темпе. Цель — разогреться и прожить амплитуду, а не устать.',
      en: 'Two easy rounds. The goal is to get warm and move through full range, not to get tired.',
    },
    items,
  };
}

const STRETCHES: ItemInput[] = [
  { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
  { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
  { exerciseId: 'child_pose', seconds: 45 },
];

function cooldown(id: string, items: ItemInput[] = STRETCHES): BlockInput {
  return {
    id,
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    title: { ru: 'Заминка', en: 'Cool-down' },
    description: {
      ru: 'Дыши медленно, тянись без рывков. Пульс должен опуститься до разговорного.',
      en: 'Breathe slowly, stretch without bouncing. Let your heart rate come down to a talking pace.',
    },
    items,
  };
}

const REST_TITLE: L10n = { ru: 'Отдых и прогулка', en: 'Rest & walk' };

function rest(week: number, day: number, subtitle: L10n): NodeInput {
  return {
    id: `w${week}d${day}_rest`,
    week,
    day,
    kind: 'rest',
    stepsGoal: 7000,
    title: REST_TITLE,
    subtitle,
  };
}

const REST_DEFAULT: L10n = {
  ru: '7000 шагов и лёгкая растяжка: мышцы восстанавливаются в дни отдыха, а не на тренировке.',
  en: '7,000 steps and light stretching: muscles recover on rest days, not during the workout.',
};
const REST_SLEEP: L10n = {
  ru: 'Прогулка 40–60 минут. Сон 7–8 часов сделает для прогресса больше, чем лишняя тренировка.',
  en: 'A 40–60 minute walk. Seven to eight hours of sleep does more for progress than an extra session.',
};
const REST_STREAK: L10n = {
  ru: 'Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.',
  en: 'Walk 7,000 steps and log them in the app — the day counts toward your streak.',
};
const REST_SORE: L10n = {
  ru: 'Лёгкая крепатура — норма. Прогулка разгонит кровь и облегчит её быстрее, чем диван.',
  en: 'Mild soreness is normal. A walk gets the blood moving and eases it faster than the couch.',
};
const REST_BEFORE_BENCHMARK: L10n = {
  ru: 'Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы.',
  en: 'Benchmark tomorrow: steps, water, an early night. No "extra" work today.',
};
const REST_DELOAD: L10n = {
  ru: 'Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.',
  en: 'Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks.',
};
const REST_BEFORE_TEST: L10n = {
  ru: 'Перед тестом — только прогулка. Завтра ты сравнишь цифры с первым днём.',
  en: 'Only a walk before the test. Tomorrow you compare your numbers with day one.',
};

/* ------------------------------------------------------------------------------------ */
/* Workouts                                                                              */
/* ------------------------------------------------------------------------------------ */

const W_TEST: WorkoutInput = {
  id: 'w_test',
  name: {
    ru: 'Тест: отжимания, присед, планка, бёрпи',
    en: 'Test: push-ups, squats, plank, burpees',
  },
  focus: { ru: 'Точка отсчёта', en: 'Baseline' },
  description: {
    ru: 'Четыре коротких теста с отдыхом по полторы минуты. Работай честно: результат определяет стартовый объём всех тренировок, а в конце курса ты повторишь тест и сравнишь цифры.',
    en: 'Four short tests with 90 seconds of rest between them. Be honest with yourself: the result sets your starting volume for every session, and at the end of the course you repeat the test and compare the numbers.',
  },
  basePoints: 80,
  tags: ['test'],
  blocks: [
    warmup('test_warmup', [
      { exerciseId: 'jog_in_place', seconds: 60 },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'test_main',
      type: 'test',
      format: 'sets',
      sets: 1,
      scalable: false,
      title: { ru: 'Тест', en: 'Test' },
      description: {
        ru: 'Максимум повторений за отведённое время. Останавливайся, как только ломается техника — засчитываются только чистые повторения.',
        en: 'Max reps in the given time. Stop as soon as your form breaks — only clean reps count.',
      },
      items: [
        {
          exerciseId: 'push_up',
          seconds: 120,
          restAfterSec: 90,
          note: {
            ru: 'Максимум за 2 минуты. Отдыхать можно в верхней точке.',
            en: 'Max reps in 2 minutes. Rest at the top if you need to.',
          },
        },
        {
          exerciseId: 'air_squat',
          seconds: 60,
          restAfterSec: 90,
          note: {
            ru: 'Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.',
            en: 'Max reps in one minute. Hips below parallel, full extension at the top.',
          },
        },
        {
          exerciseId: 'plank',
          seconds: 300,
          restAfterSec: 90,
          note: {
            ru: 'Держи, пока не провиснет поясница. Лимит — 5 минут.',
            en: 'Hold until your lower back starts to sag. Five-minute limit.',
          },
        },
        {
          exerciseId: 'burpee',
          seconds: 60,
          restAfterSec: 90,
          note: {
            ru: 'Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.',
            en: 'Max reps in one minute: chest to the floor, jump and clap at the top.',
          },
        },
      ],
    },
    cooldown('test_cooldown'),
  ],
};

const W_SQUAT_PUSH_A: WorkoutInput = {
  id: 'w_squat_push_a',
  name: { ru: 'Присед и жим A', en: 'Squat & push A' },
  focus: { ru: 'Ноги и жим: база', en: 'Legs and push: the base' },
  description: {
    ru: 'Три подхода классической связки: присед, отжимания, обратные выпады и отжимания уголком. Темп спокойный, техника важнее скорости — эти движения ты будешь усложнять весь курс. В конце короткий блок на кор.',
    en: 'Three sets of the classic combo: air squats, push-ups, reverse lunges and pike push-ups. Steady tempo, form over speed — you will be building on these movements for the whole course. A short core block to finish.',
  },
  basePoints: 100,
  tags: ['strength', 'squat', 'push'],
  blocks: [
    warmup('spa_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'arm_circles', seconds: 30 },
    ]),
    {
      id: 'spa_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 75,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Три подхода. Каждое повторение — две секунды вниз, секунда вверх. Между упражнениями 20 секунд, между подходами — 75.',
        en: 'Three sets. Two seconds down, one second up on every rep. Twenty seconds between exercises, 75 between sets.',
      },
      items: [
        { exerciseId: 'air_squat', reps: 15, restAfterSec: 20 },
        { exerciseId: 'push_up', reps: 10, restAfterSec: 20 },
        { exerciseId: 'reverse_lunge', reps: 12, restAfterSec: 20 },
        { exerciseId: 'pike_push_up', reps: 8 },
      ],
    },
    {
      id: 'spa_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'plank', seconds: 40 },
        { exerciseId: 'plank_shoulder_tap', reps: 16 },
      ],
    },
    cooldown('spa_cooldown'),
  ],
};

const W_SQUAT_PUSH_B: WorkoutInput = {
  id: 'w_squat_push_b',
  name: { ru: 'Присед и жим B', en: 'Squat & push B' },
  focus: { ru: 'Прыжок и жим: больше объёма', en: 'Jump and push: more volume' },
  description: {
    ru: 'Четыре подхода. Присед становится прыжковым, отжиманий больше, добавляются боковые выпады. Между подходами отдыхай полные 75 секунд — прыжки требуют свежих ног. Кор: лодочка и касания плеч.',
    en: 'Four sets. The squat becomes a jump squat, there are more push-ups, and lateral lunges join in. Rest the full 75 seconds between sets — jumps need fresh legs. Core: hollow hold and shoulder taps.',
  },
  basePoints: 110,
  tags: ['strength', 'squat', 'push', 'jump'],
  blocks: [
    warmup('spb_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
    ]),
    {
      id: 'spb_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Четыре подхода. В прыжковом приседе приземляйся мягко, на всю стопу, и сразу уходи в следующий присед.',
        en: 'Four sets. Land the jump squat softly on the whole foot and sink straight into the next rep.',
      },
      items: [
        { exerciseId: 'jump_squat', reps: 10, restAfterSec: 20 },
        { exerciseId: 'push_up', reps: 12, restAfterSec: 20 },
        { exerciseId: 'lateral_lunge', reps: 12, restAfterSec: 20 },
        { exerciseId: 'pike_push_up', reps: 10 },
      ],
    },
    {
      id: 'spb_core',
      type: 'core',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cooldown('spb_cooldown'),
  ],
};

const W_SQUAT_PUSH_C: WorkoutInput = {
  id: 'w_squat_push_c',
  name: { ru: 'Присед и жим C', en: 'Squat & push C' },
  focus: { ru: 'Пик силы ног и жима', en: 'Peak legs and push' },
  description: {
    ru: 'Самый плотный силовой день курса: четыре подхода прыжковых приседаний, узких отжиманий, выпадов и отжиманий уголком, а в конце каждого подхода — стульчик у стены. Если узкие отжимания пока не идут, делай обычные с паузой внизу.',
    en: 'The densest strength day of the course: four sets of jump squats, diamond push-ups, lunges and pike push-ups, with a wall sit at the end of every set. If diamond push-ups are not there yet, do regular push-ups with a pause at the bottom.',
  },
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'jump'],
  blocks: [
    warmup('spc_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'spc_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Четыре подхода, стульчик в конце каждого. Держи дыхание ровным в стульчике — это тренировка терпения.',
        en: 'Four sets with a wall sit closing each one. Keep breathing evenly in the wall sit — it is patience training.',
      },
      items: [
        { exerciseId: 'jump_squat', reps: 12, restAfterSec: 20 },
        {
          exerciseId: 'diamond_push_up',
          reps: 8,
          restAfterSec: 20,
          note: {
            ru: 'Не идут узкие — обычные отжимания с паузой в одну секунду внизу.',
            en: 'If diamonds are too hard, do regular push-ups with a one-second pause at the bottom.',
          },
        },
        { exerciseId: 'reverse_lunge', reps: 16, restAfterSec: 20 },
        { exerciseId: 'pike_push_up', reps: 12, restAfterSec: 20 },
        { exerciseId: 'wall_sit', seconds: 30 },
      ],
    },
    {
      id: 'spc_core',
      type: 'core',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'hollow_hold', seconds: 40 },
        {
          exerciseId: 'v_up',
          reps: 10,
          note: {
            ru: 'Складка не получается — делай ситапы с прямыми руками над головой.',
            en: 'If V-ups are not happening, do sit-ups with straight arms overhead.',
          },
        },
      ],
    },
    cooldown('spc_cooldown'),
  ],
};

const W_HINGE_CORE_A: WorkoutInput = {
  id: 'w_hinge_core_a',
  name: { ru: 'Тяга и кор A', en: 'Hinge & core A' },
  focus: { ru: 'Задняя поверхность и стабильный корпус', en: 'Posterior chain and a stable trunk' },
  description: {
    ru: 'День без прыжков и отжиманий: ягодичный мостик, румынская тяга на одной ноге, супермен и зашагивания на стул — всё, что делает спину и ягодицы сильными. Потом три круга на кор: мёртвый жук, планка, боковая планка.',
    en: 'No jumps and no push-ups today: glute bridges, single-leg Romanian deadlifts, supermans and step-ups onto a chair — everything that makes your back and glutes strong. Then three rounds of core: dead bugs, plank, side plank.',
  },
  basePoints: 100,
  tags: ['strength', 'hinge', 'core'],
  blocks: [
    warmup('hca_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'bird_dog', reps: 10 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'hca_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Три подхода. В мостике сжимай ягодицы наверху на секунду, в тяге на одной ноге спина прямая, а колено опорной ноги чуть согнуто.',
        en: 'Three sets. Squeeze the glutes for a second at the top of the bridge; in the single-leg deadlift keep the back flat and a soft knee on the standing leg.',
      },
      items: [
        { exerciseId: 'glute_bridge', reps: 15, restAfterSec: 15 },
        { exerciseId: 'single_leg_rdl', reps: 8, perSide: true, restAfterSec: 15 },
        { exerciseId: 'superman', reps: 12, restAfterSec: 15 },
        { exerciseId: 'step_up', reps: 10, perSide: true },
      ],
    },
    {
      id: 'hca_core',
      type: 'core',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      description: {
        ru: 'Три круга. Поясница прижата к полу в жуке, таз не проваливается в планках.',
        en: 'Three rounds. Lower back pressed into the floor in the dead bug, hips level in both planks.',
      },
      items: [
        { exerciseId: 'dead_bug', reps: 12 },
        { exerciseId: 'plank', seconds: 40 },
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
      ],
    },
    cooldown('hca_cooldown', [
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ]),
  ],
};

const W_HINGE_CORE_B: WorkoutInput = {
  id: 'w_hinge_core_b',
  name: { ru: 'Тяга и кор B', en: 'Hinge & core B' },
  focus: { ru: 'Одна нога и антиротация', en: 'Single-leg work and anti-rotation' },
  description: {
    ru: 'Мостик переходит на одну ногу, тяга и зашагивания — с большим числом повторений. В блоке на кор появляются лодочка, подъёмы ног и русский твист. Двигайся медленно: две секунды вверх, две вниз.',
    en: 'The bridge moves to one leg, the deadlift and step-ups get more reps. The core block adds the hollow hold, leg raises and Russian twists. Move slowly: two seconds up, two seconds down.',
  },
  basePoints: 110,
  tags: ['strength', 'hinge', 'core', 'unilateral'],
  blocks: [
    warmup('hcb_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'bird_dog', reps: 10 },
      { exerciseId: 'worlds_greatest_stretch', reps: 3, perSide: true },
      { exerciseId: 'jog_in_place', seconds: 45 },
    ]),
    {
      id: 'hcb_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Три подхода, как и раньше, но мостик переехал на одну ногу, а повторений на ногу стало больше. Слабую ногу делай первой — так ты не «добьёшь» её уставшим.',
        en: 'Three sets as before, but the bridge has moved to one leg and there are more reps per leg. Start each unilateral move with your weaker leg so you never do it tired.',
      },
      items: [
        { exerciseId: 'single_leg_glute_bridge', reps: 10, perSide: true, restAfterSec: 15 },
        { exerciseId: 'single_leg_rdl', reps: 10, perSide: true, restAfterSec: 15 },
        { exerciseId: 'superman', reps: 15, restAfterSec: 15 },
        { exerciseId: 'step_up', reps: 12, perSide: true },
      ],
    },
    {
      id: 'hcb_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      description: {
        ru: 'Два круга без спешки — четыре упражнения подряд, это больше работы на кор, чем кажется. В лодочке поясница вжата в пол; в твисте поворачивай грудь, а не только руки.',
        en: 'Two unhurried rounds — four exercises back to back is more core work than it looks. Lower back glued to the floor in the hollow hold; rotate the chest, not just the arms, in the twist.',
      },
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'leg_raise', reps: 12 },
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
        { exerciseId: 'russian_twist', reps: 20 },
      ],
    },
    cooldown('hcb_cooldown', [
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ]),
  ],
};

const W_HINGE_CORE_C: WorkoutInput = {
  id: 'w_hinge_core_c',
  name: { ru: 'Тяга и кор C', en: 'Hinge & core C' },
  focus: { ru: 'Пик задней поверхности', en: 'Peak posterior chain' },
  description: {
    ru: 'Самая объёмная версия дня тяги: по 12 повторений на ногу в мостике, десять в румынской тяге, двенадцать зашагиваний на сторону. Кор — 40 секунд боковой планки на каждую сторону и ножницы. После такого дня отдых заслужен.',
    en: 'The biggest version of hinge day: 12 reps per leg in the bridge, ten in the Romanian deadlift, twelve step-ups per side. Core: 40-second side planks each way and flutter kicks. You will have earned the rest day.',
  },
  basePoints: 120,
  tags: ['strength', 'hinge', 'core', 'unilateral'],
  blocks: [
    warmup('hcc_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'bird_dog', reps: 12 },
      { exerciseId: 'leg_swing', reps: 12, perSide: true },
      { exerciseId: 'inchworm', reps: 6 },
    ]),
    {
      id: 'hcc_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Три больших подхода. Если баланс в тяге уходит — коснись пальцами стула, но не опирайся на него.',
        en: 'Three big sets. If you lose balance in the deadlift, touch the chair with your fingertips — do not lean on it.',
      },
      items: [
        { exerciseId: 'single_leg_glute_bridge', reps: 12, perSide: true, restAfterSec: 15 },
        { exerciseId: 'single_leg_rdl', reps: 10, perSide: true, restAfterSec: 15 },
        { exerciseId: 'superman', reps: 15, restAfterSec: 15 },
        { exerciseId: 'step_up', reps: 12, perSide: true },
      ],
    },
    {
      id: 'hcc_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      description: {
        ru: 'Два круга из четырёх упражнений. В ножницах ноги низко над полом, но поясница не отрывается — если отрывается, подними ноги выше.',
        en: 'Two rounds of four exercises. In flutter kicks keep the legs low but the lower back down — if it lifts, raise the legs higher.',
      },
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'leg_raise', reps: 12 },
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
        { exerciseId: 'flutter_kick', seconds: 30 },
      ],
    },
    cooldown('hcc_cooldown', [
      { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ]),
  ],
};

const W_ENGINE_AMRAP10: WorkoutInput = {
  id: 'w_engine_amrap10',
  name: { ru: 'Двигатель: AMRAP 10', en: 'Engine: AMRAP 10' },
  focus: { ru: 'Аэробная база', en: 'Aerobic base' },
  description: {
    ru: 'Десять минут ровной работы: бёрпи, приседания, скалолаз и скакалка. Задача — не выложиться в первые две минуты, а найти темп, который сможешь держать все десять. Считай круги: в пятой неделе ты сделаешь пятнадцатиминутную версию.',
    en: 'Ten minutes of steady work: burpees, squats, mountain climbers and rope jumps. The goal is not to empty the tank in the first two minutes but to find a pace you can hold for all ten. Count your rounds: in week five you do a fifteen-minute version.',
  },
  basePoints: 100,
  tags: ['metcon', 'amrap', 'cardio'],
  blocks: [
    warmup('ea10_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'high_knees', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'arm_circles', seconds: 30 },
    ]),
    {
      id: 'ea10_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 600,
      title: { ru: 'AMRAP 10 минут', en: 'AMRAP 10 minutes' },
      description: {
        ru: 'Как можно больше кругов за 10 минут. Отдыхай короткими паузами по 5–10 секунд, а не одной длинной.',
        en: 'As many rounds as possible in 10 minutes. Rest in short 5–10 second breaks, not one long one.',
      },
      items: [
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'air_squat', reps: 10 },
        { exerciseId: 'mountain_climber', reps: 20 },
        {
          exerciseId: 'single_under',
          reps: 30,
          note: {
            ru: 'Нет скакалки — 30 джампинг-джеков.',
            en: 'No rope — 30 jumping jacks.',
          },
        },
      ],
    },
    {
      id: 'ea10_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'plank', seconds: 45 },
        { exerciseId: 'dead_bug', reps: 12 },
      ],
    },
    cooldown('ea10_cooldown'),
  ],
};

const W_ENGINE_EMOM12: WorkoutInput = {
  id: 'w_engine_emom12',
  name: { ru: 'Двигатель: EMOM 12', en: 'Engine: EMOM 12' },
  focus: { ru: 'Темп по минутам', en: 'Pace by the minute' },
  description: {
    ru: 'Каждую минуту — новое упражнение: бёрпи, приседания, скалолаз, скакалка, и так три круга. Сделал объём — остаток минуты отдыхаешь. Если работа занимает больше 45 секунд, в следующем круге сделай чуть меньше повторений.',
    en: 'A new exercise every minute — burpees, squats, mountain climbers, rope jumps — for three cycles. Finish the reps, rest for what is left of the minute. If the work takes more than 45 seconds, trim the reps a little on the next cycle.',
  },
  basePoints: 100,
  tags: ['metcon', 'emom', 'cardio'],
  blocks: [
    warmup('ee12_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'arm_circles', seconds: 30 },
    ]),
    {
      id: 'ee12_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 12,
      title: { ru: 'EMOM 12 минут', en: 'EMOM 12 minutes' },
      description: {
        ru: 'Каждую минуту новое упражнение из списка, по кругу. Остаток минуты — отдых.',
        en: 'A new exercise from the list every minute, cycling through. The rest of the minute is rest.',
      },
      items: [
        { exerciseId: 'burpee', reps: 8 },
        { exerciseId: 'air_squat', reps: 15 },
        { exerciseId: 'mountain_climber', reps: 24 },
        {
          exerciseId: 'single_under',
          reps: 40,
          note: {
            ru: 'Нет скакалки — 40 джампинг-джеков.',
            en: 'No rope — 40 jumping jacks.',
          },
        },
      ],
    },
    {
      id: 'ee12_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'russian_twist', reps: 20 },
      ],
    },
    cooldown('ee12_cooldown'),
  ],
};

const W_ENGINE_TABATA: WorkoutInput = {
  id: 'w_engine_tabata',
  name: { ru: 'Двигатель: табата', en: 'Engine: Tabata' },
  focus: { ru: 'Интервалы 20/10', en: '20/10 intervals' },
  description: {
    ru: 'Три табаты по четыре минуты: 20 секунд работы, 10 секунд отдыха, восемь раундов — четыре на первое упражнение, четыре на второе. Первая табата — прыжковый присед и бёрпи, вторая — отжимания и скалолаз, третья — бег с высоким коленом и конькобежец. Между табатами отдышись минуту. Число рядом с упражнением — ориентир на один 20-секундный раунд.',
    en: 'Three four-minute Tabatas: 20 seconds on, 10 seconds off, eight rounds — four on the first exercise, four on the second. The first Tabata is jump squats and burpees, the second push-ups and mountain climbers, the third high knees and skaters. Catch your breath for a minute between Tabatas. The number next to each exercise is the target for one 20-second round.',
  },
  basePoints: 100,
  tags: ['metcon', 'tabata', 'cardio'],
  blocks: [
    warmup('et_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'high_knees', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
    ]),
    {
      id: 'et_tabata_1',
      type: 'metcon',
      format: 'tabata',
      workSec: 20,
      restSec: 10,
      rounds: 4,
      title: { ru: 'Табата 1: ноги', en: 'Tabata 1: legs' },
      description: {
        ru: 'Четыре раунда прыжкового приседа, затем четыре раунда бёрпи: 20 секунд работы, 10 отдыха. Всего восемь раундов — четыре минуты.',
        en: 'Four rounds of jump squats, then four rounds of burpees: 20 seconds on, 10 off. Eight rounds in total — four minutes.',
      },
      items: [
        { exerciseId: 'jump_squat', reps: 8 },
        { exerciseId: 'burpee', reps: 4 },
      ],
    },
    {
      id: 'et_tabata_2',
      type: 'metcon',
      format: 'tabata',
      workSec: 20,
      restSec: 10,
      rounds: 4,
      title: { ru: 'Табата 2: жим и кор', en: 'Tabata 2: push and core' },
      description: {
        ru: 'Четыре раунда отжиманий, затем четыре раунда скалолаза. Перед стартом отдышись минуту после первой табаты.',
        en: 'Four rounds of push-ups, then four rounds of mountain climbers. Take a minute to catch your breath after the first Tabata before you start.',
      },
      items: [
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'mountain_climber', reps: 20 },
      ],
    },
    {
      id: 'et_tabata_3',
      type: 'metcon',
      format: 'tabata',
      workSec: 20,
      restSec: 10,
      rounds: 4,
      title: { ru: 'Табата 3: двигатель', en: 'Tabata 3: engine' },
      description: {
        ru: 'Четыре раунда бега с высоким коленом, затем четыре раунда конькобежца. Последняя табата — держи высоту колена и ширину прыжка до конца.',
        en: 'Four rounds of high knees, then four rounds of skaters. Last Tabata — keep the knees high and the jumps wide to the end.',
      },
      items: [
        { exerciseId: 'high_knees', seconds: 20 },
        { exerciseId: 'skater', reps: 12 },
      ],
    },
    cooldown('et_cooldown'),
  ],
};

const W_ENGINE_AMRAP15: WorkoutInput = {
  id: 'w_engine_amrap15',
  name: { ru: 'Двигатель: AMRAP 15', en: 'Engine: AMRAP 15' },
  focus: { ru: 'Длинный AMRAP', en: 'The long AMRAP' },
  description: {
    ru: 'Пятнадцать минут — самый длинный интервал курса перед «Синди». Пять упражнений в круге: бёрпи, прыжковые приседания, отжимания, скакалка и ситапы. Распредели силы: первые пять минут на 80 %, дальше держи темп, последние две — всё, что осталось.',
    en: 'Fifteen minutes — the longest interval of the course before Cindy. Five movements per round: burpees, jump squats, push-ups, rope jumps and sit-ups. Pace it: the first five minutes at 80%, then hold, and give whatever is left in the last two.',
  },
  basePoints: 110,
  tags: ['metcon', 'amrap', 'cardio'],
  blocks: [
    warmup('ea15_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'ea15_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 900,
      title: { ru: 'AMRAP 15 минут', en: 'AMRAP 15 minutes' },
      description: {
        ru: 'Как можно больше кругов за 15 минут. Запиши число кругов — сравнишь с AMRAP 10 из первой недели.',
        en: 'As many rounds as possible in 15 minutes. Note the rounds — compare with the AMRAP 10 from week one.',
      },
      items: [
        { exerciseId: 'burpee', reps: 8 },
        { exerciseId: 'jump_squat', reps: 10 },
        { exerciseId: 'push_up', reps: 10 },
        {
          exerciseId: 'single_under',
          reps: 40,
          note: {
            ru: 'Нет скакалки — 40 джампинг-джеков.',
            en: 'No rope — 40 jumping jacks.',
          },
        },
        { exerciseId: 'sit_up', reps: 15 },
      ],
    },
    {
      id: 'ea15_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
        { exerciseId: 'hollow_hold', seconds: 30 },
      ],
    },
    cooldown('ea15_cooldown'),
  ],
};

const W_CHIPPER_A: WorkoutInput = {
  id: 'w_chipper_a',
  name: { ru: 'Чиппер: всё тело A', en: 'Full-body chipper A' },
  focus: { ru: 'Три круга на время', en: 'Three rounds for time' },
  description: {
    ru: 'Три круга на время с лимитом 15 минут: бёрпи, приседания, отжимания, выпады, ситапы. Чиппер — это про то, чтобы «откусывать» по кусочку: разбивай большие серии на части и не останавливайся надолго. Запиши время — в пятой неделе будет четыре круга.',
    en: 'Three rounds for time with a 15-minute cap: burpees, squats, push-ups, lunges, sit-ups. A chipper is about chipping away — break big sets into chunks and never stop for long. Note your time: in week five it is four rounds.',
  },
  basePoints: 110,
  tags: ['metcon', 'fortime', 'chipper'],
  blocks: [
    warmup('cha_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
      { exerciseId: 'high_knees', seconds: 30 },
    ]),
    {
      id: 'cha_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 3,
      durationSec: 900,
      title: { ru: '3 круга на время', en: '3 rounds for time' },
      description: {
        ru: 'Лимит 15 минут. Первый круг — на 85 % от максимума, чтобы третий не развалился.',
        en: '15-minute cap. Run the first round at 85% so the third one does not fall apart.',
      },
      items: [
        { exerciseId: 'burpee', reps: 10 },
        { exerciseId: 'air_squat', reps: 20 },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'reverse_lunge', reps: 16 },
        { exerciseId: 'sit_up', reps: 15 },
      ],
    },
    cooldown('cha_cooldown', [
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
      { exerciseId: 'cat_cow', reps: 8 },
    ]),
  ],
};

const W_CHIPPER_B: WorkoutInput = {
  id: 'w_chipper_b',
  name: { ru: 'Чиппер: всё тело B', en: 'Full-body chipper B' },
  focus: { ru: 'Четыре круга на время', en: 'Four rounds for time' },
  description: {
    ru: 'Четыре круга, лимит 20 минут. К бёрпи и отжиманиям добавляются прыжковые приседания, конькобежец и касания плеч в планке. Начни чуть медленнее, чем хочется: четвёртый круг не должен быть намного медленнее первого.',
    en: 'Four rounds, 20-minute cap. Jump squats, skaters and plank shoulder taps join the burpees and push-ups. Start a little slower than you want to: the fourth round should not be much slower than the first.',
  },
  basePoints: 120,
  tags: ['metcon', 'fortime', 'chipper'],
  blocks: [
    warmup('chb_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
    ]),
    {
      id: 'chb_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 4,
      durationSec: 1200,
      title: { ru: '4 круга на время', en: '4 rounds for time' },
      description: {
        ru: 'Лимит 20 минут. Засеки время каждого круга — ровные круги важнее рекордного первого.',
        en: '20-minute cap. Note each round time — even rounds matter more than a record first one.',
      },
      items: [
        { exerciseId: 'burpee', reps: 12 },
        { exerciseId: 'jump_squat', reps: 12 },
        { exerciseId: 'push_up', reps: 12 },
        { exerciseId: 'skater', reps: 20 },
        { exerciseId: 'sit_up', reps: 20 },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cooldown('chb_cooldown', [
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
      { exerciseId: 'cat_cow', reps: 8 },
    ]),
  ],
};

const W_EASY_FLOW: WorkoutInput = {
  id: 'w_easy_flow',
  name: { ru: 'Лёгкий поток', en: 'Easy flow' },
  focus: { ru: 'Восстановление и техника', en: 'Recovery and technique' },
  description: {
    ru: 'Лёгкий день: три круга спокойной работы — приседания, отжимания от стула, мостик, медвежья походка, удержание в приседе — без спешки и на идеальной технике. Потом кор и длинная растяжка. Пульс не должен подниматься высоко: это день, когда тело догоняет нагрузку.',
    en: 'An easy day: three rounds of calm work — squats, incline push-ups, bridges, bear crawl, bottom squat hold — no rush, perfect form. Then core and a long stretch. Keep your heart rate low: this is the day your body catches up with the training.',
  },
  basePoints: 90,
  tags: ['recovery', 'skill', 'mobility'],
  blocks: [
    warmup('flow_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'jog_in_place', seconds: 45 },
    ]),
    {
      id: 'flow_skill',
      type: 'skill',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 60,
      title: { ru: 'Техника', en: 'Technique' },
      description: {
        ru: 'Три круга в темпе разговора. Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке.',
        en: 'Three rounds at a talking pace. Treat every rep as a demo: full range, a pause at the end point.',
      },
      items: [
        { exerciseId: 'air_squat', reps: 10 },
        { exerciseId: 'incline_push_up', reps: 10 },
        { exerciseId: 'glute_bridge', reps: 12 },
        { exerciseId: 'bear_crawl', seconds: 20 },
        { exerciseId: 'squat_hold', seconds: 20 },
      ],
    },
    {
      id: 'flow_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'bird_dog', reps: 10 },
        { exerciseId: 'dead_bug', reps: 10 },
        { exerciseId: 'side_plank', seconds: 20, perSide: true },
      ],
    },
    cooldown('flow_cooldown', [
      { exerciseId: 'hip_flexor_stretch', seconds: 45, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
      { exerciseId: 'child_pose', seconds: 60 },
      { exerciseId: 'cat_cow', reps: 8 },
    ]),
  ],
};

const W_BENCH_BURPEES: WorkoutInput = {
  id: 'w_bench_burpees',
  name: { ru: '100 бёрпи на время', en: '100 burpees for time' },
  focus: { ru: 'Бенчмарк', en: 'Benchmark' },
  description: {
    ru: 'Классика: 100 бёрпи, лимит 12 минут. Разбей на серии — например, 10 по 10 с коротким выдохом между ними — и не стой дольше 10 секунд. Запиши время: это твоя точка отсчёта. Не уложился в лимит — запиши, сколько успел: это тоже результат.',
    en: 'A classic: 100 burpees, 12-minute cap. Break it into sets — say 10 × 10 with a short breather in between — and never stand still for more than 10 seconds. Write down your time: it is your reference. If you hit the cap, note how many you got — that is a result too.',
  },
  basePoints: 150,
  tags: ['benchmark', 'fortime'],
  blocks: [
    warmup('bb_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'bb_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 1,
      durationSec: 720,
      title: { ru: '100 бёрпи на время', en: '100 burpees for time' },
      description: {
        ru: 'Лимит 12 минут. Полное бёрпи: грудь касается пола, прыжок с хлопком над головой.',
        en: '12-minute cap. Full burpee: chest touches the floor, jump with a clap overhead.',
      },
      items: [
        {
          exerciseId: 'burpee',
          reps: 100,
          note: {
            ru: 'Серии по 10, пауза не дольше 10 секунд.',
            en: 'Sets of 10, pauses no longer than 10 seconds.',
          },
        },
      ],
    },
    cooldown('bb_cooldown', [
      { exerciseId: 'child_pose', seconds: 45 },
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
    ]),
  ],
};

const W_BENCH_CINDY: WorkoutInput = {
  id: 'w_bench_cindy',
  name: { ru: 'Синди своим весом', en: 'Bodyweight Cindy' },
  focus: { ru: 'Бенчмарк: AMRAP 20', en: 'Benchmark: AMRAP 20' },
  description: {
    ru: 'Домашняя версия «Синди»: 20 минут, круг — 10 ситапов, 10 отжиманий, 15 приседаний. В оригинале вместо ситапов подтягивания, но турника у нас нет. Держи ровный темп с первой минуты и считай круги — это число ты будешь бить в следующем цикле.',
    en: 'The at-home Cindy: 20 minutes, one round is 10 sit-ups, 10 push-ups, 15 air squats. The original has pull-ups instead of sit-ups, but there is no bar here. Hold an even pace from the first minute and count rounds — that is the number to beat in your next cycle.',
  },
  basePoints: 150,
  tags: ['benchmark', 'amrap'],
  blocks: [
    warmup('bc_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'bc_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 1200,
      title: { ru: 'AMRAP 20 минут', en: 'AMRAP 20 minutes' },
      description: {
        ru: 'Как можно больше кругов за 20 минут. Отжимания разбивай раньше, чем откажут руки: 6 + 4 лучше, чем 10 и минута паузы.',
        en: 'As many rounds as possible in 20 minutes. Break the push-ups before your arms give out: 6 + 4 beats 10 and a minute of standing around.',
      },
      items: [
        { exerciseId: 'sit_up', reps: 10 },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'air_squat', reps: 15 },
      ],
    },
    cooldown('bc_cooldown'),
  ],
};

/* ------------------------------------------------------------------------------------ */
/* Path                                                                                  */
/* ------------------------------------------------------------------------------------ */

const T_SQUAT_PUSH: L10n = { ru: 'Присед и жим', en: 'Squat & push' };
const T_HINGE_CORE: L10n = { ru: 'Тяга и кор', en: 'Hinge & core' };
const T_ENGINE: L10n = { ru: 'Двигатель', en: 'Engine' };
const T_CHIPPER: L10n = { ru: 'Чиппер', en: 'Chipper' };
const T_FLOW: L10n = { ru: 'Лёгкий поток', en: 'Easy flow' };

const NODES: NodeInput[] = [
  /* Week 1 — baseline and the first pass through each day type. */
  {
    id: 'w1d1_test',
    week: 1,
    day: 1,
    kind: 'test',
    workoutId: 'w_test',
    title: { ru: 'Тест: точка отсчёта', en: 'Baseline test' },
    subtitle: {
      ru: '4 теста · отжимания, присед, планка, бёрпи',
      en: '4 tests · push-ups, squats, plank, burpees',
    },
  },
  rest(1, 2, REST_STREAK),
  {
    id: 'w1d3_squat_push',
    week: 1,
    day: 3,
    kind: 'workout',
    workoutId: 'w_squat_push_a',
    title: T_SQUAT_PUSH,
    subtitle: { ru: '3 подхода · база', en: '3 sets · the base' },
  },
  rest(1, 4, REST_SORE),
  {
    id: 'w1d5_hinge_core',
    week: 1,
    day: 5,
    kind: 'workout',
    workoutId: 'w_hinge_core_a',
    title: T_HINGE_CORE,
    subtitle: { ru: '3 подхода + 3 круга кора', en: '3 sets + 3 core rounds' },
  },
  {
    id: 'w1d6_engine',
    week: 1,
    day: 6,
    kind: 'workout',
    workoutId: 'w_engine_amrap10',
    title: T_ENGINE,
    subtitle: { ru: 'AMRAP 10 мин', en: 'AMRAP 10 min' },
  },
  rest(1, 7, REST_DEFAULT),

  /* Week 2 — same variants, full four-day rhythm, first chipper. */
  {
    id: 'w2d1_squat_push',
    week: 2,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_a',
    title: T_SQUAT_PUSH,
    subtitle: { ru: '3 подхода · закрепляем технику', en: '3 sets · locking in the form' },
  },
  rest(2, 2, REST_SLEEP),
  {
    id: 'w2d3_hinge_core',
    week: 2,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_a',
    title: T_HINGE_CORE,
    subtitle: { ru: '3 подхода + кор', en: '3 sets + core' },
  },
  {
    id: 'w2d4_engine',
    week: 2,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_emom12',
    title: T_ENGINE,
    subtitle: { ru: 'EMOM 12 мин', en: 'EMOM 12 min' },
  },
  rest(2, 5, REST_DEFAULT),
  {
    id: 'w2d6_chipper',
    week: 2,
    day: 6,
    kind: 'workout',
    workoutId: 'w_chipper_a',
    title: T_CHIPPER,
    subtitle: { ru: '3 круга на время, лимит 15 мин', en: '3 rounds for time, 15-min cap' },
  },
  rest(2, 7, REST_STREAK),

  /* Week 3 — B variants: jumps, single-leg work, Tabata, first benchmark. */
  {
    id: 'w3d1_squat_push',
    week: 3,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_b',
    title: T_SQUAT_PUSH,
    subtitle: { ru: '4 подхода · прыжковый присед', en: '4 sets · jump squats' },
  },
  rest(3, 2, REST_SORE),
  {
    id: 'w3d3_hinge_core',
    week: 3,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_b',
    title: T_HINGE_CORE,
    subtitle: { ru: '3 подхода · на одной ноге', en: '3 sets · single-leg' },
  },
  {
    id: 'w3d4_engine',
    week: 3,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_tabata',
    title: T_ENGINE,
    subtitle: { ru: '3 табаты 20/10', en: '3 Tabatas 20/10' },
  },
  rest(3, 5, REST_BEFORE_BENCHMARK),
  {
    id: 'w3d6_benchmark',
    week: 3,
    day: 6,
    kind: 'benchmark',
    workoutId: 'w_bench_burpees',
    title: { ru: '100 бёрпи', en: '100 burpees' },
    subtitle: { ru: 'Бенчмарк · на время, лимит 12 мин', en: 'Benchmark · for time, 12-min cap' },
  },
  rest(3, 7, REST_SLEEP),

  /* Week 4 — deload: same movements, volume ×0.65, longer rests (handled by the engine). */
  {
    id: 'w4d1_squat_push',
    week: 4,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_b',
    deload: true,
    title: T_SQUAT_PUSH,
    subtitle: { ru: 'Разгрузка · объём −35 %', en: 'Deload · volume −35%' },
  },
  rest(4, 2, REST_DELOAD),
  {
    id: 'w4d3_hinge_core',
    week: 4,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_b',
    deload: true,
    title: T_HINGE_CORE,
    subtitle: { ru: 'Разгрузка · объём −35 %', en: 'Deload · volume −35%' },
  },
  {
    id: 'w4d4_engine',
    week: 4,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap10',
    deload: true,
    title: T_ENGINE,
    subtitle: { ru: 'Разгрузка · AMRAP 10 мин', en: 'Deload · AMRAP 10 min' },
  },
  rest(4, 5, REST_DELOAD),
  {
    id: 'w4d6_flow',
    week: 4,
    day: 6,
    kind: 'workout',
    workoutId: 'w_easy_flow',
    deload: true,
    title: T_FLOW,
    subtitle: { ru: 'Разгрузка · техника и растяжка', en: 'Deload · technique and stretching' },
  },
  rest(4, 7, REST_SLEEP),

  /* Week 5 — C variants: peak volume, long AMRAP, four-round chipper. */
  {
    id: 'w5d1_squat_push',
    week: 5,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_c',
    title: T_SQUAT_PUSH,
    subtitle: { ru: '4 подхода · узкие отжимания', en: '4 sets · diamond push-ups' },
  },
  rest(5, 2, REST_SORE),
  {
    id: 'w5d3_hinge_core',
    week: 5,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_core_c',
    title: T_HINGE_CORE,
    subtitle: { ru: '3 больших подхода · пик объёма', en: '3 big sets · peak volume' },
  },
  {
    id: 'w5d4_engine',
    week: 5,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap15',
    title: T_ENGINE,
    subtitle: { ru: 'AMRAP 15 мин', en: 'AMRAP 15 min' },
  },
  rest(5, 5, REST_DEFAULT),
  {
    id: 'w5d6_chipper',
    week: 5,
    day: 6,
    kind: 'workout',
    workoutId: 'w_chipper_b',
    title: T_CHIPPER,
    subtitle: { ru: '4 круга на время, лимит 20 мин', en: '4 rounds for time, 20-min cap' },
  },
  rest(5, 7, REST_STREAK),

  /* Week 6 — last strength day, Cindy, an easy day and the retest. */
  {
    id: 'w6d1_squat_push',
    week: 6,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_c',
    title: T_SQUAT_PUSH,
    subtitle: { ru: '4 подхода · последний силовой', en: '4 sets · last strength day' },
  },
  rest(6, 2, REST_BEFORE_BENCHMARK),
  {
    id: 'w6d3_benchmark',
    week: 6,
    day: 3,
    kind: 'benchmark',
    workoutId: 'w_bench_cindy',
    title: { ru: 'Синди своим весом', en: 'Bodyweight Cindy' },
    subtitle: { ru: 'Бенчмарк · AMRAP 20 мин', en: 'Benchmark · AMRAP 20 min' },
  },
  rest(6, 4, REST_SLEEP),
  {
    id: 'w6d5_flow',
    week: 6,
    day: 5,
    kind: 'workout',
    workoutId: 'w_easy_flow',
    title: T_FLOW,
    subtitle: {
      ru: 'Техника и растяжка перед тестом',
      en: 'Technique and stretching before the retest',
    },
  },
  rest(6, 6, REST_BEFORE_TEST),
  {
    id: 'w6d7_retest',
    week: 6,
    day: 7,
    kind: 'test',
    workoutId: 'w_test',
    title: { ru: 'Повторный тест', en: 'Retest' },
    subtitle: {
      ru: 'Те же 4 теста · сравни с первой неделей',
      en: 'Same 4 tests · compare with week 1',
    },
  },
];

/* ------------------------------------------------------------------------------------ */
/* Course                                                                                */
/* ------------------------------------------------------------------------------------ */

export const COURSE_ENGINE: CourseInput = {
  id: 'engine',
  order: 2,
  slug: { ru: 'svoim-vesom-sila-i-vynoslivost', en: 'bodyweight-engine' },
  name: { ru: 'Своим весом: сила и выносливость', en: 'Bodyweight Engine' },
  tagline: {
    ru: 'Шесть недель силы и выносливости на собственном весе — четыре тренировки в неделю, без инвентаря.',
    en: 'Six weeks of bodyweight strength and conditioning — four sessions a week, no gear.',
  },
  description: {
    ru: 'Программа для тех, кто уже знает, что такое присед и отжимание, и хочет двигаться дальше: силовые дни, AMRAP и EMOM, табата, чипперы и два бенчмарка. Всё дома, без оборудования.',
    en: 'For people who already know their way around a squat and a push-up and want the next step: strength days, AMRAPs and EMOMs, Tabata, chippers and two benchmarks. All at home, no equipment.',
  },
  longDescription: [
    {
      ru: 'Курс построен как настоящий кроссфит-цикл, только без штанги и зала. Каждая неделя — четыре разных дня: присед и жим, тяга и кор, «двигатель» (интервалы на выносливость) и чиппер на всё тело. Паттерны движений повторяются из недели в неделю, а объём и сложность растут: обычный присед превращается в прыжковый, отжимания — в узкие, планка — в лодочку.',
      en: 'The course is built like a real CrossFit cycle, just without a barbell or a gym. Every week has four different days: squat and push, hinge and core, an "engine" day (conditioning intervals) and a full-body chipper. The movement patterns repeat from week to week while volume and complexity grow: the air squat becomes a jump squat, push-ups become diamond push-ups, the plank becomes a hollow hold.',
    },
    {
      ru: 'Ты начинаешь с теста — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По его результатам приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Четвёртая неделя — разгрузочная: объём падает примерно на треть, чтобы тело усвоило нагрузку. В конце третьей недели — 100 бёрпи на время, в конце шестой — 20-минутный AMRAP в духе «Синди» и повторный тест, чтобы увидеть прогресс в цифрах.',
      en: 'You start with a test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. Week four is a deload: volume drops by about a third so your body can absorb the work. Week three ends with 100 burpees for time, week six with a 20-minute Cindy-style AMRAP and a retest, so you see your progress in numbers.',
    },
    {
      ru: 'Из оборудования нужны только устойчивый стул для зашагиваний и коврик. Скакалка — по желанию: если её нет, приложение заменит прыжки на скакалке джампинг-джеками.',
      en: 'All you need is a sturdy chair for step-ups and a mat. A jump rope is optional: if you do not have one, the app swaps rope jumps for jumping jacks.',
    },
  ],
  forWhom: [
    {
      ru: 'Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.',
      en: 'You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute.',
    },
    {
      ru: 'Ты прошёл курс «Старт» и хочешь следующий уровень.',
      en: 'You finished the Start course and want the next level.',
    },
    {
      ru: 'Ты хочешь тренироваться дома без инвентаря, но с настоящей структурой: силовые дни, интервалы, бенчмарки.',
      en: 'You want to train at home without gear but with real structure: strength days, intervals, benchmarks.',
    },
    {
      ru: 'У тебя есть 25–35 минут четыре раза в неделю.',
      en: 'You have 25–35 minutes four times a week.',
    },
  ],
  outcomes: [
    {
      ru: 'Больше отжиманий, приседаний и бёрпи в тестах — ты сравнишь первую и шестую неделю.',
      en: 'More push-ups, squats and burpees in the tests — you compare week one with week six.',
    },
    {
      ru: 'Освоишь прыжковые приседания, узкие отжимания, лодочку и складку.',
      en: 'You learn jump squats, diamond push-ups, the hollow hold and V-ups.',
    },
    {
      ru: 'Пройдёшь два бенчмарка: 100 бёрпи на время и 20-минутный AMRAP в духе «Синди».',
      en: 'You complete two benchmarks: 100 burpees for time and a 20-minute Cindy-style AMRAP.',
    },
    {
      ru: 'Научишься работать в форматах AMRAP, EMOM, табата и чиппер и распределять силы.',
      en: 'You get comfortable with AMRAP, EMOM, Tabata and chipper formats and learn to pace them.',
    },
    {
      ru: 'Привыкнешь к четырём тренировкам в неделю без перегруза — с днями отдыха и разгрузочной неделей.',
      en: 'You settle into four sessions a week without burning out — with rest days and a deload week built in.',
    },
  ],
  equipment: ['none', 'mat', 'chair', 'jump_rope'],
  level: 2,
  weeks: 6,
  sessionsPerWeek: 4,
  avgSessionMin: 30,
  accent: '#FFD9A8',
  gradient: ['#FFD9A8', '#FFB4C8'],
  price: { rub: 3990, usd: 39 },
  workouts: [
    W_TEST,
    W_SQUAT_PUSH_A,
    W_SQUAT_PUSH_B,
    W_SQUAT_PUSH_C,
    W_HINGE_CORE_A,
    W_HINGE_CORE_B,
    W_HINGE_CORE_C,
    W_ENGINE_AMRAP10,
    W_ENGINE_EMOM12,
    W_ENGINE_TABATA,
    W_ENGINE_AMRAP15,
    W_CHIPPER_A,
    W_CHIPPER_B,
    W_EASY_FLOW,
    W_BENCH_BURPEES,
    W_BENCH_CINDY,
  ],
  nodes: NODES,
  faq: [
    {
      q: { ru: 'Что нужно из оборудования?', en: 'What equipment do I need?' },
      a: {
        ru: 'Коврик и устойчивый стул — для зашагиваний и для отжиманий от опоры в лёгкий день. Скакалка по желанию: если её нет, приложение автоматически заменит прыжки на скакалке джампинг-джеками, и программа от этого не изменится.',
        en: 'A mat and a sturdy chair — for step-ups and for incline push-ups on the easy day. A jump rope is optional: without one the app automatically swaps rope jumps for jumping jacks and the program stays the same.',
      },
    },
    {
      q: {
        ru: 'Мне подойдёт этот курс или лучше начать со «Старта»?',
        en: 'Is this course right for me, or should I begin with Start?',
      },
      a: {
        ru: 'Ориентир такой: 8–10 отжиманий от пола подряд, минута планки и 15–20 приседаний без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт»: там те же паттерны движений, но без прыжков и с отжиманиями с колен, а через четыре недели вернёшься сюда.',
        en: 'A rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15–20 squats without getting winded. If that is you, jump in. If not yet, do Start first: same movement patterns, no jumps and knee push-ups, and you come back here in four weeks.',
      },
    },
    {
      q: { ru: 'Сколько времени занимает тренировка?', en: 'How long is a session?' },
      a: {
        ru: 'В среднем около 30 минут вместе с разминкой и заминкой: силовые дни — 27–37 минут, «двигатель» — 24–30, чипперы, бенчмарки и лёгкий день — 20–30. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.',
        en: 'About 30 minutes on average including warm-up and cool-down: strength days run 27–37 minutes, engine days 24–30, chippers, benchmarks and the easy day 20–30. Before you start, the app shows the estimated duration for your own volume.',
      },
    },
    {
      q: { ru: 'Пропустил тренировку — что делать?', en: 'I missed a session — what now?' },
      a: {
        ru: 'Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не пытайся сделать две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва.',
        en: 'No problem: the path does not reset, just continue from the next node when you can. Do not try to double up to "catch up" — shifting the week is better. If the break was longer than two weeks, pick "Easier" for the first two sessions back.',
      },
    },
    {
      q: { ru: 'Как приложение подстраивает нагрузку?', en: 'How does the app adapt the load?' },
      a: {
        ru: 'Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. В четвёртую неделю объём снижается автоматически.',
        en: 'Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. In week four the volume drops automatically.',
      },
    },
    {
      q: {
        ru: 'Болят мышцы после тренировки — это нормально?',
        en: 'My muscles are sore after training — is that normal?',
      },
      a: {
        ru: 'Тянущая боль в мышцах через день-два после нагрузки — норма, особенно в первые две недели и после прыжков. Помогают прогулка, сон и следующая лёгкая тренировка. А вот резкая боль в суставе или пояснице, или та, что усиливается во время движения, — сигнал остановиться. Отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку, а если не проходит несколько дней — покажись врачу.',
        en: 'A dull ache a day or two after a session is normal, especially in the first two weeks and after jumps. A walk, sleep and the next easy session help. Sharp pain in a joint or the lower back, or pain that gets worse as you move, is a signal to stop. Mark "Pain" in the post-workout feedback — the app reduces the load — and if it lasts several days, see a doctor.',
      },
    },
  ],
};
