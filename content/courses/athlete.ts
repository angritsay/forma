/**
 * Course "athlete" — «Атлет: продвинутый домашний кроссфит» / "Home Athlete".
 *
 * Level 3, eight weeks, four sessions a week, dumbbells + pull-up bar + jump rope.
 *
 * Weekly skeleton (D = day of week):
 *   D1 squat & push (strength + short AMRAP + core) · D2 rest · D3 pull & hinge (pull-up
 *   ladder + hinge strength + core) · D4 engine (EMOM couplet / AMRAP 15 / Tabata / EMOM 16,
 *   each with a rope or dumbbell skill block) · D5 rest · D6 chipper or Murph rehearsal or
 *   benchmark · D7 rest
 * Week 1 opens with the baseline test, week 4 is a deload (volume ×0.65 and rest ×1.2 applied
 * by the engine) that ends with Cindy, weeks 5–7 are the peak, week 8 is a taper: an easy
 * technique day, Half Murph and the retest.
 *
 * Progression: A variants (weeks 1–2: 4 sets, negative pull-ups, medium loads) → B (weeks 3–4:
 * 5 sets, strict pull-ups for four, heavy loads, the first thruster AMRAP) → C (weeks 5–7:
 * 5 × 8 with the heavy pair, pull-ups for six, devil presses in the AMRAP, farmer carry).
 * Murph is rehearsed three times (quarter → 80% → quarter again) before the benchmark.
 * Loads are labels (`light` / `medium` / `heavy`); the engine maps them to the athlete's own
 * dumbbells. Numbers are authored for a level-3 athlete at scale 1.0.
 *
 * Engine facts this file relies on: a `fortime` block takes its round count from `sets`
 * (`rounds` is mirrored for readers of the raw content; omitted = one pass); an `emom` block
 * rotates its items minute by minute (two items = a couplet, four items = four cycles);
 * a `tabata` block runs all rounds of item 1, then item 2, … with `restBetweenRoundsSec`
 * between them; per-side exercises carry `perSide: true`.
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

/** Squat & push days: rope to wake the calves, shoulders open, squat pattern rehearsed. */
function wuSquatPush(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'single_under', reps: 40 },
      { exerciseId: 'arm_circles', seconds: 30 },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'worlds_greatest_stretch', reps: 2, perSide: true },
    ],
    l(
      'Два круга. Скакалка лёгкая, на носках; в приседе-разгибании прожми колени наружу и раскрой грудь.',
      'Two rounds. Easy rope on the toes; in the squat-to-stand push the knees out and open the chest.',
    ),
  );
}

/** Pull & hinge days: spine, hips, hamstrings; the bar work has its own hang. */
function wuPullHinge(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'single_under', reps: 40 },
      { exerciseId: 'cat_cow', reps: 8 },
      { exerciseId: 'leg_swing', reps: 8, perSide: true },
      { exerciseId: 'inchworm', reps: 4 },
    ],
    l(
      'Два круга без спешки. Разбуди спину, таз и заднюю поверхность бедра — сегодня они главные.',
      'Two unhurried rounds. Wake up the spine, hips and hamstrings — they are in charge today.',
    ),
  );
}

/** Engine days: heart rate up before the clock starts. */
function wuEngine(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'single_under', reps: 30 },
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

