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

/** @type {Record<string, Record<string, { label?: string; messages: number[]; alternatives?: number[]; flags: {ru:string,en:string}[] }>>} */
const ANNOTATIONS = {
  start: {
    w_test_start: {
      messages: [],
      flags: [
        l(
          'Этого нет в канале. Теста на максимум в первый день больше нет — по твоему замечанию. Остался только повтор в конце курса: те же три упражнения, что в анкете при первом входе, чтобы сравнить цифры за 8 недель. Оставить или убрать и его?',
          'Not from the channel. The day-one max test is gone, per your note. Only the end-of-course repeat remains: the same three movements as the onboarding on first login, to compare the numbers after 8 weeks. Keep it, or drop this one too?',
        ),
      ],
    },
    w_s01_sets: {
      label: '1',
      messages: [80],
      alternatives: [198, 199, 201],
      flags: [
        l(
          'Взята версия с двумя кругами и минутой отдыха (сообщение 80). Во втором наборе (198–201) та же тренировка по таймеру: минута на упражнение, четвёртая — отдых. Какую оставить?',
          'The two-rounds-with-a-minute-rest version (message 80) is used. The second run (198–201) had the same session on a timer: one minute per exercise, the fourth minute rest. Which should stay?',
        ),
        l(
          'Переписано по твоей «идеальной» первой тренировке: «жук» — основной вариант (6–10 на сторону), ситапы — если уверенно; отжимания 5–10, приседания 8–15; техника и комфорт, без максимумов. «Как написано» 8 / 8 на сторону / 13; новичок с коэффициентом 0,6 получит 5 / 5 / 8 — твой «минимум».',
          'Rewritten from your "ideal" first workout: dead bug as the main option (6–10 per side), sit-ups only if confident; push-ups 5–10, squats 8–15; technique and comfort, no maxes. Authored 8 / 8 per side / 13; a beginner at scale 0.6 gets 5 / 5 / 8 — your "minimum".',
        ),
      ],
    },
    w_s02_sets: {
      label: '2',
      messages: [84],
      alternatives: [207],
      flags: [
        l(
          '«Тяга к носкам поочерёдно» показана ситапом: в библиотеке нет такого упражнения и нет твоего ролика с ним. Нормально ли показывать ролик с ситапом, или снимем тягу к носкам отдельно?',
          '"Alternating toe reaches" is shown as a sit-up: the library has no such movement and no clip of you doing it. Is the sit-up clip acceptable, or should we film the toe reach separately?',
        ),
      ],
    },
    w_s03_pairs: {
      label: '3',
      messages: [88],
      alternatives: [213],
      flags: [
        l(
          'Взята версия «три пары по два круга» (88). Во втором наборе (213) — «старт раз в 2 минуты, по одному кругу». Отдых 2 минуты между парами написан в описании, таймер его не считает.',
          'The "three pairs, two rounds each" version (88) is used. The second run (213) had "start every 2 minutes, one round each". The 2-minute rest between pairs is in the text; the timer does not run it.',
        ),
      ],
    },
    w_s04_bridges: {
      label: '4',
      messages: [221],
      flags: [
        l(
          'Ягодичный мост — единственное движение курса без твоего видео. В экспорте есть ролик моста, но снят другим человеком в другом зале; он не подключён. Снять свой или разрешить чужой?',
          'The glute bridge is the only movement in the course without your video. The export has a bridge clip, but by someone else in another gym; it is not wired up. Film your own or allow that one?',
        ),
      ],
    },
    w_s05_three_rounds: {
      label: '5 и 21',
      messages: [94, 173],
      alternatives: [225],
      flags: [
        l(
          'Тренировки 5 и 21 сделаны одной и той же тренировкой, чтобы приложение записало время оба раза и показало разницу. В 21-й ты просил без отдыха между кругами — здесь это «чем быстрее, тем лучше». Так можно?',
          'Workouts 5 and 21 are the same workout so the app records the time both times and shows the difference. In 21 you asked for no rest between rounds — here that is "the faster the better". Acceptable?',
        ),
        l(
          'Во втором наборе (225) пятая — лесенка 10-15-20 с крышкой 8 минут. Не взята, чтобы сравнение с 21-й осталось честным.',
          'In the second run (225) the fifth was a 10-15-20 ladder with an 8-minute cap. Not used, so the comparison with 21 stays honest.',
        ),
      ],
    },
    w_s06_amrap8: {
      label: '6',
      messages: [230],
      alternatives: [98],
      flags: [
        l(
          'Взято 8 минут (230), в первом наборе было 10 (98).',
          '8 minutes (230) is used; the first run had 10 (98).',
        ),
      ],
    },
    w_s07_hundred_situps: {
      label: '7',
      messages: [102],
      flags: [
        l(
          'У тебя помечено «новички и уверенные новички». Оставить на третьей неделе или сдвинуть позже?',
          'You marked it "beginners and confident beginners". Keep it in week three or move it later?',
        ),
      ],
    },
    w_s08_emom_ladder: {
      label: '8',
      messages: [238],
      alternatives: [104, 235],
      flags: [
        l(
          'Взята последняя версия: два круга, 12 и 14 (238). Приложение показывает 12 на каждой минуте, «+2 во втором круге» — текстом. Первые версии: три круга 10-12-14 с минутой отдыха (104) и без неё (235).',
          'The latest version is used: two loops, 12 and 14 (238). The app shows 12 every minute; "+2 in the second loop" is text. Earlier versions: three loops 10-12-14 with a rest minute (104) and without (235).',
        ),
      ],
    },
    w_s09_chipper_x2: {
      label: '9',
      messages: [245],
      alternatives: [110],
      flags: [
        l(
          'Крышка 8 минут из второго набора (245).',
          'The 8-minute cap comes from the second run (245).',
        ),
      ],
    },
    w_s10_every_3_min: {
      label: '10',
      messages: [115],
      alternatives: [253],
      flags: [
        l(
          'Взята версия «раз в 3 минуты, 3 круга» (115). Во втором наборе (253): раз в 2 минуты, червячки + отжимания + приседания, 4 круга. Окно 3 минуты показано как круг и отдых 75 секунд.',
          'The "every 3 minutes, 3 rounds" version (115) is used. The second run (253): every 2 minutes, inchworms + push-ups + squats, 4 rounds. The 3-minute window is shown as a round plus 75 seconds of rest.',
        ),
      ],
    },
    w_s11_emom8: {
      label: '11',
      messages: [254],
      alternatives: [120],
      flags: [
        l(
          'Взято два круга (254); в первом наборе было три (120).',
          'Two loops (254) are used; the first run had three (120).',
        ),
      ],
    },
    w_s12_step_ladder: {
      label: '12',
      messages: [126],
      flags: [
        l('Крышки в тексте нет — поставлена 10 минут.', 'No cap in the text — 10 minutes is set.'),
      ],
    },
    w_s13_amrap8_burpees: {
      label: '13',
      messages: [128],
      flags: [
        l(
          'Первые бёрпи в курсе. Показывается твой ролик полного бёрпи; вариант шагом — текстом.',
          'The first burpees in the course. Your full-burpee clip is shown; the step-back option is text.',
        ),
      ],
    },
    w_s14_squats_4min: {
      label: '13 (второй)',
      messages: [134],
      flags: [
        l(
          'В канале это второе сообщение под номером 13. Здесь — отдельный короткий день (около 14 минут с разминкой). Оставить отдельным днём или присоединить к другой тренировке?',
          'In the channel this is the second message numbered 13. Here it is its own short day (about 14 minutes with the warm-up). Keep it as a day or fold it into another session?',
        ),
      ],
    },
    w_s15_twenty_forty: {
      label: '14',
      messages: [135],
      flags: [
        l(
          'Отдых 2 минуты между «20-20-20» и «40-40-40» написан в описании второго блока. Крышки по 7 минут добавлены.',
          'The 2-minute rest between "20-20-20" and "40-40-40" is in the second block’s text. 7-minute caps are added.',
        ),
      ],
    },
    w_s16_amrap8_jacks: {
      label: '15',
      messages: [139],
      flags: [
        l(
          'Скакалка везде заменена джампинг-джеками (в описании курса скакалки нет). Твой ролик со скакалкой есть — если хочешь, добавим скакалку как необязательный инвентарь.',
          'The rope is replaced by jumping jacks everywhere (the course lists no rope). Your rope clip exists — we can add the rope as optional equipment if you want.',
        ),
      ],
    },
    w_s17_long_chipper: {
      label: '16',
      messages: [149],
      flags: [
        l(
          '«Тяга к носкам» показана ситапом (см. тренировку 2).',
          '"Toe reaches" shown as sit-ups (see workout 2).',
        ),
      ],
    },
    w_s18_buy_in: {
      label: '18 (первое)',
      messages: [157],
      flags: [
        l(
          'В канале это сообщение подписано «18», но выложено раньше 17-й — здесь порядок по дате. «Максимум червячков» показан как 6 повторов: приложению нужна цифра.',
          'In the channel this is labelled "18" but was posted before 17 — the order here follows the dates. "Max inchworms" is shown as 6 reps: the app needs a number.',
        ),
      ],
    },
    w_s19_three_windows: {
      label: '17',
      messages: [163],
      flags: [
        l(
          'Три окна по 2 минуты — три блока «на время» с крышкой 2 минуты. «Максимум» показан как 10 червячков / 10 бёрпи / 4+4 — твои ориентиры 13 и 18 в описании.',
          'Three 2-minute windows are three for-time blocks capped at 2 minutes. "Max" is shown as 10 inchworms / 10 burpees / 4+4 — your 13 and 18 targets are in the text.',
        ),
      ],
    },
    w_s20_burpee_ladder: {
      label: '18 (второе)',
      messages: [168],
      flags: [
        l(
          'Лесенка 1…12 бёрпи по минутам. В режиме «Потяжелее» приложение даёт 14 минут, и 13-я минута начинается снова с 1 бёрпи — так устроен движок.',
          'The 1…12 burpee ladder by the minute. On "Harder" the app gives 14 minutes and minute 13 restarts at 1 burpee — that is how the engine works.',
        ),
      ],
    },
    w_s22_chipper_x2: {
      label: '22',
      messages: [179],
      flags: [
        l(
          'В тексте «между кругами нет отдыха», но количество кругов не написано. Сделано два круга с крышкой 10 минут. Один или два?',
          'The text says "no rest between rounds" but not how many rounds. Two rounds with a 10-minute cap are set. One or two?',
        ),
      ],
    },
    w_s23_amrap8_worms: {
      label: '23',
      messages: [184],
      flags: [
        l(
          '«Тяга к носкам» показана ситапом (см. тренировку 2).',
          '"Toe reaches" shown as sit-ups (see workout 2).',
        ),
      ],
    },
    w_s24_steps_and_jumps: {
      label: '24',
      messages: [189],
      flags: [
        l(
          '100 прыжков на скакалке = 60 джампинг-джеков (по времени). Минута отдыха после каждого круга — текстом. Крышка 12 минут.',
          '100 rope skips = 60 jumping jacks (by time). The minute of rest after each round is text. 12-minute cap.',
        ),
      ],
    },
  },
};

