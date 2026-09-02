/**
 * Course "dumbbells" — «Гантели дома: сила и рельеф» / "Dumbbell Builder".
 *
 * Level 2, six weeks, four sessions a week, a pair of dumbbells and a mat.
 *
 * Weekly skeleton (D = day of week):
 *   D1 squat & press (+ core) · D2 rest · D3 hinge & pull (+ core) · D4 engine (EMOM / AMRAP /
 *   Tabata, each with a short skill block for the clean, thruster or snatch) · D5 rest ·
 *   D6 dumbbell complex or benchmark · D7 rest
 * Week 1 opens with the baseline test, week 3 ends with dumbbell "DT", week 4 is a deload
 * (volume ×0.65 and rest ×1.2 applied by the engine), week 6 holds 21-15-9 thrusters & burpees
 * and the retest.
 *
 * Progression: A variants (weeks 1–2: 3 sets, medium loads) → B (weeks 3–4: 4 sets, heavy
 * floor press / deadlift, first AMRAP finisher) → C (weeks 5–6: the heavy pair everywhere,
 * renegade rows, AMRAP 10). Loads are labels (`light` / `medium` / `heavy`); the engine maps
 * them to the athlete's own dumbbells. Numbers are authored for a level-2 athlete at scale 1.0.
 *
 * Note: the engine and the player read the round count of a `fortime` block from `sets`;
 * `rounds` is mirrored on those blocks for readers of the raw content.
 */
import type { CourseInput, L10n, WorkoutInput } from '@/content/schema';

type BlockInput = WorkoutInput['blocks'][number];
type ItemInput = BlockInput['items'][number];
type NodeInput = CourseInput['nodes'][number];

const l = (ru: string, en: string): L10n => ({ ru, en });

/* ------------------------------------------------------------------------------------ */
/* Shared building blocks                                                                */
/* ------------------------------------------------------------------------------------ */

const WARMUP_DEFAULT = l(
  'Два круга в спокойном темпе. Цель — разогреть суставы и прожить амплитуду, а не устать.',
  'Two easy rounds. The goal is to warm up the joints and move through full range, not to get tired.',
);

function warmup(id: string, items: ItemInput[], description: L10n = WARMUP_DEFAULT): BlockInput {
  return {
    id,
    type: 'warmup',
    format: 'circuit',
    sets: 2,
    scalable: false,
    title: l('Разминка', 'Warm-up'),
    description,
    items,
  };
}

/** Squat & press days: legs on, shoulders open, squat and lunge pattern rehearsed. */
function wuSquatPress(id: string): BlockInput {
  return warmup(id, [
    { exerciseId: 'jog_in_place', seconds: 45 },
    { exerciseId: 'arm_circles', seconds: 30 },
    { exerciseId: 'squat_to_stand', reps: 6 },
    { exerciseId: 'worlds_greatest_stretch', reps: 2, perSide: true },
  ]);
}

/** Hinge & pull days: spine, hips, hamstrings. */
function wuHingePull(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'leg_swing', reps: 8, perSide: true },
      { exerciseId: 'inchworm', reps: 4 },
    ],
    l(
      'Два круга без спешки. Разбуди спину и тазобедренные суставы — сегодня они работают больше всего.',
      'Two unhurried rounds. Wake up the spine and the hips — they do most of the work today.',
    ),
  );
}

/** Engine days: get the heart rate up before the clock starts. */
function wuEngine(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'jumping_jack', reps: 20 },
      { exerciseId: 'high_knees', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'arm_circles', seconds: 30 },
    ],
    l(
      'Два круга, второй быстрее первого: пульс должен подняться до старта таймера.',
      'Two rounds, the second quicker than the first: your heart rate should be up before the timer starts.',
    ),
  );
}

/** Complex / benchmark days: whole body, hinge and overhead included. */
function wuFull(id: string): BlockInput {
  return warmup(id, [
    { exerciseId: 'jumping_jack', reps: 20 },
    { exerciseId: 'worlds_greatest_stretch', reps: 3, perSide: true },
    { exerciseId: 'squat_to_stand', reps: 6 },
    { exerciseId: 'arm_circles', seconds: 30 },
  ]);
}

/** Light warm-up before the test: ready, not tired. */
function wuTest(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'jog_in_place', seconds: 45 },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'inchworm', reps: 3 },
    ],
    l(
      'Лёгкая разминка. Не утомляйся: силы нужны для теста.',
      'A light warm-up. Do not tire yourself out: save your strength for the test.',
    ),
  );
}

const COOLDOWN_DEFAULT = l(
  'Дыши медленно, тянись без рывков и не через боль. Пульс должен опуститься до разговорного.',
  'Breathe slowly, stretch without bouncing and never into pain. Let your heart rate come down to a talking pace.',
);

function cooldown(
  id: string,
  items: ItemInput[],
  description: L10n = COOLDOWN_DEFAULT,
): BlockInput {
  return {
    id,
    type: 'cooldown',
    format: 'sets',
    sets: 1,
    scalable: false,
    title: l('Заминка', 'Cool-down'),
    description,
    items,
  };
}