/** Chippers, rehearsals and benchmarks: whole body, hips and shoulders included. */
function wuFull(id: string): BlockInput {
  return warmup(
    id,
    [
      { exerciseId: 'jog_in_place', seconds: 60 },
      { exerciseId: 'worlds_greatest_stretch', reps: 3, perSide: true },
      { exerciseId: 'squat_to_stand', reps: 6 },
      { exerciseId: 'arm_circles', seconds: 30 },
    ],
    l(
      'Два круга. Впереди длинная работа — разогрейся полностью, но не трать силы: второй круг в темпе разговора.',
      'Two rounds. Long work ahead — warm up fully but spend nothing: the second round at a talking pace.',
    ),
  );
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

/** After squats, presses and lunges: hips, hamstrings, a deep squat, a rest pose. */
function cdLower(id: string): BlockInput {
  return cooldown(id, [
    { exerciseId: 'squat_hold', seconds: 30 },
    { exerciseId: 'hip_flexor_stretch', seconds: 40, perSide: true },
    { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
    { exerciseId: 'child_pose', seconds: 45 },
  ]);
}

/** After pull-ups and deadlifts: spine mobility, a decompressing hang, hamstrings, rest pose. */
function cdPull(id: string): BlockInput {
  return cooldown(
    id,
    [
      { exerciseId: 'cat_cow', reps: 6 },
      { exerciseId: 'dead_hang', seconds: 30 },
      { exerciseId: 'hamstring_stretch', seconds: 40, perSide: true },
      { exerciseId: 'child_pose', seconds: 45 },
    ],
    l(
      'Вис на турнике здесь — не работа, а вытяжение: расслабь плечи, дыши животом. Потом длинный выдох в каждой позе.',
      'The hang here is not work but decompression: relax the shoulders, breathe into the belly. Then a long exhale in every position.',
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

/** The long stretch after the big days and on the easy day. */
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
    'Четыре теста с отдыхом по 90 секунд: отжимания за две минуты, приседания за минуту, планка на максимум и бёрпи за минуту. По ним приложение выставит стартовый объём курса, а в восьмую неделю ты повторишь тест и увидишь разницу в цифрах. Считаются только чистые повторения: грудь до пола, бедро ниже параллели, прыжок с хлопком.',
    'Four tests with 90 seconds of rest between them: push-ups in two minutes, squats in one, a max plank hold and burpees in a minute. The app sets the starting volume of the course from them, and in week eight you repeat the test and see the difference in numbers. Only clean reps count: chest to the floor, hips below parallel, a jump with a clap.',
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

/* --- Squat & push -------------------------------------------------------------------- */

const W_SQUAT_PUSH_A: WorkoutInput = {
  id: 'w_squat_push_a',
  name: l('Присед и жим A', 'Squat & push A'),
  focus: l(
    'Фронтальный присед, швунг и прыжковые выпады',
    'Front squat, push press and jumping lunges',
  ),
  description: l(
    'Первый силовой день. Четыре подхода по кругу: фронтальный присед с тяжёлой парой, швунг, прыжковые выпады и узкие отжимания. Задача первых двух недель — найти веса, с которыми последние два повторения даются с усилием, но чисто. После силы — семь минут AMRAP из отжиманий и двойных прыжков, потом кор.',
    'The first strength day. Four sets in rotation: front squats with the heavy pair, push presses, jumping lunges and diamond push-ups. The job of the first two weeks is to find the weights where the last two reps are hard but clean. After the strength work, a seven-minute AMRAP of push-ups and double-unders, then core.',
  ),
  basePoints: 110,
  tags: ['strength', 'squat', 'push', 'amrap', 'core'],
  blocks: [
    wuSquatPush('spa_warmup'),
    {
      id: 'spa_strength',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Четыре подхода по кругу: присед → швунг → прыжковые выпады → узкие отжимания. 20 секунд между упражнениями, 90 между подходами. Темп в приседе: две секунды вниз, взрыв вверх.',
        'Four sets in rotation: squat → push press → jumping lunges → diamond push-ups. Twenty seconds between exercises, 90 between sets. Squat tempo: two seconds down, explode up.',
      ),
      items: [
        {
          exerciseId: 'db_front_squat',
          reps: 8,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Гантели на плечах, локти вперёд, бедро ниже параллели',
            'Dumbbells on the shoulders, elbows forward, hips below parallel',
          ),
        },
        {
          exerciseId: 'db_push_press',
          reps: 8,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'Короткий подсед — и гантели летят вверх за счёт ног',
            'A short dip, then the legs launch the dumbbells',
          ),
        },
        {
          exerciseId: 'jumping_lunge',
          reps: 16,
          restAfterSec: 20,
          note: l(
            'По 8 на ногу, заднее колено мягко касается пола',
            '8 per leg, the back knee kisses the floor',
          ),
        },
        {
          exerciseId: 'diamond_push_up',
          reps: 10,
          note: l(
            'Ладони под грудью, локти вдоль корпуса',
            'Hands under the chest, elbows along the body',
          ),
        },
      ],
    },
    {
      id: 'spa_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 420,
      title: l('AMRAP 7 мин', 'AMRAP 7 min'),
      description: l(
        'Максимум кругов за 7 минут: 10 отжиманий, 30 двойных. Отжимания без остановки, скакалку — сериями, которые не рвутся.',
        'As many rounds as possible in 7 minutes: 10 push-ups, 30 double-unders. Push-ups unbroken, the rope in sets you do not trip on.',
      ),
      items: [
        { exerciseId: 'push_up', reps: 10 },
        {
          exerciseId: 'double_under',
          reps: 30,
          note: l('Нет дабл-андеров — 60 синглов', 'No double-unders yet? 60 singles'),
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
        'Два круга. Лодочка — поясница вжата в пол, руки за головой; складка — руки и ноги встречаются над животом.',
        'Two rounds. Hollow hold: lower back pressed into the floor, arms overhead; V-up: hands and feet meet over the belly.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'v_up', reps: 12 },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cdLower('spa_cooldown'),
  ],
};

const W_SQUAT_PUSH_B: WorkoutInput = {
  id: 'w_squat_push_b',
  name: l('Присед и жим B', 'Squat & push B'),
  focus: l('Пять подходов и трастеры в AMRAP', 'Five sets and thrusters in the AMRAP'),
  description: l(
    'Пять подходов вместо четырёх, вес тяжелее, повторений меньше: фронтальный присед и швунг по шесть, прыжковые выпады по двадцать, отжимания уголком для плеч. AMRAP восемь минут — трастеры, отжимания, скакалка — связывает силу с дыханием. Кор — лодочка, складка, касания плеч.',
    'Five sets instead of four, heavier weight, fewer reps: front squats and push presses for six, jumping lunges for twenty, pike push-ups for the shoulders. An eight-minute AMRAP — thrusters, push-ups, rope — ties the strength to your breathing. Core: hollow hold, V-ups, shoulder taps.',
  ),
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'amrap', 'core'],
  blocks: [
    wuSquatPush('spb_warmup'),
    {
      id: 'spb_strength',
      type: 'strength',
      format: 'sets',
      sets: 5,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Пять подходов по кругу: присед → швунг → прыжковые выпады → отжимания уголком. 20 секунд между упражнениями, 90 между подходами. Если шесть приседов даются легко — в следующий раз вес тяжелее.',
        'Five sets in rotation: squat → push press → jumping lunges → pike push-ups. Twenty seconds between exercises, 90 between sets. If six squats feel easy, go heavier next time.',
      ),
      items: [
        {
          exerciseId: 'db_front_squat',
          reps: 6,
          load: 'heavy',
          restAfterSec: 20,
          note: l('Ниже параллели, локти не падают', 'Below parallel, elbows stay up'),
        },
        {
          exerciseId: 'db_push_press',
          reps: 6,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Тяжёлая пара: локти выпрямляются полностью над головой',
            'The heavy pair: elbows fully locked overhead',
          ),
        },
        {
          exerciseId: 'jumping_lunge',
          reps: 20,
          restAfterSec: 20,
          note: l('По 10 на ногу, приземляйся мягко', '10 per leg, land softly'),
        },
        {
          exerciseId: 'pike_push_up',
          reps: 10,
          note: l(
            'Таз высоко, макушка к полу между ладонями',
            'Hips high, crown of the head to the floor between the hands',
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
        'Максимум кругов за 8 минут: 6 трастеров, 8 отжиманий, 40 двойных. Лёгкая пара — трастеры без остановки.',
        'As many rounds as possible in 8 minutes: 6 thrusters, 8 push-ups, 40 double-unders. Light pair — thrusters unbroken.',
      ),
      items: [
        {
          exerciseId: 'db_thruster',
          reps: 6,
          load: 'light',
          note: l(
            'Из приседа сразу в жим, одним движением',
            'Straight from the squat into the press, one movement',
          ),
        },
        { exerciseId: 'push_up', reps: 8 },
        {
          exerciseId: 'double_under',
          reps: 40,
          note: l('Или 80 синглов', 'Or 80 singles'),
        },
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
        'Два круга. В складке не «прыгай» поясницей с пола — поднимай корпус и ноги одновременно.',
        'Two rounds. In the V-up do not bounce the lower back off the floor — lift the torso and the legs together.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 40 },
        { exerciseId: 'v_up', reps: 15 },
        { exerciseId: 'plank_shoulder_tap', reps: 20 },
      ],
    },
    cdLower('spb_cooldown'),
  ],
};

const W_SQUAT_PUSH_C: WorkoutInput = {
  id: 'w_squat_push_c',
  name: l('Присед и жим C', 'Squat & push C'),
  focus: l('Тяжёлая пара и AMRAP 10 в ритме Мёрфа', 'The heavy pair and a Murph-paced AMRAP 10'),
  description: l(
    'Пик силового дня, недели с пятой по седьмую: пять подходов по восемь с тяжёлой парой в приседе и швунге, 24 прыжковых выпада, 12 узких отжиманий. Потом десять минут AMRAP — дьявольский жим, отжимания, приседания, скакалка — это объём, из которого сложится «Мёрф». Кор — лодочка и складка.',
    'The strength day peaks, weeks five to seven: five sets of eight with the heavy pair in the squat and the push press, 24 jumping lunges, 12 diamond push-ups. Then a ten-minute AMRAP — devil presses, push-ups, air squats, rope — the volume Murph is built from. Core: hollow hold and V-ups.',
  ),
  basePoints: 120,
  tags: ['strength', 'squat', 'push', 'amrap', 'core', 'peak'],
  blocks: [
    wuSquatPush('spc_warmup'),
    {
      id: 'spc_strength',
      type: 'strength',
      format: 'sets',
      sets: 5,
      restBetweenSetsSec: 90,
      title: l('Сила', 'Strength'),
      description: l(
        'Пять подходов по кругу: присед → швунг → прыжковые выпады → узкие отжимания. 20 секунд между упражнениями, 90 между подходами. Вес тяжёлый, техника не ломается: если два последних повторения не идут чисто — уменьши вес, а не глубину.',
        'Five sets in rotation: squat → push press → jumping lunges → diamond push-ups. Twenty seconds between exercises, 90 between sets. Heavy weight, form holds: if the last two reps are not clean, drop the weight, not the depth.',
      ),
      items: [
        { exerciseId: 'db_front_squat', reps: 8, load: 'heavy', restAfterSec: 20 },
        {
          exerciseId: 'db_push_press',
          reps: 8,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Гантели над макушкой, локти выпрямлены полностью',
            'Dumbbells over the crown of the head, elbows fully locked',
          ),
        },
        {
          exerciseId: 'jumping_lunge',
          reps: 24,
          restAfterSec: 20,
          note: l('По 12 на ногу', '12 per leg'),
        },
        { exerciseId: 'diamond_push_up', reps: 12 },
      ],
    },
    {
      id: 'spc_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 600,
      title: l('AMRAP 10 мин', 'AMRAP 10 min'),
      description: l(
        'Максимум кругов за 10 минут: 4 дьявольских жима, 10 отжиманий, 15 приседаний, 30 двойных. Ровный темп: это репетиция «Мёрфа», а не спринт.',
        'As many rounds as possible in 10 minutes: 4 devil presses, 10 push-ups, 15 air squats, 30 double-unders. Even pace: it is a Murph rehearsal, not a sprint.',
      ),
      items: [
        {
          exerciseId: 'db_devil_press',
          reps: 4,
          load: 'light',
          note: l(
            'Не идёт — бёрпи + взятие двух гантелей на плечи',
            'Too hard? Burpee + a two-dumbbell clean to the shoulders',
          ),
        },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'air_squat', reps: 15 },
        {
          exerciseId: 'double_under',
          reps: 30,
          note: l('Или 60 синглов', 'Or 60 singles'),
        },
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
        'Два круга. Самый длинный hollow hold курса — держи, пока поясница прижата; оторвалась — согни колени, но не бросай.',
        'Two rounds. The longest hollow hold of the course — hold while the lower back stays down; if it lifts, bend the knees, but do not quit.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 45 },
        { exerciseId: 'v_up', reps: 15 },
        { exerciseId: 'plank_shoulder_tap', reps: 24 },
      ],
    },
    cdLower('spc_cooldown'),
  ],
};

/* --- Pull & hinge -------------------------------------------------------------------- */

const W_PULL_HINGE_A: WorkoutInput = {
  id: 'w_pull_hinge_a',
  name: l('Тяга и подтягивания A', 'Pull & hinge A'),
  focus: l(
    'Негативные подтягивания, румынская тяга, тяга ренегата',
    'Negative pull-ups, Romanian deadlifts, renegade rows',
  ),
  description: l(
    'День спины и задней цепи. Сначала подтягивания: четыре подхода негативных — прыгни или залезь в верхнюю точку и опускайся пять секунд; уже есть строгие — делай строгие, а негативными добивай подход. В паре с ними подъёмы коленей в висе. Потом тяга: румынская с тяжёлой парой, тяга ренегата, румынская на одной ноге. Кор — лодочка, боковая планка, супермен.',
    'Back and posterior-chain day. Pull-ups first: four sets of negatives — jump or climb to the top and lower for five seconds; if you already have strict reps, do them and finish the set with negatives. Hanging knee raises are paired with them. Then the hinge: Romanian deadlifts with the heavy pair, renegade rows, single-leg RDLs. Core: hollow hold, side plank, superman.',
  ),
  basePoints: 110,
  tags: ['strength', 'pull', 'hinge', 'core'],
  blocks: [
    wuPullHinge('pha_warmup'),
    {
      id: 'pha_pull',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Подтягивания', 'Pull-ups'),
      description: l(
        'Четыре подхода: негативные → подъём коленей. 20 секунд между упражнениями, 90 между подходами. Пять секунд вниз — это правда пять секунд, считай вслух.',
        'Four sets: negatives → knee raises. Twenty seconds between exercises, 90 between sets. Five seconds down means five real seconds — count out loud.',
      ),
      items: [
        {
          exerciseId: 'negative_pull_up',
          reps: 5,
          restAfterSec: 20,
          note: l(
            'Есть строгие — 3 строгих + 2 негативных',
            'Got strict reps? 3 strict + 2 negatives',
          ),
        },
        {
          exerciseId: 'hanging_knee_raise',
          reps: 10,
          note: l('Колени к груди, без раскачки', 'Knees to the chest, no swinging'),
        },
      ],
    },
    {
      id: 'pha_hinge',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 75,
      title: l('Тяга', 'Hinge'),
      description: l(
        'Четыре подхода по кругу: румынская тяга → тяга ренегата → румынская на одной ноге. 20 секунд между упражнениями, 75 между подходами. Спина плоская всё время, движение начинается с таза.',
        'Four sets in rotation: Romanian deadlift → renegade row → single-leg RDL. Twenty seconds between exercises, 75 between sets. Back flat throughout, the movement starts from the hips.',
      ),
      items: [
        {
          exerciseId: 'db_rdl',
          reps: 10,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Колени мягкие, гантели скользят по бёдрам до середины голени',
            'Soft knees, dumbbells slide down the thighs to mid-shin',
          ),
        },
        {
          exerciseId: 'db_renegade_row',
          reps: 12,
          load: 'medium',
          restAfterSec: 20,
          note: l(
            'По 6 на руку, ноги шире плеч, таз не крутится',
            '6 per arm, feet wide, hips square',
          ),
        },
        {
          exerciseId: 'single_leg_rdl',
          reps: 8,
          perSide: true,
          note: l(
            'Без веса или с лёгкой гантелью в противоположной руке',
            'Bodyweight or a light dumbbell in the opposite hand',
          ),
        },
      ],
    },
    {
      id: 'pha_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга без спешки: таз не проваливается в боковой планке, в супермене пауза секунда наверху.',
        'Two unhurried rounds: hips stay up in the side plank, a one-second pause at the top of the superman.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
        { exerciseId: 'superman', reps: 12 },
      ],
    },
    cdPull('pha_cooldown'),
  ],
};

