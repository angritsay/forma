/**
 * Арифметика воронки: доли, суммы и то, какую неделю считать недосчитанной.
 *
 * База отдаёт только счётчики — сколько человек каждой когорты дошло до каждого шага (0025).
 * Проценты живут здесь по той же причине, что и серия клуба в `streak.ts`: демо и прод должны
 * читать одни и те же числа одинаково, а правило «последняя неделя не идёт в средние» — это
 * решение, а не запрос, и его надо уметь проверить тестом.
 *
 * ## Почему текущая неделя не суммируется с остальными
 *
 * Человек, вошедший вчера, ещё не успел ни пройти онбординг, ни купить. Если сложить его неделю с
 * закрытыми, средняя конверсия падает каждый понедельник и растёт к воскресенью — и отчёт,
 * который смотрят «раз в неделю», начинает отвечать на вопрос «какой сегодня день», а не «как у
 * нас дела». Поэтому текущая неделя показывается строкой, но в итог не входит.
 */
import type { FunnelWeek } from '@/lib/api/types';

/** Шаги в том порядке, в каком по ним идут. Первый — основание, от него считается общая доля. */
export const FUNNEL_STEPS = ['signedUp', 'onboarded', 'trained', 'repeated', 'paid'] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export type FunnelTotals = Record<FunnelStep, number>;

const EMPTY: FunnelTotals = {
  signedUp: 0,
  onboarded: 0,
  trained: 0,
  repeated: 0,
  paid: 0,
};

/** `YYYY-MM-DD` → дни от эпохи, или null, если это не дата. */
function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(ms) ? null : Math.floor(ms / 86_400_000);
}

/**
 * Идёт ли эта неделя прямо сейчас: сегодня внутри её семи дней.
 *
 * Сравнение по датам, а не по «самой свежей строке в ответе»: если на этой неделе никто не вошёл,
 * самой свежей окажется прошлая — и её, законченную, пришлось бы выкинуть из итога ни за что.
 */
export function isCurrentWeek(weekStart: string, today: string): boolean {
  const start = dayNumber(weekStart);
  const now = dayNumber(today);
  if (start === null || now === null) return false;
  return now >= start && now < start + 7;
}

/** Только закрытые недели — те, у которых было время дойти до конца воронки. */
export function closedWeeks(weeks: readonly FunnelWeek[], today: string): FunnelWeek[] {
  return weeks.filter((w) => !isCurrentWeek(w.weekStart, today));
}

/** Сумма по колонкам. Каждый человек лежит ровно в одной неделе, поэтому суммы не двоятся. */
export function totals(weeks: readonly FunnelWeek[]): FunnelTotals {
  const out: FunnelTotals = { ...EMPTY };
  for (const w of weeks) {
    for (const step of FUNNEL_STEPS) out[step] += Math.max(0, w[step]);
  }
  return out;
}

/**
 * Доля от предыдущего шага, 0…1. `null`, когда предыдущий шаг пуст: «0 из 0» — это не ноль
 * процентов, это отсутствие ответа, и рисовать его как провал нельзя.
 *
 * У первого шага предыдущего нет, и он всегда `null`.
 */
export function stepRate(t: FunnelTotals, step: FunnelStep): number | null {
  const i = FUNNEL_STEPS.indexOf(step);
  if (i <= 0) return null;
  const prev = t[FUNNEL_STEPS[i - 1]!];
  if (prev <= 0) return null;
  return t[step] / prev;
}

/** Доля от всех вошедших, 0…1 — «сколько из пришедших в итоге дошло сюда». */
export function overallRate(t: FunnelTotals, step: FunnelStep): number | null {
  if (t.signedUp <= 0) return null;
  return t[step] / t.signedUp;
}

/**
 * Процент для показа. Целые — потому что за ними стоят десятки людей, а не тысячи: «12,5%» от
 * восьми человек — это один человек, притворившийся точностью.
 */
export function formatPercent(locale: string, rate: number | null): string {
  if (rate === null) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(rate * 100)}%`;
}