/** After squats, presses and thrusters: hips, hamstrings, a deep squat, a rest pose. */
function cdLower(id: string): BlockInput {
  return cooldown(id, [
    { exerciseId: 'squat_hold', seconds: 30 },
    { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
    { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
    { exerciseId: 'child_pose', seconds: 45 },
  ]);
}

/** After deadlifts and rows: spine mobility, hamstrings, hip flexors, rest pose. */
function cdHinge(id: string): BlockInput {
  return cooldown(
    id,
    [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
    l(
      'Спокойно верни спину и таз в нейтраль: длинный выдох в каждой позе, без рывков.',
      'Gently bring the spine and hips back to neutral: a long exhale in every position, no bouncing.',
    ),
  );
}

/** After metcons and tests: bring the heart rate down, open the hips. */
function cdEngine(id: string): BlockInput {
  return cooldown(
    id,
    [
      { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
    l(
      'Если ещё тяжело дышать — походи минуту, потом тянись. Заминка должна закончиться на спокойном пульсе.',
      'Still breathing hard? Walk for a minute first, then stretch. The cool-down should end at a calm heart rate.',
    ),
  );
}

/** The long stretch of the easy day. */
function cdLong(id: string): BlockInput {
  return cooldown(
    id,
    [
      { exerciseId: 'hip_flexor_stretch', seconds: 45, perSide: true },
      { exerciseId: 'hamstring_stretch', seconds: 45, perSide: true },
      { exerciseId: 'child_pose', seconds: 60 },
      { exerciseId: 'cat_cow', reps: 8 },
    ],
    l(
      'Сегодня растяжка длиннее обычного. Не торопись: это часть тренировки, а не довесок к ней.',
      'The stretch is longer than usual today. Take your time: it is part of the session, not an add-on.',
    ),
  );
}

/* ------------------------------------------------------------------------------------ */
/* Workouts                                                                              */
/* ------------------------------------------------------------------------------------ */

const W_TEST: WorkoutInput = {
  id: 'w_test',
  name: l('Тест: отжимания, присед, планка, бёрпи', 'Test: push-ups, squats, plank, burpees'),
  focus: l('Точка отсчёта', 'Baseline'),
  description: l(
    'Четыре коротких теста с отдыхом по 90 секунд: отжимания за две минуты, приседания за минуту, планка на максимум и бёрпи за минуту. По ним приложение подберёт стартовый объём, а в конце курса ты повторишь тест и сравнишь цифры. Работай честно, но без геройства: считаются только чистые повторения.',
    'Four short tests with 90 seconds of rest between them: push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app uses them to set your starting volume, and at the end of the course you repeat the test and compare the numbers. Be honest, not heroic: only clean reps count.',
  ),
  basePoints: 80,
  tags: ['test', 'push', 'squat', 'core'],
  blocks: [
    wuTest('test_warmup'),
    {
      id: 'test_main',
      type: 'test',
      format: 'sets',
      sets: 1,
      scalable: false,
      title: l('Тест', 'Test'),
      description: l(
        'Максимум повторений за отведённое время, отдых 90 секунд между тестами. Останавливайся, как только ломается техника.',
        'Max reps in the given time, 90 seconds of rest between tests. Stop as soon as your form breaks.',
      ),
      items: [
        {
          exerciseId: 'push_up',
          seconds: 120,
          restAfterSec: 90,
          note: l(
            'Максимум за 2 минуты. Грудь касается пола, локти выпрямляются полностью. Отдыхать можно в верхней точке.',
            'Max reps in 2 minutes. Chest to the floor, elbows fully locked at the top. Rest at the top if you need to.',
          ),
        },
        {
          exerciseId: 'air_squat',
          seconds: 60,
          restAfterSec: 90,
          note: l(
            'Максимум за минуту. Бедро ниже параллели, полное выпрямление наверху.',
            'Max reps in one minute. Hips below parallel, full extension at the top.',
          ),
        },
        {
          exerciseId: 'plank',
          seconds: 300,
          restAfterSec: 90,
          note: l(
            'Держи, пока не провиснет поясница. Лимит — 5 минут.',
            'Hold until your lower back starts to sag. Five-minute limit.',
          ),
        },
        {
          exerciseId: 'burpee',
          seconds: 60,
          restAfterSec: 90,
          note: l(
            'Максимум за минуту: грудь касается пола, наверху прыжок с хлопком.',
            'Max reps in one minute: chest to the floor, jump and clap at the top.',
          ),
        },
      ],
    },
    cdEngine('test_cooldown'),
  ],
};

/* --- Squat & press ------------------------------------------------------------------- */

const W_SQUAT_PRESS_A: WorkoutInput = {
  id: 'w_squat_press_a',
  name: l('Присед и жим A', 'Squat & press A'),
  focus: l('Гоблет-присед и жим стоя: база', 'Goblet squat and standing press: the base'),
  description: l(
    'Первый силовой день курса. Четыре движения по кругу — гоблет-присед, жим гантелей стоя, обратные выпады и жим с пола — три подхода со средним весом. Задача первых двух недель — найти рабочие веса и отточить технику, а не вымотаться. В конце короткий блок на кор.',
    'The first strength day of the course. Four movements in rotation — goblet squat, standing dumbbell press, reverse lunges and floor press — three sets at a medium weight. The job of the first two weeks is to find your working weights and sharpen technique, not to exhaust yourself. A short core block to finish.',
  ),
  basePoints: 100,
  tags: ['strength', 'squat', 'push', 'core'],
  blocks: [
    wuSquatPress('spa_warmup'),
    {
      id: 'spa_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 75,
      title: l('Сила', 'Strength'),
      description: l(
        'Три подхода по кругу: присед → жим стоя → выпады → жим с пола. Между упражнениями 20 секунд, между подходами 75. Темп: две секунды вниз, одна вверх. Если в последнем подходе техника держится легко — в следующий раз бери вес тяжелее.',
        'Three sets in rotation: squat → standing press → lunges → floor press. Twenty seconds between exercises, 75 between sets. Tempo: two seconds down, one up. If form still feels easy in the last set, go heavier next time.',
      ),
      items: [
        {
          exerciseId: 'db_goblet_squat',
          reps: 12,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'Гантель у груди, локти внутрь коленей внизу, пятки на полу',
            'Dumbbell at the chest, elbows inside the knees at the bottom, heels down',
          ),
        },
        {
          exerciseId: 'db_shoulder_press',
          reps: 10,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'Сожми ягодицы и живот — поясница не прогибается',
            'Squeeze glutes and abs — no arching in the lower back',
          ),
        },
        {
          exerciseId: 'db_lunge',
          reps: 12,
          load: 'medium',
          restAfterSec: 20,
          note: l('По 6 на ногу, гантели вдоль тела', '6 per leg, dumbbells at your sides'),
        },
        {
          exerciseId: 'db_floor_press',
          reps: 12,
          load: 'medium',
          note: l(
            'Локти под 45°, касание трицепсом пола — и жми',
            'Elbows at 45°, touch the triceps to the floor, then press',
          ),
        },
      ],
    },
    {
      id: 'spa_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. Таз не крутится в касаниях плеч — поставь ноги шире, если нужно.',
        'Two rounds. Hips stay still in the shoulder taps — widen your feet if you need to.',
      ),
      items: [
        { exerciseId: 'plank', seconds: 40 },
        { exerciseId: 'dead_bug', reps: 12 },
        { exerciseId: 'plank_shoulder_tap', reps: 16 },
      ],
    },
    cdLower('spa_cooldown'),
  ],
};

const W_SQUAT_PRESS_B: WorkoutInput = {
  id: 'w_squat_press_b',
  name: l('Присед и жим B', 'Squat & press B'),
  focus: l('Фронтальный присед, швунг и AMRAP 8', 'Front squat, push press and AMRAP 8'),
  description: l(
    'Гантели переезжают на плечи: фронтальный присед и швунг — движения, из которых потом складывается трастер. Четыре подхода, отдых 90 секунд, жим с пола — с тяжёлой парой. После силы — восемь минут AMRAP с лёгкими трастерами, чтобы связать всё в одно движение.',
    'The dumbbells move to your shoulders: front squats and push presses — the two pieces a thruster is made of. Four sets, 90 seconds of rest, floor press with the heavy pair. After the strength work, an eight-minute AMRAP with light thrusters to join it all into one movement.',
  ),
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'amrap', 'core'],
  blocks: [
    wuSquatPress('spb_warmup'),
    {
      id: 'spb_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Четыре подхода по кругу: фронтальный присед → швунг → жим с пола. Отдых 20 секунд между упражнениями и 90 между подходами. В швунге гантели уходят вверх за счёт ног — руки только доводят.',
        'Four sets in rotation: front squat → push press → floor press. Twenty seconds between exercises, 90 between sets. In the push press the legs launch the dumbbells — the arms only finish.',
      ),
      items: [
        {
          exerciseId: 'db_front_squat',
          reps: 10,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'Гантели на плечах, локти вперёд, грудь вверх',
            'Dumbbells on the shoulders, elbows forward, chest up',
          ),
        },
        {
          exerciseId: 'db_push_press',
          reps: 8,
          load: 'medium',
          restAfterSec: 20,
          note: l('Короткий подсед — и резко вверх', 'A short dip, then drive up hard'),
        },
        {
          exerciseId: 'db_floor_press',
          reps: 12,
          load: 'heavy',
          note: l(
            'Тяжёлая пара: последние два повторения — с усилием',
            'The heavy pair: the last two reps should be a grind',
          ),
        },
      ],
    },
    {
      id: 'spb_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 480,
      title: l('AMRAP 8 мин', 'AMRAP 8 min'),
      description: l(
        'Максимум кругов за 8 минут: 8 трастеров, 8 отжиманий, 12 приседаний. Лёгкая пара гантелей. Держи ровный темп — это финишер, а не бенчмарк.',
        'As many rounds as possible in 8 minutes: 8 thrusters, 8 push-ups, 12 air squats. Light dumbbells. Keep an even pace — this is a finisher, not a benchmark.',
      ),
      items: [
        {
          exerciseId: 'db_thruster',
          reps: 8,
          load: 'light',
          note: l(
            'Из приседа сразу в жим, одним движением',
            'Straight from the squat into the press, one movement',
          ),
        },
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'air_squat', reps: 12 },
      ],
    },
    {
      id: 'spb_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. В лодочке поясница прижата к полу; если отрывается — согни колени.',
        'Two rounds. In the hollow hold press the lower back into the floor; if it lifts, bend the knees.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cdLower('spb_cooldown'),
  ],
};

const W_SQUAT_PRESS_C: WorkoutInput = {
  id: 'w_squat_press_c',
  name: l('Присед и жим C', 'Squat & press C'),
  focus: l('Тяжёлый фронтальный присед и AMRAP 10', 'Heavy front squats and AMRAP 10'),
  description: l(
    'Пик силового дня: тяжёлая пара во фронтальном приседе и швунге, выпады с гантелями на плечах. Потом десять минут AMRAP — трастеры, бёрпи, ситапы: та же связка, что ждёт тебя в финальном бенчмарке, только короче. Кор — лодочка и складка.',
    'The strength day peaks: the heavy pair in front squats and push presses, lunges with the dumbbells on the shoulders. Then a ten-minute AMRAP — thrusters, burpees, sit-ups: the same pairing you will meet in the final benchmark, just shorter. Core: hollow hold and V-ups.',
  ),
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'amrap', 'core', 'peak'],
  blocks: [
    wuSquatPress('spc_warmup'),
    {
      id: 'spc_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: l('Сила', 'Strength'),
      description: l(
        'Четыре подхода по кругу: фронтальный присед → швунг → выпады. Отдых 75 секунд. Вес тяжёлый, но техника не ломается: если два последних повторения не идут чисто — уменьши вес, а не глубину.',
        'Four sets in rotation: front squat → push press → lunges. Rest 75 seconds. Heavy weight, but form holds: if the last two reps are not clean, drop the weight, not the depth.',
      ),
      items: [
        {
          exerciseId: 'db_front_squat',
          reps: 12,
          load: 'heavy',
          restAfterSec: 20,
          note: l('Ниже параллели, локти не падают', 'Below parallel, elbows stay up'),
        },
        {
          exerciseId: 'db_push_press',
          reps: 10,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Гантели над макушкой, локти выпрямлены полностью',
            'Dumbbells over the crown of the head, elbows fully locked',
          ),
        },
        {
          exerciseId: 'db_lunge',
          reps: 12,
          load: 'medium',
          note: l('По 6 на ногу, гантели на плечах', '6 per leg, dumbbells on the shoulders'),
        },
      ],
    },
    {
      id: 'spc_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 600,
      title: l('AMRAP 10 мин', 'AMRAP 10 min'),
      description: l(
        'Максимум кругов за 10 минут: 8 трастеров, 5 бёрпи, 10 ситапов. Разбивай трастеры на 4 + 4 раньше, чем придётся бросать гантели посреди подхода.',
        'As many rounds as possible in 10 minutes: 8 thrusters, 5 burpees, 10 sit-ups. Split the thrusters 4 + 4 before you are forced to drop the dumbbells mid-set.',
      ),
      items: [
        { exerciseId: 'db_thruster', reps: 8, load: 'light' },
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'sit_up', reps: 10 },
      ],
    },
    {
      id: 'spc_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. Складка — руки и ноги встречаются над животом; поясница не «прыгает» с пола.',
        'Two rounds. In the V-up hands and feet meet over the belly; do not bounce the lower back off the floor.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        {
          exerciseId: 'v_up',
          reps: 10,
          note: l(
            'Не идёт складка — ситапы с прямыми руками над головой',
            'No V-ups yet? Sit-ups with straight arms overhead',
          ),
        },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cdLower('spc_cooldown'),
  ],
};