const W_PULL_HINGE_B: WorkoutInput = {
  id: 'w_pull_hinge_b',
  name: l('Тяга и подтягивания B', 'Pull & hinge B'),
  focus: l('Строгие подтягивания и тяжёлая становая', 'Strict pull-ups and heavy deadlifts'),
  description: l(
    'Подтягивания становятся строгими: пять подходов по четыре. Нет четырёх — два строгих и два негативных, но каждый подход начинай со строгих. Становая с тяжёлой парой, тяга ренегата по восемь на руку, румынская средним весом. Кор — лодочка, складка, боковая планка.',
    'Pull-ups go strict: five sets of four. No four yet? Two strict and two negatives, but open every set with strict reps. Deadlifts with the heavy pair, renegade rows at eight per arm, Romanian deadlifts at a medium weight. Core: hollow hold, V-ups, side plank.',
  ),
  basePoints: 120,
  tags: ['strength', 'pull', 'hinge', 'core'],
  blocks: [
    wuPullHinge('phb_warmup'),
    {
      id: 'phb_pull',
      type: 'strength',
      format: 'sets',
      sets: 5,
      restBetweenSetsSec: 90,
      title: l('Подтягивания', 'Pull-ups'),
      description: l(
        'Пять подходов: строгие подтягивания → подъём коленей. Из полного виса до подбородка над перекладиной, без раскачки. 90 секунд между подходами — используй их все.',
        'Five sets: strict pull-ups → knee raises. From a dead hang to chin over the bar, no kipping. Ninety seconds between sets — use all of them.',
      ),
      items: [
        {
          exerciseId: 'pull_up',
          reps: 4,
          restAfterSec: 20,
          note: l(
            'Нет четырёх — 2 строгих + 2 негативных по 5 секунд',
            'No four yet? 2 strict + 2 five-second negatives',
          ),
        },
        { exerciseId: 'hanging_knee_raise', reps: 12 },
      ],
    },
    {
      id: 'phb_hinge',
      type: 'strength',
      format: 'sets',
      sets: 4,
      restBetweenSetsSec: 90,
      title: l('Тяга', 'Hinge'),
      description: l(
        'Четыре подхода по кругу: становая → тяга ренегата → румынская тяга. 20 секунд между упражнениями, 90 между подходами. В тяге ренегата не крути корпус — тянет спина, а не поясница.',
        'Four sets in rotation: deadlift → renegade row → Romanian deadlift. Twenty seconds between exercises, 90 between sets. Do not twist in the renegade row — the back pulls, not the lower back.',
      ),
      items: [
        {
          exerciseId: 'db_deadlift',
          reps: 10,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'Гантели вдоль голеней, вставай через пятки',
            'Dumbbells along the shins, drive up through the heels',
          ),
        },
        {
          exerciseId: 'db_renegade_row',
          reps: 16,
          load: 'medium',
          restAfterSec: 20,
          note: l('По 8 на руку', '8 per arm'),
        },
        {
          exerciseId: 'db_rdl',
          reps: 10,
          load: 'medium',
          note: l('Три секунды вниз', 'Three seconds down'),
        },
      ],
    },
    {
      id: 'phb_core',
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
        { exerciseId: 'hollow_hold', seconds: 40 },
        { exerciseId: 'v_up', reps: 12 },
        { exerciseId: 'side_plank', seconds: 30, perSide: true },
      ],
    },
    cdPull('phb_cooldown'),
  ],
};

const W_PULL_HINGE_C: WorkoutInput = {
  id: 'w_pull_hinge_c',
  name: l('Тяга и подтягивания C', 'Pull & hinge C'),
  focus: l(
    'Подтягивания по шесть, становая и прогулка фермера',
    'Pull-ups for six, deadlifts and the farmer carry',
  ),
  description: l(
    'Самый объёмный день спины: пять подходов подтягиваний по шесть — тридцать за тренировку, половина того, что ждёт тебя в «Мёрфе». Становая с тяжёлой парой по восемь, тяга ренегата тяжёлой парой, 45 секунд прогулки фермера в каждом подходе. Кор — лодочка, складка, боковая планка. После этого дня — отдых, и он в плане.',
    'The biggest back day: five sets of six pull-ups — thirty in a session, half of what Murph asks for. Deadlifts with the heavy pair for eight, renegade rows with the heavy pair, 45 seconds of farmer carry in every set. Core: hollow hold, V-ups, side plank. After this day comes rest — and it is in the plan.',
  ),
  basePoints: 120,
  tags: ['strength', 'pull', 'hinge', 'carry', 'core', 'peak'],
  blocks: [
    wuPullHinge('phc_warmup'),
    {
      id: 'phc_pull',
      type: 'strength',
      format: 'sets',
      sets: 5,
      restBetweenSetsSec: 90,
      title: l('Подтягивания', 'Pull-ups'),
      description: l(
        'Пять подходов: подтягивания → подъём коленей. Если шестое подтягивание не идёт чисто — четыре строгих и два негативных, но не сокращай число подходов.',
        'Five sets: pull-ups → knee raises. If the sixth rep is not clean — four strict and two negatives, but do not cut the number of sets.',
      ),
      items: [
        {
          exerciseId: 'pull_up',
          reps: 6,
          restAfterSec: 20,
          note: l(
            'Не идут шесть — 4 строгих + 2 негативных',
            'Six not there yet? 4 strict + 2 negatives',
          ),
        },
        { exerciseId: 'hanging_knee_raise', reps: 15 },
      ],
    },
    {
      id: 'phc_hinge',
      type: 'strength',
      format: 'sets',
      sets: 5,
      restBetweenSetsSec: 90,
      title: l('Тяга и хват', 'Hinge & grip'),
      description: l(
        'Пять подходов по кругу: становая → тяга ренегата → прогулка фермера. 20 секунд между упражнениями, 90 между подходами. Прогулка с тяжёлой парой: если гантели тянут плечи вперёд — вес правильный, просто не давай им это сделать.',
        'Five sets in rotation: deadlift → renegade row → farmer carry. Twenty seconds between exercises, 90 between sets. Carry the heavy pair: if the dumbbells try to pull your shoulders forward, the weight is right — just do not let them.',
      ),
      items: [
        { exerciseId: 'db_deadlift', reps: 8, load: 'heavy', restAfterSec: 20 },
        {
          exerciseId: 'db_renegade_row',
          reps: 16,
          load: 'heavy',
          restAfterSec: 20,
          note: l(
            'По 8 на руку. Гантель тянется к бедру, локоть вдоль корпуса',
            '8 per arm. Pull the dumbbell to the hip, elbow along the body',
          ),
        },
        {
          exerciseId: 'farmer_carry',
          seconds: 45,
          load: 'heavy',
          note: l(
            'Плечи назад и вниз, шагай по комнате туда и обратно',
            'Shoulders back and down, walk the room back and forth',
          ),
        },
      ],
    },
    {
      id: 'phc_core',
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
        { exerciseId: 'hollow_hold', seconds: 45 },
        { exerciseId: 'v_up', reps: 15 },
        { exerciseId: 'side_plank', seconds: 40, perSide: true },
      ],
    },
    cdPull('phc_cooldown'),
  ],
};

/* --- Engine (conditioning) ----------------------------------------------------------- */

const W_ENGINE_EMOM12: WorkoutInput = {
  id: 'w_engine_emom12',
  name: l('Двигатель: EMOM 12', 'Engine: EMOM 12'),
  focus: l(
    'Рывок, дьявольский жим и темп по минутам',
    'Snatch, devil press and pacing by the minute',
  ),
  description: l(
    'Первый день выносливости. Короткий блок техники — рывок гантели и дьявольский жим, два движения, на которых держатся метконы этого курса. Потом EMOM 12: нечётная минута — десять рывков, чётная — восемь бёрпи. Сделал — отдыхай до конца минуты. Если работа занимает больше 40 секунд, убавь два повторения в следующем круге. В конце — кор.',
    'The first conditioning day. A short technique block — the dumbbell snatch and the devil press, the two movements the metcons of this course rest on. Then EMOM 12: odd minutes ten snatches, even minutes eight burpees. Finish the reps, rest for what is left of the minute. If the work takes more than 40 seconds, drop two reps in the next cycle. Core to finish.',
  ),
  basePoints: 100,
  tags: ['metcon', 'emom', 'skill', 'cardio', 'core'],
  blocks: [
    wuEngine('ee_warmup'),
    {
      id: 'ee_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 45,
      title: l('Техника: рывок и дьявольский жим', 'Skill: the snatch and the devil press'),
      description: l(
        'Два круга с лёгкой парой. Рывок: ноги толкают, рука — верёвка, гантель летит вдоль тела и фиксируется над головой. Дьявольский жим: грудь к полу между гантелями, встал — и мах обеих над головой с прямой спиной.',
        'Two rounds with the light pair. Snatch: the legs push, the arm is a rope, the dumbbell travels close to the body and locks out overhead. Devil press: chest to the floor between the dumbbells, stand up, then swing both overhead with a flat back.',
      ),
      items: [
        {
          exerciseId: 'db_snatch',
          reps: 6,
          load: 'light',
          note: l(
            'По 3 на руку, медленно, с паузой над коленом',
            '3 per arm, slowly, with a pause above the knee',
          ),
        },
        {
          exerciseId: 'db_devil_press',
          reps: 3,
          load: 'light',
          note: l(
            'Бёрпи на гантели, потом обе гантели махом над головой',
            'Burpee onto the dumbbells, then swing both overhead',
          ),
        },
      ],
    },
    {
      id: 'ee_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 12,
      title: l('EMOM 12 мин', 'EMOM 12 min'),
      description: l(
        'Минута 1 — рывки, минута 2 — бёрпи, и так шесть раз. Цель — заканчивать работу на 35–40-й секунде каждой минуты.',
        'Minute 1 snatches, minute 2 burpees, six times over. The goal is to finish the work by second 35–40 of every minute.',
      ),
      items: [
        {
          exerciseId: 'db_snatch',
          reps: 10,
          load: 'medium',
          note: l('По 5 на руку, меняй руку внизу', '5 per arm, switch hands at the bottom'),
        },
        { exerciseId: 'burpee', reps: 8 },
      ],
    },
    {
      id: 'ee_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. В ножницах поясница на полу, ноги низко, пятки не касаются пола.',
        'Two rounds. In the flutter kicks the lower back stays down, legs low, heels never touch the floor.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 30 },
        { exerciseId: 'flutter_kick', seconds: 30 },
      ],
    },
    cdEngine('ee_cooldown'),
  ],
};

