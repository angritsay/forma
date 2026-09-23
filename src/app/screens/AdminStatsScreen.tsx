/**
 * Аналитика (админ): сколько людей, где они отваливаются и кто именно.
 *
 * Владелец: «Обязательно добавь внутри админки возможность отслеживать прогресс всех
 * пользователей, чтобы мы собирали аналитику и могли в дальнейшем улучшать все приложение на
 * основе реальных данных наших пользователей» и, уточняя, «я вообще заинтересована просто в том,
 * чтобы раз в неделю заходить и анализировать аналитику по воронке и по конверсии».
 *
 * «Раз в неделю» — это и есть постановка задачи для экрана. Сюда не смотрят каждый день и не
 * ищут здесь тренд по часам; сюда заходят в понедельник, читают четыре абзаца и решают, что
 * чинить. Поэтому: числа крупно, шагов пять, графика ровно столько, чтобы было видно, где
 * обрыв, — и ни одного элемента, который надо настраивать перед тем, как прочитать.
 *
 * ## Четыре блока, в порядке убывания срочности
 *
 * 1. **Сейчас** — сколько всего людей и сколько из них живые. Плюс «заплатили и не вошли»: это
 *    единственное число на экране, которое требует действия сегодня, поэтому оно отдельной
 *    плашкой и появляется, только когда таких людей нет нуля.
 * 2. **Воронка** — пять шагов с долями. Считается по когортам недели первого входа (0025), а
 *    текущая неделя из итога исключена: её людям просто не хватило времени дойти до покупки, и
 *    без этого средняя конверсия падала бы каждый понедельник.
 * 3. **По неделям** — те же пять чисел построчно, чтобы было с чем сравнить.
 * 4. **Люди** — кто стоит за числами. Воронка говорит «теряем половину», список говорит, кого
 *    именно и когда они были здесь в последний раз.
 *
 * ## Чего здесь нет
 *
 * Шага «открыл приложение»: входы мы не пишем. Придумать первое число воронки и поделить на него
 * все остальные — это и есть выдуманная статистика, которую `docs/SPEC.md` запрещает.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { formatDate, formatNumber, type TKey } from '@/i18n/index';
import { getAdminOverview, listFunnel, listProgress } from '@/lib/api/admin';
import type { AdminOverview, FunnelWeek, ProgressRow } from '@/lib/api/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { SEARCH_DEBOUNCE_MS } from '@/app/features/admin/model';
import { useDebounced } from '@/app/features/admin/useDebounced';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import {
  closedWeeks,
  formatPercent,
  FUNNEL_STEPS,
  isCurrentWeek,
  overallRate,
  stepRate,
  totals,
  type FunnelStep,
} from '@/app/features/admin/funnel';

/** Сколько недель просить у базы. Квартал — столько, сколько имеет смысл сравнивать глазами. */
const WEEKS = 12;

const STEP_LABEL: Record<FunnelStep, TKey> = {
  signedUp: 'app.adminStatsStepSignedUp',
  onboarded: 'app.adminStatsStepOnboarded',
  trained: 'app.adminStatsStepTrained',
  repeated: 'app.adminStatsStepRepeated',
  paid: 'app.adminStatsStepPaid',
};

/**
 * Короткие подписи колонок недельной таблицы: полные названия шагов в строку не встают.
 *
 * Сокращения, а не номера шагов. Номер понятен только тому, кто минуту назад прочитал воронку
 * выше, — а таблицу читают отдельно, и «3» в ней не значит ничего. Подсказка по наведению
 * номеру не помогла бы: сюда заходят с телефона, где наводить нечем.
 */
const COL_SHORT: Record<FunnelStep, TKey> = {
  signedUp: 'app.adminStatsColSignedUp',
  onboarded: 'app.adminStatsColOnboarded',
  trained: 'app.adminStatsColTrained',
  repeated: 'app.adminStatsColRepeated',
  paid: 'app.adminStatsColPaid',
};

interface TileProps {
  label: string;
  value: string;
}

/** Одно число и подпись под ним. Числа — дисплейным, потому что за ними сюда и приходят. */
function Tile({ label, value }: TileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
      <span className="font-display tabular text-[26px] leading-none">{value}</span>
      <span className="text-[12px] leading-tight text-muted">{label}</span>
    </div>
  );
}

