/**
 * The week's top three as a podium: 2 · 1 · 3, the leader's column on the warm gradient, the
 * prize as the caption over it, my own line under it when I am not up there.
 *
 * Replaces the board preview (three `BoardRow`s, a gap, my row and its neighbours, a full-width
 * prize bar, «Пока никто не набрал баллов», «Вся таблица →») after the owner's «Визуально
 * мусорно… много текстов». The same facts, drawn as heights: `podium.ts` orders them and
 * `standings.ts` still decides the places, so the podium and the full board never disagree.
 *
 *   - **Columns:** avatar (seed = the row's title, as the board's rows are named), the name on
 *     one line, the points as a numeral on the step. The first step is `bg-warm text-ink` —
 *     the leader's circle of the board, grown into a block; the other two are `--surface-2`.
 *   - **The prize** is the podium's caption, one quiet line above the columns: the trophy as a
 *     monochrome mark and «Приз недели — час с тренером» at 13px in `text-muted`, the prize
 *     shortened to a label (`shortPrize`). It was a warm `Pill` floating over the leader's
 *     column, and the owner read that as a button with no job («непонятно что это»): a pill on
 *     the gradient is the club's *action* material, and this is not an action. A caption
 *     says what the columns are climbing for.
 *   - **Empty week:** three dashed steps with «—». No sentence.
 *   - **My line:** `#5 · Ты · 58`, the move since last visit («↑2», `boardDelta`) and the chase
 *     as a chip («до Димы — 2 балла», `boardGap`). Only when I am not one of the three.
 *   - «Вся таблица →» stays, a ghost at the right, the one way to the full board.
 */
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Glyph, Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { pointsWord } from '@/app/features/share/story/data';
import { podiumOf, shortPrize, type PodiumColumn } from './podium';
import type { BoardGap, Standings } from './standings';

export interface ClubPodiumProps {
  standings: Standings;
  /** `boardDelta(...).rankDelta` for my row; null when nothing to compare. */
  delta: number | null;
  gap: BoardGap;
  /** The prize in full (`clubPrize`); shortened here. */
  prize: string;
  onAll: () => void;
}

/** Step heights, first the tallest. */
const HEIGHT: Record<PodiumColumn['step'], string> = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
const STEPS: readonly PodiumColumn['step'][] = [2, 1, 3];

export function ClubPodium({ standings, delta, gap, prize, onAll }: ClubPodiumProps) {
  const { t, locale } = useT();
  const podium = useMemo(() => podiumOf(standings, { delta, gap }), [standings, delta, gap]);
  const empty = podium.columns.every((c) => c === null);
  const you = t('app.marathonBoardYou');

  return (
    <section className="flex flex-col gap-3" aria-label={t('app.clubPodium')}>
      {/* The caption: the short label for the eye, the whole prize for the reader. */}
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <Icon name="trophy" size={14} className="shrink-0" />
        <span className="min-w-0 truncate" aria-hidden="true">
          {t('app.clubPrizeWeek')} — {shortPrize(prize)}
        </span>
        <span className="sr-only">
          {t('app.clubPrizeWeek')} — {prize}
        </span>
      </p>

      <ol
        className="grid grid-cols-3 items-end gap-2"
        aria-label={empty ? t('app.clubPodiumEmpty') : undefined}
      >
        {podium.columns.map((col, i) => {
          const step = STEPS[i]!;
          if (!col) {
            return (
              <li key={step} className="flex flex-col items-center gap-2" aria-hidden="true">
                <span className="size-10" />
                <span
                  className={clsx(
                    'flex w-full items-end justify-center rounded-tile border border-dashed border-border pb-3',
                    HEIGHT[step],
                  )}
                >
                  <span className="numeral text-[15px] text-muted-2">—</span>
                </span>
              </li>
            );
          }
          const points = formatNumber(locale, col.row.points);
          return (
            <li
              key={col.row.entryId}
              className="flex min-w-0 flex-col items-center gap-2"
              aria-label={t('app.clubPodiumStep', {
                n: formatNumber(locale, col.rank),
                name: col.row.title,
                points: pointsWord(t, locale, col.row.points, points),
              })}
              aria-current={col.row.isMine ? 'true' : undefined}
            >
              <Avatar seed={col.row.title} name={col.row.title} size={40} />
              <span
                aria-hidden="true"
                className={clsx(
                  'w-full truncate text-center text-[13px] leading-tight',
                  col.row.isMine ? 'text-text' : 'text-muted',
                )}
              >
                {col.row.isMine && !col.row.title.includes(you) ? you : col.row.title}
              </span>
              <span
                aria-hidden="true"
                className={clsx(
                  'flex w-full flex-col items-center justify-end gap-0.5 rounded-tile pb-3',
                  HEIGHT[step],
                  col.step === 1
                    ? 'bg-warm text-ink'
                    : clsx('bg-surface-2 text-text', col.row.isMine && 'border border-text'),
                )}
              >
                <span className="numeral text-[20px] leading-none">{points}</span>
                <span className="numeral text-[11px] leading-none opacity-70">#{col.rank}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {podium.me ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="numeral text-[15px] text-text" aria-current="true">
            {podium.me.rank === null ? '—' : `#${formatNumber(locale, podium.me.rank)}`}
            {' · '}
            {you}
            {' · '}
            {formatNumber(locale, podium.me.points)}
          </span>
          {podium.me.delta ? (
            <span
              className={clsx(
                'numeral text-[13px]',
                podium.me.delta > 0 ? 'text-accent' : 'text-muted-2',
              )}
              aria-label={t(podium.me.delta > 0 ? 'app.clubRankUp' : 'app.clubRankDown', {
                n: formatNumber(locale, Math.abs(podium.me.delta)),
              })}
            >
              {podium.me.delta > 0 ? '↑' : '↓'}
              {formatNumber(locale, Math.abs(podium.me.delta))}
            </span>
          ) : null}
          {podium.me.gap?.kind === 'chase' ? (
            <Chip size="sm">
              {t('app.clubGapChase', {
                name: podium.me.gap.name,
                points: pointsWord(t, locale, podium.me.gap.points),
              })}
            </Chip>
          ) : null}
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="sm"
        className="-mr-4.5 self-end"
        onClick={onAll}
        iconRight={<Glyph size={12}>→</Glyph>}
      >
        {t('app.marathonBoardAll')}
      </Button>
    </section>
  );
}