const W_ENGINE_AMRAP15: WorkoutInput = {
  id: 'w_engine_amrap15',
  name: l('Двигатель: AMRAP 15', 'Engine: AMRAP 15'),
  focus: l('Синди со скакалкой', 'Cindy with a rope'),
  description: l(
    'Круг «Синди» — 5 подтягиваний, 10 отжиманий, 15 приседаний — плюс 30 двойных прыжков, пятнадцать минут. Перед стартом блок скакалки: двойные нужно тренировать на свежих ногах. В первый раз, во вторую неделю, просто найди темп и запиши круги; во второй, в шестую, побей это число.',
    'A Cindy round — 5 pull-ups, 10 push-ups, 15 squats — plus 30 double-unders, fifteen minutes. A rope block before the start: double-unders need practising on fresh legs. The first time, in week two, just find the pace and note your rounds; the second time, in week six, beat that number.',
  ),
  basePoints: 110,
  tags: ['metcon', 'amrap', 'skill', 'pull', 'cardio'],
  blocks: [
    wuEngine('ea_warmup'),
    {
      id: 'ea_skill',
      type: 'skill',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 30,
      title: l('Скакалка: двойные', 'Rope: double-unders'),
      description: l(
        'Три круга. Прыжок чуть выше обычного, скакалку крутят кисти, локти у корпуса. Запутался — не злись, просто начни серию заново.',
        'Three rounds. Jump a little higher than usual, the wrists turn the rope, elbows close to the body. Tripped? Do not get angry, just restart the set.',
      ),
      items: [
        { exerciseId: 'single_under', reps: 20 },
        {
          exerciseId: 'double_under',
          reps: 10,
          note: l(
            'Учишь дабл — чередуй: сингл, дабл, сингл. Ещё нет — 20 быстрых синглов',
            'Learning? Alternate single, double, single. Not there yet? 20 fast singles',
          ),
        },
      ],
    },
    {
      id: 'ea_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 900,
      title: l('AMRAP 15 мин', 'AMRAP 15 min'),
      description: l(
        'Максимум кругов за 15 минут. Первые пять минут — на 80 %. Подтягивания сериями, которые не разваливаются; отжимания 5 + 5 раньше, чем откажут руки.',
        'As many rounds as possible in 15 minutes. The first five minutes at 80%. Pull-ups in sets that hold together; push-ups 5 + 5 before your arms give out.',
      ),
      items: [
        {
          exerciseId: 'pull_up',
          reps: 5,
          note: l(
            'Нет строгих — 5 негативных: прыжок вверх, медленно вниз',
            'No strict pull-ups? 5 negatives: jump up, lower slowly',
          ),
        },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'air_squat', reps: 15 },
        {
          exerciseId: 'double_under',
          reps: 30,
          note: l('Или 60 синглов', 'Or 60 singles'),
        },
      ],
    },
    cdEngine('ea_cooldown'),
  ],
};

const W_ENGINE_TABATA: WorkoutInput = {
  id: 'w_engine_tabata',
  name: l('Двигатель: табата', 'Engine: Tabata'),
  focus: l(
    'Три табаты: скакалка, бёрпи, выпрыгивания',
    'Three Tabatas: rope, burpees, jump squats',
  ),
  description: l(
    'Три табаты по четыре минуты — 20 секунд работы, 10 отдыха, восемь раундов — с минутой между ними: двойные прыжки, бёрпи, приседания с выпрыгиванием. Перед стартом короткий блок скакалки. Число рядом с упражнением — цель на один раунд; держи его во всех восьми, а не только в первых трёх. Потом кор.',
    'Three four-minute Tabatas — 20 seconds on, 10 off, eight rounds — with a minute between them: double-unders, burpees, jump squats. A short rope block before the start. The number next to each exercise is the target for one round; hold it through all eight, not just the first three. Core to finish.',
  ),
  basePoints: 100,
  tags: ['metcon', 'tabata', 'skill', 'cardio', 'core'],
  blocks: [
    wuEngine('et_warmup'),
    {
      id: 'et_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Скакалка: двойные', 'Rope: double-unders'),
      description: l(
        'Два круга. Синглы — ритм, двойные — сериями, сколько получается без ошибки.',
        'Two rounds. Singles for rhythm, doubles in sets as long as you can go without a miss.',
      ),
      items: [
        { exerciseId: 'single_under', reps: 20 },
        {
          exerciseId: 'double_under',
          reps: 15,
          note: l(
            'Ещё нет — сингл, дабл, сингл или 30 быстрых синглов',
            'Not there yet? Single, double, single — or 30 fast singles',
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
        'Восемь раундов скакалки, минута отдыха, восемь раундов бёрпи, минута, восемь раундов выпрыгиваний. В последних раундах делай, сколько успеваешь, не теряя техники.',
        'Eight rounds of rope, a minute of rest, eight rounds of burpees, a minute, eight rounds of jump squats. In the last rounds do what you can without losing form.',
      ),
      items: [
        {
          exerciseId: 'double_under',
          reps: 15,
          note: l('Или 30 синглов', 'Or 30 singles'),
        },
        { exerciseId: 'burpee', reps: 6 },
        {
          exerciseId: 'jump_squat',
          reps: 10,
          note: l('Приземляйся мягко, в полный присед', 'Land softly, into a full squat'),
        },
      ],
    },
    {
      id: 'et_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. В русском твисте пятки на полу или на весу — как держишь спину прямой.',
        'Two rounds. In the Russian twist keep the heels down or up — whichever keeps your back straight.',
      ),
      items: [
        { exerciseId: 'v_up', reps: 12 },
        { exerciseId: 'russian_twist', reps: 20 },
        { exerciseId: 'flutter_kick', seconds: 30 },
      ],
    },
    cdEngine('et_cooldown'),
  ],
};

const W_ENGINE_EMOM16: WorkoutInput = {
  id: 'w_engine_emom16',
  name: l('Двигатель: EMOM 16', 'Engine: EMOM 16'),
  focus: l('Четыре движения по кругу минутами', 'Four movements rotating by the minute'),
  description: l(
    'Шестнадцать минут, четыре движения по кругу: дьявольский жим, двойные прыжки, подтягивания, бёрпи — четыре цикла. Каждое должно занимать 30–40 секунд, остаток минуты — отдых. Это самый плотный «двигатель» курса: если к третьему циклу не укладываешься, убирай по одному повторению, а не пропускай минуты. Кор — лодочка и подъёмы коленей в висе.',
    'Sixteen minutes, four movements in rotation: devil presses, double-unders, pull-ups, burpees — four cycles. Each should take 30–40 seconds, the rest of the minute is rest. It is the densest engine day of the course: if you are not making it by the third cycle, drop a rep at a time, do not skip minutes. Core: hollow hold and hanging knee raises.',
  ),
  basePoints: 110,
  tags: ['metcon', 'emom', 'skill', 'pull', 'cardio', 'core'],
  blocks: [
    wuEngine('ee16_warmup'),
    {
      id: 'ee16_skill',
      type: 'skill',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Техника: скакалка и дьявольский жим', 'Skill: rope and devil press'),
      description: l(
        'Два круга с лёгкой парой. Двойные — сериями; дьявольский жим — медленно, с полной фиксацией над головой.',
        'Two rounds with the light pair. Doubles in sets; the devil press slowly, with a full lockout overhead.',
      ),
      items: [
        {
          exerciseId: 'double_under',
          reps: 20,
          note: l('Или 40 синглов', 'Or 40 singles'),
        },
        { exerciseId: 'db_devil_press', reps: 3, load: 'light' },
      ],
    },
    {
      id: 'ee16_emom',
      type: 'metcon',
      format: 'emom',
      rounds: 16,
      title: l('EMOM 16 мин', 'EMOM 16 min'),
      description: l(
        'Минута 1 — дьявольский жим, 2 — скакалка, 3 — подтягивания, 4 — бёрпи, четыре круга. Дыши ровно в отдыхе: три-четыре глубоких выдоха до следующего сигнала.',
        'Minute 1 devil presses, 2 rope, 3 pull-ups, 4 burpees, four cycles. Breathe evenly in the rest: three or four deep exhales before the next beep.',
      ),
      items: [
        {
          exerciseId: 'db_devil_press',
          reps: 5,
          load: 'medium',
          note: l(
            'Не идёт — 5 бёрпи + взятие двух гантелей',
            'Too hard? 5 burpees + a two-dumbbell clean',
          ),
        },
        {
          exerciseId: 'double_under',
          reps: 30,
          note: l('Или 60 синглов', 'Or 60 singles'),
        },
        {
          exerciseId: 'pull_up',
          reps: 5,
          note: l('Нет строгих — 5 негативных', 'No strict pull-ups? 5 negatives'),
        },
        { exerciseId: 'burpee', reps: 8 },
      ],
    },
    {
      id: 'ee16_core',
      type: 'core',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 30,
      title: l('Кор', 'Core'),
      description: l(
        'Два круга. После EMOM хват устал — в подъёмах коленей держи перекладину спокойно, без сжатия до белых пальцев.',
        'Two rounds. Your grip is tired after the EMOM — hold the bar calmly in the knee raises, no white-knuckle squeeze.',
      ),
      items: [
        { exerciseId: 'hollow_hold', seconds: 40 },
        { exerciseId: 'hanging_knee_raise', reps: 12 },
      ],
    },
    cdEngine('ee16_cooldown'),
  ],
};

/* --- Chippers and Murph rehearsals --------------------------------------------------- */

const W_CHIPPER_A: WorkoutInput = {
  id: 'w_chipper_a',
  name: l('Чиппер 60-50-40-30-20-10', 'Chipper 60-50-40-30-20-10'),
  focus: l('Один проход на время', 'One pass for time'),
  description: l(
    'Чиппер — список движений, который ты «откусываешь» по кусочку: 60 двойных прыжков, 50 приседаний, 40 отжиманий, 30 рывков гантели, 20 складок, 10 дьявольских жимов. Один проход, лимит 15 минут. Порядок такой специально: сначала ноги, потом руки, потом всё вместе. Стратегия — короткие серии с короткими паузами, а не одна большая серия и минута стояния.',
    'A chipper is a list of movements you chip away at: 60 double-unders, 50 air squats, 40 push-ups, 30 dumbbell snatches, 20 V-ups, 10 devil presses. One pass, 15-minute cap. The order is deliberate: legs first, then arms, then everything at once. Strategy: short sets with short breaks, not one huge set and a minute of standing around.',
  ),
  basePoints: 110,
  tags: ['metcon', 'fortime', 'chipper', 'full_body'],
  blocks: [
    wuFull('cha_warmup'),
    {
      id: 'cha_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 900,
      title: l('На время, лимит 15 мин', 'For time, 15-min cap'),
      description: l(
        'Один проход сверху вниз. Засеки и запиши время: чипперы ещё вернутся.',
        'One pass from the top down. Time it and write it down: the chippers will be back.',
      ),
      items: [
        {
          exerciseId: 'double_under',
          reps: 60,
          note: l('Или 120 синглов', 'Or 120 singles'),
        },
        { exerciseId: 'air_squat', reps: 50 },
        {
          exerciseId: 'push_up',
          reps: 40,
          note: l('Разбивай 10 + 10 + 10 + 10', 'Split 10 + 10 + 10 + 10'),
        },
        {
          exerciseId: 'db_snatch',
          reps: 30,
          load: 'light',
          note: l('По 15 на руку, меняй каждые 5', '15 per arm, switch every 5'),
        },
        {
          exerciseId: 'v_up',
          reps: 20,
          note: l('Или ситапы с прямыми руками', 'Or sit-ups with straight arms overhead'),
        },
        {
          exerciseId: 'db_devil_press',
          reps: 10,
          load: 'light',
          note: l(
            'Не идёт — бёрпи + взятие двух гантелей',
            'Too hard? Burpee + a two-dumbbell clean',
          ),
        },
      ],
    },
    cdEngine('cha_cooldown'),
  ],
};

