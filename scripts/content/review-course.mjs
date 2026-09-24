#!/usr/bin/env node
/**
 * Renders a course as a single HTML page for the coach to review day by day.
 *
 * For every node on the path it shows the workout as the app will run it — blocks, items, the
 * authored numbers next to what a beginner (level 1, scale 0.6) actually gets, rests, and the
 * engine's duration at Easier / As usual / Harder — beside the coach's own words for that
 * workout (docs/COACH_SOURCE.md), which clip demonstrates each movement, and the open questions
 * the transcription raised. The page is bilingual (RU default, EN toggle) and self-contained.
 *
 * Usage:  node scripts/content/review-course.mjs [--course start] [--out review/start.html]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.warn(w);
});
register('../seo/ts-loader.mjs', import.meta.url);

const { COURSES, EXERCISE_BY_ID, contentIssues } = await import('@/content/registry');
const { prescribeWorkout } = await import('@/lib/training/prescribe');

/* ------------------------------------------------------------------------------------------ */
/* CLI                                                                                        */
/* ------------------------------------------------------------------------------------------ */

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const courseId = arg('--course', 'start');
const outPath = resolve(ROOT, arg('--out', `review/${courseId}.html`));

const issues = contentIssues();
if (issues.length > 0) {
  console.error('Content does not validate; fix it before rendering a review:');
  for (const i of issues.slice(0, 10)) console.error(`  ${i.path}: ${i.message}`);
  process.exit(1);
}
const course = COURSES.find((c) => c.id === courseId);
if (!course) {
  console.error(`Unknown course "${courseId}". Known: ${COURSES.map((c) => c.id).join(', ')}`);
  process.exit(1);
}

/* ------------------------------------------------------------------------------------------ */
/* Review annotations: where each workout comes from and what the coach should decide.        */
/* Keyed by workout id; only the `start` course has a written source today.                   */
/* ------------------------------------------------------------------------------------------ */

const l = (ru, en) => ({ ru, en });

/*
 * Keyed by the current workout ids of the 20-workout course (Sergey's spec of 10 September).
 * `label` is his number in the channel, `messages` the nearest channel post (docs/COACH_SOURCE.md),
 * `alternatives` other versions he posted. `flags` are the open questions for him — keep this list
 * in step with «Open questions for the coach» in docs/COACH_RULES.md.
 */
/** @type {Record<string, Record<string, { label?: string; messages: number[]; alternatives?: number[]; flags: {ru:string,en:string}[] }>>} */
const ANNOTATIONS = {
  start: {
    w_s01_emom: {
      label: '1',
      messages: [201],
      alternatives: [80, 198, 199],
      flags: [
        l(
          'Сколько циклов по 4 минуты? Приложение играет один цикл: три минуты работы (отжимания, приседания, «жук»), и на этом основная часть заканчивается — около 3 минут работы. В канале приложена схема таймера, её в экспорте нет. Нужно два-три цикла?',
          'How many 4-minute cycles? The app plays one: three working minutes (push-ups, squats, dead bugs) and the main part ends — about 3 minutes of work. The channel post had a timer picture that is not in the export. Should it be two or three cycles?',
        ),
      ],
    },
    w_s02_emom: {
      label: '2',
      messages: [207],
      alternatives: [84],
      flags: [
        l(
          'Тот же вопрос, что в первой: сколько циклов по 4 минуты? Сейчас один. Диапазоны в подсказках — твои из сообщения 207: обратные отжимания 10–20, выпады 10–18, «жук» 10–16; «как написано» по 12.',
          'Same question as workout 1: how many 4-minute cycles? One today. The ranges in the notes are yours from message 207: dips 10–20, lunges 10–18, dead bugs 10–16; authored at 12 each.',
        ),
      ],
    },
    w_s03_pairs: {
      label: '3',
      messages: [213],
      alternatives: [88],
      flags: [
        l(
          'Объём пары на пресс: ситапы «как написано» 8 при твоём диапазоне 10–20, «жук» 30 (20–40) сразу за ними. Так оставить?',
          'Core pair volume: sit-ups authored at 8 against your 10–20 range, then 30 dead bugs (20–40) straight after. Keep it?',
        ),
        l(
          '«Старт раз в 2 минуты» приложение считать не умеет, поэтому после каждой пары — 2 минуты отдыха (остаток двухминутки плюс твоя минута). При «Посложнее» приложение добавляет второй проход всех трёх пар. Нормально?',
          'The app cannot run "start every 2 minutes", so each pair is followed by 2 minutes of rest (what is left of the window plus your minute). On "Harder" the app adds a second pass of all three pairs. Acceptable?',
        ),
      ],
    },
    w_s04_bridges: {
      label: '4',
      messages: [221],
      flags: [
        l(
          'В канале было 200 мостов с крышкой 10 минут (новички) / 8 (уверенные). В твоей программе от 10 сентября — максимум за 5 минут, ориентир 100. Подтверди 100 за 5 минут: приложение показывает ориентир под человека, окно всегда 5 минут.',
          'The channel had 200 bridges with a 10-minute cap (beginners) / 8 (confident). Your 10 September programme says max in 5 minutes, target 100. Please confirm 100 in 5 minutes: the app shows a target fitted to the person, the window is always 5 minutes.',
        ),
      ],
    },
    w_s05_three_rounds: {
      label: '5',
      messages: [94],
      alternatives: [225],
      flags: [],
    },
    w_s06_amrap8: {
      label: '6',
      messages: [230],
      alternatives: [98],
      flags: [],
    },
    w_s07_emom_ladder: {
      label: '8',
      messages: [238],
      alternatives: [104, 235],
      flags: [
        l(
          'Теперь приложение показывает оба круга цифрами: минуты 1–4 по 12, минуты 5–8 по 14. Ситапы в этой тренировке меняются на «жука» один к одному (у тебя «12 ситапов / 12 жуков»), а не вдвое — иначе не уложиться в минуту. Верно?',
          'The app now shows both loops as numbers: minutes 1–4 at 12, minutes 5–8 at 14. In this workout sit-ups swap for dead bugs one-for-one (your "12 sit-ups / 12 dead bugs"), not twice — otherwise it does not fit the minute. Right?',
        ),
      ],
    },
    w_s08_two_rounds: {
      label: '9',
      messages: [245],
      alternatives: [110],
      flags: [],
    },
    w_s09_for_time: {
      messages: [],
      flags: [
        l(
          'Крышка 8 минут на два круга: 30 ситапов, 60 скалолазов, 60 «жуков» всего. По расчёту приложения это около 8 минут чистой работы — уверенный новичок едва укладывается. Оставить 8 или дать 10?',
          'An 8-minute cap for two rounds: 30 sit-ups, 60 climbers, 60 dead bugs in total. The app estimates about 8 minutes of pure work — a confident beginner barely fits. Keep 8 or give 10?',
        ),
      ],
    },
    w_s10_every_2min: {
      label: '10',
      messages: [253],
      alternatives: [115],
      flags: [
        l(
          '«Раз в 2 минуты» показано как круг и 70 секунд отдыха после него (при твоих цифрах круг занимает около минуты). Так годится?',
          '"Every 2 minutes" is shown as the round plus 70 seconds of rest after it (at your numbers the round takes about a minute). Good enough?',
        ),
      ],
    },
    w_s11_emom8: {
      label: '11',
      messages: [254],
      alternatives: [120],
      flags: [],
    },
    w_s12_step_ladder: {
      label: '12',
      messages: [126],
      flags: [
        l(
          'Лесенка теперь одинаковая при любой сложности — 10-8-6-4-2 и 5-4-3-2-1, крышка 10 минут, — чтобы она не теряла форму. Новичок делает те же цифры. Так?',
          'The ladder is now the same at every difficulty — 10-8-6-4-2 and 5-4-3-2-1, a 10-minute cap — so it keeps its shape. A beginner does the same numbers. Right?',
        ),
      ],
    },
    w_s13_ladder5: {
      label: '23',
      messages: [184],
      alternatives: [128],
      flags: [
        l(
          'Тоже одинаково при любой сложности: 5-6-7-8-9, 8 минут. Отжимания идут три тренировки подряд (13, 14 — 60 отжиманий с колен, 15) — не много ли для новичка подряд?',
          'Also the same at every difficulty: 5-6-7-8-9, 8 minutes. Push-ups come three workouts in a row (13, 14 — 60 knee push-ups, 15) — too much back to back for a beginner?',
        ),
      ],
    },
    w_s14_double: {
      label: '14',
      messages: [135],
      flags: [],
    },
    w_s15_amrap8: {
      label: '15',
      messages: [139],
      flags: [],
    },
    w_s16_chipper: {
      label: '16',
      messages: [149],
      flags: [
        l(
          'Червячки идут четыре тренировки подряд (16, 17, 18, 19) — кисти и задняя поверхность бедра выдержат у новичка?',
          'Inchworms come four workouts in a row (16, 17, 18, 19) — will a beginner’s wrists and hamstrings cope?',
        ),
      ],
    },
    w_s17_buyin: {
      label: '18 (первое)',
      messages: [157],
      flags: [
        l(
          '«Раз в 3 минуты, в остаток — максимум червячков» приложение показывает так: входной билет, 8 червячков, потом 3 минуты отдыха и второй круг. Так понятно?',
          '"Every 3 minutes, max inchworms in the rest" is shown as: the buy-in, 8 inchworms, then 3 minutes of rest and the second round. Clear enough?',
        ),
      ],
    },
    w_s18_intervals: {
      label: '17',
      messages: [163],
      flags: [
        l(
          'Каждый интервал — два шага: входной билет (крышка минута), потом минута на максимум. Минута отдыха между интервалами пока только в тексте. Так годится?',
          'Each interval is two steps: the buy-in (a one-minute cap), then a minute of max reps. The minute of rest between intervals is only in the text for now. Good enough?',
        ),
      ],
    },
    w_s19_inchworm_ladder: {
      label: '18 (второе)',
      messages: [168],
      flags: [],
    },
    w_s20_finisher: {
      label: '21',
      messages: [173],
      flags: [],
    },
  },
};

