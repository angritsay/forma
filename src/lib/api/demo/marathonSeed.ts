/**
 * The marathon the demo account walks into: ten days already played, five invented rivals, and a
 * board where today's task is the one thing standing between the viewer and second place.
 *
 * All of it is invented and clearly labelled demo data, like the rest of the demo store — none of
 * these people exist and none of it may ever reach the marketing site. It is seeded rather than
 * left empty because an empty marathon teaches nothing: the whole point of the format is what the
 * board looks like once a week has been played.
 *
 * **Everyone races alone** (`teamSize: 1`). It used to run in pairs — three teams, a partner who
 * was ahead on some days and behind on others — and «Никакого напарника в клубе быть не должно.
 * Каждый сам за себя» ended that. `teams` is empty and every member is their own entry.
 *
 * **One task a day, and its name is all of it.** Fourteen rows, no `body`: «Задание одно в день. Не
 * надо доп текст писать.» Points run 8 to 15, so a harder day is worth more and the board is not a
 * column of ties.
 *
 * Nothing here counts steps. The week used to open day 2, day 9 and day 10 with «Шаги», measured in
 * шагов — that went with the step feature (`docs/SPEC.md` §11.10): a Mini App cannot read a phone's
 * step counter, so the figure was typed in by hand. Days measured in seconds and minutes stay,
 * because a person knows those without another app.
 */
import { addDays, toLocalDateIso } from '@/lib/util/dates';
import type {
  MarathonAdjustmentRow,
  MarathonMemberRow,
  MarathonRow,
  MarathonSubmissionRow,
  MarathonTaskRow,
  MarathonTeamRow,
} from '../types';

/** Fixed ids: the seed is written once and read by name, so nothing here is random. */
export const DEMO_MARATHON_ID = 'demo_marathon_sprint';
export const DEMO_ME_MEMBER = 'demo_mmember_me';
const MEMBER_MAREK = 'demo_mmember_marek';
const MEMBER_ANYA = 'demo_mmember_anya';
const MEMBER_DIMA = 'demo_mmember_dima';
const MEMBER_LENA = 'demo_mmember_lena';
const MEMBER_SONYA = 'demo_mmember_sonya';

/** Today is day 10, so week 1 is complete and week 2 is halfway through. */
export const DEMO_MARATHON_DAYS = 14;
const DEMO_TODAY_INDEX = 10;

type SeedTask = [day: number, title: string, points: number, extra?: Partial<MarathonTaskRow>];

/**
 * Fourteen days, one task each. The last four are in the future — the app hides them, and the
 * admin's day plan is where they are visible.
 */
const SEED_TASKS: readonly SeedTask[] = [
  [1, 'Зарядка десять минут', 10],
  [2, 'Планка на максимум', 10, { proofKind: 'number', unit: 'сек' }],
  [3, 'Пешком по лестнице', 12],
  [4, 'Пятнадцать минут растяжки', 8],
  [5, 'Фото тарелки', 8, { proofKind: 'media', proofVisibility: 'coach' }],
  [6, 'Сто приседаний за день', 15],
  [7, 'Итог недели одной строкой', 10, { proofKind: 'text' }],
  [8, 'Зарядка десять минут', 10],
  [9, 'День без сахара', 12],
  [10, 'Пятьдесят берпи за день', 15],
  [11, 'Прогулка сорок минут', 10, { proofKind: 'number', unit: 'мин', targetNum: 40 }],
  [12, 'Пешком по лестнице', 12],
  [13, 'Любимая тренировка', 15],
  [14, 'Итог марафона одной строкой', 10, { proofKind: 'text' }],
];

/**
 * Who delivered which day. Deliberately uneven, and arranged around the week on screen: today is
 * day 10, so the club's table is week 2 — days 8, 9 and 10 — and it reads
 *
 *   Аня 42 · Марек 37 · Дима 27 · **Ты 22** · Лена 10 · Соня 10
 *
 * with today's fifteen points the only thing between the viewer and a tie for second. That is the
 * whole argument for putting a board on the same screen as the task, and a seed where the viewer
 * is already first or hopelessly last would never make it.
 */
const SEED_PROOFS: readonly (readonly [day: number, members: readonly string[]])[] = [
  [1, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA]],
  [2, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_LENA, MEMBER_SONYA]],
  [3, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_DIMA]],
  [4, [DEMO_ME_MEMBER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA, MEMBER_SONYA]],
  // Day 5 is the photograph, and nobody's is invented: a row pointing at an object that is not in
  // the bucket would show the coach a broken picture.
  [6, [MEMBER_MAREK, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA, MEMBER_SONYA]],
  [7, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_LENA]],
  [8, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_LENA, MEMBER_SONYA]],
  [9, [DEMO_ME_MEMBER, MEMBER_MAREK, MEMBER_ANYA, MEMBER_DIMA]],
  // Today: three of them are already done and the viewer is not. That is the state the tab exists
  // to show, and tapping «сделал» moves the row on screen.
  [10, [MEMBER_MAREK, MEMBER_ANYA, MEMBER_DIMA]],
];

