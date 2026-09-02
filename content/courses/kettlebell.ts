/**
 * Course "kettlebell" — «Гиря: сила и метаболизм» / "Kettlebell Power".
 *
 * Six weeks, three sessions a week, level 2, one kettlebell plus a mat.
 *
 * Weekly skeleton (D = day of week):
 *   D1 squat & press · D2 rest · D3 swing school (hinge / pull / get-up / carries) · D4 rest ·
 *   D5 metabolic (EMOM, ladder, AMRAP) · D7 rest
 * The hinge day carries the technical thread of the course: deadlift → swing → clean → press →
 * snatch, with a Turkish get-up skill block and loaded carries on every hinge day.
 * Week 1 opens with the baseline test, week 4 is a deload (volume ×0.65 by the engine), week 6
 * holds the last strength day, the "100 swings + 50 goblet squats" benchmark, a light technique
 * session and the retest.
 *
 * Numbers are authored for a level-2 athlete at scale 1.0; the training engine scales every
 * block marked `scalable` by the athlete's course scale and difficulty choice, and turns the
 * `load` labels into a concrete bell from the athlete's equipment.
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
      ru: 'Два спокойных круга. Гиря в разминке лёгкая: задача — разогреть плечи, тазобедренные и спину, а не устать до начала работы.',
      en: 'Two easy rounds. Use a light bell in the warm-up: the goal is to wake up the shoulders, hips and back, not to get tired before the work starts.',
    },
    items,
  };
}

const STRETCHES: ItemInput[] = [
  { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
  { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
  { exerciseId: 'child_pose', seconds: 45 },
];

const HINGE_STRETCHES: ItemInput[] = [
  { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
  { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
  { exerciseId: 'cat_cow', reps: 8 },
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
      ru: 'Отложи гирю и дыши медленно. Тянись без рывков, пока пульс не опустится до разговорного.',
      en: 'Put the bell down and breathe slowly. Stretch without bouncing until your heart rate is back to a talking pace.',
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
  ru: '7000 шагов и лёгкая растяжка. Сила растёт в дни отдыха — не отбирай их у себя.',
  en: '7,000 steps and light stretching. Strength is built on rest days — do not skip them.',
};
const REST_SLEEP: L10n = {
  ru: 'Прогулка 40–60 минут и 7–8 часов сна. Это даст больше, чем ещё одна тренировка с гирей.',
  en: 'A 40–60 minute walk and 7–8 hours of sleep. That does more than one more kettlebell session.',
};
const REST_STREAK: L10n = {
  ru: 'Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию.',
  en: 'Walk 7,000 steps and log them in the app — the day counts toward your streak.',
};
const REST_SORE: L10n = {
  ru: 'Тянет ягодицы и заднюю поверхность бедра после махов — это норма. Прогулка разгонит кровь быстрее, чем диван.',
  en: 'Sore glutes and hamstrings after swings are normal. A walk gets the blood moving faster than the couch.',
};
const REST_HANDS: L10n = {
  ru: 'Ладоням тоже нужен отдых: осмотри мозоли, подпили огрубевшую кожу, смажь кремом. Сорванная ладонь выбьет из графика на неделю.',
  en: 'Your palms need rest too: check the calluses, file down hard skin, moisturise. A torn palm costs a week of training.',
};
const REST_DELOAD: L10n = {
  ru: 'Разгрузочная неделя: гуляй, спи, ешь нормально. Тело догоняет нагрузку прошлых трёх недель.',
  en: 'Deload week: walk, sleep, eat properly. Your body is catching up with the last three weeks.',
};
const REST_BEFORE_BENCHMARK: L10n = {
  ru: 'Завтра бенчмарк: шаги, вода, ранний сон. Ни одного «лишнего» маха сегодня.',
  en: 'Benchmark tomorrow: steps, water, an early night. Not a single "extra" swing today.',
};
const REST_BEFORE_TEST: L10n = {
  ru: 'Перед тестом — только прогулка. Завтра ты сравнишь цифры с первым днём курса.',
  en: 'Only a walk before the test. Tomorrow you compare your numbers with day one of the course.',
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
    ru: 'Четыре коротких теста без гири, с отдыхом по полторы минуты между ними. Работай честно: результат задаёт стартовый объём всех тренировок, а в конце курса ты повторишь тест и сравнишь цифры.',
    en: 'Four short bodyweight tests with 90 seconds of rest between them. Be honest with yourself: the result sets your starting volume for every session, and at the end of the course you repeat the test and compare the numbers.',
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

/* --- Squat & press days ------------------------------------------------------------- */

const W_SQUAT_PRESS_A: WorkoutInput = {
  id: 'w_squat_press_a',
  name: { ru: 'Присед и жим A', en: 'Squat & press A' },
  focus: { ru: 'Гоблет-присед и жим: техника', en: 'Goblet squat and press: the technique' },
  description: {
    ru: 'Три подхода базовой связки: гоблет-присед, жим гири стоя, обратные выпады с гирей у груди и отжимания. Темп спокойный, каждое повторение — с полной амплитудой: в приседе локти уходят внутрь коленей, в жиме гиря идёт по прямой мимо лица. В конце короткий блок на кор.',
    en: 'Three sets of the base combo: goblet squat, standing kettlebell press, front-rack reverse lunges and push-ups. Steady tempo, full range on every rep: in the squat the elbows go inside the knees, in the press the bell travels straight up past your face. A short core block to finish.',
  },
  basePoints: 100,
  tags: ['strength', 'squat', 'push'],
  blocks: [
    warmup('spa_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
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
        ru: 'Три подхода. Две секунды вниз, секунда вверх. Между упражнениями 20 секунд, между подходами — 75.',
        en: 'Three sets. Two seconds down, one second up. Twenty seconds between exercises, 75 between sets.',
      },
      items: [
        {
          exerciseId: 'kb_goblet_squat',
          reps: 10,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Внизу — секунда паузы, локти раздвигают колени.',
            en: 'One-second pause at the bottom, elbows pushing the knees out.',
          },
        },
        {
          exerciseId: 'kb_press',
          reps: 6,
          perSide: true,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Сначала слабая рука. Корпус не отклоняется — жмёт плечо, а не поясница.',
            en: 'Weaker arm first. No leaning back — the shoulder presses, not the lower back.',
          },
        },
        {
          exerciseId: 'kb_lunge',
          reps: 12,
          load: 'light',
          restAfterSec: 20,
          note: {
            ru: '12 всего, по 6 на ногу, чередуй. Гиря у груди двумя руками.',
            en: '12 total, 6 per leg, alternating. Hold the bell at your chest with both hands.',
          },
        },
        { exerciseId: 'push_up', reps: 10 },
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
        { exerciseId: 'dead_bug', reps: 12 },
      ],
    },
    cooldown('spa_cooldown'),
  ],
};