/* --- Hinge & pull -------------------------------------------------------------------- */

const W_HINGE_PULL_A: WorkoutInput = {
  id: 'w_hinge_pull_a',
  name: l('Тяга и спина A', 'Hinge & pull A'),
  focus: l('Становая, тяга в наклоне и ягодицы', 'Deadlift, bent-over row and glutes'),
  description: l(
    'День наклона и тяги: становая тяга с тяжёлой парой, тяга гантели в наклоне, румынская тяга и ягодичный мостик. Здесь ты учишься держать спину прямой под нагрузкой — навык, который бережёт поясницу во всех остальных тренировках. Кор — боковая планка, бёрд-дог и подъёмы ног.',
    'Hinge and pull day: deadlifts with the heavy pair, bent-over rows, Romanian deadlifts and glute bridges. This is where you learn to keep a flat back under load — the skill that protects your lower back in every other session. Core: side plank, bird dog and leg raises.',
  ),
  basePoints: 110,
  tags: ['strength', 'hinge', 'pull', 'core'],
  blocks: [
    wuHingePull('hpa_warmup'),
    {
      id: 'hpa_strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 75,
      title: l('Сила', 'Strength'),
      description: l(
        'Три подхода по кругу: становая → тяга в наклоне → румынская тяга → мостик. Отдых 20 секунд между упражнениями, 75 между подходами. Поясница нейтральна всё время: если не уверен — посмотри на себя сбоку в зеркало.',
        'Three sets in rotation: deadlift → bent-over row → Romanian deadlift → bridge. Twenty seconds between exercises, 75 between sets. Keep a neutral lower back throughout: if in doubt, check yourself side-on in a mirror.',
      ),
      items: [
        {
          exerciseId: 'db_deadlift',
          reps: 12,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Гантели вдоль голеней, вставай через пятки',
            'Dumbbells along the shins, drive up through the heels',
          ),
        },
        {
          exerciseId: 'db_row',
          reps: 10,
          perSide: true,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Свободная рука упирается в колено, локоть тянется к бедру',
            'Free hand braced on the knee, pull the elbow towards the hip',
          ),
        },
        {
          exerciseId: 'db_rdl',
          reps: 10,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'Колени мягкие, гантели скользят по бёдрам до середины голени',
            'Soft knees, dumbbells slide down the thighs to mid-shin',
          ),
        },
        {
          exerciseId: 'glute_bridge',
          reps: 15,
          note: l('Секунда паузы наверху', 'One-second pause at the top'),
        },
      ],
    },
    {
      id: 'hpa_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга без спешки: таз не проваливается в боковой планке, поясница на полу в подъёмах ног.',
        'Two unhurried rounds: hips stay up in the side plank, lower back on the floor in the leg raises.',
      ),
      items: [
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
        { exerciseId: 'bird_dog', reps: 10 },
        { exerciseId: 'leg_raise', reps: 10 },
      ],
    },
    cdHinge('hpa_cooldown'),
  ],
};

const W_HINGE_PULL_B: WorkoutInput = {
  id: 'w_hinge_pull_b',
  name: l('Тяга и спина B', 'Hinge & pull B'),
  focus: l('Четыре подхода и прогулка фермера', 'Four sets and the farmer carry'),
  description: l(
    'Четыре подхода вместо трёх, больше повторений в тяге, а в блок на кор приходит прогулка фермера — самое честное упражнение на хват и осанку. Становая по-прежнему с тяжёлой парой; если пары две, румынскую делай со средней.',
    'Four sets instead of three, more reps in the row, and the farmer carry joins the core block — the most honest test of grip and posture there is. Deadlifts stay with the heavy pair; if you own two pairs, do the Romanian deadlift with the medium one.',
  ),
  basePoints: 120,
  tags: ['strength', 'hinge', 'pull', 'carry', 'core'],
  blocks: [
    wuHingePull('hpb_warmup'),
    {
      id: 'hpb_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Четыре подхода по кругу: становая → тяга в наклоне → румынская тяга. 20 секунд между упражнениями, 90 между подходами. В тяге в наклоне не крути корпус — тянет спина, а не поясница.',
        'Four sets in rotation: deadlift → bent-over row → Romanian deadlift. Twenty seconds between exercises, 90 between sets. Do not twist in the row — the back pulls, not the lower back.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 10, load: 'heavy', restAfterSec: 20 },
        { exerciseId: 'db_row', reps: 12, perSide: true, load: 'heavy', restAfterSec: 20 },
        {
          exerciseId: 'db_rdl',
          reps: 12,
          load: 'medium',
          note: l(
            'Три секунды вниз, растяжение сзади бедра — и вверх',
            'Three seconds down, feel the hamstrings stretch, then up',
          ),
        },
      ],
    },
    {
      id: 'hpb_core',
      type: 'core',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 30,
      title: l('Кор и хват', 'Core & grip'),
      description: l(
        'Три круга. Прогулка фермера с тяжёлой парой: если гантели тянут плечи вперёд — вес правильный, просто не давай им это сделать.',
        'Three rounds. Farmer carry with the heavy pair: if the dumbbells try to pull your shoulders forward, the weight is right — just do not let them.',
      ),
      items: [
        {
          exerciseId: 'farmer_carry',
          seconds: 40,
          load: 'heavy',
          note: l(
            'Плечи назад и вниз, шагай по комнате туда и обратно',
            'Shoulders back and down, walk the room back and forth',
          ),
        },
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
        { exerciseId: 'hollow_hold', seconds: 30 },
      ],
    },
    cdHinge('hpb_cooldown'),
  ],
};

const W_HINGE_PULL_C: WorkoutInput = {
  id: 'w_hinge_pull_c',
  name: l('Тяга и спина C', 'Hinge & pull C'),
  focus: l('Тяжёлая становая и тяга ренегата', 'Heavy deadlifts and renegade rows'),
  description: l(
    'Самый тяжёлый день тяги: двенадцать становых с тяжёлой парой, тяга ренегата в планке, румынская тяга тем же весом и 45 секунд прогулки фермера в каждом подходе. Кор — лодочка, боковая планка и складка. После такого дня отдых обязателен — и он в плане.',
    'The heaviest hinge day: twelve deadlifts with the heavy pair, renegade rows from the plank, Romanian deadlifts with the same weight and 45 seconds of farmer carry in every set. Core: hollow hold, side plank and V-ups. After a day like this the rest day is mandatory — and it is in the plan.',
  ),
  basePoints: 120,
  tags: ['strength', 'hinge', 'pull', 'carry', 'core', 'peak'],
  blocks: [
    wuHingePull('hpc_warmup'),
    {
      id: 'hpc_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Четыре подхода по кругу: становая → тяга ренегата → румынская тяга → прогулка фермера. 20 секунд между упражнениями, 90 между подходами. В тяге ренегата ноги шире плеч, таз не разворачивается.',
        'Four sets in rotation: deadlift → renegade row → Romanian deadlift → farmer carry. Twenty seconds between exercises, 90 between sets. In the renegade row set the feet wide and keep the hips square.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 12, load: 'heavy', restAfterSec: 20 },
        {
          exerciseId: 'db_renegade_row',
          reps: 12,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'По 6 на руку. Не идёт — тяга в наклоне по 8 на сторону',
            '6 per arm. Too hard? Bent-over rows, 8 per side',
          ),
        },
        { exerciseId: 'db_rdl', reps: 12, load: 'heavy', restAfterSec: 20 },
        { exerciseId: 'farmer_carry', seconds: 45, load: 'heavy' },
      ],
    },
    {
      id: 'hpc_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. Самый большой объём на корпус за курс — держи позиции, пока техника чистая, и не задерживай дыхание.',
        'Two rounds. The biggest core volume of the course — hold each position only while form is clean, and do not hold your breath.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 40 },
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
        {
          exerciseId: 'v_up',
          reps: 10,
          note: l('Или ситапы с прямыми руками', 'Or sit-ups with straight arms overhead'),
        },
      ],
    },
    cdHinge('hpc_cooldown'),
  ],
};

