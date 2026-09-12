/**
 * The marathon the demo account walks into: ten days already played, a partner who is ahead on
 * some days and behind on others, two rival pairs and a board that has changed hands.
 *
 * All of it is invented and clearly labelled demo data, like the rest of the demo store — none of
 * these people exist and none of it may ever reach the marketing site. It is seeded rather than
 * left empty because an empty marathon teaches nothing: the whole point of the format is what the
 * board and the partner state look like once a week has been played.
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
const TEAM_MINE = 'demo_mteam_mine';
const TEAM_B = 'demo_mteam_b';
const TEAM_C = 'demo_mteam_c';
export const DEMO_ME_MEMBER = 'demo_mmember_me';
const MEMBER_PARTNER = 'demo_mmember_marek';
const MEMBER_ANYA = 'demo_mmember_anya';
const MEMBER_DIMA = 'demo_mmember_dima';
const MEMBER_LENA = 'demo_mmember_lena';
const MEMBER_SONYA = 'demo_mmember_sonya';

/** Today is day 10, so week 1 is complete and week 2 is halfway through. */
export const DEMO_MARATHON_DAYS = 14;
const DEMO_TODAY_INDEX = 10;

type SeedTask = [
  day: number,
  title: string,
  body: string,
  rule: MarathonTaskRow['rule'],
  points: number,
  extra?: Partial<MarathonTaskRow>,
];

/**
 * Fourteen days of a real-shaped plan: a morning message that scores nothing, the pair task that
 * carries most of the points, and a per-person task or two. The last four days are in the future —
 * the app hides them, and the admin's day plan is where they are visible.
 */
const SEED_TASKS: readonly SeedTask[] = [
  [1, 'Доброе утро', 'Первый день. Пишем в чат, что начали.', 'none', 0],
  [1, 'Зарядка 10 минут', 'Любая разминка, лишь бы встать с кровати.', 'all_members', 10],
  [
    2,
    'Шаги',
    'Считаем шаги за день.',
    'per_member',
    5,
    { proofKind: 'number', unit: 'шагов', targetNum: 8000 },
  ],
  [2, 'Планка', 'Максимум за один подход.', 'per_member', 5, { proofKind: 'number', unit: 'сек' }],
  [3, 'Вторая палуба', 'Поднимаемся пешком, лифт не считается.', 'capped', 5, { cap: 7 }],
  [3, 'Вода', 'Два литра за день.', 'all_members', 8],
  [4, 'День отдыха', 'Сегодня ничего. Отдыхаем — это тоже часть плана.', 'none', 0],
  [
    5,
    'Отжимания',
    'Сколько получится, за три подхода.',
    'per_member',
    6,
    { proofKind: 'number', unit: 'раз' },
  ],
  [
    5,
    'Фото тарелки',
    'Обед. Без комментариев, просто фото.',
    'per_member',
    4,
    { proofKind: 'media', proofVisibility: 'coach' },
  ],
  [6, 'Приседания', 'Сто за день, можно частями.', 'all_members', 12],
  [
    7,
    'Итог недели',
    'Пишем одной строкой, что получилось.',
    'per_member',
    3,
    { proofKind: 'text' },
  ],
  [8, 'Доброе утро', 'Вторая неделя. Счёт с нуля.', 'none', 0],
  [8, 'Зарядка 10 минут', 'Как в первый день.', 'all_members', 10],
  [
    9,
    'Шаги',
    'Сегодня цель выше.',
    'per_member',
    5,
    { proofKind: 'number', unit: 'шагов', targetNum: 10000 },
  ],
  [9, 'Без сахара', 'Весь день.', 'all_members', 10],
  [10, 'Доброе утро', 'Середина недели. Держимся.', 'none', 0],
  [10, 'Берпи', 'Пятьдесят за день, можно частями.', 'all_members', 12],
  [
    10,
    'Шаги',
    'Считаем шаги за день.',
    'per_member',
    5,
    { proofKind: 'number', unit: 'шагов', targetNum: 10000 },
  ],
  [11, 'Растяжка', 'Пятнадцать минут перед сном.', 'per_member', 5],
  [12, 'Вторая палуба', 'Снова пешком.', 'capped', 5, { cap: 7 }],
  [13, 'Любимая тренировка', 'Выбираем сами и делаем вдвоём.', 'all_members', 15],
  [14, 'Итог марафона', 'Одной строкой: что изменилось.', 'per_member', 5, { proofKind: 'text' }],
];

/**
 * Who delivered what, as [day, task title, member ids]. Deliberately uneven: my partner misses the
 * pair task on day 3 (so our team takes nothing that day, which is the rule the format turns on),
 * and I miss one on day 6.
 */