const W_SQUAT_PRESS_B: WorkoutInput = {
  id: 'w_squat_press_b',
  name: { ru: 'Присед и жим B', en: 'Squat & press B' },
  focus: { ru: 'Четыре подхода: больше жима', en: 'Four sets: more pressing' },
  description: {
    ru: 'Те же четыре движения, но четыре подхода и больше повторений: восемь жимов на руку вместо шести, 16 выпадов вместо 12. Если в последнем подходе жим «залипает» на середине — доделай оставшиеся повторения швунгом, слегка подсев ногами. Кор: боковая планка и касания плеч.',
    en: 'The same four movements, but four sets and more reps: eight presses per arm instead of six, 16 lunges instead of 12. If the press stalls halfway through the last set, finish the remaining reps as a push press with a small dip of the legs. Core: side plank and shoulder taps.',
  },
  basePoints: 110,
  tags: ['strength', 'squat', 'push'],
  blocks: [
    warmup('spb_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
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
        ru: 'Четыре подхода. Держи темп из первой недели: две секунды вниз, секунда вверх, никаких отбивов от коленей.',
        en: 'Four sets. Keep the week-one tempo: two seconds down, one up, no bouncing off the knees.',
      },
      items: [
        { exerciseId: 'kb_goblet_squat', reps: 12, load: 'medium', restAfterSec: 20 },
        {
          exerciseId: 'kb_press',
          reps: 8,
          perSide: true,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Сжимай свободный кулак и ягодицы — жим станет стабильнее.',
            en: 'Squeeze your free fist and your glutes — the press gets steadier.',
          },
        },
        {
          exerciseId: 'kb_lunge',
          reps: 16,
          load: 'medium',
          restAfterSec: 20,
          note: { ru: '16 всего, по 8 на ногу.', en: '16 total, 8 per leg.' },
        },
        { exerciseId: 'push_up', reps: 12 },
      ],
    },
    {
      id: 'spb_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
        { exerciseId: 'plank_shoulder_tap', reps: 16 },
      ],
    },
    cooldown('spb_cooldown'),
  ],
};

const W_SQUAT_PRESS_C: WorkoutInput = {
  id: 'w_squat_press_c',
  name: { ru: 'Присед и жим C', en: 'Squat & press C' },
  focus: { ru: 'Пик силы ног и жима', en: 'Peak legs and press' },
  description: {
    ru: 'Самый плотный силовой день курса: четыре подхода с паузой в приседе, тяжёлым жимом и узкими отжиманиями, а после — EMOM на 12 минут, где по минутам чередуются гоблет-присед, отжимания и выпады с гирей у груди. Между подходами отдыхай полные 90 секунд: тяжёлый жим любит свежие плечи. Кора отдельно нет — его роль выполняют присед с паузой и выпады.',
    en: 'The densest strength day of the course: four sets with a paused squat, a heavy press and diamond push-ups, followed by a 12-minute EMOM rotating goblet squats, push-ups and front-rack lunges minute by minute. Rest the full 90 seconds between sets — a heavy press wants fresh shoulders. No separate core block: the paused squat and the lunges do that job.',
  },
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'emom'],
  blocks: [
    warmup('spc_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'spc_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: { ru: 'Силовой блок', en: 'Strength' },
      description: {
        ru: 'Четыре подхода, 90 секунд отдыха. Если узкие отжимания не идут, делай обычные с паузой в одну секунду внизу.',
        en: 'Four sets, 90 seconds of rest. If diamond push-ups are not there yet, do regular push-ups with a one-second pause at the bottom.',
      },
      items: [
        {
          exerciseId: 'kb_goblet_squat',
          reps: 15,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Пауза две секунды в нижней точке на каждом повторении.',
            en: 'Two-second pause at the bottom of every rep.',
          },
        },
        {
          exerciseId: 'kb_press',
          reps: 8,
          perSide: true,
          load: 'heavy',
          restAfterSec: 20,
          note: {
            ru: 'Самая тяжёлая гиря, которую жмёшь на 8 чисто. Не идёт — вернись к средней.',
            en: 'The heaviest bell you can press for 8 clean reps. If it stalls, go back to the medium one.',
          },
        },
        {
          exerciseId: 'diamond_push_up',
          reps: 10,
          note: {
            ru: 'Не идут узкие — обычные отжимания с паузой внизу.',
            en: 'If diamonds are too hard, do regular push-ups with a pause at the bottom.',
          },
        },
      ],
    },
    {
      id: 'spc_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 12,
      title: { ru: 'EMOM 12 минут', en: 'EMOM 12 minutes' },
      description: {
        ru: 'Минута 1 — гоблет-присед, минута 2 — отжимания, минута 3 — выпады, и так по кругу четыре раза. Сделал повторения — остаток минуты отдыхаешь.',
        en: 'Minute 1 goblet squats, minute 2 push-ups, minute 3 lunges, and round again four times. Finish the reps, rest for what is left of the minute.',
      },
      items: [
        { exerciseId: 'kb_goblet_squat', reps: 12, load: 'medium' },
        { exerciseId: 'push_up', reps: 10 },
        {
          exerciseId: 'kb_lunge',
          reps: 12,
          load: 'medium',
          note: { ru: '12 всего, по 6 на ногу.', en: '12 total, 6 per leg.' },
        },
      ],
    },
    cooldown('spc_cooldown'),
  ],
};

/* --- Swing school: hinge, pull, get-up, carries ------------------------------------- */

const W_SWING_SCHOOL_A: WorkoutInput = {
  id: 'w_swing_school_a',
  name: { ru: 'Школа маха A: тяга и мах', en: 'Swing school A: deadlift & swing' },
  focus: { ru: 'Хип-хиндж: от тяги к маху', en: 'The hip hinge: from deadlift to swing' },
  description: {
    ru: 'Первый урок гиревой техники. Становая тяга с гирей учит наклон с прямой спиной, мах — тот же наклон, только быстрый: гиря летит от бёдер, а не от рук. Тяга сумо к подбородку готовит плечи к взятию на следующей неделе. Потом — разбор турецкого подъёма по шагам и переноска гири в одной руке.',
    en: "Your first kettlebell technique lesson. The kettlebell deadlift teaches the hinge with a flat back; the swing is the same hinge, just fast — the bell flies from the hips, not the arms. The sumo high pull gets the shoulders ready for next week's clean. Then a step-by-step Turkish get-up and a one-arm carry.",
  },
  basePoints: 100,
  tags: ['skill', 'hinge', 'core'],
  blocks: [
    warmup('ssa_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'glute_bridge', reps: 12 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
    ]),
    {
      id: 'ssa_hinge',
      type: 'skill',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      title: { ru: 'Школа маха', en: 'Swing school' },
      description: {
        ru: 'Три подхода. Тяга — медленно и с прямой спиной; мах — резко, до уровня груди, наверху ягодицы сжаты, колени прямые. Гиря опускается «в пах», а не к коленям.',
        en: 'Three sets. Deadlift slow and flat-backed; swing sharp, to chest height, glutes squeezed and knees straight at the top. The bell comes back high into the groin, not down to the knees.',
      },
      items: [
        {
          exerciseId: 'kb_deadlift',
          reps: 8,
          load: 'heavy',
          restAfterSec: 20,
          note: {
            ru: 'Гиря между стоп, вес на пятках, взгляд в пол в двух метрах перед собой.',
            en: 'Bell between the feet, weight on the heels, eyes on the floor two metres ahead.',
          },
        },
        {
          exerciseId: 'kb_swing',
          reps: 10,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Русский мах — до уровня груди. Руки — верёвки, работают бёдра.',
            en: 'Russian swing — chest height. Arms are ropes; the hips do the work.',
          },
        },
        { exerciseId: 'kb_sumo_high_pull', reps: 8, load: 'medium' },
      ],
    },
    {
      id: 'ssa_getup',
      type: 'skill',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 30,
      title: { ru: 'Турецкий подъём: разбор', en: 'Turkish get-up: the steps' },
      description: {
        ru: 'По одному подъёму на руку, три подхода. В первую неделю можно вообще без гири или с самой лёгкой: задача — запомнить порядок шагов, а не вес.',
        en: 'One get-up per arm, three sets. This week you can do it with no bell or the lightest one: the goal is to memorise the sequence, not the weight.',
      },
      items: [
        {
          exerciseId: 'kb_turkish_get_up',
          reps: 1,
          perSide: true,
          load: 'light',
          restAfterSec: 30,
          note: {
            ru: 'Смотри на гирю всю дорогу вверх. Каждую позицию — с паузой на секунду.',
            en: 'Eyes on the bell all the way up. Pause for a second in every position.',
          },
        },
      ],
    },
    {
      id: 'ssa_carry',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Переноска и кор', en: 'Carry and core' },
      description: {
        ru: 'Два круга. В переноске плечи на одном уровне, корпус не заваливается к гире — это и есть упражнение на кор.',
        en: 'Two rounds. In the carry keep the shoulders level and do not lean toward the bell — that is the core exercise.',
      },
      items: [
        { exerciseId: 'kb_suitcase_carry', seconds: 30, perSide: true, load: 'heavy' },
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
      ],
    },
    cooldown('ssa_cooldown', HINGE_STRETCHES),
  ],
};