/* --- Engine (conditioning) ----------------------------------------------------------- */

const W_ENGINE_EMOM12: WorkoutInput = {
  id: 'w_engine_emom12',
  name: l('Двигатель: EMOM 12', 'Engine: EMOM 12'),
  focus: l('Взятие на грудь и темп по минутам', 'Cleans and pacing by the minute'),
  description: l(
    'Первый день выносливости. Сначала короткий блок техники взятия на грудь, потом EMOM 12: каждую минуту — новое упражнение, взятие, бёрпи, скалолаз, четыре круга. Сделал — отдыхай до конца минуты. Так ты учишься главному в кроссфите: распределять силы.',
    'The first conditioning day. A short clean-technique block first, then EMOM 12: a new exercise every minute — cleans, burpees, mountain climbers — four cycles. Finish the reps, rest for what is left of the minute. It teaches the core CrossFit skill: pacing.',
  ),
  basePoints: 100,
  tags: ['metcon', 'emom', 'skill', 'cardio'],
  blocks: [
    wuEngine('ee_warmup'),
    {
      id: 'ee_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 45,
      title: l('Техника: взятие на грудь', 'Skill: the clean'),
      description: l(
        'Два круга с лёгкой парой. Становая — чтобы вспомнить наклон, потом взятие: тяни ногами, локти быстро уходят вперёд, гантели ловишь на плечи в подседе.',
        'Two rounds with the light pair. Deadlifts to rehearse the hinge, then cleans: drive with the legs, whip the elbows forward, catch the dumbbells on the shoulders in a shallow squat.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 6, load: 'light' },
        { exerciseId: 'db_clean', reps: 6, load: 'light' },
      ],
    },
    {
      id: 'ee_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 12,
      title: l('EMOM 12 мин', 'EMOM 12 min'),
      description: l(
        'Минута 1 — взятие, минута 2 — бёрпи, минута 3 — скалолаз, и так четыре круга. Если работа занимает больше 40 секунд, в следующем круге убавь два повторения.',
        'Minute 1 cleans, minute 2 burpees, minute 3 mountain climbers, four cycles. If the work takes more than 40 seconds, drop two reps in the next cycle.',
      ),
      items: [
        {
          exerciseId: 'db_clean',
          reps: 8,
          load: 'medium',
          note: l('Две гантели, средний вес', 'Two dumbbells, medium weight'),
        },
        { exerciseId: 'burpee', reps: 6 },
        {
          exerciseId: 'mountain_climber',
          reps: 24,
          note: l(
            'Считай касания: 24 — это по 12 на ногу',
            'Count the touches: 24 means 12 per leg',
          ),
        },
      ],
    },
    cdEngine('ee_cooldown'),
  ],
};

const W_ENGINE_AMRAP12: WorkoutInput = {
  id: 'w_engine_amrap12',
  name: l('Двигатель: AMRAP 12', 'Engine: AMRAP 12'),
  focus: l('Трастеры и ровный темп', 'Thrusters and an even pace'),
  description: l(
    'Знакомство с трастером — главным движением этого курса: присед и жим одним махом. Короткий блок техники, затем 12 минут AMRAP: трастеры, отжимания, приседания, ситапы. Найди темп, который сможешь держать все двенадцать минут, и запиши число кругов.',
    'Meet the thruster — the signature movement of this course: a squat and a press in one motion. A short technique block, then a 12-minute AMRAP: thrusters, push-ups, air squats, sit-ups. Find a pace you can hold for all twelve minutes and write down your rounds.',
  ),
  basePoints: 100,
  tags: ['metcon', 'amrap', 'skill', 'cardio'],
  blocks: [
    wuEngine('ea12_warmup'),
    {
      id: 'ea12_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 45,
      title: l('Техника: трастер', 'Skill: the thruster'),
      description: l(
        'Два круга с лёгкой парой. Фронтальный присед — грудь вверх, локти вперёд. Трастер — из самой нижней точки приседа разгоняешь гантели вверх без паузы.',
        'Two rounds with the light pair. Front squat: chest up, elbows forward. Thruster: from the very bottom of the squat drive the dumbbells overhead with no pause.',
      ),
      items: [
        { exerciseId: 'db_front_squat', reps: 6, load: 'light' },
        { exerciseId: 'db_thruster', reps: 6, load: 'light' },
      ],
    },
    {
      id: 'ea12_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 720,
      title: l('AMRAP 12 мин', 'AMRAP 12 min'),
      description: l(
        'Максимум кругов за 12 минут. Первые три минуты — на 80 %: если после них ты ещё можешь говорить короткими фразами, темп правильный.',
        'As many rounds as possible in 12 minutes. The first three minutes at 80%: if you can still speak in short phrases after them, the pace is right.',
      ),
      items: [
        { exerciseId: 'db_thruster', reps: 8, load: 'light' },
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'air_squat', reps: 12 },
        { exerciseId: 'sit_up', reps: 10 },
      ],
    },
    cdEngine('ea12_cooldown'),
  ],
};

const W_ENGINE_TABATA: WorkoutInput = {
  id: 'w_engine_tabata',
  name: l('Двигатель: табата', 'Engine: Tabata'),
  focus: l('Рывок гантели и интервалы 20/10', 'Dumbbell snatch and 20/10 intervals'),
  description: l(
    'Три табаты по четыре минуты: 20 секунд работы, 10 отдыха, восемь раундов на одно упражнение, между табатами минута. Рывок гантели, отжимания, гоблет-присед. Перед стартом — короткий блок техники рывка: это самое быстрое движение курса, и его нужно сначала прожить медленно.',
    'Three four-minute Tabatas: 20 seconds on, 10 off, eight rounds of one exercise, a minute between Tabatas. Dumbbell snatches, push-ups, goblet squats. Before you start — a short snatch-technique block: it is the fastest movement of the course and you need to feel it slowly first.',
  ),
  basePoints: 100,
  tags: ['metcon', 'tabata', 'skill', 'cardio'],
  blocks: [
    wuEngine('et_warmup'),
    {
      id: 'et_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 45,
      title: l('Техника: рывок', 'Skill: the snatch'),
      description: l(
        'Два круга. Гантель между стоп, спина прямая: ноги толкают, рука — как верёвка, гантель летит вверх вдоль тела, локоть выпрямляется над головой.',
        'Two rounds. Dumbbell between the feet, back flat: the legs push, the arm is a rope, the dumbbell travels close to the body and locks out overhead.',
      ),
      items: [
        {
          exerciseId: 'db_snatch',
          reps: 8,
          load: 'light',
          note: l(
            'По 4 на руку, медленно, с паузой над коленом',
            '4 per arm, slowly, with a pause above the knee',
          ),
        },
      ],
    },
    {
      id: 'et_tabata',
      type: 'metcon',
      format: 'tabata',
      workSec: 20,
      restSec: 10,
      rounds: 8,
      restBetweenRoundsSec: 60,
      title: l('3 табаты 20/10', '3 Tabatas 20/10'),
      description: l(
        'Восемь раундов рывка, минута отдыха, восемь раундов отжиманий, минута, восемь раундов гоблет-приседа. Число рядом с упражнением — ориентир на один 20-секундный раунд; в последних раундах делай, сколько успеешь, не теряя техники.',
        'Eight rounds of snatches, a minute of rest, eight rounds of push-ups, a minute, eight rounds of goblet squats. The number next to each exercise is the target for one 20-second round; in the last rounds do what you can without losing form.',
      ),
      items: [
        {
          exerciseId: 'db_snatch',
          reps: 6,
          load: 'light',
          note: l(
            'По 3 на руку. Не идёт рывок — взятие одной гантели на плечо',
            '3 per arm. If the snatch is not there yet, do single-dumbbell cleans',
          ),
        },
        { exerciseId: 'push_up', reps: 8 },
        { exerciseId: 'db_goblet_squat', reps: 8, load: 'light' },
      ],
    },
    cdEngine('et_cooldown'),
  ],
};