const W_CHIPPER_B: WorkoutInput = {
  id: 'w_chipper_b',
  name: l('Чиппер: 4 круга', 'Chipper: 4 rounds'),
  focus: l(
    'Подтягивания, трастеры, выпады, скакалка, бёрпи',
    'Pull-ups, thrusters, lunges, rope, burpees',
  ),
  description: l(
    'Четыре круга на время, лимит 20 минут: 8 подтягиваний, 12 трастеров, 20 прыжковых выпадов, 40 двойных, 8 бёрпи. Пять движений, ни одного «лёгкого» — это репетиция того, как тело ведёт себя на пятнадцатой минуте под нагрузкой. Лёгкая пара в трастерах; подтягивания разбивай 4 + 4 с первого круга, а не когда придётся.',
    'Four rounds for time, 20-minute cap: 8 pull-ups, 12 thrusters, 20 jumping lunges, 40 double-unders, 8 burpees. Five movements and not one easy one — a rehearsal of how the body behaves fifteen minutes into hard work. Light pair in the thrusters; split the pull-ups 4 + 4 from round one, not when you are forced to.',
  ),
  basePoints: 120,
  tags: ['metcon', 'fortime', 'chipper', 'pull', 'full_body'],
  blocks: [
    wuFull('chb_warmup'),
    {
      id: 'chb_fortime',
      type: 'metcon',
      format: 'fortime',
      sets: 4,
      rounds: 4,
      durationSec: 1200,
      title: l('4 круга на время', '4 rounds for time'),
      description: l(
        'Лимит 20 минут. Между кругами не садись: пройди три шага, выдохни и начинай следующий.',
        '20-minute cap. Do not sit down between rounds: take three steps, exhale and start the next one.',
      ),
      items: [
        {
          exerciseId: 'pull_up',
          reps: 8,
          note: l(
            'Нет строгих — негативные, по 5 в круге',
            'No strict pull-ups? Negatives, 5 per round',
          ),
        },
        {
          exerciseId: 'db_thruster',
          reps: 12,
          load: 'light',
          note: l('Лёгкая пара, без остановки', 'Light pair, unbroken'),
        },
        {
          exerciseId: 'jumping_lunge',
          reps: 20,
          note: l('По 10 на ногу', '10 per leg'),
        },
        {
          exerciseId: 'double_under',
          reps: 40,
          note: l('Или 80 синглов', 'Or 80 singles'),
        },
        { exerciseId: 'burpee', reps: 8 },
      ],
    },
    cdLower('chb_cooldown'),
  ],
};

const W_MURPH_PREP_A: WorkoutInput = {
  id: 'w_murph_prep_a',
  name: l('Четверть Мёрфа', 'Quarter Murph'),
  focus: l(
    'Бег, 25 подтягиваний, 50 отжиманий, 75 приседаний, бег',
    'Run, 25 pull-ups, 50 push-ups, 75 squats, run',
  ),
  description: l(
    'Первая репетиция главного бенчмарка курса: две минуты бега на месте, 25 подтягиваний, 50 отжиманий, 75 приседаний и снова две минуты бега — четверть настоящего «Мёрфа». Лимит 20 минут. Среднюю часть разбей на пять кругов по 5-10-15: так ты никогда не упрёшься в отказ. Запиши время: в седьмую неделю ты сделаешь эту же тренировку и сравнишь.',
    'The first rehearsal of the main benchmark of the course: two minutes of jogging in place, 25 pull-ups, 50 push-ups, 75 squats and two more minutes of jogging — a quarter of the real Murph. 20-minute cap. Split the middle into five rounds of 5-10-15: that way you never hit failure. Note your time: in week seven you do this exact session again and compare.',
  ),
  basePoints: 120,
  tags: ['metcon', 'fortime', 'murph', 'pull', 'push', 'squat'],
  blocks: [
    wuFull('mpa_warmup'),
    {
      id: 'mpa_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 1200,
      title: l('На время, лимит 20 мин', 'For time, 20-min cap'),
      description: l(
        'Бег → 5 кругов «Синди» → бег. Круги делай подряд, без пауз между движениями дольше трёх вдохов.',
        'Run → 5 Cindy rounds → run. Do the rounds back to back, no break between movements longer than three breaths.',
      ),
      items: [
        {
          exerciseId: 'jog_in_place',
          seconds: 120,
          note: l(
            'Бег на месте: колени выше, темп разговорный',
            'Jog in place: knees up, a talking pace',
          ),
        },
        {
          exerciseId: 'pull_up',
          reps: 25,
          note: l(
            '5 кругов по 5. Нет строгих — негативные с прыжком',
            '5 rounds of 5. No strict pull-ups? Jumping negatives',
          ),
        },
        {
          exerciseId: 'push_up',
          reps: 50,
          note: l('По 10 в круге', '10 per round'),
        },
        {
          exerciseId: 'air_squat',
          reps: 75,
          note: l('По 15 в круге', '15 per round'),
        },
        {
          exerciseId: 'jog_in_place',
          seconds: 120,
          note: l(
            'Второй бег — на уставших ногах, но темп тот же',
            'The second run is on tired legs, but the pace is the same',
          ),
        },
      ],
    },
    cdEngine('mpa_cooldown'),
  ],
};

const W_MURPH_PREP_B: WorkoutInput = {
  id: 'w_murph_prep_b',
  name: l('Репетиция Мёрфа', 'Murph rehearsal'),
  focus: l(
    'Бег, 40 подтягиваний, 80 отжиманий, 120 приседаний, бег',
    'Run, 40 pull-ups, 80 push-ups, 120 squats, run',
  ),
  description: l(
    'Генеральная репетиция: две с половиной минуты бега, 40 подтягиваний, 80 отжиманий, 120 приседаний, две с половиной минуты бега — восемь кругов по 5-10-15 внутри, лимит 30 минут. Это 80 % финального бенчмарка, и главное здесь — темп: круг за две-две с половиной минуты, без рывка в начале. Найди схему разбивки, которая работает, — с ней и пойдёшь на «Мёрф» через две недели.',
    'The dress rehearsal: two and a half minutes of jogging, 40 pull-ups, 80 push-ups, 120 squats, two and a half minutes of jogging — eight rounds of 5-10-15 in the middle, 30-minute cap. It is 80% of the final benchmark, and pace is everything here: a round every two to two and a half minutes, no sprint at the start. Find the partitioning that works — it is the one you take into Murph two weeks later.',
  ),
  basePoints: 130,
  tags: ['metcon', 'fortime', 'murph', 'pull', 'push', 'squat', 'peak'],
  blocks: [
    wuFull('mpb_warmup'),
    {
      id: 'mpb_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 1800,
      title: l('На время, лимит 30 мин', 'For time, 30-min cap'),
      description: l(
        'Бег → 8 кругов «Синди» → бег. Отжимания разбивай 5 + 5 уже с третьего круга: экономь руки для последних кругов.',
        'Run → 8 Cindy rounds → run. Split the push-ups 5 + 5 from round three on: save your arms for the last rounds.',
      ),
      items: [
        { exerciseId: 'jog_in_place', seconds: 150 },
        {
          exerciseId: 'pull_up',
          reps: 40,
          note: l(
            '8 кругов по 5. Нет строгих — негативные с прыжком',
            '8 rounds of 5. No strict pull-ups? Jumping negatives',
          ),
        },
        {
          exerciseId: 'push_up',
          reps: 80,
          note: l('По 10 в круге', '10 per round'),
        },
        {
          exerciseId: 'air_squat',
          reps: 120,
          note: l('По 15 в круге', '15 per round'),
        },
        { exerciseId: 'jog_in_place', seconds: 150 },
      ],
    },
    cdLong('mpb_cooldown'),
  ],
};

/* --- The easy day -------------------------------------------------------------------- */

const W_SKILL_FLOW: WorkoutInput = {
  id: 'w_skill_flow',
  name: l('Лёгкий день: техника', 'Easy day: technique'),
  focus: l('Скакалка, строгие подтягивания, растяжка', 'Rope, strict pull-ups, stretching'),
  description: l(
    'Лёгкий день, пульс низкий. Три круга: двойные прыжки сериями, три медленных негативных (или три строгих с паузой наверху), гоблет-присед с паузой внизу, медвежья походка и удержание в приседе. Потом спокойный кор и длинная растяжка. В разгрузочную неделю это день, когда тело догоняет нагрузку; в восьмую — последняя тренировка перед «Мёрфом», и цель у неё одна: прийти на бенчмарк свежим.',
    'An easy day, heart rate low. Three rounds: double-unders in sets, three slow negatives (or three strict pull-ups with a pause at the top), goblet squats with a pause at the bottom, bear crawl and a bottom-squat hold. Then calm core work and a long stretch. In the deload week this is the day your body catches up with the training; in week eight it is the last session before Murph, and its only goal is to arrive at the benchmark fresh.',
  ),
  basePoints: 90,
  tags: ['recovery', 'skill', 'mobility', 'core'],
  blocks: [
    wuPullHinge('sf_warmup'),
    {
      id: 'sf_skill',
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
          exerciseId: 'double_under',
          reps: 20,
          note: l(
            'Сериями по 5–10, без спешки. Нет — 40 синглов',
            'Sets of 5–10, unhurried. Not there yet? 40 singles',
          ),
        },
        {
          exerciseId: 'negative_pull_up',
          reps: 3,
          note: l(
            'Пять секунд вниз. Есть строгие — 3 строгих с паузой наверху',
            'Five seconds down. Got strict reps? 3 strict with a pause at the top',
          ),
        },
        {
          exerciseId: 'db_goblet_squat',
          reps: 10,
          load: 'light',
          note: l('Пауза две секунды внизу', 'Two-second pause at the bottom'),
        },
        { exerciseId: 'bear_crawl', seconds: 20 },
        { exerciseId: 'squat_hold', seconds: 20 },
      ],
    },
    {
      id: 'sf_core',
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
        { exerciseId: 'hollow_hold', seconds: 20 },
      ],
    },
    cdLong('sf_cooldown'),
  ],
};

/* --- Benchmarks ---------------------------------------------------------------------- */