const GENERAL_NOTES = {
  start: [
    l(
      'Курс — твоя программа от 10 сентября: 20 тренировок подряд, четыре блока по пять, без дней отдыха на пути, без теста в начале и в конце и без разгрузки. Рядом с каждой тренировкой — ближайшее сообщение из канала; номер в канале указан, где он есть.',
      'The course is your programme of 10 September: 20 workouts in a row, four blocks of five, no rest days on the path, no test at the start or the end and no deload. Beside each workout is the nearest channel message, with its channel number where there is one.',
    ),
    l(
      'Разминка — суставная гимнастика сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы, потом медленный присед; без бега, около 5 минут. Заминка — растяжка: спина, бёдра, сгибатели бедра, поза ребёнка — и запись ощущений, плюс «не получилось потренироваться — прогулка». Твоих трёх разминочных роликов в экспорте нет — если пришлёшь, подставим их. Разминка и заминка не масштабируются.',
      'The warm-up is joint mobility from the top down: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles, then a slow squat; no running, about 5 minutes. The cool-down is a stretch — spine, thighs, hip flexors, child pose — a note of how it felt, and "could not train? Go for a walk". Your three warm-up clips are not in the export — send them and we will wire them in. Warm-up and cool-down do not scale.',
    ),
    l(
      'Цифры «как написано» — для уверенного новичка. Приложение умножает их на коэффициент человека: новичок получает 0,6–0,8, и цифры сходятся с твоим «начинайте с минимума». Ниже показано и то и другое. Лесенки (12, 13) и точки отсчёта (19, 20) одинаковы при любой сложности.',
      'The authored numbers are for a confident beginner. The app multiplies them by the person’s scale: a beginner gets 0.6–0.8, which lands on your "start from the minimum". Both are shown below. The ladders (12, 13) and the reference points (19, 20) are the same at every difficulty.',
    ),
  ],
};

/* ------------------------------------------------------------------------------------------ */
/* Sources: the coach's verbatim messages and the clip behind each exercise                    */
/* ------------------------------------------------------------------------------------------ */