const W_ENGINE_AMRAP15: WorkoutInput = {
  id: 'w_engine_amrap15',
  name: l('Двигатель: AMRAP 15', 'Engine: AMRAP 15'),
  focus: l('Длинный AMRAP с рывком', 'The long AMRAP with snatches'),
  description: l(
    'Самый длинный интервал курса: 15 минут, четыре упражнения — рывок гантели, отжимания, гоблет-присед, бёрпи. Стратегия: первые пять минут спокойно, середину — ровно, последние две — всё, что осталось. Число кругов сравни с AMRAP 12 из второй недели.',
    'The longest interval of the course: 15 minutes, four movements — dumbbell snatches, push-ups, goblet squats, burpees. Strategy: the first five minutes easy, the middle steady, the last two with whatever is left. Compare your rounds with the AMRAP 12 from week two.',
  ),
  basePoints: 110,
  tags: ['metcon', 'amrap', 'cardio'],
  blocks: [
    wuEngine('ea15_warmup'),
    {
      id: 'ea15_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 900,
      title: l('AMRAP 15 мин', 'AMRAP 15 min'),
      description: l(
        'Максимум кругов за 15 минут. Отдыхай короткими паузами по 5–10 секунд и не оставляй гантель на полу дольше чем на три вдоха.',
        'As many rounds as possible in 15 minutes. Rest in short 5–10 second breaks and never leave the dumbbell on the floor for more than three breaths.',
      ),
      items: [
        {
          exerciseId: 'db_snatch',
          reps: 10,
          load: 'light',
          note: l(
            'По 5 на руку, меняй руку над головой или на полу',
            '5 per arm, switch hands overhead or on the floor',
          ),
        },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'db_goblet_squat', reps: 10, load: 'light' },
        { exerciseId: 'burpee', reps: 5 },
      ],
    },
    cdEngine('ea15_cooldown'),
  ],
};

/* --- Complexes and the easy day ------------------------------------------------------ */

const W_COMPLEX_A: WorkoutInput = {
  id: 'w_complex_a',
  name: l('Комплекс с гантелями A', 'Dumbbell complex A'),
  focus: l('Всё тело одним весом', 'Whole body, one weight'),
  description: l(
    'Комплекс — это несколько движений подряд, не выпуская гантели из рук: становая, взятие, фронтальный присед, швунг. Четыре круга со средним весом, минута отдыха. Потом восемь минут AMRAP из бёрпи, гоблет-приседа и ситапов. Это день, где сила и выносливость встречаются.',
    'A complex is several movements back to back without putting the dumbbells down: deadlift, clean, front squat, push press. Four rounds at a medium weight, a minute of rest. Then an eight-minute AMRAP of burpees, goblet squats and sit-ups. This is the day strength and conditioning meet.',
  ),
  basePoints: 100,
  tags: ['strength', 'complex', 'full_body', 'amrap'],
  blocks: [
    wuFull('cxa_warmup'),
    {
      id: 'cxa_complex',
      type: 'strength',
      format: 'circuit',
      sets: 4,
      restBetweenRoundsSec: 60,
      title: l('Комплекс: 4 круга', 'Complex: 4 rounds'),
      description: l(
        'Гантели в руках весь круг: 8 становых → 6 взятий → 6 фронтальных приседов → 6 швунгов. Вес выбирай по швунгу — самому слабому звену. Между кругами минута.',
        'Dumbbells stay in your hands the whole round: 8 deadlifts → 6 cleans → 6 front squats → 6 push presses. Pick the weight by the push press — the weakest link. A minute between rounds.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 8, load: 'medium' },
        { exerciseId: 'db_clean', reps: 6, load: 'medium' },
        { exerciseId: 'db_front_squat', reps: 6, load: 'medium' },
        { exerciseId: 'db_push_press', reps: 6, load: 'medium' },
      ],
    },
    {
      id: 'cxa_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 480,
      title: l('AMRAP 8 мин', 'AMRAP 8 min'),
      description: l(
        'Максимум кругов за 8 минут. Гантель для приседа — лёгкая: тут работает дыхание, а не сила.',
        'As many rounds as possible in 8 minutes. Light dumbbell for the squats: this part is about breathing, not strength.',
      ),
      items: [
        { exerciseId: 'burpee', reps: 5 },
        { exerciseId: 'db_goblet_squat', reps: 10, load: 'light' },
        { exerciseId: 'sit_up', reps: 10 },
      ],
    },
    cdLower('cxa_cooldown'),
  ],
};

const W_COMPLEX_B: WorkoutInput = {
  id: 'w_complex_b',
  name: l('Комплекс с гантелями B', 'Dumbbell complex B'),
  focus: l('Пять кругов и дьявольский жим', 'Five rounds and the devil press'),
  description: l(
    'Пять кругов комплекса по восемь повторений в каждом движении — это уже серьёзный объём под нагрузкой. Затем три круга на время: дьявольский жим, приседания, складка, лимит 10 минут. Дьявольский жим — бёрпи с гантелями и мах обеих над головой; если пока не идёт, делай бёрпи и взятие двух гантелей.',
    'Five rounds of the complex at eight reps per movement — that is serious volume under load. Then three rounds for time: devil presses, air squats, V-ups, 10-minute cap. The devil press is a burpee onto the dumbbells followed by swinging both overhead; if it is not there yet, do a burpee and a two-dumbbell clean instead.',
  ),
  basePoints: 110,
  tags: ['strength', 'complex', 'full_body', 'fortime'],
  blocks: [
    wuFull('cxb_warmup'),
    {
      id: 'cxb_complex',
      type: 'strength',
      format: 'circuit',
      sets: 5,
      restBetweenRoundsSec: 75,
      title: l('Комплекс: 5 кругов', 'Complex: 5 rounds'),
      description: l(
        'Не выпуская гантели: 8 становых → 8 взятий → 8 фронтальных приседов → 8 швунгов. Между кругами 75 секунд. Если в четвёртом круге пришлось поставить гантели — это нормально: отдохни 10 секунд и продолжай.',
        'Without putting the dumbbells down: 8 deadlifts → 8 cleans → 8 front squats → 8 push presses. 75 seconds between rounds. If you have to drop the dumbbells in round four, that is fine: rest 10 seconds and carry on.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 8, load: 'medium' },
        { exerciseId: 'db_clean', reps: 8, load: 'medium' },
        { exerciseId: 'db_front_squat', reps: 8, load: 'medium' },
        { exerciseId: 'db_push_press', reps: 8, load: 'medium' },
      ],
    },
    {
      id: 'cxb_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 3,
      rounds: 3,
      durationSec: 600,
      title: l('3 круга на время', '3 rounds for time'),
      description: l(
        'Лимит 10 минут: 6 дьявольских жимов, 15 приседаний, 10 складок — три круга. Гантели лёгкие. Засеки время.',
        '10-minute cap: 6 devil presses, 15 air squats, 10 V-ups — three rounds. Light dumbbells. Note your time.',
      ),
      items: [
        {
          exerciseId: 'db_devil_press',
          reps: 6,
          load: 'light',
          note: l(
            'Не идёт — бёрпи + взятие двух гантелей на плечи',
            'Too hard? Burpee + a two-dumbbell clean to the shoulders',
          ),
        },
        { exerciseId: 'air_squat', reps: 15 },
        {
          exerciseId: 'v_up',
          reps: 10,
          note: l('Или ситапы с прямыми руками', 'Or sit-ups with straight arms overhead'),
        },
      ],
    },
    cdLower('cxb_cooldown'),
  ],
};

const W_TECHNIQUE_FLOW: WorkoutInput = {
  id: 'w_technique_flow',
  name: l('Лёгкий день: техника', 'Easy day: technique'),
  focus: l('Восстановление, техника и растяжка', 'Recovery, technique and stretching'),
  description: l(
    'Лёгкий день с лёгкой парой: три круга гоблет-приседа с паузой внизу, медленной румынской тяги, жима стоя, медвежьей походки и удержания в приседе. Затем спокойный кор и длинная растяжка. Пульс не должен подниматься высоко — это день, когда тело догоняет нагрузку.',
    'An easy day with the light pair: three rounds of goblet squats with a pause at the bottom, slow Romanian deadlifts, standing presses, bear crawl and a bottom-squat hold. Then calm core work and a long stretch. Keep your heart rate low — this is the day your body catches up with the training.',
  ),
  basePoints: 90,
  tags: ['recovery', 'skill', 'mobility', 'core'],
  blocks: [
    wuHingePull('tf_warmup'),
    {
      id: 'tf_skill',
      type: 'skill',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 60,
      title: l('Техника', 'Technique'),
      description: l(
        'Три круга в темпе разговора. Каждое повторение — как показательное: полная амплитуда, пауза в крайней точке, лёгкий вес.',
        'Three rounds at a talking pace. Treat every rep as a demo: full range, a pause at the end point, light weight.',
      ),
      items: [
        {
          exerciseId: 'db_goblet_squat',
          reps: 10,
          load: 'light',
          note: l('Пауза две секунды внизу', 'Two-second pause at the bottom'),
        },
        {
          exerciseId: 'db_rdl',
          reps: 10,
          load: 'light',
          note: l('Три секунды вниз', 'Three seconds down'),
        },
        { exerciseId: 'db_shoulder_press', reps: 8, load: 'light' },
        { exerciseId: 'bear_crawl', seconds: 20 },
        { exerciseId: 'squat_hold', seconds: 20 },
      ],
    },
    {
      id: 'tf_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два спокойных круга. Дыши ровно, движения медленные.',
        'Two calm rounds. Breathe evenly, move slowly.',
      ),
      items: [
        { exerciseId: 'bird_dog', reps: 10 },
        { exerciseId: 'dead_bug', reps: 10 },
        { exerciseId: 'side_plank', seconds: 20, perSide: true },
      ],
    },
    cdLong('tf_cooldown'),
  ],
};