const W_SWING_SCHOOL_B: WorkoutInput = {
  id: 'w_swing_school_b',
  name: { ru: 'Школа маха B: мах и взятие', en: 'Swing school B: swing & clean' },
  focus: { ru: 'Объём махов и первое взятие', en: 'Swing volume and the first clean' },
  description: {
    ru: 'Махов становится больше — 15 в подходе, четыре подхода, — а из маха вырастает взятие на грудь: та же работа бёдер, только гиря не летит вперёд, а «обвивает» руку и мягко ложится на предплечье. Турецкий подъём уже с гирей. В конце — переноска подольше и супермен для спины.',
    en: 'More swings — 15 per set, four sets — and the clean grows out of the swing: the same hip drive, except the bell does not fly forward but wraps around the arm and lands softly on the forearm. The get-up is now done with a bell. To finish, a longer carry and supermans for the back.',
  },
  basePoints: 110,
  tags: ['skill', 'hinge', 'core'],
  blocks: [
    warmup('ssb_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'glute_bridge', reps: 12 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
    ]),
    {
      id: 'ssb_hinge',
      type: 'skill',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 60,
      title: { ru: 'Школа маха', en: 'Swing school' },
      description: {
        ru: 'Четыре подхода. Взятие — с малым числом повторений: пять на руку, каждое чистое. Если гиря бьёт по предплечью, держи локоть ближе к корпусу и «протягивай» кисть сквозь дужку раньше.',
        en: 'Four sets. Keep the clean reps low — five per arm, every one clean. If the bell bangs your forearm, keep the elbow closer to your body and thread your hand through the handle earlier.',
      },
      items: [
        { exerciseId: 'kb_deadlift', reps: 6, load: 'heavy', restAfterSec: 15 },
        {
          exerciseId: 'kb_swing',
          reps: 15,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Резкий выдох на каждом махе наверху.',
            en: 'A sharp exhale at the top of every swing.',
          },
        },
        {
          exerciseId: 'kb_clean',
          reps: 5,
          perSide: true,
          load: 'medium',
          restAfterSec: 20,
          note: {
            ru: 'Гиря обвивает руку, а не бьёт по ней. Локоть прижат к рёбрам в конечной точке.',
            en: 'The bell wraps around the arm rather than hitting it. Elbow tucked to the ribs in the rack.',
          },
        },
      ],
    },
    {
      id: 'ssb_getup',
      type: 'skill',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 30,
      title: { ru: 'Турецкий подъём', en: 'Turkish get-up' },
      description: {
        ru: 'По одному подъёму на руку, три подхода, лёгкая гиря. Рука с гирей вертикальна в каждой позиции.',
        en: 'One get-up per arm, three sets, light bell. The loaded arm stays vertical in every position.',
      },
      items: [
        {
          exerciseId: 'kb_turkish_get_up',
          reps: 1,
          perSide: true,
          load: 'light',
          restAfterSec: 30,
        },
      ],
    },
    {
      id: 'ssb_carry',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Переноска и спина', en: 'Carry and back' },
      items: [
        { exerciseId: 'kb_suitcase_carry', seconds: 40, perSide: true, load: 'heavy' },
        { exerciseId: 'superman', reps: 12 },
      ],
    },
    cooldown('ssb_cooldown', HINGE_STRETCHES),
  ],
};

const W_CLEAN_PRESS: WorkoutInput = {
  id: 'w_clean_press',
  name: { ru: 'Взятие и жим', en: 'Clean & press' },
  focus: { ru: 'Комплекс: мах → взятие → жим', en: 'The complex: swing → clean → press' },
  description: {
    ru: 'Гиревой комплекс, где движения складываются в цепочку: махи, взятия, жим прямо из положения на груди, тяга сумо. Четыре подхода, отдых 75 секунд. Турецкий подъём — уже по два на руку. В конце прогулка фермера и лодочка: хват и кор держат всё, что ты делаешь с гирей.',
    en: 'A kettlebell complex where the movements chain together: swings, cleans, the press straight from the rack, sumo high pulls. Four sets, 75 seconds of rest. The get-up is now two per arm. Farmer carry and hollow hold to finish: grip and core hold up everything you do with a bell.',
  },
  basePoints: 110,
  tags: ['strength', 'hinge', 'push', 'core'],
  blocks: [
    warmup('cp_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'glute_bridge', reps: 12 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
    ]),
    {
      id: 'cp_complex',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: { ru: 'Комплекс', en: 'Complex' },
      description: {
        ru: 'Четыре подхода. Жим делай сразу после взятия той же рукой: взял — выжал — опустил на грудь — следующее.',
        en: 'Four sets. Press right after the clean with the same arm: clean — press — lower to the rack — next rep.',
      },
      items: [
        { exerciseId: 'kb_swing', reps: 12, load: 'medium', restAfterSec: 15 },
        { exerciseId: 'kb_clean', reps: 5, perSide: true, load: 'medium', restAfterSec: 15 },
        {
          exerciseId: 'kb_press',
          reps: 5,
          perSide: true,
          load: 'medium',
          restAfterSec: 15,
          note: {
            ru: 'Из положения на груди. Вдох перед жимом, выдох наверху.',
            en: 'From the rack. Breathe in before the press, out at the top.',
          },
        },
        { exerciseId: 'kb_sumo_high_pull', reps: 10, load: 'medium' },
      ],
    },
    {
      id: 'cp_getup',
      type: 'skill',
      format: 'sets',
      sets: 2,
      restBetweenSetsSec: 30,
      title: { ru: 'Турецкий подъём', en: 'Turkish get-up' },
      description: {
        ru: 'По два подъёма на руку, два подхода. Первый — медленный и разборчивый, второй — в один плавный поток.',
        en: 'Two get-ups per arm, two sets. The first one slow and deliberate, the second one in one smooth flow.',
      },
      items: [
        {
          exerciseId: 'kb_turkish_get_up',
          reps: 2,
          perSide: true,
          load: 'light',
          restAfterSec: 30,
        },
      ],
    },
    {
      id: 'cp_carry',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Хват и кор', en: 'Grip and core' },
      items: [
        {
          exerciseId: 'farmer_carry',
          seconds: 45,
          load: 'heavy',
          note: {
            ru: 'Одна гиря — половину времени в одной руке, половину в другой, не ставя на пол.',
            en: 'One bell — half the time in one hand, half in the other, without setting it down.',
          },
        },
        { exerciseId: 'hollow_hold', seconds: 30 },
      ],
    },
    cooldown('cp_cooldown', HINGE_STRETCHES),
  ],
};