const sourceMd = await readFile(resolve(ROOT, 'docs/COACH_SOURCE.md'), 'utf8').catch(() => '');
/** @type {Map<number, string>} message id → verbatim text */
const MESSAGES = new Map();
for (const m of sourceMd.matchAll(/^## \d+\. message (\d+)\n\n```\n([\s\S]*?)\n```/gm)) {
  MESSAGES.set(Number(m[1]), m[2]);
}

const manifest = JSON.parse(await readFile(resolve(ROOT, 'media/manifest.json'), 'utf8'));
/** @type {Map<string, string>} exercise id → clip key */
const CLIP_BY_EXERCISE = new Map();
for (const clip of manifest) if (clip.exerciseId) CLIP_BY_EXERCISE.set(clip.exerciseId, clip.key);

/* ------------------------------------------------------------------------------------------ */
/* Engine numbers                                                                              */
/* ------------------------------------------------------------------------------------------ */

const PROFILE = {
  equipment: [
    'none',
    'mat',
    'chair',
    'box',
    'jump_rope',
    'dumbbells',
    'kettlebell',
    'pullup_bar',
    'band',
  ],
  dumbbellKg: [8, 12, 16],
  kettlebellKg: [16, 24],
  limitations: [],
};
/** The load tests measure at this profile: level 2, scale 1. */
const AUTHORED = { level: 2, scale: 1 };
/** What a fresh beginner sees after a weak baseline test. */
const BEGINNER = { level: 1, scale: 0.6 };

function prescribe(workout, choice, who) {
  return prescribeWorkout(workout, {
    profile: PROFILE,
    level: who.level,
    choice,
    scale: who.scale,
  });
}

function itemView(item) {
  return {
    exerciseId: item.exerciseId,
    target: item.target,
    unit: item.unit,
    perSide: !!item.perSide,
    restAfterSec: item.restAfterSec ?? 0,
    substituted: item.substituted ? item.originalExerciseId : undefined,
  };
}

function workoutView(workout) {
  const authored = prescribe(workout, 'normal', AUTHORED);
  const beginner = prescribe(workout, 'normal', BEGINNER);
  const minutes = {
    easier: prescribe(workout, 'easier', AUTHORED).estimatedSec / 60,
    normal: authored.estimatedSec / 60,
    harder: prescribe(workout, 'harder', AUTHORED).estimatedSec / 60,
    beginner: beginner.estimatedSec / 60,
  };
  const blocks = workout.blocks.map((b, i) => {
    const pa = authored.blocks[i];
    const pb = beginner.blocks[i];
    return {
      id: b.id,
      type: b.type,
      format: b.format,
      title: b.title,
      description: b.description,
      scalable: b.scalable !== false,
      sets: pa.sets,
      setsBeginner: pb.sets,
      rounds: b.rounds,
      durationSec: pa.durationSec,
      restBetweenSec: pa.restBetweenRoundsSec || pa.restBetweenSetsSec || 0,
      minutes: pa.estimatedSec / 60,
      items: b.items.map((it, j) => ({
        ...itemView(pa.items[j]),
        beginnerTarget: pb.items[j].target,
        beginnerExerciseId: pb.items[j].exerciseId,
        note: it.note,
      })),
    };
  });
  return {
    id: workout.id,
    name: workout.name,
    focus: workout.focus,
    description: workout.description,
    basePoints: workout.basePoints,
    minutes,
    blocks,
  };
}

const workouts = Object.fromEntries(course.workouts.map((w) => [w.id, workoutView(w)]));
const exercisesUsed = new Map();
for (const w of course.workouts)
  for (const b of w.blocks)
    for (const it of b.items) {
      const e = EXERCISE_BY_ID.get(it.exerciseId);
      if (!e) continue;
      const cur = exercisesUsed.get(e.id) ?? {
        id: e.id,
        name: e.name,
        level: e.level,
        video: !!e.video?.ru,
        clip: CLIP_BY_EXERCISE.get(e.id) ?? null,
        mainWork: false,
        workouts: new Set(),
      };
      if (b.type !== 'warmup' && b.type !== 'cooldown') {
        cur.mainWork = true;
        cur.workouts.add(w.id);
      }
      exercisesUsed.set(e.id, cur);
    }
const exercises = [...exercisesUsed.values()]
  .map((e) => ({ ...e, workouts: [...e.workouts] }))
  .sort((a, b) => Number(b.mainWork) - Number(a.mainWork) || b.workouts.length - a.workouts.length);

const annotations = ANNOTATIONS[course.id] ?? {};
const nodes = course.nodes.map((n, index) => ({
  index,
  id: n.id,
  week: n.week,
  day: n.day,
  kind: n.kind,
  workoutId: n.workoutId,
  title: n.title,
  subtitle: n.subtitle,
}));

const sessionNodes = nodes.filter((n) => n.workoutId);
const avg =
  sessionNodes.reduce((s, n) => s + workouts[n.workoutId].minutes.normal, 0) / sessionNodes.length;
const mainWorkNoVideo = exercises.filter((e) => e.mainWork && !e.video);

const data = {
  generatedAt: new Date().toISOString(),
  course: {
    id: course.id,
    name: course.name,
    weeks: course.weeks,
    sessionsPerWeek: course.sessionsPerWeek,
    equipment: course.equipment,
  },
  summary: {
    sessions: sessionNodes.length,
    distinctWorkouts: course.workouts.length,
    avgMinutes: avg,
    maxMinutes: Math.max(...sessionNodes.map((n) => workouts[n.workoutId].minutes.normal)),
    minMinutes: Math.min(...sessionNodes.map((n) => workouts[n.workoutId].minutes.normal)),
    mainWorkExercises: exercises.filter((e) => e.mainWork).length,
    mainWorkWithVideo: exercises.filter((e) => e.mainWork && e.video).length,
    mainWorkNoVideo: mainWorkNoVideo.map((e) => e.id),
    openQuestions: Object.values(annotations).reduce((s, a) => s + a.flags.length, 0),
  },
  notes: GENERAL_NOTES[course.id] ?? [],
  nodes,
  workouts,
  annotations,
  messages: Object.fromEntries(
    [
      ...new Set(
        Object.values(annotations).flatMap((a) => [...a.messages, ...(a.alternatives ?? [])]),
      ),
    ]
      .filter((id) => MESSAGES.has(id))
      .map((id) => [id, MESSAGES.get(id)]),
  ),
  exercises: Object.fromEntries(
    exercises.map((e) => [
      e.id,
      {
        name: e.name,
        level: e.level,
        video: e.video,
        clip: e.clip,
        mainWork: e.mainWork,
        workouts: e.workouts,
      },
    ]),
  ),
};

/* ------------------------------------------------------------------------------------------ */
/* Page                                                                                       */
/* ------------------------------------------------------------------------------------------ */

const html = String.raw;
const page = html`<title>${course.name.ru}</title>
  <meta
    name="description"
    content="${course.name.ru}: программа по дням и тренировкам для проверки тренером"
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Onest:wght@400;500;600&display=swap"
  />
  <style>
    /* Third palette (src/styles/global.css): graphite is the only ground — «фон больше не может
       быть другого цвета», darkened to #121212 in design/CHANGELOG.md §16 — so there is no light
       variant any more. Light blue #afe9fd is the brand accent, the neon is kept for action and
       does not appear on a page with none. */
    :root {
      color-scheme: dark;
      --bg: #121212;
      --surface: #1c1c1c;
      --surface-2: #262626;
      --surface-3: #303030;
      --border: rgba(255, 255, 255, 0.1);
      --border-strong: rgba(255, 255, 255, 0.18);
      --text: #f6f6f7;
      --muted: #b9b9c0;
      --muted-2: #a6a6ae;
      --accent: #afe9fd;
      --accent-soft: rgba(175, 233, 253, 0.14);
      --accent-2: #afe9fd;
      --accent-2-soft: rgba(175, 233, 253, 0.1);
      --warning: #ffd166;
      --warning-soft: rgba(255, 209, 102, 0.14);
      --danger: #ff6b6b;
      --danger-soft: rgba(255, 107, 107, 0.16);
      --rest: #1c1c1c;
      --bar: #afe9fd;
      --bar-range: rgba(175, 233, 253, 0.28);
      --font-sans: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --font-display: 'Unbounded', 'Onest', system-ui, sans-serif;
    }

    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: inherit;
    }
    h1,
    h2,
    h3,
    h4 {
      margin: 0;
      text-wrap: balance;
    }
    h1 {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: clamp(22px, 3.2vw, 34px);
      line-height: 1.15;
    }
    h2 {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 18px;
      letter-spacing: 0.01em;
    }
    h3 {
      font-weight: 600;
      font-size: 16px;
    }
    p {
      margin: 0;
    }
    .num {
      font-variant-numeric: tabular-nums;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    button {
      font: inherit;
      color: inherit;
      background: none;
      border: 1px solid var(--border-strong);
      border-radius: 0;
      padding: 6px 14px;
      cursor: pointer;
    }
    button:focus-visible,
    a:focus-visible,
    summary:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    button[aria-pressed='true'] {
      background: var(--text);
      color: var(--bg);
      border-color: var(--text);
    }

    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 24px 96px;
      display: grid;
      gap: 40px;
    }
    header.top {
      display: grid;
      gap: 16px;
    }
    .topline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .toggle {
      display: flex;
      gap: 6px;
    }
    .lede {
      max-width: 68ch;
      color: var(--muted);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 14px 16px;
      display: grid;
      gap: 2px;
    }
    .stat .value {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 26px;
      line-height: 1.1;
    }
    .stat .label {
      font-size: 12px;
      color: var(--muted);
    }
    .stat.warn .value {
      color: var(--warning);
    }

    .notes {
      display: grid;
      gap: 8px;
      max-width: 78ch;
    }
    .notes li {
      color: var(--muted);
    }
    .notes ul {
      margin: 0;
      padding-left: 20px;
      display: grid;
      gap: 6px;
    }

    /* Calendar */
    .calendar {
      display: grid;
      gap: 6px;
    }
    .cal-head {
      display: grid;
      grid-template-columns: 64px repeat(7, 1fr);
      gap: 6px;
    }
    .cal-head span {
      text-align: center;
    }
    .week {
      display: grid;
      grid-template-columns: 64px repeat(7, 1fr);
      gap: 6px;
    }
    .week-label {
      display: grid;
      align-content: start;
      gap: 2px;
      padding-top: 8px;
    }
    .week-label b {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 20px;
    }
    .week-label small {
      color: var(--muted);
      font-size: 12px;
    }
    .day {
      min-height: 118px;
      border-radius: 0;
      padding: 10px 11px;
      display: grid;
      align-content: start;
      gap: 6px;
      font-size: 13px;
    }
    .day.empty {
      background: transparent;
      border: 1px dashed var(--border);
    }
    .day.rest {
      background: var(--rest);
      color: var(--muted);
      border: 1px solid var(--border);
    }
    .day.workout {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      text-decoration: none;
    }
    .day.workout:hover {
      border-color: var(--accent);
    }
    .day.test,
    .day.benchmark {
      background: var(--accent-2-soft);
    }
    .day .n {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
    }
    .day .n small {
      font-family: var(--font-sans);
      font-weight: 500;
      font-size: 11px;
      color: var(--muted);
    }
    .day .t {
      font-weight: 600;
      line-height: 1.25;
    }
    .day .s {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.3;
    }
    .day .m {
      margin-top: auto;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 6px;
      align-items: center;
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
    }
    .chip {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .chip.fmt {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .chip.flag {
      background: var(--warning-soft);
      color: var(--warning);
    }
    .chip.novideo {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .chip.kind {
      background: var(--accent-2-soft);
      color: var(--accent-2);
    }

    /* Duration chart */
    .chart {
      display: grid;
      gap: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 16px 18px;
    }
    .chart .row {
      display: grid;
      grid-template-columns: 32px minmax(120px, 220px) 1fr 52px;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }
    .chart .row .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--muted);
    }
    .chart .track {
      position: relative;
      height: 14px;
    }
    .chart .grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, var(--border) 1px, transparent 1px);
      background-size: calc(100% / 6) 100%;
    }
    .chart .range {
      position: absolute;
      top: 3px;
      height: 8px;
      border-radius: 0;
      background: var(--bar-range);
    }
    .chart .bar {
      position: absolute;
      top: 3px;
      height: 8px;
      border-radius: 0;
      background: var(--bar);
    }
    .chart .cap {
      position: absolute;
      top: 0;
      width: 2px;
      height: 14px;
      background: var(--danger);
    }
    .chart .axis {
      display: grid;
      grid-template-columns: 32px minmax(120px, 220px) 1fr 52px;
      gap: 10px;
      font-size: 11px;
      color: var(--muted-2);
    }
    .chart .axis .ticks {
      display: flex;
      justify-content: space-between;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 12px;
      color: var(--muted);
    }
    .legend i {
      display: inline-block;
      width: 14px;
      height: 8px;
      border-radius: 0;
      vertical-align: middle;
      margin-right: 6px;
    }

    /* Workout details */
    .workouts {
      display: grid;
      gap: 20px;
    }
    article.w {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 20px 22px;
      display: grid;
      gap: 18px;
      scroll-margin-top: 16px;
    }
    article.w.test {
      border-color: var(--accent-2);
    }
    .w-head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 16px;
      align-items: start;
    }
    .w-num {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 30px;
      line-height: 1;
      min-width: 56px;
    }
    .w-num small {
      display: block;
      font-family: var(--font-sans);
      font-weight: 500;
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
      letter-spacing: 0.04em;
    }
    .w-title {
      display: grid;
      gap: 6px;
    }
    .w-title .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      font-size: 12px;
      color: var(--muted);
      align-items: center;
    }
    .w-times {
      display: grid;
      grid-template-columns: repeat(3, auto);
      gap: 10px;
      text-align: center;
    }
    .w-times div {
      display: grid;
      gap: 0;
      padding: 6px 10px;
      border-radius: 0;
      background: var(--surface-2);
    }
    .w-times b {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 17px;
    }
    .w-times span {
      font-size: 11px;
      color: var(--muted);
    }
    .w-times div.on {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }
    .w-desc {
      color: var(--muted);
      max-width: 72ch;
    }
    .cols {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    .blocks {
      display: grid;
      gap: 12px;
      align-content: start;
    }
    .block {
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 12px 14px;
      display: grid;
      gap: 8px;
      align-content: start;
    }
    .block.aux {
      opacity: 0.8;
    }
    .block .bh {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 6px 12px;
      align-items: baseline;
    }
    .block .bh h4 {
      font-size: 14px;
      font-weight: 600;
    }
    .block .bh .bmeta {
      font-size: 12px;
      color: var(--muted);
    }
    .block .bd {
      font-size: 13px;
      color: var(--muted);
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.items th {
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted-2);
      padding: 4px 6px 6px 0;
      border-bottom: 1px solid var(--border);
    }
    table.items td {
      padding: 5px 6px 5px 0;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    table.items tr:last-child td {
      border-bottom: 0;
    }
    table.items td.r,
    table.items th.r {
      text-align: right;
      white-space: nowrap;
    }
    table.items .note {
      display: block;
      font-size: 12px;
      color: var(--muted);
    }
    table.items .vid {
      white-space: nowrap;
    }
    .ok {
      color: var(--accent);
      font-weight: 600;
    }
    .no {
      color: var(--danger);
      font-weight: 600;
    }
    .source {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .source pre {
      margin: 0;
      white-space: pre-wrap;
      font: 13px/1.45 var(--font-sans);
      background: var(--surface-2);
      border-radius: 0;
      padding: 12px 14px;
      color: var(--text);
    }
    .source details {
      border: 1px solid var(--border);
      border-radius: 0;
      padding: 8px 12px;
    }
    .source summary {
      cursor: pointer;
      font-size: 13px;
      color: var(--muted);
    }
    .flags {
      display: grid;
      gap: 8px;
    }
    .flags li {
      background: var(--warning-soft);
      border-radius: 0;
      padding: 8px 12px;
      font-size: 13px;
    }
    .flags ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 6px;
    }
    .flags .eyebrow {
      color: var(--warning);
    }

    table.ex {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0;
      overflow: hidden;
    }
    table.ex th,
    table.ex td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }
    table.ex th {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted-2);
      font-weight: 600;
    }
    table.ex tr:last-child td {
      border-bottom: 0;
    }
    .scroll {
      overflow-x: auto;
    }
    footer {
      color: var(--muted-2);
      font-size: 12px;
    }

    @media (max-width: 900px) {
      .cols {
        grid-template-columns: 1fr;
      }
      .cal-head {
        display: none;
      }
      .week {
        grid-template-columns: 1fr;
      }
      .day.empty {
        display: none;
      }
      .w-head {
        grid-template-columns: auto 1fr;
      }
      .w-times {
        grid-column: 1 / -1;
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .day.workout {
        transition: border-color 120ms ease;
      }
    }
  </style>

  <div class="wrap" id="app"></div>

  <script id="data" type="application/json">
    ${JSON.stringify(data).replace(/</g, '\\u003c')}
  </script>
  <script>
    (() => {
      const DATA = JSON.parse(document.getElementById('data').textContent);
      let lang = 'ru';
      try {
        lang = localStorage.getItem('review-lang') === 'en' ? 'en' : 'ru';
      } catch {}

      const T = {
        ru: {
          review: 'Проверка курса',
          generated: 'Собрано из содержимого приложения',
          lede: 'Программа по дням и по тренировкам — так, как её увидит человек в приложении. Открой день, сравни с тем, что написано в канале, и оставь комментарий там, где надо поправить.',
          weeks: 'недель',
          sessions: 'занятий',
          avgMin: 'мин в среднем',
          rangeMin: 'мин самая короткая — самая длинная',
          videos: 'движений с твоим видео',
          questions: 'вопросов к тебе',
          notes: 'Что важно знать',
          calendar: 'Календарь',
          day: 'День',
          week: 'Неделя',
          rest: 'Отдых',
          test: 'Тест',
          retest: 'Повторный тест',
          benchmark: 'Контрольная',
          chart: 'Длительность занятий',
          chartLede:
            'Расчёт движка при коэффициенте 1,0: столбик — «Как обычно», светлая полоса — от «Полегче» до «Потяжелее». Пунктир справа — потолок 30 минут для курса новичков.',
          legendNormal: 'Как обычно',
          legendRange: 'Полегче — Потяжелее',
          minutes: 'мин',
          workouts: 'Тренировки по порядку',
          easier: 'Полегче',
          normal: 'Как обычно',
          harder: 'Потяжелее',
          beginner: 'Новичок',
          authored: 'Как написано',
          exercise: 'Упражнение',
          video: 'Видео',
          source: 'Как написано в канале',
          message: 'Сообщение',
          alt: 'Другая версия',
          noSource: 'В канале этого нет: добавлено приложением.',
          flags: 'Вопросы к тренеру',
          rounds: 'кругов',
          sets: 'подходов',
          minutesWindow: 'мин',
          cap: 'крышка',
          restBetween: 'отдых между кругами',
          emom: 'EMOM',
          amrap: 'AMRAP',
          fortime: 'На время',
          circuit: 'Круги',
          setsFmt: 'Подходы',
          interval: 'Интервалы',
          tabata: 'Табата',
          warmup: 'Разминка',
          cooldown: 'Заминка',
          perSide: 'на каждую сторону',
          reps: 'повт.',
          sec: 'с',
          substituted: 'вместо',
          exTable: 'Все движения курса',
          exLede:
            'Ролик — ключ клипа из экспорта (media/manifest.json). Каждое движение курса должно быть снято: без ролика в приложении остаётся пустая плашка.',
          inMain: 'в основной части',
          usedIn: 'тренировок',
          level: 'уровень',
          yes: 'есть',
          no: 'нет',
          anim: 'не снято',
          restAfter: 'отдых после',
          points: 'очков',
          clipPending: 'ролик другого человека, не подключён',
          howTo:
            'Как читать: «Как написано» — цифра для уверенного новичка; «Новичок» — что получит человек с коэффициентом 0,6 после слабого входного теста. Между ними приложение подстраивает нагрузку само.',
        },
        en: {
          review: 'Course review',
          generated: 'Built from the app content',
          lede: 'The programme day by day and workout by workout, exactly as a person will see it in the app. Open a day, compare it with what the channel said, and leave a comment where something needs fixing.',
          weeks: 'weeks',
          sessions: 'sessions',
          avgMin: 'min on average',
          rangeMin: 'min shortest — longest',
          videos: 'movements with your video',
          questions: 'questions for you',
          notes: 'Good to know',
          calendar: 'Calendar',
          day: 'Day',
          week: 'Week',
          rest: 'Rest',
          test: 'Test',
          retest: 'Retest',
          benchmark: 'Benchmark',
          chart: 'Session length',
          chartLede:
            'Engine estimate at scale 1.0: the bar is "As usual", the light band runs from "Easier" to "Harder". The mark on the right is the 30-minute ceiling for the beginner course.',
          legendNormal: 'As usual',
          legendRange: 'Easier — Harder',
          minutes: 'min',
          workouts: 'Workouts in order',
          easier: 'Easier',
          normal: 'As usual',
          harder: 'Harder',
          beginner: 'Beginner',
          authored: 'Authored',
          exercise: 'Exercise',
          video: 'Video',
          source: 'As posted in the channel',
          message: 'Message',
          alt: 'Other version',
          noSource: 'Not from the channel: added by the app.',
          flags: 'Questions for the coach',
          rounds: 'rounds',
          sets: 'sets',
          minutesWindow: 'min',
          cap: 'cap',
          restBetween: 'rest between rounds',
          emom: 'EMOM',
          amrap: 'AMRAP',
          fortime: 'For time',
          circuit: 'Rounds',
          setsFmt: 'Sets',
          interval: 'Intervals',
          tabata: 'Tabata',
          warmup: 'Warm-up',
          cooldown: 'Cool-down',
          perSide: 'per side',
          reps: 'reps',
          sec: 's',
          substituted: 'instead of',
          exTable: 'Every movement in the course',
          exLede:
            'Clip is the export key (media/manifest.json). Every movement in the course has to be filmed: with no clip the app shows a blank tile.',
          inMain: 'in main work',
          usedIn: 'workouts',
          level: 'level',
          yes: 'yes',
          no: 'no',
          anim: 'not filmed',
          restAfter: 'rest after',
          points: 'points',
          clipPending: 'someone else’s clip, not wired up',
          howTo:
            'How to read: "Authored" is the figure for a confident beginner; "Beginner" is what a person at scale 0.6 gets after a weak baseline test. In between, the app adapts the load itself.',
        },
      };
      const t = (k) => T[lang][k] ?? k;
      const L = (obj) => (obj ? (obj[lang] ?? obj.ru ?? '') : '');
      const esc = (s) =>
        String(s).replace(
          /[&<>"]/g,
          (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
        );
      const min = (m) =>
        (Math.round(m * 10) / 10).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        });
      const DAYS = {
        ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      };
      const FMT = {
        emom: 'emom',
        amrap: 'amrap',
        fortime: 'fortime',
        circuit: 'circuit',
        sets: 'setsFmt',
        interval: 'interval',
        tabata: 'tabata',
      };

      const mainBlocks = (w) =>
        w.blocks.filter((b) => b.type !== 'warmup' && b.type !== 'cooldown');
      const mainFormat = (w) => {
        const b = mainBlocks(w)[0];
        return b ? t(FMT[b.format]) : '';
      };
      const sessionNumber = new Map();
      let n = 0;
      for (const node of DATA.nodes)
        if (node.kind === 'workout' || node.kind === 'benchmark') sessionNumber.set(node.id, ++n);
      const workoutHasNoVideo = (w) =>
        mainBlocks(w).some((b) => b.items.some((it) => !DATA.exercises[it.exerciseId]?.video));

      function nodeLabel(node) {
        if (node.kind === 'test') return node.index === 0 ? t('test') : t('retest');
        return sessionNumber.get(node.id);
      }

      function renderStats() {
        const s = DATA.summary;
        const tiles = [
          [DATA.course.weeks, t('weeks')],
          [s.sessions, t('sessions')],
          [min(s.avgMinutes), t('avgMin')],
          [min(s.minMinutes) + '–' + min(s.maxMinutes), t('rangeMin')],
          [s.mainWorkWithVideo + ' / ' + s.mainWorkExercises, t('videos')],
          [s.openQuestions, t('questions'), 'warn'],
        ];
        return (
          '<section class="stats">' +
          tiles
            .map(
              ([v, l, c]) =>
                '<div class="stat ' +
                (c || '') +
                '"><span class="value num">' +
                esc(v) +
                '</span><span class="label">' +
                esc(l) +
                '</span></div>',
            )
            .join('') +
          '</section>'
        );
      }

      function renderCalendar() {
        const byWeek = new Map();
        for (const node of DATA.nodes) {
          if (!byWeek.has(node.week)) byWeek.set(node.week, new Map());
          byWeek.get(node.week).set(node.day, node);
        }
        let out = '<section class="calendar"><div><h2>' + t('calendar') + '</h2></div>';
        out +=
          '<div class="cal-head"><span></span>' +
          DAYS[lang].map((d) => '<span class="eyebrow">' + d + '</span>').join('') +
          '</div>';
        for (let week = 1; week <= DATA.course.weeks; week++) {
          const days = byWeek.get(week) ?? new Map();
          const sessions = [...days.values()].filter((x) => x.workoutId);
          const total = sessions.reduce((a, x) => a + DATA.workouts[x.workoutId].minutes.normal, 0);
          out +=
            '<div class="week"><div class="week-label"><b class="num">' +
            week +
            '</b><small>' +
            t('week') +
            '</small><small class="num">' +
            sessions.length +
            ' × ≈' +
            min(total / (sessions.length || 1)) +
            ' ' +
            t('minutes') +
            '</small></div>';
          for (let day = 1; day <= 7; day++) {
            const node = days.get(day);
            if (!node) {
              out += '<div class="day empty" aria-hidden="true"></div>';
              continue;
            }
            if (node.kind === 'rest') {
              out +=
                '<div class="day rest"><span class="n"><span>' +
                t('rest') +
                '</span><small>' +
                t('day') +
                ' ' +
                day +
                '</small></span><span class="s">' +
                esc(L(node.subtitle)) +
                '</span></div>';
              continue;
            }
            const w = DATA.workouts[node.workoutId];
            const flags = (DATA.annotations[node.workoutId]?.flags ?? []).length;
            const cls = 'day workout ' + node.kind;
            out +=
              '<a class="' +
              cls +
              '" href="#' +
              esc(node.id) +
              '"><span class="n"><span>' +
              (node.kind === 'test' ? esc(nodeLabel(node)) : '№ ' + nodeLabel(node)) +
              '</span><small>' +
              t('day') +
              ' ' +
              day +
              '</small></span>';
            out +=
              '<span class="t">' +
              esc(L(w.name)) +
              '</span><span class="s">' +
              esc(L(node.subtitle)) +
              '</span>';
            out +=
              '<span class="m"><span class="chip ' +
              (node.kind === 'benchmark' ? 'kind' : 'fmt') +
              '">' +
              esc(node.kind === 'benchmark' ? t('benchmark') : mainFormat(w)) +
              '</span><span class="num">≈' +
              min(w.minutes.normal) +
              ' ' +
              t('minutes') +
              '</span>' +
              (flags ? '<span class="chip flag">?' + flags + '</span>' : '') +
              (workoutHasNoVideo(w)
                ? '<span class="chip novideo">' + t('video') + ': ' + t('no') + '</span>'
                : '') +
              '</span></a>';
          }
          out += '</div>';
        }
        return out + '</section>';
      }

      function renderChart() {
        const nodes = DATA.nodes.filter((x) => x.workoutId);
        const MAX = 36; // minutes on the axis: room for the 30-minute cap mark
        const pct = (m) => Math.min(100, (m / MAX) * 100);
        let out =
          '<section><div style="display:grid;gap:6px;margin-bottom:12px"><h2>' +
          t('chart') +
          '</h2><p class="lede">' +
          t('chartLede') +
          '</p></div><div class="chart">';
        out +=
          '<div class="legend"><span><i style="background:var(--bar)"></i>' +
          t('legendNormal') +
          '</span><span><i style="background:var(--bar-range)"></i>' +
          t('legendRange') +
          '</span></div>';
        for (const node of nodes) {
          const w = DATA.workouts[node.workoutId];
          const m = w.minutes;
          out +=
            '<div class="row"><span class="num" style="color:var(--muted)">' +
            esc(nodeLabel(node)) +
            '</span><a class="name" href="#' +
            esc(node.id) +
            '">' +
            esc(L(w.name)) +
            '</a>';
          out +=
            '<div class="track"><div class="grid"></div><div class="range" style="left:' +
            pct(m.easier) +
            '%;width:' +
            (pct(m.harder) - pct(m.easier)) +
            '%"></div><div class="bar" style="width:' +
            pct(m.normal) +
            '%"></div><div class="cap" style="left:' +
            pct(30) +
            '%"></div></div>';
          out += '<span class="num" style="text-align:right">' + min(m.normal) + '</span></div>';
        }
        out +=
          '<div class="axis"><span></span><span></span><div class="ticks">' +
          [0, 6, 12, 18, 24, 30, 36].map((v) => '<span>' + v + '</span>').join('') +
          '</div><span></span></div>';
        return out + '</div></section>';
      }

      function blockMeta(b) {
        const parts = [];
        if (b.format === 'emom') parts.push(b.sets + ' ' + t('minutesWindow'));
        else if (b.format === 'amrap')
          parts.push(Math.round(b.durationSec / 60) + ' ' + t('minutesWindow'));
        else if (b.format === 'fortime') {
          parts.push(b.sets + ' ' + t('rounds'));
          if (b.durationSec)
            parts.push(t('cap') + ' ' + Math.round(b.durationSec / 60) + ' ' + t('minutesWindow'));
        } else if (b.format === 'circuit') parts.push(b.sets + ' ' + t('rounds'));
        else if (b.format === 'sets') parts.push(b.sets + ' ' + t('sets'));
        if (b.restBetweenSec && b.format !== 'emom' && b.format !== 'amrap')
          parts.push(t('restBetween') + ' ' + b.restBetweenSec + ' ' + t('sec'));
        parts.push('≈' + min(b.minutes) + ' ' + t('minutes'));
        return parts.join(' · ');
      }

      function itemTarget(it, target, exId) {
        const unit = it.unit === 'seconds' ? t('sec') : t('reps');
        return (
          '<span class="num">' +
          target +
          ' ' +
          unit +
          (it.perSide ? ' ' + t('perSide') : '') +
          '</span>'
        );
      }

      function renderBlock(b) {
        const aux = b.type === 'warmup' || b.type === 'cooldown';
        let out =
          '<div class="block' +
          (aux ? ' aux' : '') +
          '"><div class="bh"><h4>' +
          esc(
            L(b.title) ||
              t(
                b.type === 'warmup' ? 'warmup' : b.type === 'cooldown' ? 'cooldown' : FMT[b.format],
              ),
          ) +
          '</h4><span class="bmeta num">' +
          esc(blockMeta(b)) +
          '</span></div>';
        if (b.description) out += '<p class="bd">' + esc(L(b.description)) + '</p>';
        out +=
          '<table class="items"><thead><tr><th>' +
          t('exercise') +
          '</th><th class="r">' +
          t('authored') +
          '</th><th class="r">' +
          t('beginner') +
          '</th><th class="r">' +
          t('video') +
          '</th></tr></thead><tbody>';
        for (const it of b.items) {
          const ex = DATA.exercises[it.exerciseId];
          const sub =
            it.beginnerExerciseId !== it.exerciseId
              ? '<span class="note">' +
                t('beginner') +
                ': ' +
                esc(L(DATA.exercises[it.beginnerExerciseId]?.name) || it.beginnerExerciseId) +
                ' ' +
                t('substituted') +
                ' ' +
                esc(L(ex?.name)) +
                '</span>'
              : '';
          const rest = it.restAfterSec
            ? '<span class="note">' +
              t('restAfter') +
              ' ' +
              it.restAfterSec +
              ' ' +
              t('sec') +
              '</span>'
            : '';
          out +=
            '<tr><td>' +
            esc(L(ex?.name) || it.exerciseId) +
            (it.note ? '<span class="note">' + esc(L(it.note)) + '</span>' : '') +
            sub +
            rest +
            '</td>';
          out +=
            '<td class="r">' +
            itemTarget(it, it.target) +
            '</td><td class="r">' +
            itemTarget(it, it.beginnerTarget) +
            '</td>';
          out +=
            '<td class="r vid">' +
            (ex?.video
              ? '<span class="ok">' + esc(ex.clip || t('yes')) + '</span>'
              : aux
                ? '<span style="color:var(--muted-2)">' + t('anim') + '</span>'
                : '<span class="no">' + t('no') + '</span>') +
            '</td></tr>';
        }
        return out + '</tbody></table></div>';
      }

      function renderWorkout(node) {
        const w = DATA.workouts[node.workoutId];
        const a = DATA.annotations[node.workoutId];
        const label = nodeLabel(node);
        let out = '<article class="w ' + node.kind + '" id="' + esc(node.id) + '">';
        out +=
          '<div class="w-head"><div class="w-num num">' +
          (node.kind === 'test'
            ? '<span style="font-size:18px">' + esc(label) + '</span>'
            : label) +
          (a?.label
            ? '<small>' + (lang === 'ru' ? 'в канале' : 'channel') + ' ' + esc(a.label) + '</small>'
            : '') +
          '</div>';
        out +=
          '<div class="w-title"><h3>' +
          esc(L(w.name)) +
          '</h3><div class="meta"><span class="num">' +
          t('week') +
          ' ' +
          node.week +
          ', ' +
          t('day').toLowerCase() +
          ' ' +
          node.day +
          '</span>';
        out +=
          '<span class="chip ' +
          (node.kind === 'benchmark' ? 'kind' : 'fmt') +
          '">' +
          esc(
            node.kind === 'benchmark'
              ? t('benchmark')
              : node.kind === 'test'
                ? t('test')
                : mainFormat(w),
          ) +
          '</span><span>' +
          esc(L(w.focus)) +
          '</span><span class="num">' +
          w.basePoints +
          ' ' +
          t('points') +
          '</span></div></div>';
        out +=
          '<div class="w-times num"><div><b>' +
          min(w.minutes.easier) +
          '</b><span>' +
          t('easier') +
          '</span></div><div class="on"><b>' +
          min(w.minutes.normal) +
          '</b><span>' +
          t('normal') +
          '</span></div><div><b>' +
          min(w.minutes.harder) +
          '</b><span>' +
          t('harder') +
          '</span></div></div></div>';
        out += '<p class="w-desc">' + esc(L(w.description)) + '</p>';
        out +=
          '<div class="cols"><div class="blocks">' + w.blocks.map(renderBlock).join('') + '</div>';
        out += '<div class="source">';
        if (a?.flags?.length)
          out +=
            '<div class="flags"><span class="eyebrow">' +
            t('flags') +
            '</span><ul>' +
            a.flags.map((f) => '<li>' + esc(L(f)) + '</li>').join('') +
            '</ul></div>';
        out += '<span class="eyebrow">' + t('source') + '</span>';
        const msgs = a?.messages ?? [];
        if (!msgs.length)
          out += '<p class="bd" style="color:var(--muted)">' + t('noSource') + '</p>';
        for (const id of msgs)
          if (DATA.messages[id])
            out +=
              '<span class="eyebrow" style="color:var(--muted-2)">' +
              t('message') +
              ' ' +
              id +
              '</span><pre>' +
              esc(DATA.messages[id]) +
              '</pre>';
        for (const id of a?.alternatives ?? [])
          if (DATA.messages[id])
            out +=
              '<details><summary>' +
              t('alt') +
              ' — ' +
              t('message').toLowerCase() +
              ' ' +
              id +
              '</summary><pre style="margin-top:8px">' +
              esc(DATA.messages[id]) +
              '</pre></details>';
        out += '</div></div></article>';
        return out;
      }

      function renderExercises() {
        const rows = Object.entries(DATA.exercises)
          .map(([id, e]) => ({ id, ...e }))
          .sort(
            (a, b) =>
              Number(b.mainWork) - Number(a.mainWork) || b.workouts.length - a.workouts.length,
          );
        let out =
          '<section><div style="display:grid;gap:6px;margin-bottom:12px"><h2>' +
          t('exTable') +
          '</h2><p class="lede">' +
          t('exLede') +
          '</p></div><div class="scroll"><table class="ex"><thead><tr><th>' +
          t('exercise') +
          '</th><th>' +
          t('level') +
          '</th><th>' +
          t('inMain') +
          '</th><th>' +
          t('usedIn') +
          '</th><th>' +
          t('video') +
          '</th></tr></thead><tbody>';
        for (const e of rows) {
          const vid = e.video
            ? '<span class="ok">' + esc(e.clip || t('yes')) + '</span>'
            : e.mainWork
              ? '<span class="no">' + t('no') + '</span>'
              : '<span style="color:var(--muted-2)">' + t('anim') + '</span>';
          out +=
            '<tr><td>' +
            esc(L(e.name)) +
            '<span class="note" style="display:block;font-size:11px;color:var(--muted-2)">' +
            esc(e.id) +
            '</span></td><td class="num">' +
            e.level +
            '</td><td>' +
            (e.mainWork ? t('yes') : '—') +
            '</td><td class="num">' +
            e.workouts.length +
            '</td><td>' +
            vid +
            '</td></tr>';
        }
        return out + '</tbody></table></div></section>';
      }

      function render() {
        document.documentElement.lang = lang;
        const root = document.getElementById('app');
        let out =
          '<header class="top"><div class="topline"><span class="eyebrow">' +
          t('review') +
          ' · ' +
          esc(DATA.course.id) +
          '</span><div class="toggle" role="group" aria-label="Language"><button type="button" data-lang="ru" aria-pressed="' +
          (lang === 'ru') +
          '">RU</button><button type="button" data-lang="en" aria-pressed="' +
          (lang === 'en') +
          '">EN</button></div></div>';
        out +=
          '<h1>' + esc(L(DATA.course.name)) + '</h1><p class="lede">' + t('lede') + '</p></header>';
        out += renderStats();
        if (DATA.notes.length)
          out +=
            '<section class="notes"><h2>' +
            t('notes') +
            '</h2><ul>' +
            DATA.notes.map((x) => '<li>' + esc(L(x)) + '</li>').join('') +
            '</ul></section>';
        out += renderCalendar();
        out += renderChart();
        out +=
          '<section class="workouts"><div style="display:grid;gap:6px"><h2>' +
          t('workouts') +
          '</h2><p class="lede">' +
          t('howTo') +
          '</p></div>' +
          DATA.nodes
            .filter((x) => x.workoutId)
            .map(renderWorkout)
            .join('') +
          '</section>';
        out += renderExercises();
        out +=
          '<footer>' + t('generated') + ' · ' + esc(DATA.generatedAt.slice(0, 10)) + '</footer>';
        root.innerHTML = out;
        root.querySelectorAll('button[data-lang]').forEach((b) =>
          b.addEventListener('click', () => {
            lang = b.dataset.lang;
            try {
              localStorage.setItem('review-lang', lang);
            } catch {}
            render();
          }),
        );
      }
      render();
      if (location.hash) {
        const el = document.getElementById(location.hash.slice(1));
        if (el) el.scrollIntoView();
      }
    })();
  </script> `;

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, page, 'utf8');
console.log(
  `wrote ${outPath} — ${data.summary.sessions} sessions over ${course.weeks} weeks, ` +
    `avg ${data.summary.avgMinutes.toFixed(1)} min, ${data.summary.openQuestions} open questions, ` +
    `no coach video for: ${data.summary.mainWorkNoVideo.join(', ') || 'none'}`,
);