/* --- Benchmarks ---------------------------------------------------------------------- */

const W_BENCH_DT: WorkoutInput = {
  id: 'w_bench_dt',
  name: l('DT с гантелями', 'Dumbbell DT'),
  focus: l('Бенчмарк: 5 кругов на время', 'Benchmark: 5 rounds for time'),
  description: l(
    '«DT» — классический кроссфит-бенчмарк, в оригинале со штангой. Наша версия с гантелями: пять кругов по 12 становых, 9 взятий на грудь и 6 швунгов, лимит 15 минут. Один средний вес на все движения. Стратегия: 11 становых, а двенадцатую переводишь сразу в первое взятие; 8 взятий, а девятое — в первый швунг. Запиши время — в следующем цикле ты его побьёшь.',
    'DT is a classic CrossFit benchmark, originally with a barbell. Our dumbbell version: five rounds of 12 deadlifts, 9 cleans and 6 push presses, 15-minute cap. One medium weight for every movement. Strategy: do 11 deadlifts and turn the twelfth straight into the first clean; 8 cleans and turn the ninth into the first push press. Note your time — you will beat it next cycle.',
  ),
  basePoints: 150,
  tags: ['benchmark', 'fortime', 'hinge', 'olympic'],
  blocks: [
    wuFull('dt_warmup'),
    {
      id: 'dt_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 5,
      rounds: 5,
      durationSec: 900,
      title: l('5 кругов на время', '5 rounds for time'),
      description: l(
        'Лимит 15 минут. Гантели можно ставить на пол, но каждый раз это дорого: короткая пауза в висе или на плечах обходится дешевле.',
        '15-minute cap. You may set the dumbbells down, but every drop costs time: a short pause in the hang or on the shoulders is cheaper.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 12, load: 'medium' },
        { exerciseId: 'db_clean', reps: 9, load: 'medium' },
        { exerciseId: 'db_push_press', reps: 6, load: 'medium' },
      ],
    },
    cdHinge('dt_cooldown'),
  ],
};

const W_BENCH_21_15_9: WorkoutInput = {
  id: 'w_bench_21_15_9',
  name: l('21-15-9: трастеры и бёрпи', '21-15-9: thrusters & burpees'),
  focus: l('Финальный бенчмарк', 'The final benchmark'),
  description: l(
    'Финальный бенчмарк курса: 21-15-9 трастеров и бёрпи на время, лимит 12 минут. Лёгкая пара гантелей — та, с которой 21 трастер можно сделать за два подхода. Это одна из самых тяжёлых связок в кроссфите: ноги, плечи и дыхание одновременно. Начни трастеры с 11 + 10, бёрпи — ровным темпом без остановок. Время запиши: это личный рекорд, к которому ты будешь возвращаться.',
    'The final benchmark of the course: 21-15-9 thrusters and burpees for time, 12-minute cap. The light pair — the one you can do 21 thrusters with in two sets. It is one of the toughest pairings in CrossFit: legs, shoulders and lungs all at once. Open the thrusters as 11 + 10, do the burpees at a steady, unbroken pace. Note the time: it is the personal record you will keep coming back to.',
  ),
  basePoints: 150,
  tags: ['benchmark', 'fortime', 'full_body'],
  blocks: [
    wuSquatPress('b2159_warmup'),
    {
      id: 'b2159_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 720,
      title: l('21-15-9 на время', '21-15-9 for time'),
      description: l(
        '21 трастер, 21 бёрпи, 15 трастеров, 15 бёрпи, 9 трастеров, 9 бёрпи. Лимит 12 минут. Не выкладывайся на первых 21: они должны быть на 80 %.',
        '21 thrusters, 21 burpees, 15 thrusters, 15 burpees, 9 thrusters, 9 burpees. 12-minute cap. Do not empty the tank on the first 21: run them at 80%.',
      ),
      items: [
        {
          exerciseId: 'db_thruster',
          reps: 21,
          load: 'light',
          note: l('Лёгкая пара, 11 + 10', 'Light pair, 11 + 10'),
        },
        { exerciseId: 'burpee', reps: 21 },
        { exerciseId: 'db_thruster', reps: 15, load: 'light' },
        { exerciseId: 'burpee', reps: 15 },
        { exerciseId: 'db_thruster', reps: 9, load: 'light' },
        { exerciseId: 'burpee', reps: 9 },
      ],
    },
    cdLower('b2159_cooldown'),
  ],
};

/* ------------------------------------------------------------------------------------ */
/* Path                                                                                  */
/* ------------------------------------------------------------------------------------ */

const REST_TITLE = l('Отдых и прогулка', 'Rest & walk');

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

const REST_STEPS = l(
  '7000 шагов и вода: мышцы растут в дни отдыха, а не на тренировке',
  '7,000 steps and water: muscles grow on rest days, not during the workout',
);
const REST_SORE = l(
  'Крепатура после гантелей — норма. Прогулка снимет её быстрее, чем диван',
  'Soreness after dumbbells is normal. A walk clears it faster than the couch',
);
const REST_SLEEP = l(
  'Прогулка 40 минут и сон 7–8 часов — лучшая добавка к силе',
  'A 40-minute walk and 7–8 hours of sleep — the best strength supplement there is',
);
const REST_STREAK = l(
  'Пройди 7000 шагов и запиши их в приложении — день зачтётся в серию',
  'Walk 7,000 steps and log them in the app — the day counts toward your streak',
);
const REST_WEEKEND = l(
  'Выходной: прогулка, растяжка, нормальная еда',
  'Day off: a walk, a stretch, proper food',
);
const REST_BEFORE_BENCHMARK = l(
  'Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы',
  'Benchmark tomorrow: steps, water, an early night. No "extra" work today',
);
const REST_DELOAD = l(
  'Разгрузочная неделя: гуляй и спи. Тело усваивает три недели работы',
  'Deload week: walk and sleep. Your body is absorbing three weeks of work',
);
const REST_BEFORE_TEST = l(
  'Завтра повторный тест — только прогулка и хороший сон',
  "Retest tomorrow — just a walk and a good night's sleep",
);

const T_SQUAT_PRESS = l('Присед и жим', 'Squat & press');
const T_HINGE_PULL = l('Тяга и спина', 'Hinge & pull');
const T_ENGINE = l('Двигатель', 'Engine');
const T_COMPLEX = l('Комплекс', 'Complex');
const T_FLOW = l('Лёгкий день', 'Easy day');