const W_SNATCH_SWING: WorkoutInput = {
  id: 'w_snatch_swing',
  name: { ru: 'Рывок и мах', en: 'Snatch & swing' },
  focus: { ru: 'Вершина прогрессии: рывок', en: 'The top of the progression: the snatch' },
  description: {
    ru: 'Рывок — это мах, который не остановился на уровне груди: гиря идёт по прямой вверх, кисть проворачивается под дужкой, и гиря мягко садится на предплечье над головой. Пять на руку, лёгкая гиря, никакой спешки. Тяжёлые махи, взятия и жим остаются — теперь весь гиревой набор собран. Турецкий подъём — с гирей потяжелее.',
    en: 'The snatch is a swing that did not stop at chest height: the bell travels straight up, the hand rotates under the handle and the bell settles softly on the forearm overhead. Five per arm, light bell, no rushing. Heavy swings, cleans and the press stay in — the whole kettlebell toolkit is now assembled. The get-up moves to a heavier bell.',
  },
  basePoints: 120,
  tags: ['strength', 'hinge', 'olympic', 'core'],
  blocks: [
    warmup('sn_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'glute_bridge', reps: 12 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
    ]),
    {
      id: 'sn_hinge',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: { ru: 'Мах, взятие, рывок, жим', en: 'Swing, clean, snatch, press' },
      description: {
        ru: 'Четыре подхода. Рывок только чистый: если гиря ударяет по предплечью — гиря тяжёлая или ты тянешь её рукой. Опускай через грудь на первых порах.',
        en: 'Four sets. Only clean snatches: if the bell bangs your forearm, it is too heavy or you are pulling with the arm. Lower it through the rack while you learn.',
      },
      items: [
        {
          exerciseId: 'kb_swing',
          reps: 15,
          load: 'heavy',
          restAfterSec: 15,
          note: {
            ru: 'Уверен в технике — делай одной рукой: 8 и 7 со сменой в воздухе или через пол.',
            en: 'Confident with the form — go one-handed: 8 and 7, switching in the air or via the floor.',
          },
        },
        { exerciseId: 'kb_clean', reps: 5, perSide: true, load: 'medium', restAfterSec: 15 },
        {
          exerciseId: 'kb_snatch',
          reps: 5,
          perSide: true,
          load: 'light',
          restAfterSec: 15,
          note: {
            ru: 'Гиря по прямой, локоть остаётся близко к телу до уровня груди, наверху — фиксация.',
            en: 'Bell travels in a straight line, elbow stays close to the body until chest height, lock out at the top.',
          },
        },
        { exerciseId: 'kb_press', reps: 5, perSide: true, load: 'medium' },
      ],
    },
    {
      id: 'sn_getup',
      type: 'skill',
      format: 'sets',
      sets: 2,
      restBetweenSetsSec: 30,
      title: { ru: 'Турецкий подъём', en: 'Turkish get-up' },
      description: {
        ru: 'По два на руку с гирей средней тяжести. Если техника плывёт — вернись к лёгкой, в этом упражнении вес второстепенен.',
        en: 'Two per arm with a medium bell. If the form gets shaky, go back to the light one — weight is secondary in this movement.',
      },
      items: [
        {
          exerciseId: 'kb_turkish_get_up',
          reps: 2,
          perSide: true,
          load: 'medium',
          restAfterSec: 30,
        },
      ],
    },
    {
      id: 'sn_carry',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Переноска и кор', en: 'Carry and core' },
      items: [
        { exerciseId: 'kb_suitcase_carry', seconds: 40, perSide: true, load: 'heavy' },
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
      ],
    },
    cooldown('sn_cooldown', HINGE_STRETCHES),
  ],
};

/* --- Metabolic days ----------------------------------------------------------------- */

const W_METCON_EMOM12: WorkoutInput = {
  id: 'w_metcon_emom12',
  name: { ru: 'Метаболизм: EMOM 12', en: 'Metabolic: EMOM 12' },
  focus: { ru: 'Махи по минутам', en: 'Swings by the minute' },
  description: {
    ru: 'Двенадцать минут, каждую минуту новое упражнение по кругу: махи, гоблет-присед, бёрпи — четыре цикла. Сделал повторения — остаток минуты отдыхаешь. Махи должны занимать не больше 25 секунд: если дольше, гиря тяжеловата для темпа или ты машешь руками. В конце короткий блок на кор.',
    en: 'Twelve minutes, a new exercise every minute, cycling through swings, goblet squats and burpees — four cycles. Finish the reps, rest for what is left of the minute. The swings should take no more than 25 seconds: if they take longer, the bell is a bit heavy for the pace or you are swinging with your arms. A short core block to finish.',
  },
  basePoints: 100,
  tags: ['metcon', 'emom', 'cardio'],
  blocks: [
    warmup('em_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
    ]),
    {
      id: 'em_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 12,
      title: { ru: 'EMOM 12 минут', en: 'EMOM 12 minutes' },
      description: {
        ru: 'Минута 1 — махи, минута 2 — гоблет-присед, минута 3 — бёрпи, и так по кругу. Остаток минуты — отдых.',
        en: 'Minute 1 swings, minute 2 goblet squats, minute 3 burpees, and round again. The rest of the minute is rest.',
      },
      items: [
        { exerciseId: 'kb_swing', reps: 15, load: 'medium' },
        { exerciseId: 'kb_goblet_squat', reps: 10, load: 'medium' },
        { exerciseId: 'burpee', reps: 6 },
      ],
    },
    {
      id: 'em_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'plank', seconds: 45 },
        {
          exerciseId: 'russian_twist',
          reps: 20,
          note: {
            ru: 'Можно с лёгкой гирей в руках, если поясница в порядке.',
            en: 'You can hold a light bell if your lower back is happy.',
          },
        },
      ],
    },
    cooldown('em_cooldown'),
  ],
};