const W_BENCH_CINDY: WorkoutInput = {
  id: 'w_bench_cindy',
  name: l('Синди', 'Cindy'),
  focus: l('Бенчмарк: AMRAP 20', 'Benchmark: AMRAP 20'),
  description: l(
    '«Синди» — классический кроссфит-бенчмарк: 20 минут, круг — 5 подтягиваний, 10 отжиманий, 15 приседаний. Никакого оборудования, кроме турника, и никаких скидок. Хороший результат для домашнего атлета — 15 кругов, очень хороший — 20. Темп ровный с первой минуты: круг в минуту — это 20 кругов; если первые три круга ты сделал быстрее, чем за две с половиной минуты, — притормози. Запиши число кругов.',
    'Cindy is a classic CrossFit benchmark: 20 minutes, one round is 5 pull-ups, 10 push-ups, 15 air squats. No equipment but the bar, and no discounts. A good result for a home athlete is 15 rounds, a very good one is 20. Even pace from the first minute: a round a minute is 20 rounds; if your first three rounds took less than two and a half minutes, slow down. Write down your rounds.',
  ),
  basePoints: 150,
  tags: ['benchmark', 'amrap', 'pull', 'push', 'squat'],
  blocks: [
    wuFull('bc_warmup'),
    {
      id: 'bc_amrap',
      type: 'metcon',
      format: 'amrap',
      durationSec: 1200,
      title: l('AMRAP 20 мин', 'AMRAP 20 min'),
      description: l(
        'Максимум кругов за 20 минут. Отжимания разбивай раньше, чем откажут руки: 6 + 4 лучше, чем 10 и минута стояния.',
        'As many rounds as possible in 20 minutes. Break the push-ups before your arms give out: 6 + 4 beats 10 and a minute of standing around.',
      ),
      items: [
        {
          exerciseId: 'pull_up',
          reps: 5,
          note: l(
            'Нет строгих — негативные с прыжком, но считай честно',
            'No strict pull-ups? Jumping negatives — but count honestly',
          ),
        },
        { exerciseId: 'push_up', reps: 10 },
        { exerciseId: 'air_squat', reps: 15 },
      ],
    },
    cdEngine('bc_cooldown'),
  ],
};

const W_BENCH_HALF_MURPH: WorkoutInput = {
  id: 'w_bench_half_murph',
  name: l('Половина Мёрфа', 'Half Murph'),
  focus: l('Финальный бенчмарк', 'The final benchmark'),
  description: l(
    '«Мёрф» — бенчмарк-мемориал в честь лейтенанта Майкла Мёрфи: миля бега, 100 подтягиваний, 200 отжиманий, 300 приседаний и ещё миля. Наша домашняя половина: три минуты бега на месте, 50 подтягиваний, 100 отжиманий, 150 приседаний, три минуты бега — лимит 40 минут. Разбивай середину как на репетициях: 10 кругов по 5-10-15 или 20 по 3-5-8 — как тебе удобнее. Это финал восьми недель. Не ускоряйся в первые пять минут, дыши, и время придёт само.',
    'Murph is a memorial benchmark for Lieutenant Michael Murphy: a mile run, 100 pull-ups, 200 push-ups, 300 squats and another mile. Our home half: three minutes of jogging in place, 50 pull-ups, 100 push-ups, 150 squats, three minutes of jogging — 40-minute cap. Partition the middle the way you rehearsed: 10 rounds of 5-10-15 or 20 rounds of 3-5-8, whichever suits you. This is the finale of eight weeks. Do not speed up in the first five minutes, breathe, and the time will take care of itself.',
  ),
  basePoints: 150,
  tags: ['benchmark', 'fortime', 'murph', 'pull', 'push', 'squat'],
  blocks: [
    wuFull('bhm_warmup'),
    {
      id: 'bhm_fortime',
      type: 'metcon',
      format: 'fortime',
      durationSec: 2400,
      title: l('На время, лимит 40 мин', 'For time, 40-min cap'),
      description: l(
        'Бег → 50 / 100 / 150 любой разбивкой → бег. Гантели сегодня не нужны: только турник, пол и ты.',
        'Run → 50 / 100 / 150 in any partition → run. No dumbbells today: just the bar, the floor and you.',
      ),
      items: [
        {
          exerciseId: 'jog_in_place',
          seconds: 180,
          note: l(
            'Бег на месте: колени выше, темп разговорный',
            'Jog in place: knees up, a talking pace',
          ),
        },
        {
          exerciseId: 'pull_up',
          reps: 50,
          note: l(
            '10 кругов по 5. Нет строгих — негативные с прыжком',
            '10 rounds of 5. No strict pull-ups? Jumping negatives',
          ),
        },
        {
          exerciseId: 'push_up',
          reps: 100,
          note: l(
            'По 10 в круге, 5 + 5 когда станет тяжело',
            '10 per round, 5 + 5 once it gets hard',
          ),
        },
        {
          exerciseId: 'air_squat',
          reps: 150,
          note: l('По 15 в круге', '15 per round'),
        },
        {
          exerciseId: 'jog_in_place',
          seconds: 180,
          note: l(
            'Последний бег: всё, что осталось, но без потери формы',
            'The last run: whatever is left, without losing form',
          ),
        },
      ],
    },
    cdLong('bhm_cooldown'),
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
  'Крепатура после выпадов и подтягиваний — норма. Прогулка снимет её быстрее, чем диван',
  'Soreness after lunges and pull-ups is normal. A walk clears it faster than the couch',
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
const REST_GRIP = l(
  'Дай ладоням отдохнуть: никаких лишних висов. Шаги, вода, сон',
  'Give your palms a break: no extra hanging. Steps, water, sleep',
);
const REST_BEFORE_BENCHMARK = l(
  'Завтра бенчмарк: шаги, вода, ранний сон. Никакой «дополнительной» работы',
  'Benchmark tomorrow: steps, water, an early night. No "extra" work today',
);
const REST_DELOAD = l(
  'Разгрузочная неделя: гуляй и спи. Тело усваивает три недели работы',
  'Deload week: walk and sleep. Your body is absorbing three weeks of work',
);
const REST_AFTER_MURPH = l(
  'После «Мёрфа» — только прогулка и еда. Плечи и спина восстанавливаются двое суток',
  'After Murph — a walk and food, nothing else. Shoulders and back need two days to recover',
);
const REST_BEFORE_TEST = l(
  'Завтра повторный тест — только прогулка и хороший сон',
  "Retest tomorrow — just a walk and a good night's sleep",
);

const T_SQUAT_PUSH = l('Присед и жим', 'Squat & push');
const T_PULL_HINGE = l('Тяга и подтягивания', 'Pull & hinge');
const T_ENGINE = l('Двигатель', 'Engine');
const T_CHIPPER = l('Чиппер', 'Chipper');
const T_MURPH_PREP = l('Репетиция Мёрфа', 'Murph rehearsal');
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
    id: 'w1d3_squat_push',
    week: 1,
    day: 3,
    kind: 'workout',
    workoutId: 'w_squat_push_a',
    title: T_SQUAT_PUSH,
    subtitle: l('4 подхода + AMRAP 7 мин', '4 sets + AMRAP 7 min'),
  },
  rest(1, 4, REST_SORE),
  {
    id: 'w1d5_pull_hinge',
    week: 1,
    day: 5,
    kind: 'workout',
    workoutId: 'w_pull_hinge_a',
    title: T_PULL_HINGE,
    subtitle: l('Негативные подтягивания + тяга', 'Negative pull-ups + hinge'),
  },
  {
    id: 'w1d6_engine',
    week: 1,
    day: 6,
    kind: 'workout',
    workoutId: 'w_engine_emom12',
    title: T_ENGINE,
    subtitle: l('Техника рывка + EMOM 12 мин', 'Snatch skill + EMOM 12 min'),
  },
  rest(1, 7, REST_WEEKEND),

  /* Week 2 — full four-day rhythm: A variants, Cindy with a rope, the first chipper. */
  {
    id: 'w2d1_squat_push',
    week: 2,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_a',
    title: T_SQUAT_PUSH,
    subtitle: l('4 подхода · чуть тяжелее', '4 sets · a little heavier'),
  },
  rest(2, 2, REST_SLEEP),
  {
    id: 'w2d3_pull_hinge',
    week: 2,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_a',
    title: T_PULL_HINGE,
    subtitle: l('4 подхода · негативные по 5 секунд', '4 sets · five-second negatives'),
  },
  {
    id: 'w2d4_engine',
    week: 2,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap15',
    title: T_ENGINE,
    subtitle: l('Скакалка + AMRAP 15 мин', 'Rope skill + AMRAP 15 min'),
  },
  rest(2, 5, REST_STEPS),
  {
    id: 'w2d6_chipper',
    week: 2,
    day: 6,
    kind: 'workout',
    workoutId: 'w_chipper_a',
    title: T_CHIPPER,
    subtitle: l('60-50-40-30-20-10 на время', '60-50-40-30-20-10 for time'),
  },
  rest(2, 7, REST_WEEKEND),

  /* Week 3 — B variants, strict pull-ups, Tabata, the first Murph rehearsal. */
  {
    id: 'w3d1_squat_push',
    week: 3,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_b',
    title: T_SQUAT_PUSH,
    subtitle: l('5 подходов + AMRAP 8 мин', '5 sets + AMRAP 8 min'),
  },
  rest(3, 2, REST_GRIP),
  {
    id: 'w3d3_pull_hinge',
    week: 3,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_b',
    title: T_PULL_HINGE,
    subtitle: l('5 подходов · строгие подтягивания', '5 sets · strict pull-ups'),
  },
  {
    id: 'w3d4_engine',
    week: 3,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_tabata',
    title: T_ENGINE,
    subtitle: l('Скакалка + 3 табаты 20/10', 'Rope skill + 3 Tabatas 20/10'),
  },
  rest(3, 5, REST_SORE),
  {
    id: 'w3d6_murph_prep',
    week: 3,
    day: 6,
    kind: 'workout',
    workoutId: 'w_murph_prep_a',
    title: T_MURPH_PREP,
    subtitle: l('Четверть Мёрфа · лимит 20 мин', 'Quarter Murph · 20-min cap'),
  },
  rest(3, 7, REST_SLEEP),

  /* Week 4 — deload: B variants at ×0.65, an easy technique day, then Cindy on fresh legs. */
  {
    id: 'w4d1_squat_push',
    week: 4,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_b',
    deload: true,
    title: T_SQUAT_PUSH,
    subtitle: l('Разгрузка · объём −35 %', 'Deload · volume −35%'),
  },
  rest(4, 2, REST_DELOAD),
  {
    id: 'w4d3_pull_hinge',
    week: 4,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_b',
    deload: true,
    title: T_PULL_HINGE,
    subtitle: l('Разгрузка · объём −35 %', 'Deload · volume −35%'),
  },
  {
    id: 'w4d4_flow',
    week: 4,
    day: 4,
    kind: 'workout',
    workoutId: 'w_skill_flow',
    deload: true,
    title: T_FLOW,
    subtitle: l('Разгрузка · скакалка и техника', 'Deload · rope and technique'),
  },
  rest(4, 5, REST_BEFORE_BENCHMARK),
  {
    id: 'w4d6_benchmark',
    week: 4,
    day: 6,
    kind: 'benchmark',
    workoutId: 'w_bench_cindy',
    title: l('Синди', 'Cindy'),
    subtitle: l('Бенчмарк · AMRAP 20 мин', 'Benchmark · AMRAP 20 min'),
  },
  rest(4, 7, REST_SLEEP),

  /* Week 5 — C variants: the heavy pair, pull-ups for six, EMOM 16, the four-round chipper. */
  {
    id: 'w5d1_squat_push',
    week: 5,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_c',
    title: T_SQUAT_PUSH,
    subtitle: l('5 подходов · тяжёлая пара + AMRAP 10', '5 sets · heavy pair + AMRAP 10'),
  },
  rest(5, 2, REST_SORE),
  {
    id: 'w5d3_pull_hinge',
    week: 5,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_c',
    title: T_PULL_HINGE,
    subtitle: l('5 × 6 подтягиваний + становая', '5 × 6 pull-ups + deadlifts'),
  },
  {
    id: 'w5d4_engine',
    week: 5,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_emom16',
    title: T_ENGINE,
    subtitle: l('EMOM 16 мин · 4 движения', 'EMOM 16 min · 4 movements'),
  },
  rest(5, 5, REST_GRIP),
  {
    id: 'w5d6_chipper',
    week: 5,
    day: 6,
    kind: 'workout',
    workoutId: 'w_chipper_b',
    title: T_CHIPPER,
    subtitle: l('4 круга на время, лимит 20 мин', '4 rounds for time, 20-min cap'),
  },
  rest(5, 7, REST_WEEKEND),

  /* Week 6 — C variants again, AMRAP 15 to beat week 2, the dress rehearsal of Murph. */
  {
    id: 'w6d1_squat_push',
    week: 6,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_c',
    title: T_SQUAT_PUSH,
    subtitle: l('5 подходов · вес ещё тяжелее', '5 sets · heavier still'),
  },
  rest(6, 2, REST_SLEEP),
  {
    id: 'w6d3_pull_hinge',
    week: 6,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_c',
    title: T_PULL_HINGE,
    subtitle: l('5 × 6 подтягиваний + прогулка фермера', '5 × 6 pull-ups + farmer carry'),
  },
  {
    id: 'w6d4_engine',
    week: 6,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_amrap15',
    title: T_ENGINE,
    subtitle: l('AMRAP 15 мин · побей вторую неделю', 'AMRAP 15 min · beat week two'),
  },
  rest(6, 5, REST_STEPS),
  {
    id: 'w6d6_murph_prep',
    week: 6,
    day: 6,
    kind: 'workout',
    workoutId: 'w_murph_prep_b',
    title: T_MURPH_PREP,
    subtitle: l('Генеральная репетиция · лимит 30 мин', 'Dress rehearsal · 30-min cap'),
  },
  rest(6, 7, REST_SLEEP),

  /* Week 7 — the last full week: C variants, EMOM 16 again, Quarter Murph to compare with week 3. */
  {
    id: 'w7d1_squat_push',
    week: 7,
    day: 1,
    kind: 'workout',
    workoutId: 'w_squat_push_c',
    title: T_SQUAT_PUSH,
    subtitle: l('5 подходов · последний тяжёлый присед', '5 sets · the last heavy squat day'),
  },
  rest(7, 2, REST_SORE),
  {
    id: 'w7d3_pull_hinge',
    week: 7,
    day: 3,
    kind: 'workout',
    workoutId: 'w_pull_hinge_c',
    title: T_PULL_HINGE,
    subtitle: l('5 × 6 · последний день тяги', '5 × 6 · the last pull day'),
  },
  {
    id: 'w7d4_engine',
    week: 7,
    day: 4,
    kind: 'workout',
    workoutId: 'w_engine_emom16',
    title: T_ENGINE,
    subtitle: l('EMOM 16 мин · второй раз', 'EMOM 16 min · second pass'),
  },
  rest(7, 5, REST_STEPS),
  {
    id: 'w7d6_murph_prep',
    week: 7,
    day: 6,
    kind: 'workout',
    workoutId: 'w_murph_prep_a',
    title: T_MURPH_PREP,
    subtitle: l(
      'Четверть Мёрфа · сравни с третьей неделей',
      'Quarter Murph · compare with week three',
    ),
  },
  rest(7, 7, REST_WEEKEND),

  /* Week 8 — taper: an easy technique day, Half Murph, two days of recovery, the retest. */
  {
    id: 'w8d1_flow',
    week: 8,
    day: 1,
    kind: 'workout',
    workoutId: 'w_skill_flow',
    title: T_FLOW,
    subtitle: l('Подводка · техника и растяжка', 'Taper · technique and stretching'),
  },
  rest(8, 2, REST_BEFORE_BENCHMARK),
  {
    id: 'w8d3_benchmark',
    week: 8,
    day: 3,
    kind: 'benchmark',
    workoutId: 'w_bench_half_murph',
    title: l('Половина Мёрфа', 'Half Murph'),
    subtitle: l('Бенчмарк · на время, лимит 40 мин', 'Benchmark · for time, 40-min cap'),
  },
  rest(8, 4, REST_AFTER_MURPH),
  rest(8, 5, REST_BEFORE_TEST),
  {
    id: 'w8d6_retest',
    week: 8,
    day: 6,
    kind: 'test',
    workoutId: 'w_test',
    title: l('Повторный тест', 'Retest'),
    subtitle: l('Те же 4 теста · сравни с первой неделей', 'Same 4 tests · compare with week 1'),
  },
];