const GENERAL_NOTES = {
  start: [
    l(
      'В экспорте 24 разных тренировки. Номера 19 и 20 в канале отсутствуют, а 13 и 18 встречаются дважды — здесь всё пронумеровано 1–24 по порядку публикации, твой номер указан рядом.',
      'The export holds 24 distinct workouts. Numbers 19 and 20 are missing from the channel, and 13 and 18 appear twice — everything here is renumbered 1–24 in posting order, with your number shown beside it.',
    ),
    l(
      'Разминка — суставная гимнастика сверху вниз: шея, плечи, локти и кисти, корпус, таз, колени, стопы, потом медленный присед; без бега, около 5 минут. Заминка — растяжка: спина, бёдра, сгибатели бедра, поза ребёнка — и запись ощущений. Твоих трёх разминочных роликов в экспорте нет — если пришлёшь, подставим их. Разминка и заминка не масштабируются и в «5–15 минут тренировки» не входят.',
      'The warm-up is joint mobility from the top down: neck, shoulders, elbows and wrists, trunk, hips, knees, ankles, then a slow squat; no running, about 5 minutes. The cool-down is a stretch — spine, thighs, hip flexors, child pose — and a note of how it felt. Your three warm-up clips are not in the export — send them and we will wire them in. Warm-up and cool-down do not scale and are not counted in the "5–15 minutes of training".',
    ),
    l(
      'Цифры «как написано» — для уверенного новичка. Приложение умножает их на коэффициент человека: после анкеты при первом входе новичок получает 0,6–0,8, и цифры сходятся с твоим «начинайте с минимума». Ниже показано и то и другое.',
      'The authored numbers are for a confident beginner. The app multiplies them by the person’s scale: after the onboarding on first login a beginner gets 0.6–0.8, which lands on your "start from the minimum". Both are shown below.',
    ),
    l(
      'Разгрузочной недели нет — как и в канале. Если нужна, скажи, на какой неделе.',
      'There is no deload week — same as the channel. If you want one, say which week.',
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
  stepsGoal: n.stepsGoal,
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
    href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Onest:wght@400;500;600&display=swap"
  />
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f4;
      --surface: #ffffff;
      --surface-2: #eaf0ec;
      --surface-3: #dde6e0;
      --border: rgba(18, 24, 21, 0.1);
      --border-strong: rgba(18, 24, 21, 0.2);
      --text: #121815;
      --muted: #5a645f;
      --muted-2: #7a847f;
      --accent: #14805f;
      --accent-soft: #cdeee0;
      --accent-2: #4a5bbf;
      --accent-2-soft: #dfe4fb;
      --warning: #9a6a00;
      --warning-soft: #fff0c2;
      --danger: #b3342f;
      --danger-soft: #ffe0de;
      --rest: #e9ede9;
      --bar: #1f9c78;
      --bar-range: rgba(31, 156, 120, 0.25);
      --font-sans: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --font-display: 'Unbounded', 'Onest', system-ui, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) {
        color-scheme: dark;
        --bg: #0b0b0d;
        --surface: #151519;
        --surface-2: #1e1e24;
        --surface-3: #2a2a31;
        --border: rgba(255, 255, 255, 0.08);
        --border-strong: rgba(255, 255, 255, 0.18);
        --text: #f5f5f7;
        --muted: #a8a8b2;
        --muted-2: #93939d;
        --accent: #b9f3e0;
        --accent-soft: rgba(185, 243, 224, 0.14);
        --accent-2: #c9d6ff;
        --accent-2-soft: rgba(201, 214, 255, 0.14);
        --warning: #ffd166;
        --warning-soft: rgba(255, 209, 102, 0.14);
        --danger: #ff8a80;
        --danger-soft: rgba(255, 107, 107, 0.16);
        --rest: #121216;
        --bar: #7ce0b0;
        --bar-range: rgba(124, 224, 176, 0.25);
      }
    }
    :root[data-theme='dark'] {
      color-scheme: dark;
      --bg: #0b0b0d;
      --surface: #151519;
      --surface-2: #1e1e24;
      --surface-3: #2a2a31;
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.18);
      --text: #f5f5f7;
      --muted: #a8a8b2;
      --muted-2: #93939d;
      --accent: #b9f3e0;
      --accent-soft: rgba(185, 243, 224, 0.14);
      --accent-2: #c9d6ff;
      --accent-2-soft: rgba(201, 214, 255, 0.14);
      --warning: #ffd166;
      --warning-soft: rgba(255, 209, 102, 0.14);
      --danger: #ff8a80;
      --danger-soft: rgba(255, 107, 107, 0.16);
      --rest: #121216;
      --bar: #7ce0b0;
      --bar-range: rgba(124, 224, 176, 0.25);
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
      border-radius: 999px;
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
      border-radius: 16px;
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
      border-radius: 14px;
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
      border-radius: 999px;
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
      border-radius: 16px;
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
      border-radius: 4px;
      background: var(--bar-range);
    }
    .chart .bar {
      position: absolute;
      top: 3px;
      height: 8px;
      border-radius: 4px;
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
      border-radius: 4px;
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
      border-radius: 20px;
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
      border-radius: 10px;
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
      border-radius: 14px;
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
      border-radius: 12px;
      padding: 12px 14px;
      color: var(--text);
    }
    .source details {
      border: 1px solid var(--border);
      border-radius: 12px;
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
      border-radius: 10px;
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
      border-radius: 16px;
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
          steps: 'шагов',
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
            'Ролик — ключ клипа из экспорта (media/manifest.json). Разминка и заминка идут с анимацией, это нормально.',
          inMain: 'в основной части',
          usedIn: 'тренировок',
          level: 'уровень',
          yes: 'есть',
          no: 'нет',
          anim: 'анимация',
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
          steps: 'steps',
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
            'Clip is the export key (media/manifest.json). Warm-ups and cool-downs play with the animation, which is fine.',
          inMain: 'in main work',
          usedIn: 'workouts',
          level: 'level',
          yes: 'yes',
          no: 'no',
          anim: 'animation',
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
                '</span><span class="m num">' +
                (node.stepsGoal ?? 7000).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB') +
                ' ' +
                t('steps') +
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