const W_METCON_LADDER: WorkoutInput = {
  id: 'w_metcon_ladder',
  name: { ru: 'Лестница махов', en: 'Swing ladder' },
  focus: { ru: 'Пирамида 10–25–10 на время', en: 'A 10–25–10 pyramid for time' },
  description: {
    ru: 'Лестница махов вверх и вниз: 10, 15, 20, 25, 20, 15, 10 — всего 115 махов, а между ступенями по 5 бёрпи. На время, лимит 12 минут. Хитрость в хвате: не сжимай дужку до белых пальцев, держи гирю «крючком» из пальцев, а на бёрпи давай кистям отдохнуть. Запиши время.',
    en: 'A swing ladder up and back down: 10, 15, 20, 25, 20, 15, 10 — 115 swings in total, with 5 burpees between rungs. For time, 12-minute cap. The trick is the grip: do not white-knuckle the handle, hook it with your fingers and let your hands rest during the burpees. Note your time.',
  },
  basePoints: 100,
  tags: ['metcon', 'fortime', 'ladder'],
  blocks: [
    warmup('ld_warmup', [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
    ]),
    {
      id: 'ld_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 720,
      title: { ru: 'Лестница на время', en: 'Ladder for time' },
      description: {
        ru: 'Лимит 12 минут. Ступени махов 10-15-20-25-20-15-10, между ступенями 5 бёрпи. Махи без пауз внутри ступени; отдых — только на смене упражнения, не дольше 10 секунд.',
        en: '12-minute cap. Swing rungs of 10-15-20-25-20-15-10 with 5 burpees between rungs. No breaks inside a rung; rest only when switching exercises, no longer than 10 seconds.',
      },
      items: [
        { exerciseId: 'kb_swing', reps: 10, load: 'medium' },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'kb_swing', reps: 15, load: 'medium' },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'kb_swing', reps: 20, load: 'medium' },
        { exerciseId: 'burpee', reps: 5 },
        {
          exerciseId: 'kb_swing',
          reps: 25,
          load: 'medium',
          note: {
            ru: 'Вершина лестницы. Дыши ритмично: выдох на каждом махе.',
            en: 'The top of the ladder. Breathe in rhythm: exhale on every swing.',
          },
        },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'kb_swing', reps: 20, load: 'medium' },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'kb_swing', reps: 15, load: 'medium' },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'kb_swing', reps: 10, load: 'medium' },
      ],
    },
    {
      id: 'ld_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'dead_bug', reps: 12 },
        { exerciseId: 'leg_raise', reps: 12 },
      ],
    },
    cooldown('ld_cooldown'),
  ],
};

const W_METCON_AMRAP15: WorkoutInput = {
  id: 'w_metcon_amrap15',
  name: { ru: 'Метаболизм: AMRAP 15', en: 'Metabolic: AMRAP 15' },
  focus: { ru: 'Длинный AMRAP перед бенчмарком', en: 'The long AMRAP before the benchmark' },
  description: {
    ru: 'Пятнадцать минут ровной работы: махи, гоблет-присед, отжимания, бёрпи. Это репетиция бенчмарка следующей недели — та же связка «мах + присед», только с отжиманиями и бёрпи между ними. Первые пять минут на 80 %, дальше держи темп, последние две — всё, что осталось. Считай круги.',
    en: 'Fifteen minutes of steady work: swings, goblet squats, push-ups, burpees. This is the rehearsal for next week\'s benchmark — the same "swing + squat" pairing, with push-ups and burpees in between. First five minutes at 80%, then hold the pace, and give whatever is left in the last two. Count your rounds.',
  },
  basePoints: 110,
  tags: ['metcon', 'amrap', 'cardio'],
  blocks: [
    warmup('am_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'inchworm', reps: 5 },
    ]),
    {
      id: 'am_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 900,
      title: { ru: 'AMRAP 15 минут', en: 'AMRAP 15 minutes' },
      description: {
        ru: 'Как можно больше кругов за 15 минут. Отдыхай короткими паузами по 5–10 секунд, а не одной длинной. Ставь гирю на пол мягко — не роняй.',
        en: 'As many rounds as possible in 15 minutes. Rest in short 5–10 second breaks, not one long one. Set the bell down gently — do not drop it.',
      },
      items: [
        { exerciseId: 'kb_swing', reps: 15, load: 'medium' },
        { exerciseId: 'kb_goblet_squat', reps: 10, load: 'medium' },
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'burpee', reps: 5 },
      ],
    },
    {
      id: 'am_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: { ru: 'Кор', en: 'Core' },
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'leg_raise', reps: 12 },
      ],
    },
    cooldown('am_cooldown'),
  ],
};

/* --- Easy flow (deload / taper) ----------------------------------------------------- */

const W_FLOW: WorkoutInput = {
  id: 'w_flow',
  name: { ru: 'Лёгкий поток', en: 'Easy flow' },
  focus: {
    ru: 'Техника с лёгкой гирей и растяжка',
    en: 'Technique with a light bell and stretching',
  },
  description: {
    ru: 'Короткая техническая тренировка без счёта на время: гало, становая тяга, махи, турецкий подъём и гоблет-присед с паузой — всё с самой лёгкой гирей, три спокойных круга. Это день, когда ты шлифуешь движения, а не устаёшь. В конце — длинная заминка с удержанием в приседе.',
    en: 'A short technique session with no clock: halos, deadlifts, swings, the Turkish get-up and a paused goblet squat — all with your lightest bell, three unhurried rounds. This is the day you polish the movements rather than get tired. A long cool-down with a bottom squat hold to finish.',
  },
  basePoints: 90,
  tags: ['skill', 'mobility', 'deload'],
  blocks: [
    warmup('fl_warmup', [
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'bird_dog', reps: 10 },
      { exerciseId: 'leg_swing', reps: 10, perSide: true },
      { exerciseId: 'worlds_greatest_stretch', reps: 4, perSide: true },
    ]),
    {
      id: 'fl_skill',
      type: 'skill',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 45,
      title: { ru: 'Технический круг', en: 'Technique round' },
      description: {
        ru: 'Три круга с лёгкой гирей. Каждое повторение — как на экзамене: медленно, с полной амплитудой и паузой в ключевой точке.',
        en: 'Three rounds with a light bell. Treat every rep like an exam: slow, full range, a pause at the key position.',
      },
      items: [
        { exerciseId: 'kb_halo', reps: 8, load: 'light' },
        { exerciseId: 'kb_deadlift', reps: 8, load: 'light' },
        {
          exerciseId: 'kb_swing',
          reps: 10,
          load: 'light',
          note: {
            ru: 'Следи за верхней точкой: колени прямые, ягодицы сжаты, гиря не выше груди.',
            en: 'Watch the top: knees straight, glutes squeezed, bell no higher than the chest.',
          },
        },
        { exerciseId: 'kb_turkish_get_up', reps: 1, perSide: true, load: 'light' },
        {
          exerciseId: 'kb_goblet_squat',
          reps: 8,
          load: 'light',
          note: {
            ru: 'Пауза две секунды внизу, локти раздвигают колени.',
            en: 'Two-second pause at the bottom, elbows pushing the knees out.',
          },
        },
      ],
    },
    cooldown('fl_cooldown', [
      { exerciseId: 'squat_hold', seconds: 45 },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ]),
  ],
};

/* --- Benchmark ---------------------------------------------------------------------- */