/* ------------------------------------------------------------------------------------ */
/* Course                                                                                */
/* ------------------------------------------------------------------------------------ */

export const COURSE_ATHLETE: CourseInput = {
  id: 'athlete',
  order: 5,
  slug: { ru: 'atlet-prodvinutyj-domashnij-krossfit', en: 'home-athlete' },
  name: l('Атлет: продвинутый домашний кроссфит', 'Home Athlete'),
  tagline: l(
    'Восемь недель продвинутого кроссфита дома: подтягивания, двойные прыжки, дьявольский жим, длинные AMRAP — и «Мёрф» в финале.',
    'Eight weeks of advanced CrossFit at home: pull-ups, double-unders, devil presses, long AMRAPs — and Murph at the end.',
  ),
  description: l(
    'Курс для тех, кто уже тренируется и хочет большего: четыре дня в неделю, гантели, турник и скакалка. Два силовых дня — присед и жим, тяга и подтягивания, — день «двигателя» с EMOM, AMRAP и табатой и день чипперов. Разгрузка в четвёртую неделю с «Синди» на 20 минут в её конце и половина «Мёрфа» в восьмую.',
    'For those who already train and want more: four days a week, dumbbells, a pull-up bar and a jump rope. Two strength days — squat & push, pull & hinge — an engine day with EMOMs, AMRAPs and Tabata, and a chipper day. A deload in week four with a 20-minute Cindy at its end, and Half Murph in week eight.',
  ),
  longDescription: [
    l(
      'Это третий уровень: курс для тех, кто отжимается двадцать пять раз подряд, держит планку две минуты и хотя бы раз висел на турнике с мыслью «а если подтянуться?». Восемь недель построены вокруг трёх навыков, которых нет в младших курсах: строгие подтягивания, двойные прыжки на скакалке и дьявольский жим. Каждый идёт по своей лестнице — негативные подтягивания превращаются в строгие по четыре, потом по шесть; синглы на скакалке — в серии двойных; бёрпи — в бёрпи с гантелями и махом над головой.',
      'This is level three: a course for someone who does twenty-five push-ups in a row, holds a plank for two minutes and has hung from a bar at least once thinking "what if I pulled?". Eight weeks are built around three skills the earlier courses do not have: strict pull-ups, double-unders and the devil press. Each climbs its own ladder — negative pull-ups become strict sets of four, then six; single-unders become sets of doubles; burpees become burpees with dumbbells and a swing overhead.',
    ),
    l(
      'Неделя — четыре тренировки. День приседа и жима: фронтальный присед и швунг с тяжёлой парой, прыжковые выпады, отжимания, короткий AMRAP и кор. День тяги и подтягиваний: подтягивания в паре с подъёмами коленей в висе, становая и румынская тяга, тяга ренегата, прогулка фермера. День «двигателя»: EMOM-куплеты, AMRAP 15, табата, EMOM 16 из четырёх движений. И шестой день — чипперы и репетиции «Мёрфа». Между ними дни отдыха с целью 7000 шагов: в этом курсе они важны не меньше тренировок.',
      'A week is four sessions. Squat & push day: front squats and push presses with the heavy pair, jumping lunges, push-ups, a short AMRAP and core. Pull & hinge day: pull-ups paired with hanging knee raises, deadlifts and Romanian deadlifts, renegade rows, the farmer carry. Engine day: EMOM couplets, AMRAP 15, Tabata, a four-movement EMOM 16. And day six — chippers and Murph rehearsals. Between them, rest days with a 7,000-step goal: in this course they matter as much as the sessions.',
    ),
    l(
      'Объём растёт волнами: недели 1–2 — база, 3 — тяжелее, 4 — разгрузка на треть с «Синди» в конце, 5–7 — пик: пять подходов, тяжёлая пара, EMOM 16 и репетиции «Мёрфа» на 5 и 8 кругов. Восьмая неделя лёгкая: техника, половина «Мёрфа» и тот же тест, что в первый день. Приложение подбирает повторения по входному тесту и твоей оценке усилия после каждой тренировки, а веса — по гантелям из профиля. Если движение пока недоступно — двойные без скакалки или подтягивания без турника, — оно подставит вариант проще.',
      'Volume rises in waves: weeks 1–2 are the base, week 3 is heavier, week 4 is a one-third deload with Cindy at its end, weeks 5–7 are the peak: five sets, the heavy pair, EMOM 16 and Murph rehearsals of 5 and 8 rounds. Week eight is light: technique, Half Murph and the same test as on day one. The app sets rep counts from the baseline test and your effort rating after every session, and weights from the dumbbells in your profile. If a movement is not available yet — double-unders without a rope or pull-ups without a bar — it substitutes an easier variant.',
    ),
    l(
      'Два бенчмарка держат курс в тонусе. «Синди» — 20 минут AMRAP из 5 подтягиваний, 10 отжиманий и 15 приседаний — в конце четвёртой недели. Половина «Мёрфа» — бег, 50 подтягиваний, 100 отжиманий, 150 приседаний, бег, лимит 40 минут — в восьмую. К ней ты подойдёшь через три репетиции, зная свою разбивку и свой темп. А входной и повторный тест покажут, сколько отжиманий, приседаний и бёрпи прибавилось за два месяца.',
      'Two benchmarks keep the course honest. Cindy — a 20-minute AMRAP of 5 pull-ups, 10 push-ups and 15 squats — at the end of week four. Half Murph — run, 50 pull-ups, 100 push-ups, 150 squats, run, 40-minute cap — in week eight. You arrive at it after three rehearsals, knowing your partitioning and your pace. And the baseline and final tests show how many push-ups, squats and burpees two months added.',
    ),
  ],
  forWhom: [
    l(
      'У тебя есть пара гантелей (лучше две пары или разборные), турник и скакалка.',
      'You own a pair of dumbbells (two pairs or adjustables are better), a pull-up bar and a jump rope.',
    ),
    l(
      'Ты отжимаешься 20–25 раз подряд, держишь планку две минуты и висишь на турнике хотя бы 30 секунд — или прошёл «Своим весом» или «Гантели дома».',
      'You do 20–25 push-ups in a row, hold a plank for two minutes and can hang from the bar for at least 30 seconds — or you finished Bodyweight Engine or Dumbbell Builder.',
    ),
    l(
      'Хочешь первое строгое подтягивание — или десятое — и серии двойных на скакалке.',
      'You want your first strict pull-up — or your tenth — and sets of double-unders.',
    ),
    l(
      'Тебе нужен вызов с понятной целью: «Синди» и «Мёрф» на время.',
      'You want a challenge with a clear goal: Cindy and Murph on the clock.',
    ),
    l(
      'Есть 35–45 минут четыре раза в неделю и готовность отдыхать в дни отдыха.',
      'You have 35–45 minutes four times a week and the discipline to rest on rest days.',
    ),
  ],
  outcomes: [
    l(
      'Строгие подтягивания: от негативных к подходам по шесть — тридцать подтягиваний за тренировку к седьмой неделе.',
      'Strict pull-ups: from negatives to sets of six — thirty pull-ups in a session by week seven.',
    ),
    l(
      'Двойные прыжки на скакалке сериями по 20–40 внутри метконов.',
      'Double-unders in sets of 20–40 inside metcons.',
    ),
    l(
      'Дьявольский жим, рывок гантели, трастер и тяга ренегата — в силовых блоках и в EMOM.',
      'The devil press, dumbbell snatch, thruster and renegade row — in strength blocks and in EMOMs.',
    ),
    l(
      'Результат в «Синди» (круги за 20 минут) и в половине «Мёрфа» (время при лимите 40 минут).',
      'A Cindy score (rounds in 20 minutes) and a Half Murph time (40-minute cap).',
    ),
    l(
      'Умение держать темп в длинных AMRAP и чипперах и разбивать большие числа на выполнимые серии.',
      'The skill of pacing long AMRAPs and chippers and breaking big numbers into doable sets.',
    ),
    l(
      'Больше отжиманий, приседаний и бёрпи в повторном тесте — и привычка к четырём тренировкам в неделю с разгрузкой.',
      'More push-ups, squats and burpees in the retest — and a habit of four sessions a week with a built-in deload.',
    ),
  ],
  equipment: ['dumbbells', 'pullup_bar', 'jump_rope', 'none', 'mat'],
  level: 3,
  weeks: 8,
  sessionsPerWeek: 4,
  avgSessionMin: 40,
  accent: '#E7C6FF',
  gradient: ['#E7C6FF', '#B9F3E0'],
  price: { rub: 4990, usd: 49 },
  workouts: [
    W_TEST,
    W_SQUAT_PUSH_A,
    W_SQUAT_PUSH_B,
    W_SQUAT_PUSH_C,
    W_PULL_HINGE_A,
    W_PULL_HINGE_B,
    W_PULL_HINGE_C,
    W_ENGINE_EMOM12,
    W_ENGINE_AMRAP15,
    W_ENGINE_TABATA,
    W_ENGINE_EMOM16,
    W_CHIPPER_A,
    W_CHIPPER_B,
    W_MURPH_PREP_A,
    W_MURPH_PREP_B,
    W_SKILL_FLOW,
    W_BENCH_CINDY,
    W_BENCH_HALF_MURPH,
  ],
  nodes: NODES,
  faq: [
    {
      q: l(
        'Какое оборудование нужно и можно ли без чего-то обойтись?',
        'What equipment do I need, and can I skip any of it?',
      ),
      a: l(
        'Три вещи: пара гантелей (идеально две пары — лёгкая для рывков, трастеров и дьявольского жима, тяжёлая для приседа, становой и тяги), турник в дверном проёме или на стене и скакалка. Без турника курс теряет главное — подтягивания, — поэтому он обязателен. Без скакалки приложение заменит двойные прыжки на джампинг-джеки, но двойные — навык, который стоит освоить, а скакалка стоит недорого.',
        'Three things: a pair of dumbbells (ideally two pairs — a light one for snatches, thrusters and devil presses, a heavy one for squats, deadlifts and rows), a doorway or wall-mounted pull-up bar, and a jump rope. Without a bar the course loses its centrepiece — pull-ups — so it is mandatory. Without a rope the app swaps double-unders for jumping jacks, but doubles are a skill worth learning, and a rope costs very little.',
      ),
    },
    {
      q: l(
        'У меня нет ни одного строгого подтягивания. Мне рано?',
        "I don't have a single strict pull-up yet. Is it too early?",
      ),
      a: l(
        'Нет, если ты можешь висеть на турнике 30 секунд и медленно опускаться из верхней точки. Первые две недели курса — только негативные подтягивания, и именно так большинство людей получают первое строгое. С третьей недели в подходах появляются строгие, а рядом с каждым таким упражнением написано, как заменить: два строгих и два негативных, или негативные с прыжком в метконах. Если и вис пока даётся тяжело, начни с «Гантели дома» или «Своим весом» — там есть тяги и планки, которые готовят спину.',
        'Not if you can hang from the bar for 30 seconds and lower yourself slowly from the top. The first two weeks are negatives only, and that is how most people get their first strict rep. From week three strict reps appear in the sets, and every such exercise says how to scale: two strict plus two negatives, or jumping negatives in the metcons. If even the hang is hard for now, start with Dumbbell Builder or Bodyweight Engine — the rows and planks there prepare your back.',
      ),
    },
    {
      q: l('Сколько длится тренировка?', 'How long is a session?'),
      a: l(
        'В среднем около 40 минут с разминкой и заминкой. Силовые дни — 35–45 минут, «двигатель» — 30–35, чипперы и репетиции «Мёрфа» — 30–40. Два исключения — бенчмарки: «Синди» с разминкой занимает около 35 минут, половина «Мёрфа» — до часа. Перед стартом приложение показывает расчётное время для каждого из трёх режимов сложности.',
        'About 40 minutes on average with warm-up and cool-down. Strength days run 35–45 minutes, engine days 30–35, chippers and Murph rehearsals 30–40. The two exceptions are the benchmarks: Cindy takes about 35 minutes with the warm-up, Half Murph up to an hour. Before you start, the app shows the estimated time for each of the three difficulty options.',
      ),
    },
    {
      q: l(
        'Пропустил тренировку или целую неделю — что делать?',
        'I missed a session or a whole week — what now?',
      ),
      a: l(
        'Одну тренировку — просто продолжай со следующего узла: путь не сбрасывается. Не ставь два силовых дня подряд, чтобы «догнать», — сдвинь неделю. После паузы дольше двух недель выбери «Полегче» в первых двух тренировках. Если выпала неделя перед «Мёрфом», сделай сначала репетицию — четверть «Мёрфа», — а бенчмарк через три-четыре дня после неё.',
        "One session — just continue from the next node: the path does not reset. Do not stack two strength days back to back to 'catch up' — shift the week. After a break longer than two weeks, pick 'Easier' for the first two sessions. If the missing week was the one before Murph, do a rehearsal first — Quarter Murph — and the benchmark three or four days later.",
      ),
    },
    {
      q: l('Как приложение подбирает нагрузку?', 'How does the app pick the load?'),
      a: l(
        'Повторения считаются по входному тесту, а после каждой тренировки ты оцениваешь усилие от 1 до 10 и самочувствие — объём в следующий раз чуть растёт или снижается. Метки «лёгкий», «средний» и «тяжёлый» приложение сопоставляет с гантелями из твоего профиля. В разгрузочную неделю объём падает автоматически примерно на треть, а перед каждой тренировкой можно выбрать «Полегче», «Как обычно» или «Сложнее». Двойные без скакалки и подтягивания без турника приложение заменит само, а вариант «нет строгих — негативные» ты выбираешь сам по подсказке рядом с упражнением.',
        "Rep counts come from the baseline test, and after every session you rate the effort from 1 to 10 and how you felt — the volume nudges up or down next time. The labels 'light', 'medium' and 'heavy' are mapped to the dumbbells in your profile. In the deload week volume drops by about a third automatically, and before every session you can choose Easier, As usual or Harder. Double-unders without a rope and pull-ups without a bar are substituted by the app; the 'no strict reps — do negatives' option you choose yourself from the hint next to the exercise.",
      ),
    },
    {
      q: l(
        'Болят ладони и предплечья от турника. Это нормально?',
        'My palms and forearms hurt from the bar. Is that normal?',
      ),
      a: l(
        'Усталость предплечий и мозоли в первые недели — норма: хват догоняет спину. Что помогает: не сжимать перекладину сильнее, чем нужно, спиливать огрубевшую кожу пемзой, чтобы мозоли не рвались, и не висеть лишнего вне плана. Острая боль в локте или плече — другое дело: отметь «Боль» в отчёте после тренировки, приложение снизит нагрузку, а подтягивания замени тягой гантели в наклоне до конца недели. Если боль держится больше недели — к врачу.',
        "Forearm fatigue and calluses in the first weeks are normal: your grip is catching up with your back. What helps: do not squeeze the bar harder than necessary, file down thick skin with a pumice stone so calluses do not tear, and do not hang extra outside the plan. Sharp pain in the elbow or shoulder is different: mark 'Pain' in the post-workout feedback, the app reduces the load, and swap pull-ups for bent-over rows for the rest of the week. Pain that lasts more than a week means see a doctor.",
      ),
    },
  ],
};