export default function AdminStatsScreen() {
  const { t, locale } = useT();
  const admin = useIsAdmin();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [weeks, setWeeks] = useState<FunnelWeek[]>([]);
  const [people, setPeople] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [query, setQuery] = useState('');
  const search = useDebounced(query, SEARCH_DEBOUNCE_MS);

  const today = toLocalDateIso();

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([getAdminOverview(), listFunnel(WEEKS)])
      .then(([o, w]) => {
        setOverview(o);
        setWeeks(w);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  /*
   * Список людей перезапрашивается отдельно от воронки: он меняется на каждую букву в поиске, а
   * воронка — нет, и гонять её сквозь дебаунс значило бы пересчитывать когорты на набор текста.
   */
  useEffect(() => {
    if (!admin) return;
    let alive = true;
    listProgress(search, 200)
      .then((r) => {
        if (alive) setPeople(r);
      })
      .catch(() => {
        /* Поиск — не причина ломать уже прочитанные числа выше. */
      });
    return () => {
      alive = false;
    };
  }, [admin, search]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  const closed = closedWeeks(weeks, today);
  const sum = totals(closed);
  const n = (v: number) => formatNumber(locale, v);

  return (
    <Screen header={<TopBar back title={t('app.adminStatsTitle')} />}>
      {loading ? (
        <LoadingBlock />
      ) : failed ? (
        <EmptyState className="py-16" title={t('app.adminStatsError')} />
      ) : overview && overview.people === 0 ? (
        <EmptyState
          className="py-16"
          title={t('app.adminStatsEmpty')}
          description={t('app.adminStatsEmptyBody')}
        />
      ) : (
        <div className="flex flex-col gap-10 pt-6">
          {/* --- сейчас ------------------------------------------------------ */}
          {overview ? (
            <section className="flex flex-col gap-3">
              <h2 className="eyebrow text-muted-2">{t('app.adminStatsNow')}</h2>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Tile label={t('app.adminStatsPeople')} value={n(overview.people)} />
                <Tile label={t('app.adminStatsPaying')} value={n(overview.paying)} />
                <Tile label={t('app.adminStatsActive7')} value={n(overview.active7d)} />
                <Tile label={t('app.adminStatsActive28')} value={n(overview.active28d)} />
              </div>

              {/*
               * Единственная плашка на экране, которая просит что-то сделать. Её нет, когда таких
               * людей нет: предупреждение о нуле — это шум, который приучают пролистывать.
               */}
              {overview.paidNeverSignedIn > 0 ? (
                <div className="flex items-start gap-3 rounded-card border border-warning/40 bg-surface p-4">
                  <span className="font-display tabular shrink-0 text-[22px] leading-none text-warning">
                    {n(overview.paidNeverSignedIn)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[14px] leading-tight text-text">
                      {t('app.adminStatsGhostTitle')}
                    </span>
                    <span className="text-[12px] leading-tight text-muted">
                      {t('app.adminStatsGhostBody')}
                    </span>
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* --- воронка ----------------------------------------------------- */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl">{t('app.adminStatsFunnel')}</h2>
              {/* Счётчик — размер выборки, и без закрытых недель его нет. «0» здесь читалось бы
                  как результат, а не как «ещё не считали». */}
              {closed.length > 0 ? (
                <span className="eyebrow tabular text-muted-2">{n(sum.signedUp)}</span>
              ) : null}
            </div>
            <p className="text-[12px] leading-snug text-muted-2">{t('app.adminStatsFunnelNote')}</p>

            {/*
             * Пока нет ни одной закрытой недели, считать нечего — и пять пустых полос с нулями
             * читаются как «всё сломалось», хотя это просто первый понедельник. Поэтому вместо
             * них одна строка, которая говорит, чего ждать и когда.
             */}
            {closed.length === 0 ? (
              <p className="text-[14px] text-muted">{t('app.adminStatsNoClosedWeeks')}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {FUNNEL_STEPS.map((step) => {
                  const share = overallRate(sum, step);
                  const from = stepRate(sum, step);
                  return (
                    <li key={step} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] text-text">{t(STEP_LABEL[step])}</span>
                        <span className="tabular flex items-baseline gap-2 text-[13px]">
                          <span className="text-text">{n(sum[step])}</span>
                          {from !== null ? (
                            <span className="text-muted-2">{formatPercent(locale, from)}</span>
                          ) : null}
                        </span>
                      </div>
                      {/*
                       * Полоса длиной в долю **от всех вошедших**, а не от предыдущего шага: иначе
                       * каждый шаг рисовался бы почти полным, и обрыв — то единственное, что здесь
                       * ищут глазами, — стал бы невидим.
                       */}
                      <div className="h-2 overflow-hidden rounded-pill bg-surface-2">
                        <div
                          className="h-full rounded-pill bg-accent"
                          style={{ width: `${Math.round((share ?? 0) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {/* Легенда к серому числу справа. Без самих процентов она объясняет пустоту. */}
            {closed.length > 0 ? (
              <p className="text-[11px] text-muted-2">{t('app.adminStatsOfPrev')}</p>
            ) : null}
          </section>

          {/* --- по неделям --------------------------------------------------- */}
          {weeks.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl">{t('app.adminStatsWeeks')}</h2>
              {/* Пять узких колонок цифр — таблица и есть таблица; на узком экране она скролится
                  вбок сама, а не ломает страницу. */}
              <div className="-mx-6 overflow-x-auto px-6 md:-mx-10 md:px-10">
                <table className="w-full min-w-[420px] border-collapse text-[13px]">
                  <thead>
                    <tr className="text-muted-2">
                      <th scope="col" className="eyebrow py-2 text-left font-normal">
                        {t('app.adminStatsColWeek')}
                      </th>
                      {FUNNEL_STEPS.map((step) => (
                        <th
                          key={step}
                          scope="col"
                          className="eyebrow py-2 text-right font-normal"
                          title={t(STEP_LABEL[step])}
                        >
                          {t(COL_SHORT[step])}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((w) => {
                      const running = isCurrentWeek(w.weekStart, today);
                      return (
                        <tr key={w.weekStart} className="border-t border-border">
                          <td className="py-2.5 whitespace-nowrap text-muted">
                            {formatDate(locale, w.weekStart)}
                            {running ? (
                              <span className="ml-2 text-[11px] text-muted-2">
                                {t('app.adminStatsWeekRunning')}
                              </span>
                            ) : null}
                          </td>
                          {FUNNEL_STEPS.map((step) => (
                            <td key={step} className="tabular py-2.5 text-right text-text">
                              {n(w[step])}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* --- люди --------------------------------------------------------- */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl">{t('app.adminStatsPeopleSection')}</h2>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('app.adminStatsSearch')}
              aria-label={t('app.adminStatsSearch')}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <ul className="flex flex-col">
              {people.map((p) => (
                <li
                  key={p.email}
                  className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] leading-tight text-text">
                      {p.displayName?.trim() || '—'}
                    </span>
                    <span className="truncate text-[12px] leading-tight text-muted-2">
                      {p.email}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    {/* «трен.» — сокращение, и оно одинаково при любом числе: три формы
                        русского множественного здесь не нужны, а «0» заменяется словами. */}
                    <span className="tabular text-[13px] text-text">
                      {p.workouts > 0
                        ? t('app.adminStatsWorkouts', { n: p.workouts })
                        : t('app.adminStatsNeverTrained')}
                    </span>
                    <span className="text-[11px] text-muted-2">
                      {p.lastWorkoutAt
                        ? t('app.adminStatsLastSeen', {
                            date: formatDate(locale, p.lastWorkoutAt.slice(0, 10)),
                          })
                        : formatDate(locale, p.createdAt.slice(0, 10))}
                    </span>
                  </span>
                  {p.subscribed ? (
                    <Badge tone="success" size="sm">
                      {t('app.adminPersonSubscribed')}
                    </Badge>
                  ) : p.courses > 0 ? (
                    /* Со словом, а не голой цифрой: «2» рядом с «ни одной тренировки» читается
                       как продолжение той же мысли и ничего не сообщает. */
                    <Badge tone="neutral" size="sm">
                      {t('app.adminStatsCoursesBadge', { n: p.courses })}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Screen>
  );
}