const W_BENCH_SWINGS_SQUATS: WorkoutInput = {
  id: 'w_bench_swings_squats',
  name: { ru: '100 махов и 50 приседаний', en: '100 swings & 50 squats' },
  focus: { ru: 'Бенчмарк: на время', en: 'Benchmark: for time' },
  description: {
    ru: 'Гиревой бенчмарк курса: 100 махов, затем 50 гоблет-приседаний, на время, лимит 12 минут. Махи разбивай сериями по 20–25 с паузой не дольше 10 секунд, приседы — по 10. Гиря средняя: та, с которой ты делал EMOM и AMRAP. Запиши время — это твой результат, который ты будешь бить в следующем цикле. Не уложился в лимит — запиши, сколько успел: это тоже результат.',
    en: 'The kettlebell benchmark of the course: 100 swings, then 50 goblet squats, for time, 12-minute cap. Break the swings into sets of 20–25 with pauses no longer than 10 seconds, the squats into sets of 10. Use the medium bell — the one you did the EMOM and AMRAP with. Write down your time: that is the number to beat in your next cycle. If you hit the cap, note how far you got — that is a result too.',
  },
  basePoints: 150,
  tags: ['benchmark', 'fortime'],
  blocks: [
    warmup('bs_warmup', [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'kb_halo', reps: 8, load: 'light' },
      { exerciseId: 'squat_to_stand', reps: 8 },
      { exerciseId: 'glute_bridge', reps: 12 },
    ]),
    {
      id: 'bs_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 720,
      title: { ru: '100 махов + 50 приседаний', en: '100 swings + 50 squats' },
      description: {
        ru: 'Лимит 12 минут. Сначала все махи, потом все приседы. Мах — до уровня груди, присед — ниже параллели.',
        en: '12-minute cap. All the swings first, then all the squats. Swing to chest height, squat below parallel.',
      },
      items: [
        {
          exerciseId: 'kb_swing',
          reps: 100,
          load: 'medium',
          note: {
            ru: 'Серии по 20–25, пауза не дольше 10 секунд.',
            en: 'Sets of 20–25, pauses no longer than 10 seconds.',
          },
        },
        {
          exerciseId: 'kb_goblet_squat',
          reps: 50,
          load: 'medium',
          note: {
            ru: 'Серии по 10. Гиря у груди, локти внутрь коленей.',
            en: 'Sets of 10. Bell at the chest, elbows inside the knees.',
          },
        },
      ],
    },
    cooldown('bs_cooldown', HINGE_STRETCHES),
  ],
};

/* ------------------------------------------------------------------------------------ */
/* Path                                                                                  */
/* ------------------------------------------------------------------------------------ */

const T_SQUAT_PRESS: L10n = { ru: 'Присед и жим', en: 'Squat & press' };
const T_SWING_SCHOOL: L10n = { ru: 'Школа маха', en: 'Swing school' };
const T_CLEAN_PRESS: L10n = { ru: 'Взятие и жим', en: 'Clean & press' };
const T_SNATCH: L10n = { ru: 'Рывок и мах', en: 'Snatch & swing' };
const T_METCON: L10n = { ru: 'Метаболизм', en: 'Metabolic' };
const T_FLOW: L10n = { ru: 'Лёгкий поток', en: 'Easy flow' };