const SEED_PROOFS: readonly (readonly [number, string, readonly string[]])[] = [
  [1, 'Доброе утро', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA]],
  [1, 'Зарядка 10 минут', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA]],
  [2, 'Шаги', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_LENA, MEMBER_SONYA]],
  [2, 'Планка', [DEMO_ME_MEMBER, MEMBER_ANYA, MEMBER_DIMA]],
  [3, 'Вторая палуба', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA]],
  [3, 'Вода', [DEMO_ME_MEMBER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA, MEMBER_SONYA]],
  [5, 'Отжимания', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_DIMA, MEMBER_SONYA]],
  [5, 'Фото тарелки', [DEMO_ME_MEMBER, MEMBER_ANYA]],
  [6, 'Приседания', [MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_LENA, MEMBER_SONYA]],
  [7, 'Итог недели', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_LENA]],
  [8, 'Доброе утро', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA, MEMBER_SONYA]],
  [8, 'Зарядка 10 минут', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_LENA, MEMBER_SONYA]],
  [9, 'Шаги', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA]],
  [9, 'Без сахара', [DEMO_ME_MEMBER, MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA]],
  // Today: my partner is already done with the pair task and I am not. That sentence — «Марек
  // сделал, ждём тебя» — is the one the Today screen exists to say.
  [10, 'Доброе утро', [MEMBER_PARTNER, MEMBER_ANYA, MEMBER_LENA]],
  [10, 'Берпи', [MEMBER_PARTNER, MEMBER_ANYA, MEMBER_DIMA]],
];

/** Numbers for the tasks that ask for one, by task title. */
const SEED_VALUES: Record<string, number> = {
  Шаги: 9420,
  Планка: 95,
  Отжимания: 32,
};

export interface DemoMarathonSeed {
  marathon: MarathonRow;
  teams: MarathonTeamRow[];
  members: MarathonMemberRow[];
  tasks: MarathonTaskRow[];
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
    description: 'Две недели, задания каждый день, счёт по парам. В воскресенье неделя обнуляется.',
    status: 'active',
    startsOn,
    days: DEMO_MARATHON_DAYS,
    teamSize: 2,
    // The demo marathon runs on the viewer's own clock, so "today" is today wherever they are.
    timezone: guessTimezone(),
    dueTime: '22:00:00',
    prize: 'Час с Сергеем один на один',
    createdAt,
    updatedAt: createdAt,
  };

  const teams: MarathonTeamRow[] = [
    { id: TEAM_MINE, marathonId: DEMO_MARATHON_ID, name: 'Ты и Марек', sortOrder: 1 },
    { id: TEAM_B, marathonId: DEMO_MARATHON_ID, name: 'Аня и Дима', sortOrder: 2 },
    { id: TEAM_C, marathonId: DEMO_MARATHON_ID, name: 'Лена и Соня', sortOrder: 3 },
  ];

  const member = (
    id: string,
    memberEmail: string,
    displayName: string,
    teamId: string,
  ): MarathonMemberRow => ({
    id,
    marathonId: DEMO_MARATHON_ID,
    email: memberEmail,
    teamId,
    displayName,
    status: 'active',
    note: null,
    createdAt,
  });

  const members: MarathonMemberRow[] = [
    member(DEMO_ME_MEMBER, email, 'Ты', TEAM_MINE),
    member(MEMBER_PARTNER, 'marek@example.com', 'Марек', TEAM_MINE),
    member(MEMBER_ANYA, 'anya@example.com', 'Аня', TEAM_B),
    member(MEMBER_DIMA, 'dima@example.com', 'Дима', TEAM_B),
    member(MEMBER_LENA, 'lena@example.com', 'Лена', TEAM_C),
    member(MEMBER_SONYA, 'sonya@example.com', 'Соня', TEAM_C),
  ];

  const tasks: MarathonTaskRow[] = SEED_TASKS.map(([day, title, body, rule, points, extra], i) => ({
    id: `demo_mtask_${i + 1}`,
    marathonId: DEMO_MARATHON_ID,
    dayIndex: day,
    sortOrder: i,
    title,
    body,
    mediaUrl: null,
    proofKind: 'done',
    unit: null,
    targetNum: null,
    rule,
    points,
    cap: null,
    audience: 'all',
    proofVisibility: 'team',
    dueTime: null,
    lateCounts: false,
    ...extra,
  }));

  const taskOn = (day: number, title: string) =>
    tasks.find((t) => t.dayIndex === day && t.title === title);

  const submissions: MarathonSubmissionRow[] = [];
  for (const [day, title, memberIds] of SEED_PROOFS) {
    const task = taskOn(day, title);
    if (!task) continue;
    for (const memberId of memberIds) {
      submissions.push({
        id: `demo_msub_${submissions.length + 1}`,
        taskId: task.id,
        memberId,
        marathonId: DEMO_MARATHON_ID,
        dayIndex: day,
        valueText: task.proofKind === 'text' ? 'Получилось. Тяжело, но получилось.' : null,
        valueNum: task.proofKind === 'number' ? (SEED_VALUES[title] ?? 20) : null,
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
      reason: 'Вытащила напарника',
      createdAt,
    },
  ];

  return { marathon, teams, members, tasks, submissions, adjustments };
}

/** The viewer's own zone, so the demo marathon's day never disagrees with their calendar. */
function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}