const NODES: NodeInput[] = [
  /* Week 1 — baseline test, then the A variants and the first EMOM. */
  {
    id: 'w1d1_test',
    week: 1,
    day: 1,
    kind: 'test',
    workoutId: 'w_test',
    title: l('Входной тест', 'Baseline test'),
    subtitle: l('Отжимания, присед, планка, бёрпи', 'Push-ups, squats, plank, burpees'),
  },
  rest(1, 2, REST_STREAK),
  {
    id: 'w1d3_squat_press',
    week: 1,
    day: 3,
    kind: 'workout',
    workoutId: 'w_squat_press_a',
    title: T_SQUAT_PRESS,
    subtitle: l('3 подхода · найди рабочие веса', '3 sets · find your working weights'),
  },
  rest(1, 4, REST_SORE),
  {
    id: 'w1d5_hinge_pull',
    week: 1,
    day: 5,
    kind: 'workout',
    workoutId: 'w_hinge_pull_a',
    title: T_HINGE_PULL,
    subtitle: l('3 подхода + кор', '3 sets + core'),
  },
  {
    id: 'w1d6_engine',
    week: 1,
    day: 6,
    kind: 'workout',
    workoutId: 'w_engine_emom12',
    title: T_ENGINE,
    subtitle: l('Техника взятия + EMOM 12 мин', 'Clean skill + EMOM 12 min'),
  },
  rest(1, 7, REST_WEEKEND),

  /* Week 2 — full four-day rhythm: A variants, the thruster, the first complex. */
  {
    id: 'w2d1_squat_press',
    week: 2,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_a',
    title: T_SQUAT_PRESS,
    subtitle: l('3 подхода · чуть тяжелее', '3 sets · a little heavier'),
  },
  rest(2, 2, REST_SLEEP),
  {
    id: 'w2d3_hinge_pull',
    week: 2,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_pull_a',
    title: T_HINGE_PULL,
    subtitle: l('3 подхода + кор', '3 sets + core'),
  },
  {
    id: 'w2d4_engine',
    week: 2,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap12',
    title: T_ENGINE,
    subtitle: l('Техника трастера + AMRAP 12 мин', 'Thruster skill + AMRAP 12 min'),
  },
  rest(2, 5, REST_STEPS),
  {
    id: 'w2d6_complex',
    week: 2,
    day: 6,
    kind: 'workout',
    workoutId: 'w_complex_a',
    title: T_COMPLEX,
    subtitle: l('4 круга + AMRAP 8 мин', '4 rounds + AMRAP 8 min'),
  },
  rest(2, 7, REST_WEEKEND),

  /* Week 3 — B variants, the snatch, dumbbell DT. */
  {
    id: 'w3d1_squat_press',
    week: 3,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_b',
    title: T_SQUAT_PRESS,
    subtitle: l('4 подхода + AMRAP 8 мин', '4 sets + AMRAP 8 min'),
  },
  rest(3, 2, REST_SORE),
  {
    id: 'w3d3_hinge_pull',
    week: 3,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_pull_b',
    title: T_HINGE_PULL,
    subtitle: l('4 подхода + прогулка фермера', '4 sets + farmer carry'),
  },
  {
    id: 'w3d4_engine',
    week: 3,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_tabata',
    title: T_ENGINE,
    subtitle: l('Техника рывка + 3 табаты 20/10', 'Snatch skill + 3 Tabatas 20/10'),
  },
  rest(3, 5, REST_BEFORE_BENCHMARK),
  {
    id: 'w3d6_benchmark',
    week: 3,
    day: 6,
    kind: 'benchmark',
    workoutId: 'w_bench_dt',
    title: l('DT с гантелями', 'Dumbbell DT'),
    subtitle: l('Бенчмарк · 5 кругов, лимит 15 мин', 'Benchmark · 5 rounds, 15-min cap'),
  },
  rest(3, 7, REST_SLEEP),

  /* Week 4 — deload: same B variants, volume ×0.65 and longer rests by the engine. */
  {
    id: 'w4d1_squat_press',
    week: 4,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_b',
    deload: true,
    title: T_SQUAT_PRESS,
    subtitle: l('Разгрузка · объём −35 %', 'Deload · volume −35%'),
  },
  rest(4, 2, REST_DELOAD),
  {
    id: 'w4d3_hinge_pull',
    week: 4,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_pull_b',
    deload: true,
    title: T_HINGE_PULL,
    subtitle: l('Разгрузка · объём −35 %', 'Deload · volume −35%'),
  },
  {
    id: 'w4d4_engine',
    week: 4,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_emom12',
    deload: true,
    title: T_ENGINE,
    subtitle: l('Разгрузка · EMOM 12 мин', 'Deload · EMOM 12 min'),
  },
  rest(4, 5, REST_DELOAD),
  {
    id: 'w4d6_flow',
    week: 4,
    day: 6,
    kind: 'workout',
    workoutId: 'w_technique_flow',
    deload: true,
    title: T_FLOW,
    subtitle: l('Разгрузка · техника и растяжка', 'Deload · technique and stretching'),
  },
  rest(4, 7, REST_SLEEP),

  /* Week 5 — C variants: the heavy pair, the long AMRAP, the five-round complex. */
  {
    id: 'w5d1_squat_press',
    week: 5,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_press_c',
    title: T_SQUAT_PRESS,
    subtitle: l('4 подхода · тяжёлая пара + AMRAP 10', '4 sets · heavy pair + AMRAP 10'),
  },
  rest(5, 2, REST_SORE),
  {
    id: 'w5d3_hinge_pull',
    week: 5,
    day: 3,
    kind: 'workout',
    workoutId: 'w_hinge_pull_c',
    title: T_HINGE_PULL,
    subtitle: l('4 подхода · тяга ренегата', '4 sets · renegade rows'),
  },
  {
    id: 'w5d4_engine',
    week: 5,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap15',
    title: T_ENGINE,
    subtitle: l('AMRAP 15 мин', 'AMRAP 15 min'),
  },
  rest(5, 5, REST_STEPS),
  {
    id: 'w5d6_complex',
    week: 5,
    day: 6,
    kind: 'workout',
    workoutId: 'w_complex_b',
    title: T_COMPLEX,
    subtitle: l('5 кругов + 3 круга на время', '5 rounds + 3 rounds for time'),
  },
  rest(5, 7, REST_WEEKEND),

  /* Week 6 — last strength day, 21-15-9, an easy day and the retest. */
  {
    id: 'w6d1_hinge_pull',
    week: 6,
    day: 1,
    kind: 'workout',
    workoutId: 'w_hinge_pull_c',
    title: T_HINGE_PULL,
    subtitle: l('4 подхода · последний силовой день', '4 sets · the last strength day'),
  },
  rest(6, 2, REST_BEFORE_BENCHMARK),
  {
    id: 'w6d3_benchmark',
    week: 6,
    day: 3,
    kind: 'benchmark',
    workoutId: 'w_bench_21_15_9',
    title: l('21-15-9', '21-15-9'),
    subtitle: l(
      'Бенчмарк · трастеры и бёрпи, лимит 12 мин',
      'Benchmark · thrusters & burpees, 12-min cap',
    ),
  },
  rest(6, 4, REST_SLEEP),
  {
    id: 'w6d5_flow',
    week: 6,
    day: 5,
    kind: 'workout',
    workoutId: 'w_technique_flow',
    title: T_FLOW,
    subtitle: l('Техника и растяжка перед тестом', 'Technique and stretching before the retest'),
  },
  rest(6, 6, REST_BEFORE_TEST),
  {
    id: 'w6d7_retest',
    week: 6,
    day: 7,
    kind: 'test',
    workoutId: 'w_test',
    title: l('Повторный тест', 'Retest'),
    subtitle: l('Те же 4 теста · сравни с первой неделей', 'Same 4 tests · compare with week 1'),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Course                                                                                */
/* ------------------------------------------------------------------------------------ */

export const COURSE_DUMBBELLS: CourseInput = {
  id: 'dumbbells',
  order: 3,
  slug: { ru: 'ganteli-doma-sila-i-relef', en: 'dumbbell-builder' },
  name: l('Гантели дома: сила и рельеф', 'Dumbbell Builder'),
  tagline: l(
    'Шесть недель силовых тренировок с парой гантелей — присед, тяга, жим и трастеры, четыре дня в неделю.',
    'Six weeks of strength training with a pair of dumbbells — squats, deadlifts, presses and thrusters, four days a week.',
  ),
  description: l(
    'Силовая программа для дома с гантелями: два силовых дня в неделю, день выносливости с рывком и взятием на грудь и день комплексов. Разгрузочная неделя, два бенчмарка — «DT» и 21-15-9 трастеров с бёрпи — и один и тот же тест в начале и в конце.',
    'A home strength program with dumbbells: two strength days a week, a conditioning day built around snatches and cleans, and a complex day. A deload week, two benchmarks — DT and 21-15-9 thrusters with burpees — and the same test at the start and the end.',
  ),
  longDescription: [
    l(
      'Пара гантелей — это почти целый зал. С ними можно приседать, тянуть с пола, жать стоя и лёжа, делать выпады, взятия и рывки. Курс построен вокруг шести базовых движений — гоблет- и фронтальный присед, становая и румынская тяга, тяга в наклоне, жим и швунг, — и каждую неделю они становятся чуть тяжелее или объёмнее: три подхода превращаются в четыре, средний вес — в тяжёлый, жим стоя — в швунг, а присед и жим — в трастер.',
      'A pair of dumbbells is very nearly a whole gym. You can squat, lift from the floor, press standing and lying, lunge, clean and snatch with them. The course is built around six base movements — goblet and front squats, deadlifts and Romanian deadlifts, bent-over rows, presses and push presses — and every week they get a little heavier or bigger: three sets become four, medium weight becomes heavy, the standing press becomes a push press, and squat plus press becomes a thruster.',
    ),
    l(
      'Неделя выглядит так: день приседа и жима, день тяги и спины — оба с блоком на кор, — день «двигателя» с EMOM, AMRAP или табатой и день комплексов, где гантели не выпускают из рук несколько движений подряд. Между тренировками — дни отдыха с целью 7000 шагов. Четвёртая неделя разгрузочная: объём падает примерно на треть, и именно после неё сила обычно делает скачок.',
      'A week looks like this: a squat & press day, a hinge & pull day — both with a core block — an engine day with an EMOM, AMRAP or Tabata, and a complex day where the dumbbells stay in your hands through several movements in a row. Between sessions are rest days with a 7,000-step goal. Week four is a deload: volume drops by about a third, and that is usually when strength jumps.',
    ),
    l(
      'Веса в программе обозначены как лёгкий, средний и тяжёлый — приложение само сопоставляет их с гантелями, которые ты указал в профиле. Количество повторений подбирается по входному тесту и корректируется после каждой тренировки по твоей оценке усилия. Если какое-то движение пока не по силам — рывок или тяга ренегата, — приложение подставит вариант проще.',
      'Loads in the program are labelled light, medium and heavy — the app maps them to the dumbbells you listed in your profile. Rep counts come from the baseline test and are adjusted after every session from your effort rating. If a movement is not there yet — the snatch or the renegade row — the app substitutes an easier variant.',
    ),
    l(
      'Два бенчмарка держат курс в тонусе: в третью неделю — «DT» с гантелями, пять кругов становой, взятий и швунгов на время; в шестую — 21-15-9 трастеров и бёрпи. А в самом начале и в самом конце — один и тот же тест: отжимания, приседания, планка и бёрпи. Так ты увидишь прогресс не в ощущениях, а в цифрах.',
      'Two benchmarks keep the course honest: in week three, dumbbell DT — five rounds of deadlifts, cleans and push presses for time; in week six, 21-15-9 thrusters and burpees. And at the very start and the very end, the same test: push-ups, squats, plank and burpees. That way you see your progress in numbers, not just in feelings.',
    ),
  ],
  forWhom: [
    l(
      'У тебя есть пара гантелей (лучше две пары или разборные) и коврик.',
      'You own a pair of dumbbells (two pairs or adjustables are better) and a mat.',
    ),
    l(
      'Ты уже отжимаешься 8–10 раз подряд и держишь планку минуту — или прошёл курс «Старт».',
      'You can already do 8–10 push-ups in a row and hold a plank for a minute — or you finished the Start course.',
    ),
    l(
      'Хочешь стать сильнее и подтянуть рельеф, а не только сбросить вес.',
      'You want to get stronger and build definition, not just lose weight.',
    ),
    l(
      'Тебе нравится структура: подходы, веса, прогрессия и понятные бенчмарки.',
      'You like structure: sets, weights, progression and clear benchmarks.',
    ),
    l('Есть 30–40 минут четыре раза в неделю.', 'You have 30–40 minutes four times a week.'),
  ],
  outcomes: [
    l(
      'Уверенная техника шести базовых движений с гантелями: присед, становая, румынская тяга, тяга в наклоне, жим, швунг.',
      'Confident technique in six base dumbbell movements: squat, deadlift, Romanian deadlift, row, press, push press.',
    ),
    l(
      'Освоишь взятие на грудь, рывок гантели и трастер — движения, из которых состоят кроссфит-комплексы.',
      'You learn the dumbbell clean, snatch and thruster — the movements CrossFit workouts are built from.',
    ),
    l(
      'Рабочие веса вырастут: от средних гантелей в первую неделю к тяжёлым в пятую.',
      'Your working weights go up: from medium dumbbells in week one to heavy ones in week five.',
    ),
    l(
      'Два бенчмарка с результатом на время: «DT» с гантелями и 21-15-9.',
      'Two benchmarks with a time to beat: dumbbell DT and 21-15-9.',
    ),
    l(
      'Больше отжиманий, приседаний и бёрпи в повторном тесте — сравнишь с первой неделей.',
      'More push-ups, squats and burpees in the retest — you compare with week one.',
    ),
    l(
      'Привычка к четырём тренировкам в неделю с отдыхом и разгрузкой, без перегруза.',
      'A habit of four sessions a week with rest days and a deload — without burning out.',
    ),
  ],
  equipment: ['dumbbells', 'none', 'mat'],
  level: 2,
  weeks: 6,
  sessionsPerWeek: 4,
  avgSessionMin: 35,
  accent: '#C9D6FF',
  gradient: ['#C9D6FF', '#E7C6FF'],
  price: { rub: 3990, usd: 39 },
  workouts: [
    W_TEST,
    W_SQUAT_PRESS_A,
    W_SQUAT_PRESS_B,
    W_SQUAT_PRESS_C,
    W_HINGE_PULL_A,
    W_HINGE_PULL_B,
    W_HINGE_PULL_C,
    W_ENGINE_EMOM12,
    W_ENGINE_AMRAP12,
    W_ENGINE_TABATA,
    W_ENGINE_AMRAP15,
    W_COMPLEX_A,
    W_COMPLEX_B,
    W_TECHNIQUE_FLOW,
    W_BENCH_DT,
    W_BENCH_21_15_9,
  ],
  nodes: NODES,
  faq: [
    {
      q: l('Какие гантели нужны?', 'What dumbbells do I need?'),
      a: l(
        'Минимум — одна пара. Идеально — две пары или разборные гантели: лёгкая для трастеров, рывков и AMRAP и тяжёлая для становой, тяги и приседа. Ориентир для «лёгкой»: ты можешь чисто выжать её над головой 15 раз подряд; для «тяжёлой»: 8 становых тяг даются с усилием. Если пара одна, все три метки нагрузки будут указывать на неё — регулируй темпом и паузами, а в быстрых движениях бери одну гантель вместо двух.',
        "One pair at minimum. Ideally two pairs or adjustable dumbbells: a light one for thrusters, snatches and AMRAPs and a heavy one for deadlifts, rows and squats. Rule of thumb for 'light': you can press it overhead cleanly 15 times in a row; for 'heavy': 8 deadlifts take real effort. If you own a single pair, all three load labels will point to it — adjust with tempo and pauses, and use one dumbbell instead of two in the fast movements.",
      ),
    },
    {
      q: l(
        'Мне подойдёт этот курс или лучше начать со «Старта»?',
        'Is this course right for me, or should I begin with Start?',
      ),
      a: l(
        'Ориентир: 8–10 отжиманий от пола подряд, минута планки и 15 приседаний с гантелью у груди без одышки. Если это про тебя — заходи. Если пока нет, пройди «Старт» или «Своим весом»: там те же паттерны движения без веса, а через месяц-полтора гантели дадутся легче и безопаснее.',
        'Rule of thumb: 8–10 full push-ups in a row, a one-minute plank and 15 goblet squats without getting winded. If that is you, jump in. If not yet, do Start or Bodyweight Engine first: the same movement patterns without load, and in a month or so the dumbbells will come easier and safer.',
      ),
    },
    {
      q: l('Сколько времени занимает тренировка?', 'How long is a session?'),
      a: l(
        'В среднем около 35 минут вместе с разминкой и заминкой. Силовые дни — 30–40 минут, «двигатель» — около 25, комплексы и бенчмарки — до 35. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.',
        'About 35 minutes on average including warm-up and cool-down. Strength days run 30–40 minutes, engine days about 25, complexes and benchmarks up to 35. Before you start, the app shows the estimated time for each of the three difficulty options.',
      ),
    },
    {
      q: l('Пропустил тренировку — что делать?', 'I missed a session — what now?'),
      a: l(
        'Просто продолжай со следующего узла, когда сможешь: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — лучше сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках и возвращайся к прежним весам постепенно.',
        "Just continue from the next node when you can: the path does not reset. Do not stack two strength days back to back to 'catch up' — shift the week instead. After a break longer than two weeks, pick 'Easier' for the first two sessions and ease back into your old weights gradually.",
      ),
    },
    {
      q: l(
        'Как приложение подбирает нагрузку и вес?',
        'How does the app pick the load and the weight?',
      ),
      a: l(
        'Количество повторений считается по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — приложение чуть поднимает или снижает объём в следующий раз. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля: самая лёгкая, средняя, самая тяжёлая. В разгрузочную неделю объём снижается автоматически, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее».',
        "Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the app nudges the volume up or down next time. The labels 'light', 'medium' and 'heavy' are mapped to the dumbbells in your profile: the lightest, the middle one, the heaviest. In the deload week volume drops automatically, and before every session you can choose Easier, As usual or Harder.",
      ),
    },
    {
      q: l(
        'После становой тянет поясницу. Это нормально?',
        'My lower back feels it after deadlifts. Is that normal?',
      ),
      a: l(
        'Лёгкая усталость в мышцах вдоль позвоночника на следующий день — норма: они тоже работали. Острая боль, прострел или боль, которая усиливается при наклоне, — нет. В этом случае отметь «Боль» в отчёте после тренировки: приложение снизит нагрузку. Проверь технику: гантели близко к голеням, спина прямая, движение начинается с таза, а не с поясницы. Если поясница беспокоит регулярно, укажи это в ограничениях профиля — приложение заменит тяжёлые наклоны более безопасными вариантами — и покажись врачу.',
        "Mild fatigue in the muscles along the spine the next day is normal: they worked too. Sharp pain, a sudden twinge or pain that gets worse as you bend is not. In that case mark 'Pain' in the post-workout feedback: the app reduces the load. Check your technique: dumbbells close to the shins, back flat, the movement starts from the hips, not the lower back. If your lower back bothers you regularly, add it to the limitations in your profile — the app swaps heavy hinges for safer variants — and see a doctor.",
      ),
    },
  ],
};