const NODES: NodeInput[] = [
  /* Week 1 — baseline, first squat & press, first swing lesson. */
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
    id: 'w1d3_squat_press',
    week: 1,
    day: 3,
    kind: 'workout',
    workoutId: 'w_squat_press_a',
    title: T_SQUAT_PRESS,
    subtitle: {
      ru: '3 подхода · техника гоблет-приседа и жима',
      en: '3 sets · goblet squat and press form',
    },
  },
  rest(1, 4, REST_SORE),
  {
    id: 'w1d5_swing_school',
    week: 1,
    day: 5,
    kind: 'workout',
    workoutId: 'w_swing_school_a',
    title: T_SWING_SCHOOL,
    subtitle: {
      ru: 'Тяга → мах · турецкий подъём по шагам',
      en: 'Deadlift → swing · get-up step by step',
    },
  },
  rest(1, 7, REST_DEFAULT),

  /* Week 2 — same strength variant, swing volume and the clean, first EMOM. */
  {
    id: 'w2d1_squat_press',
    week: 2,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_a',
    title: T_SQUAT_PRESS,
    subtitle: { ru: '3 подхода · закрепляем технику', en: '3 sets · locking in the form' },
  },
  rest(2, 2, REST_SLEEP),
  {
    id: 'w2d3_swing_school',
    week: 2,
    day: 3,
    kind: 'workout',
    workoutId: 'w_swing_school_b',
    title: T_SWING_SCHOOL,
    subtitle: { ru: '4 подхода · махи и первое взятие', en: '4 sets · swings and the first clean' },
  },
  rest(2, 4, REST_HANDS),
  {
    id: 'w2d5_metcon',
    week: 2,
    day: 5,
    kind: 'workout',
    workoutId: 'w_metcon_emom12',
    title: T_METCON,
    subtitle: {
      ru: 'EMOM 12 мин · махи, присед, бёрпи',
      en: 'EMOM 12 min · swings, squats, burpees',
    },
  },
  rest(2, 7, REST_STREAK),

  /* Week 3 — B variant, the clean & press complex, the swing ladder. */
  {
    id: 'w3d1_squat_press',
    week: 3,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_b',
    title: T_SQUAT_PRESS,
    subtitle: { ru: '4 подхода · больше жима', en: '4 sets · more pressing' },
  },
  rest(3, 2, REST_SORE),
  {
    id: 'w3d3_clean_press',
    week: 3,
    day: 3,
    kind: 'workout',
    workoutId: 'w_clean_press',
    title: T_CLEAN_PRESS,
    subtitle: {
      ru: 'Комплекс 4 подхода · подъём по 2 на руку',
      en: '4-set complex · 2 get-ups per arm',
    },
  },
  rest(3, 4, REST_DEFAULT),
  {
    id: 'w3d5_metcon',
    week: 3,
    day: 5,
    kind: 'workout',
    workoutId: 'w_metcon_ladder',
    title: T_METCON,
    subtitle: {
      ru: 'Лестница махов · на время, лимит 12 мин',
      en: 'Swing ladder · for time, 12-min cap',
    },
  },
  rest(3, 7, REST_SLEEP),

  /* Week 4 — deload: same movements, volume ×0.65, longer rests (handled by the engine). */
  {
    id: 'w4d1_squat_press',
    week: 4,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_b',
    deload: true,
    title: T_SQUAT_PRESS,
    subtitle: { ru: 'Разгрузка · объём −35 %', en: 'Deload · volume −35%' },
  },
  rest(4, 2, REST_DELOAD),
  {
    id: 'w4d3_clean_press',
    week: 4,
    day: 3,
    kind: 'workout',
    workoutId: 'w_clean_press',
    deload: true,
    title: T_CLEAN_PRESS,
    subtitle: { ru: 'Разгрузка · объём −35 %', en: 'Deload · volume −35%' },
  },
  rest(4, 4, REST_DELOAD),
  {
    id: 'w4d5_flow',
    week: 4,
    day: 5,
    kind: 'workout',
    workoutId: 'w_flow',
    deload: true,
    title: T_FLOW,
    subtitle: {
      ru: 'Разгрузка · техника с лёгкой гирей',
      en: 'Deload · technique with a light bell',
    },
  },
  rest(4, 7, REST_SLEEP),

  /* Week 5 — C variant, the snatch, the long AMRAP. */
  {
    id: 'w5d1_squat_press',
    week: 5,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_c',
    title: T_SQUAT_PRESS,
    subtitle: { ru: '4 подхода + EMOM 12 · пик силы', en: '4 sets + EMOM 12 · peak strength' },
  },
  rest(5, 2, REST_SORE),
  {
    id: 'w5d3_snatch',
    week: 5,
    day: 3,
    kind: 'workout',
    workoutId: 'w_snatch_swing',
    title: T_SNATCH,
    subtitle: { ru: '4 подхода · первый рывок', en: '4 sets · your first snatch' },
  },
  rest(5, 4, REST_HANDS),
  {
    id: 'w5d5_metcon',
    week: 5,
    day: 5,
    kind: 'workout',
    workoutId: 'w_metcon_amrap15',
    title: T_METCON,
    subtitle: {
      ru: 'AMRAP 15 мин · репетиция бенчмарка',
      en: 'AMRAP 15 min · benchmark rehearsal',
    },
  },
  rest(5, 7, REST_DEFAULT),

  /* Week 6 — last strength day, the benchmark, a light technique day and the retest. */
  {
    id: 'w6d1_squat_press',
    week: 6,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_c',
    title: T_SQUAT_PRESS,
    subtitle: {
      ru: '4 подхода + EMOM 12 · последний силовой',
      en: '4 sets + EMOM 12 · last strength day',
    },
  },
  rest(6, 2, REST_BEFORE_BENCHMARK),
  {
    id: 'w6d3_benchmark',
    week: 6,
    day: 3,
    kind: 'benchmark',
    workoutId: 'w_bench_swings_squats',
    title: { ru: '100 махов и 50 приседаний', en: '100 swings & 50 squats' },
    subtitle: { ru: 'Бенчмарк · на время, лимит 12 мин', en: 'Benchmark · for time, 12-min cap' },
  },
  rest(6, 4, REST_SLEEP),
  {
    id: 'w6d5_flow',
    week: 6,
    day: 5,
    kind: 'workout',
    workoutId: 'w_flow',
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

export const COURSE_KETTLEBELL: CourseInput = {
  id: 'kettlebell',
  order: 4,
  slug: { ru: 'girya-sila-i-metabolizm', en: 'kettlebell-power' },
  name: { ru: 'Гиря: сила и метаболизм', en: 'Kettlebell Power' },
  tagline: {
    ru: 'Шесть недель с одной гирей: от становой тяги до рывка, три тренировки в неделю.',
    en: 'Six weeks with a single kettlebell: from the deadlift to the snatch, three sessions a week.',
  },
  description: {
    ru: 'Курс вокруг гиревого маха и всего, что из него вырастает: взятие, жим, рывок, турецкий подъём и переноски. Силовые дни, EMOM и лестницы махов, разгрузочная неделя и бенчмарк «100 махов + 50 приседаний» в финале. Дома, с одной гирей.',
    en: 'A course built around the kettlebell swing and everything that grows out of it: the clean, the press, the snatch, the Turkish get-up and carries. Strength days, swing EMOMs and ladders, a deload week and the "100 swings + 50 squats" benchmark at the end. At home, with one bell.',
  },
  longDescription: [
    {
      ru: 'Гиря — самый честный домашний снаряд: один кусок железа, а нагрузку из него можно вытащить любую. Каждая неделя курса — три разных дня. «Присед и жим»: гоблет-присед, жим стоя, выпады с гирей у груди и отжимания. «Школа маха»: здесь живёт главная линия курса — становая тяга, потом мах, из маха взятие на грудь, из взятия жим, а на пятой неделе — рывок; на каждом таком дне есть блок турецкого подъёма и переноски. И «Метаболизм»: EMOM махов, лестница 10–25–10 на время и длинный AMRAP.',
      en: 'A kettlebell is the most honest piece of home equipment: one lump of iron, and you can get any kind of load out of it. Every week of the course has three different days. "Squat & press": goblet squats, standing press, front-rack lunges and push-ups. "Swing school", where the main thread of the course lives — the deadlift, then the swing, the clean out of the swing, the press out of the clean, and in week five the snatch; every one of these days also has a Turkish get-up block and carries. And "Metabolic": swing EMOMs, a 10–25–10 ladder for time and a long AMRAP.',
    },
    {
      ru: 'Ты начинаешь с теста без гири — отжимания за две минуты, приседания за минуту, планка на время, бёрпи за минуту. По нему приложение подбирает стартовый объём, а после каждой тренировки уточняет его по твоей оценке усилия. Вес гири ты не считаешь сам: в программе стоят метки «лёгкая», «средняя», «тяжёлая», и приложение подставляет твои гири. Четвёртая неделя — разгрузочная: объём падает примерно на треть, техника остаётся. В шестой — последний силовой день, бенчмарк «100 махов + 50 гоблет-приседаний» на время и повторный тест.',
      en: 'You start with a bodyweight test — push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses it to set your starting volume, then fine-tunes it after every session from your effort rating. You never have to calculate the bell weight yourself: the program uses "light", "medium" and "heavy" labels and the app maps them to the bells you own. Week four is a deload: volume drops by about a third, the technique work stays. Week six holds the last strength day, the "100 swings + 50 goblet squats" benchmark for time and the retest.',
    },
    {
      ru: 'Из инвентаря нужна одна гиря и коврик. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, приложение само выберет полегче для жима и рывка и потяжелее для тяги и переносок. Вторая гиря не нужна: прогулка фермера в курсе делается с одной, со сменой руки.',
      en: 'All you need is one kettlebell and a mat. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several bells, the app picks a lighter one for the press and the snatch and a heavier one for deadlifts and carries. You do not need a second bell: the farmer carry in this course is done with one, switching hands.',
    },
  ],
  forWhom: [
    {
      ru: 'Ты уже тренировался: отжимаешься от пола 8–10 раз подряд и стоишь в планке минуту.',
      en: 'You have trained before: you can do 8–10 full push-ups in a row and hold a plank for a minute.',
    },
    {
      ru: 'У тебя есть гиря (или ты готов её купить) и ты хочешь уметь с ней всё, а не только махать.',
      en: 'You own a kettlebell (or are ready to buy one) and want to be able to do everything with it, not just swing.',
    },
    {
      ru: 'Тебе нужны сила и выносливость одновременно — за 30–35 минут три раза в неделю.',
      en: 'You want strength and conditioning at the same time — in 30–35 minutes, three times a week.',
    },
    {
      ru: 'Ты прошёл «Старт» или «Своим весом» и хочешь добавить к собственному весу железо.',
      en: 'You finished Start or Bodyweight Engine and want to add iron to bodyweight.',
    },
  ],
  outcomes: [
    {
      ru: 'Чистый мах гирей: наклон от бёдер, прямая спина, гиря летит от таза, а не от рук.',
      en: 'A clean kettlebell swing: hinge from the hips, flat back, the bell driven by the hips rather than the arms.',
    },
    {
      ru: 'Освоишь взятие на грудь, жим стоя, рывок и турецкий подъём — весь базовый гиревой набор.',
      en: 'You learn the clean, the standing press, the snatch and the Turkish get-up — the whole basic kettlebell toolkit.',
    },
    {
      ru: 'Пройдёшь бенчмарк «100 махов + 50 гоблет-приседаний» и запишешь время, которое будешь бить дальше.',
      en: 'You complete the "100 swings + 50 goblet squats" benchmark and record a time to beat next cycle.',
    },
    {
      ru: 'Больше отжиманий, приседаний, планки и бёрпи в повторном тесте — ты сравнишь первую и шестую неделю.',
      en: 'More push-ups, squats, plank time and burpees in the retest — you compare week one with week six.',
    },
    {
      ru: 'Сильный хват и устойчивый кор за счёт переносок, турецкого подъёма и планок.',
      en: 'A strong grip and a stable core from carries, get-ups and planks.',
    },
  ],
  equipment: ['kettlebell', 'none', 'mat'],
  level: 2,
  weeks: 6,
  sessionsPerWeek: 3,
  avgSessionMin: 32,
  accent: '#FFB4A8',
  gradient: ['#FFB4A8', '#FFD9A8'],
  price: { rub: 3990, usd: 39 },
  workouts: [
    W_TEST,
    W_SQUAT_PRESS_A,
    W_SQUAT_PRESS_B,
    W_SQUAT_PRESS_C,
    W_SWING_SCHOOL_A,
    W_SWING_SCHOOL_B,
    W_CLEAN_PRESS,
    W_SNATCH_SWING,
    W_METCON_EMOM12,
    W_METCON_LADDER,
    W_METCON_AMRAP15,
    W_FLOW,
    W_BENCH_SWINGS_SQUATS,
  ],
  nodes: NODES,
  faq: [
    {
      q: { ru: 'Какая гиря нужна? Одна или две?', en: 'What kettlebell do I need? One or two?' },
      a: {
        ru: 'Одной достаточно — весь курс построен под одну гирю, а прогулка фермера делается со сменой руки. Ориентир по весу: мужчинам с опытом тренировок — 16 кг, без опыта — 12; женщинам — 8–12 кг. Если гирь несколько, укажи их в профиле: приложение подставит полегче туда, где в программе стоит «лёгкая» (жим, рывок, турецкий подъём в первые недели), и потяжелее туда, где «тяжёлая» (становая тяга, переноски). Ещё нужен коврик.',
        en: 'One is enough — the whole course is built around a single bell, and the farmer carry is done switching hands. A weight guideline: men with some training experience — 16 kg, without it — 12 kg; women — 8–12 kg. If you own several, list them in your profile: the app uses a lighter one where the program says "light" (press, snatch, the get-up in the first weeks) and a heavier one where it says "heavy" (deadlifts, carries). You also need a mat.',
      },
    },
    {
      q: {
        ru: 'Я никогда не занимался с гирей. Мне подойдёт?',
        en: 'I have never trained with a kettlebell. Is this for me?',
      },
      a: {
        ru: 'Да, если у тебя есть общая база: 8–10 отжиманий от пола подряд, минута планки, 15–20 приседаний без одышки. Гиревая техника здесь строится с нуля: первые две недели — только тяга, мах и разбор турецкого подъёма, взятие появляется на второй неделе, жим из взятия на третьей, рывок на пятой. Если базы пока нет, пройди сначала «Старт» — четыре недели без инвентаря, и возвращайся.',
        en: 'Yes, if you have a general base: 8–10 full push-ups in a row, a one-minute plank, 15–20 squats without getting winded. Kettlebell technique is built from scratch here: the first two weeks are only the deadlift, the swing and the get-up steps; the clean appears in week two, the press out of the clean in week three, the snatch in week five. If the base is not there yet, do Start first — four weeks with no equipment — and come back.',
      },
    },
    {
      q: { ru: 'Сколько времени занимает тренировка?', en: 'How long is a session?' },
      a: {
        ru: 'В среднем 32 минуты вместе с разминкой и заминкой: силовые дни и «Школа маха» — 28–37 минут, метаболические дни — 25–30, «Лёгкий поток» — около 20, бенчмарк — 20–25. Три тренировки в неделю; в последней неделе добавляется короткий технический день перед повторным тестом. Перед стартом приложение показывает расчётную длительность именно для твоего объёма.',
        en: 'About 32 minutes on average including warm-up and cool-down: strength days and Swing school run 28–37 minutes, metabolic days 25–30, Easy flow about 20, the benchmark 20–25. Three sessions a week; the final week adds a short technique day before the retest. Before you start, the app shows the estimated duration for your own volume.',
      },
    },
    {
      q: { ru: 'Пропустил тренировку — что делать?', en: 'I missed a session — what now?' },
      a: {
        ru: 'Ничего страшного: путь не сбрасывается, просто продолжай со следующего узла, когда сможешь. Не делай две тренировки в один день, чтобы «догнать», — лучше сдвинуть неделю. Если пауза была больше двух недель, выбери «Полегче» в первых двух тренировках после перерыва и возьми гирю полегче на махах: хват и ладони отвыкают быстрее, чем ноги.',
        en: 'No problem: the path does not reset, just continue from the next node when you can. Do not double up to "catch up" — shifting the week is better. If the break was longer than two weeks, pick "Easier" for the first two sessions back and use a lighter bell on the swings: your grip and palms lose the habit faster than your legs do.',
      },
    },
    {
      q: {
        ru: 'После махов болит поясница. Это нормально?',
        en: 'My lower back hurts after swings. Is that normal?',
      },
      a: {
        ru: 'Тянущая усталость в ягодицах и задней поверхности бедра через день после махов — норма. Боль именно в пояснице — нет: чаще всего это значит, что наклон идёт спиной, а не бёдрами, или гиря опускается слишком низко к коленям. Вернись к становой тяге с гирей и махам с лёгкой гирей, следи, чтобы гиря проходила высоко «в пах», а наверху сжимай ягодицы. Отметь «Боль» в отчёте после тренировки — приложение снизит нагрузку. Если боль резкая, отдаёт в ногу или не проходит несколько дней — покажись врачу.',
        en: 'Dull fatigue in the glutes and hamstrings the day after swings is normal. Pain in the lower back itself is not: most often it means you are bending with your back instead of your hips, or letting the bell drop too low toward the knees. Go back to kettlebell deadlifts and swings with a light bell, keep the bell passing high into the groin and squeeze your glutes at the top. Mark "Pain" in the post-workout feedback — the app reduces the load. If the pain is sharp, radiates into a leg or lasts several days, see a doctor.',
      },
    },
    {
      q: { ru: 'Как приложение подстраивает нагрузку?', en: 'How does the app adapt the load?' },
      a: {
        ru: 'Стартовый объём считается по тесту первого дня. После каждой тренировки ты оцениваешь усилие по шкале от 1 до 10 и самочувствие — и приложение чуть поднимает или снижает число повторений на следующий раз. Перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее»; рекомендацию приложение даёт по последним тренировкам и по тому, сколько ты отдыхал. Вес гири оно выбирает из тех, что ты указал в профиле, по меткам «лёгкая / средняя / тяжёлая». В четвёртую неделю объём снижается автоматически, а если ты отметил проблемы с поясницей или плечами, тяжёлые махи и жимы заменяются на более щадящие варианты.',
        en: 'Your starting volume comes from the day-one test. After every session you rate the effort from 1 to 10 and how you felt, and the app nudges the reps up or down for next time. Before each session you can pick Easier, As usual or Harder; the app recommends one based on your recent sessions and how much you have rested. It picks the bell from the ones in your profile using the "light / medium / heavy" labels. In week four the volume drops automatically, and if you flagged lower-back or shoulder issues, heavy swings and presses are swapped for gentler variants.',
      },
    },
  ],
};