/** Numbers for the tasks that ask for one, by task title. */
const SEED_VALUES: Record<string, number> = {
  'Планка на максимум': 95,
  'Прогулка сорок минут': 44,
};

export interface DemoMarathonSeed {
  marathon: MarathonRow;
  teams: MarathonTeamRow[];
  members: MarathonMemberRow[];
  tasks: MarathonTaskRow[];
  /** Who a task went to; a task with no row here went to everyone. */
  targets: { taskId: string; teamId: string | null; memberId: string | null }[];
  submissions: MarathonSubmissionRow[];
  adjustments: MarathonAdjustmentRow[];
}

/** The whole fixture, built against today's date so the marathon is always mid-flight. */
export function seedMarathon(email: string, today = toLocalDateIso()): DemoMarathonSeed {
  const startsOn = addDays(today, -(DEMO_TODAY_INDEX - 1));
  const createdAt = new Date().toISOString();

  const marathon: MarathonRow = {
    id: DEMO_MARATHON_ID,
    slug: 'sprint',
    title: 'Спринт Формы',
    description:
      'Две недели, одно задание в день, каждый сам за себя. В воскресенье неделя обнуляется.',
    status: 'active',
    startsOn,
    days: DEMO_MARATHON_DAYS,
    teamSize: 1,
    // The demo marathon runs on the viewer's own clock, so "today" is today wherever they are.
    timezone: guessTimezone(),
    dueTime: '22:00:00',
    prize: 'Час с тренером и создателем Forma',
    createdAt,
    updatedAt: createdAt,
  };

  /* No teams, and `marathon_is_solo()` is what makes that true rather than an empty array. */
  const teams: MarathonTeamRow[] = [];

  const member = (id: string, memberEmail: string, displayName: string): MarathonMemberRow => ({
    id,
    marathonId: DEMO_MARATHON_ID,
    email: memberEmail,
    teamId: null,
    displayName,
    status: 'active',
    note: null,
    createdAt,
  });

  const members: MarathonMemberRow[] = [
    member(DEMO_ME_MEMBER, email, 'Ты'),
    member(MEMBER_MAREK, 'marek@example.com', 'Марек'),
    member(MEMBER_ANYA, 'anya@example.com', 'Аня'),
    member(MEMBER_DIMA, 'dima@example.com', 'Дима'),
    member(MEMBER_LENA, 'lena@example.com', 'Лена'),
    member(MEMBER_SONYA, 'sonya@example.com', 'Соня'),
  ];

  const tasks: MarathonTaskRow[] = SEED_TASKS.map(([day, title, points, extra], i) => ({
    id: `demo_mtask_${i + 1}`,
    marathonId: DEMO_MARATHON_ID,
    dayIndex: day,
    sortOrder: 0,
    title,
    // No body anywhere: the name of the task is the task.
    body: null,
    mediaUrl: null,
    proofKind: 'done',
    unit: null,
    targetNum: null,
    // Solo, so the only rule that means anything: you deliver, you score.
    rule: 'per_member',
    points,
    cap: null,
    audience: 'all',
    proofVisibility: 'team',
    dueTime: null,
    lateCounts: false,
    ...extra,
  }));

  const taskOn = (day: number) => tasks.find((t) => t.dayIndex === day);

  const submissions: MarathonSubmissionRow[] = [];
  for (const [day, memberIds] of SEED_PROOFS) {
    const task = taskOn(day);
    if (!task) continue;
    for (const memberId of memberIds) {
      submissions.push({
        id: `demo_msub_${submissions.length + 1}`,
        taskId: task.id,
        memberId,
        marathonId: DEMO_MARATHON_ID,
        dayIndex: day,
        valueText: task.proofKind === 'text' ? 'Получилось. Тяжело, но получилось.' : null,
        valueNum: task.proofKind === 'number' ? (SEED_VALUES[task.title] ?? 20) : null,
        mediaPath: null,
        // Late evening of that day, comfortably before the 22:00 deadline.
        submittedAt: new Date(`${addDays(startsOn, day - 1)}T18:40:00`).toISOString(),
        voidedAt: null,
        voidReason: null,
      });
    }
  }

  const adjustments: MarathonAdjustmentRow[] = [
    {
      id: 'demo_madj_1',
      marathonId: DEMO_MARATHON_ID,
      memberId: MEMBER_ANYA,
      dayIndex: 9,
      points: 5,
      reason: 'Написала разбор своей недели в чат',
      createdAt,
    },
  ];

  /*
   * One task addressed to a single person, because targeting is a thing the format does and an
   * all-to-everyone seed would never show it: day 11's walk is for the viewer and nobody else sees
   * it. It is in the future, so it changes nothing on the board.
   */
  const walk = tasks.find((t) => t.dayIndex === 11);
  const targets = walk ? [{ taskId: walk.id, teamId: null, memberId: DEMO_ME_MEMBER }] : [];

  return { marathon, teams, members, tasks, targets, submissions, adjustments };
}

/** The viewer's own zone, so the demo marathon's day never disagrees with their calendar. */
function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}
